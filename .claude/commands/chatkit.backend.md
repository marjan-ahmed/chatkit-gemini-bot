---
description: Set up a ChatKit Python backend with OpenAI Agents SDK and LiteLLM for Gemini/other models
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input to determine which AI provider to use (default: Gemini).

## ChatKit Backend Setup Guide

This skill creates a production-ready ChatKit Python backend server.

### Step 1: Create Backend Directory Structure

```
backend/
├── main.py           # FastAPI server with ChatKit
├── requirements.txt  # Python dependencies
└── .venv/           # Virtual environment (created by user)
```

### Step 2: Create requirements.txt

```txt
fastapi==0.115.6
uvicorn[standard]==0.32.1
openai-chatkit<=1.4.0
openai-agents[litellm]>=0.6.2
python-dotenv==1.0.1
```

### Step 3: Create main.py with Full Implementation

**CRITICAL IMPORTS** (these exact imports work with openai-chatkit 1.4.0):
```python
from agents import Agent, Runner
from agents.extensions.models.litellm_model import LitellmModel

from chatkit.server import ChatKitServer, StreamingResult
from chatkit.store import Store  # Note: 'store' not 'stores'
from chatkit.types import ThreadMetadata, ThreadItem, Page
from chatkit.agents import AgentContext, stream_agent_response
```

**IMPORTANT GOTCHAS:**
1. Import `Store` from `chatkit.store` (singular), NOT `chatkit.stores`
2. Do NOT import `Event` from `chatkit.server` - it doesn't exist
3. Do NOT import `ClientToolCallOutputItem` or `FilePart` from `chatkit.types`
4. Use `Any` type for attachments and complex types

**Required Store Methods** (all must be implemented):
- `generate_thread_id(context) -> str`
- `generate_item_id(item_type, thread, context) -> str`
- `load_thread(thread_id, context) -> ThreadMetadata`
- `save_thread(thread, context) -> None`
- `load_thread_items(thread_id, after, limit, order, context) -> Page[ThreadItem]`
- `add_thread_item(thread_id, item, context) -> None`
- `save_item(thread_id, item, context) -> None`
- `load_item(thread_id, item_id, context) -> ThreadItem`
- `delete_thread_item(thread_id, item_id, context) -> None`
- `load_threads(limit, after, order, context) -> Page[ThreadMetadata]`
- `delete_thread(thread_id, context) -> None`
- `save_attachment(attachment, context) -> None`
- `load_attachment(attachment_id, context) -> Any`
- `delete_attachment(attachment_id, context) -> None`

**Conversation History Fix** (CRITICAL for agent memory):
The agent needs full conversation history, not just current message. Implement:
```python
async def _build_conversation_history(self, thread, current_input, context) -> list:
    from chatkit.types import UserMessageItem, AssistantMessageItem
    page = await self.store.load_thread_items(thread.id, None, 100, "asc", context)
    messages = []
    for item in page.data:
        if isinstance(item, UserMessageItem):
            text = ""
            if hasattr(item, 'content') and item.content:
                for part in item.content:
                    if hasattr(part, 'text'):
                        text += part.text
            if text:
                messages.append({"role": "user", "content": text})
        elif isinstance(item, AssistantMessageItem):
            text = ""
            if hasattr(item, 'content') and item.content:
                for part in item.content:
                    if hasattr(part, 'text'):
                        text += part.text
            if text:
                messages.append({"role": "assistant", "content": text})
    # Add current input
    if current_input:
        current_text = ""
        if hasattr(current_input, 'content') and current_input.content:
            for part in current_input.content:
                if hasattr(part, 'text'):
                    current_text += part.text
        if current_text and (not messages or messages[-1].get("content") != current_text):
            messages.append({"role": "user", "content": current_text})
    return messages
```

**LiteLLM Model Configuration** (for Gemini):
```python
gemini_model = LitellmModel(
    model="gemini/gemini-2.0-flash",
    api_key=os.getenv("GEMINI_API_KEY"),
)
```

**FastAPI Endpoint**:
```python
@app.post("/chatkit")
async def chatkit_endpoint(request: Request):
    result = await server.process(await request.body(), {})
    if isinstance(result, StreamingResult):
        return StreamingResponse(result, media_type="text/event-stream")
    return Response(content=result.json, media_type="application/json")
```

### Step 4: Create .env file

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Step 5: Setup Commands

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python main.py
```

Server runs at http://localhost:8000

### Supported AI Providers via LiteLLM:
- **Gemini**: `gemini/gemini-2.0-flash`, `gemini/gemini-1.5-pro`
- **OpenAI**: `openai/gpt-4o`, `openai/gpt-4-turbo`
- **Anthropic**: `anthropic/claude-3-sonnet`
- **Azure**: `azure/gpt-4`

---

## Execution

1. Create `backend/` directory if not exists
2. Write `backend/requirements.txt` with dependencies
3. Write `backend/main.py` with full ChatKit server implementation
4. Create `.env.example` in project root
5. Provide setup instructions to user
