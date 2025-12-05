# ChatKit Integration Knowledge Base

> Complete reference for building chat applications with OpenAI ChatKit + any LLM provider

## Overview

ChatKit is OpenAI's framework for building chat UIs that connect to any backend. This knowledge base covers:
- ChatKit Python (backend server)
- ChatKit React (frontend UI)
- OpenAI Agents SDK with LiteLLM (multi-provider AI)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           @openai/chatkit-react                      │    │
│  │  ┌──────────────┐  ┌──────────────┐                 │    │
│  │  │  useChatKit  │  │   ChatKit    │                 │    │
│  │  │   (hook)     │──│  (component) │                 │    │
│  │  └──────────────┘  └──────────────┘                 │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP POST /chatkit
                              │ SSE Streaming
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              openai-chatkit                          │    │
│  │  ┌──────────────┐  ┌──────────────┐                 │    │
│  │  │ ChatKitServer│  │    Store     │                 │    │
│  │  │  (protocol)  │──│ (persistence)│                 │    │
│  │  └──────────────┘  └──────────────┘                 │    │
│  └─────────────────────────────────────────────────────┘    │
│                              │                               │
│                              ▼                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           openai-agents + litellm                    │    │
│  │  ┌──────────────┐  ┌──────────────┐                 │    │
│  │  │    Agent     │  │ LitellmModel │                 │    │
│  │  │   (logic)    │──│  (adapter)   │                 │    │
│  │  └──────────────┘  └──────────────┘                 │    │
│  └─────────────────────────────────────────────────────┘    │
│                              │                               │
│                              ▼                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              LLM Provider                            │    │
│  │   Gemini │ OpenAI │ Anthropic │ Azure │ etc.        │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Package Versions (Tested)

```
# Backend
fastapi==0.115.6
uvicorn[standard]==0.32.1
openai-chatkit<=1.4.0
openai-agents[litellm]>=0.6.2
python-dotenv==1.0.1

# Frontend
@openai/chatkit-react: ^1.3.0
react: ^18.3.1
react-dom: ^18.3.1
vite: ^6.0.3
```

## Import Reference

### Correct Imports (openai-chatkit 1.4.0)

```python
# Server and streaming
from chatkit.server import ChatKitServer, StreamingResult

# Store (SINGULAR - not 'stores')
from chatkit.store import Store

# Types (NOT 'models')
from chatkit.types import ThreadMetadata, ThreadItem, Page
from chatkit.types import UserMessageItem, AssistantMessageItem

# Agent integration
from chatkit.agents import AgentContext, stream_agent_response
```

### Invalid Imports (DO NOT USE)

```python
# These will cause ImportError:
from chatkit.stores import Store           # Use chatkit.store
from chatkit.models import ThreadMetadata  # Use chatkit.types
from chatkit.server import Event           # Doesn't exist
from chatkit.types import ClientToolCallOutputItem  # Doesn't exist
from chatkit.types import FilePart         # Doesn't exist
```

## Store Implementation

All 14 methods must be implemented:

```python
class MemoryStore(Store[dict]):
    def generate_thread_id(self, context: dict) -> str:
        return f"thread_{uuid.uuid4().hex[:12]}"

    def generate_item_id(self, item_type: str, thread: ThreadMetadata, context: dict) -> str:
        return f"{item_type}_{uuid.uuid4().hex[:12]}"

    async def load_thread(self, thread_id: str, context: dict) -> ThreadMetadata:
        # Return existing or create new

    async def save_thread(self, thread: ThreadMetadata, context: dict) -> None:
        # Persist thread metadata

    async def load_thread_items(self, thread_id: str, after: str | None,
                                 limit: int, order: str, context: dict) -> Page[ThreadItem]:
        # Return paginated items

    async def add_thread_item(self, thread_id: str, item: ThreadItem, context: dict) -> None:
        # Add or update item

    async def save_item(self, thread_id: str, item: ThreadItem, context: dict) -> None:
        # Alias for add_thread_item

    async def load_item(self, thread_id: str, item_id: str, context: dict) -> ThreadItem:
        # Load single item

    async def delete_thread_item(self, thread_id: str, item_id: str, context: dict) -> None:
        # Remove item

    async def load_threads(self, limit: int, after: str | None,
                           order: str, context: dict) -> Page[ThreadMetadata]:
        # List all threads

    async def delete_thread(self, thread_id: str, context: dict) -> None:
        # Remove thread

    # OFTEN FORGOTTEN - but required:
    async def save_attachment(self, attachment: Any, context: dict) -> None:
        pass

    async def load_attachment(self, attachment_id: str, context: dict) -> Any:
        raise ValueError(f"Attachment {attachment_id} not found")

    async def delete_attachment(self, attachment_id: str, context: dict) -> None:
        pass
```

## Conversation History (Critical for Agent Memory)

The default `simple_to_agent_input(input)` only passes the current message. For conversation memory:

```python
async def _build_conversation_history(self, thread: ThreadMetadata,
                                       current_input: Any, context: dict) -> list:
    """Build full conversation for agent"""
    from chatkit.types import UserMessageItem, AssistantMessageItem

    page = await self.store.load_thread_items(thread.id, None, 100, "asc", context)
    messages = []

    for item in page.data:
        text = self._extract_text(item)
        if not text:
            continue

        if isinstance(item, UserMessageItem):
            messages.append({"role": "user", "content": text})
        elif isinstance(item, AssistantMessageItem):
            messages.append({"role": "assistant", "content": text})

    # Add current input if not duplicate
    if current_input:
        text = self._extract_text(current_input)
        if text and (not messages or messages[-1].get("content") != text):
            messages.append({"role": "user", "content": text})

    return messages

def _extract_text(self, item) -> str:
    """Extract text from message content parts"""
    text = ""
    if hasattr(item, 'content') and item.content:
        for part in item.content:
            if hasattr(part, 'text'):
                text += part.text
    return text
```

## LiteLLM Model Configuration

```python
from agents.extensions.models.litellm_model import LitellmModel

# Gemini
model = LitellmModel(
    model="gemini/gemini-2.0-flash",
    api_key=os.getenv("GEMINI_API_KEY"),
)

# OpenAI
model = LitellmModel(
    model="openai/gpt-4o",
    api_key=os.getenv("OPENAI_API_KEY"),
)

# Anthropic
model = LitellmModel(
    model="anthropic/claude-3-sonnet-20240229",
    api_key=os.getenv("ANTHROPIC_API_KEY"),
)
```

## Frontend Configuration

### Required: domainKey

```typescript
const { control } = useChatKit({
  api: {
    url: 'http://localhost:8000/chatkit',
    domainKey: 'localhost',  // REQUIRED
  },
  // ...
})
```

### Required: CDN Script

```html
<script src="https://cdn.platform.openai.com/deployments/chatkit/chatkit.js" async></script>
```

### Correct Prompt Schema

```typescript
startScreen: {
  prompts: [
    { label: 'Hello', prompt: 'Say hello' },  // Use 'label'
    // NOT: { name: 'Hello', ... }
    // NOT: { label: 'Hello', icon: '👋', ... }
  ],
}
```

### Thread Persistence

```typescript
const [initialThread, setInitialThread] = useState<string | null>(null)

useEffect(() => {
  const saved = localStorage.getItem('chatkit-thread-id')
  setInitialThread(saved)
}, [])

// In useChatKit:
{
  initialThread: initialThread,
  onThreadChange: ({ threadId }) => {
    if (threadId) localStorage.setItem('chatkit-thread-id', threadId)
  },
}
```

## CRITICAL: LiteLLM/Gemini ID Collision Fix

When using LiteLLM with non-OpenAI providers (Gemini, Anthropic), the `stream_agent_response` function reuses message IDs from the provider's response. These IDs may collide, causing messages to **overwrite each other**.

### Root Cause

In `chatkit/agents.py` (line 514-521):
```python
yield ThreadItemAddedEvent(
    item=AssistantMessageItem(
        id=item.id,  # <-- Uses provider's ID, may collide!
        ...
    )
)
```

### Solution: ID Mapping

```python
async def respond(self, thread, input, context):
    # ... setup code ...

    # Track ID mappings to ensure unique IDs
    id_mapping: dict[str, str] = {}

    async for event in stream_agent_response(agent_context, result):
        if event.type == "thread.item.added":
            if isinstance(event.item, AssistantMessageItem):
                old_id = event.item.id
                if old_id not in id_mapping:
                    new_id = self.store.generate_item_id("message", thread, context)
                    id_mapping[old_id] = new_id
                event.item.id = id_mapping[old_id]
        elif event.type == "thread.item.done":
            if isinstance(event.item, AssistantMessageItem):
                if event.item.id in id_mapping:
                    event.item.id = id_mapping[event.item.id]
        elif event.type == "thread.item.updated":
            if event.item_id in id_mapping:
                event.item_id = id_mapping[event.item_id]

        yield event
```

## Complete Error Reference

| Error | Module | Fix |
|-------|--------|-----|
| `chatkit.stores` not found | Backend | Use `chatkit.store` |
| `chatkit.models` not found | Backend | Use `chatkit.types` |
| Cannot import `Event` | Backend | Remove from imports |
| Cannot import `ClientToolCallOutputItem` | Backend | Use `Any` type |
| Cannot import `FilePart` | Backend | Use `Any` type |
| Can't instantiate abstract class | Backend | Implement ALL 14 methods |
| Agent doesn't remember | Backend | Use `ThreadItemConverter` |
| **Messages overwrite each other** | **Backend** | **Use ID mapping fix** |
| Invalid input at api | Frontend | Add `domainKey` |
| Unrecognized key "name" | Frontend | Use `label` |
| Unrecognized key "icon" | Frontend | Remove `icon` |
| Blank screen | Frontend | Add CDN script |
| History not loading | Frontend | Implement localStorage persistence |

## Testing Checklist

- [ ] Backend starts without errors
- [ ] `GET /health` returns 200
- [ ] `POST /chatkit` streams responses
- [ ] Frontend renders chat UI
- [ ] Messages send and receive
- [ ] Agent remembers conversation
- [ ] **Messages appear separately (not merged)**
- [ ] **`/debug/threads` shows unique IDs**
- [ ] Thread persists on refresh
- [ ] New chat clears history
