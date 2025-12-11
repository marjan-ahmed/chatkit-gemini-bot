import os
import uuid
from pathlib import Path
from datetime import datetime, timezone
from typing import Any, AsyncIterator
from dataclasses import dataclass, field

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from fastapi.staticfiles import StaticFiles

from agents import Agent, Runner
from agents.extensions.models.litellm_model import LitellmModel

# Import from chatkit
from chatkit.server import ChatKitServer, StreamingResult
from chatkit.store import Store
from chatkit.types import ThreadMetadata, ThreadItem, Page
from chatkit.agents import AgentContext, stream_agent_response, ThreadItemConverter

# Load .env from project root
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / ".env")


@dataclass
class ThreadState:
    thread: ThreadMetadata
    items: list[ThreadItem] = field(default_factory=list)


class MemoryStore(Store[dict]):
    """Thread-safe in-memory store matching official ChatKit implementation"""

    def __init__(self) -> None:
        self._threads: dict[str, ThreadState] = {}
        self._attachments: dict[str, Any] = {}

    def generate_thread_id(self, context: dict) -> str:
        return f"thread_{uuid.uuid4().hex[:12]}"

    def generate_item_id(self, item_type: str, thread: ThreadMetadata, context: dict) -> str:
        new_id = f"{item_type}_{uuid.uuid4().hex[:12]}"
        print(f"[Store] generate_item_id: type={item_type}, id={new_id}")
        return new_id

    def _get_items(self, thread_id: str) -> list[ThreadItem]:
        state = self._threads.get(thread_id)
        return state.items if state else []

    async def load_thread(self, thread_id: str, context: dict) -> ThreadMetadata:
        state = self._threads.get(thread_id)
        if state:
            return state.thread.model_copy(deep=True)
        # Create new thread
        thread = ThreadMetadata(
            id=thread_id,
            created_at=datetime.now(timezone.utc),
            metadata={}
        )
        self._threads[thread_id] = ThreadState(thread=thread.model_copy(deep=True), items=[])
        return thread

    async def save_thread(self, thread: ThreadMetadata, context: dict) -> None:
        state = self._threads.get(thread.id)
        if state:
            state.thread = thread.model_copy(deep=True)
        else:
            self._threads[thread.id] = ThreadState(
                thread=thread.model_copy(deep=True),
                items=[]
            )

    async def load_thread_items(
        self,
        thread_id: str,
        after: str | None,
        limit: int,
        order: str,
        context: dict,
    ) -> Page[ThreadItem]:
        items = [item.model_copy(deep=True) for item in self._get_items(thread_id)]

        # Sort by created_at
        items.sort(
            key=lambda i: getattr(i, "created_at", datetime.now(timezone.utc)),
            reverse=(order == "desc"),
        )

        # Handle pagination with 'after' cursor
        start = 0
        if after:
            index_map = {item.id: idx for idx, item in enumerate(items)}
            start = index_map.get(after, -1) + 1

        slice_items = items[start: start + limit + 1]
        has_more = len(slice_items) > limit

        result_items = slice_items[:limit]
        print(f"[Store] Returning {len(result_items)} items for thread {thread_id}, has_more={has_more}")

        return Page(
            data=result_items,
            has_more=has_more,
            after=slice_items[-1].id if has_more and slice_items else None
        )

    async def add_thread_item(self, thread_id: str, item: ThreadItem, context: dict) -> None:
        state = self._threads.get(thread_id)
        if not state:
            await self.load_thread(thread_id, context)
            state = self._threads[thread_id]

        # Debug: log item details
        item_type = type(item).__name__
        content_preview = ""
        if hasattr(item, 'content') and item.content:
            for part in item.content:
                if hasattr(part, 'text'):
                    content_preview = part.text[:50] + "..." if len(part.text) > 50 else part.text
                    break
        print(f"[Store] add_thread_item: id={item.id}, type={item_type}, content='{content_preview}'")

        # Check if item exists, update if so
        for i, existing in enumerate(state.items):
            if existing.id == item.id:
                state.items[i] = item.model_copy(deep=True)
                print(f"[Store] Updated existing item {item.id}")
                return

        state.items.append(item.model_copy(deep=True))
        print(f"[Store] Added NEW item {item.id}, total items: {len(state.items)}")

    async def save_item(self, thread_id: str, item: ThreadItem, context: dict) -> None:
        await self.add_thread_item(thread_id, item, context)

    async def load_item(self, thread_id: str, item_id: str, context: dict) -> ThreadItem:
        for item in self._get_items(thread_id):
            if item.id == item_id:
                return item.model_copy(deep=True)
        raise ValueError(f"Item {item_id} not found")

    async def delete_thread_item(self, thread_id: str, item_id: str, context: dict) -> None:
        state = self._threads.get(thread_id)
        if state:
            state.items = [i for i in state.items if i.id != item_id]

    async def load_threads(self, limit: int, after: str | None, order: str, context: dict) -> Page[ThreadMetadata]:
        threads = [s.thread.model_copy(deep=True) for s in self._threads.values()]
        return Page(data=threads[-limit:], has_more=False)

    async def delete_thread(self, thread_id: str, context: dict) -> None:
        self._threads.pop(thread_id, None)

    async def save_attachment(self, attachment: Any, context: dict) -> None:
        self._attachments[attachment.id] = attachment

    async def load_attachment(self, attachment_id: str, context: dict) -> Any:
        if attachment_id not in self._attachments:
            raise ValueError(f"Attachment {attachment_id} not found")
        return self._attachments[attachment_id]

    async def delete_attachment(self, attachment_id: str, context: dict) -> None:
        self._attachments.pop(attachment_id, None)


# Gemini model via LiteLLM
gemini_model = LitellmModel(
    model="gemini/gemini-2.0-flash",
    api_key=os.getenv("GEMINI_API_KEY"),
)


class GeminiChatKitServer(ChatKitServer[dict]):
    def __init__(self, data_store: Store):
        super().__init__(data_store)

        self.assistant_agent = Agent[AgentContext](
            name="Gemini Assistant",
            instructions="You are a helpful, friendly assistant powered by Google Gemini. Be concise and clear.",
            model=gemini_model,
        )
        self.converter = ThreadItemConverter()

    async def respond(self, thread: ThreadMetadata, input: Any, context: dict) -> AsyncIterator:
        from chatkit.types import (
            ThreadItemAddedEvent, ThreadItemDoneEvent, ThreadItemUpdatedEvent,
            AssistantMessageItem
        )

        agent_context = AgentContext(
            thread=thread,
            store=self.store,
            request_context=context,
        )

        # Load all thread items and convert using ChatKit's converter
        page = await self.store.load_thread_items(thread.id, None, 100, "asc", context)
        all_items = list(page.data)

        # Add current input to the list if provided
        if input:
            all_items.append(input)

        print(f"[Server] Processing {len(all_items)} items for agent")

        # Convert thread items to agent input format using ChatKit's converter
        agent_input = await self.converter.to_agent_input(all_items) if all_items else []

        print(f"[Server] Converted to {len(agent_input)} agent input items")

        result = Runner.run_streamed(
            self.assistant_agent,
            agent_input,
            context=agent_context,
        )

        # Track ID mappings to ensure unique IDs (LiteLLM/Gemini may reuse IDs)
        id_mapping: dict[str, str] = {}

        async for event in stream_agent_response(agent_context, result):
            # Fix potential ID collisions from LiteLLM/Gemini
            if event.type == "thread.item.added":
                if isinstance(event.item, AssistantMessageItem):
                    old_id = event.item.id
                    # Generate unique ID if we haven't seen this response ID before
                    if old_id not in id_mapping:
                        new_id = self.store.generate_item_id("message", thread, context)
                        id_mapping[old_id] = new_id
                        print(f"[Server] Mapping ID {old_id} -> {new_id}")
                    event.item.id = id_mapping[old_id]
            elif event.type == "thread.item.done":
                if isinstance(event.item, AssistantMessageItem):
                    old_id = event.item.id
                    if old_id in id_mapping:
                        event.item.id = id_mapping[old_id]
            elif event.type == "thread.item.updated":
                if event.item_id in id_mapping:
                    event.item_id = id_mapping[event.item_id]

            yield event


# Initialize FastAPI app
app = FastAPI(title="ChatKit Gemini")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ChatKit server
store = MemoryStore()
server = GeminiChatKitServer(store)


@app.post("/chatkit")
async def chatkit_endpoint(request: Request):
    result = await server.process(await request.body(), {})
    if isinstance(result, StreamingResult):
        return StreamingResponse(result, media_type="text/event-stream")
    return Response(content=result.json, media_type="application/json")


@app.get("/health")
async def health():
    return {"status": "ok", "model": "gemini-2.0-flash"}


@app.get("/debug/threads")
async def debug_threads():
    """Debug endpoint to view all stored items"""
    result = {}
    for thread_id, state in store._threads.items():
        items = []
        for item in state.items:
            item_data = {
                "id": item.id,
                "type": type(item).__name__,
                "created_at": str(getattr(item, 'created_at', 'N/A')),
            }
            # Extract content
            if hasattr(item, 'content') and item.content:
                content_parts = []
                for part in item.content:
                    if hasattr(part, 'text'):
                        content_parts.append(part.text)
                item_data["content"] = content_parts
            items.append(item_data)
        result[thread_id] = {
            "thread": {"id": state.thread.id, "created_at": str(state.thread.created_at)},
            "items": items,
            "item_count": len(items)
        }
    return result


# Serve frontend
FRONTEND_DIR = ROOT_DIR / "frontend" / "dist"
if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    print("Starting ChatKit Gemini server at http://localhost:8001")
    uvicorn.run(app, host="0.0.0.0", port=8001)
