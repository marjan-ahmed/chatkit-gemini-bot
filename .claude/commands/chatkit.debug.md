---
description: Debug and fix common ChatKit integration issues
---

## User Input

```text
$ARGUMENTS
```

Parse user input for error messages or symptoms.

## ChatKit Debug Guide

This skill diagnoses and fixes common ChatKit issues.

### Diagnostic Steps

1. **Check Backend Logs**
   - Look for import errors
   - Look for Store method errors
   - Check if items are being stored

2. **Check Frontend Console**
   - Look for FatalAppError
   - Check network requests to /chatkit
   - Look for React errors

3. **Check Network Tab**
   - Verify POST /chatkit requests
   - Check response format (SSE for streaming)
   - Look for CORS errors

### Error Database

#### Backend Errors

**`ModuleNotFoundError: No module named 'chatkit.stores'`**
```python
# WRONG
from chatkit.stores import Store

# CORRECT
from chatkit.store import Store
```

**`ModuleNotFoundError: No module named 'chatkit.models'`**
```python
# WRONG
from chatkit.models import ThreadMetadata

# CORRECT
from chatkit.types import ThreadMetadata
```

**`ImportError: cannot import name 'Event' from 'chatkit.server'`**
```python
# WRONG
from chatkit.server import ChatKitServer, StreamingResult, Event

# CORRECT - Event doesn't exist, remove it
from chatkit.server import ChatKitServer, StreamingResult
```

**`ImportError: cannot import name 'ClientToolCallOutputItem'`**
```python
# WRONG
from chatkit.types import ClientToolCallOutputItem

# CORRECT - Use Any type instead
from typing import Any
```

**`ImportError: cannot import name 'FilePart'`**
```python
# WRONG
from chatkit.types import FilePart

# CORRECT - Use Any type instead
from typing import Any
```

**`TypeError: Can't instantiate abstract class`**
```
Missing methods - implement ALL of these:
- generate_thread_id
- generate_item_id
- load_thread
- save_thread
- load_thread_items
- add_thread_item
- save_item
- load_item
- delete_thread_item
- load_threads
- delete_thread
- save_attachment      # Often forgotten!
- load_attachment      # Often forgotten!
- delete_attachment    # Often forgotten!
```

**Agent Not Remembering Conversation**
```python
# Problem: Only current message passed to agent
# Solution: Build full conversation history

async def respond(self, thread, input, context):
    # Load history
    conversation = await self._build_conversation_history(thread, input, context)

    # Pass to agent
    result = Runner.run_streamed(
        self.agent,
        conversation,  # Full history, not just input
        context=agent_context,
    )
```

#### Frontend Errors

**`FatalAppError: Invalid input at api`**
```typescript
// WRONG
api: {
  url: 'http://localhost:8000/chatkit',
}

// CORRECT - domainKey required
api: {
  url: 'http://localhost:8000/chatkit',
  domainKey: 'localhost',
}
```

**`Unrecognized key "name" at startScreen.prompts`**
```typescript
// WRONG
prompts: [
  { name: 'Hello', prompt: 'Say hello' }
]

// CORRECT
prompts: [
  { label: 'Hello', prompt: 'Say hello' }
]
```

**`Unrecognized key "icon"`**
```typescript
// WRONG
prompts: [
  { label: 'Hello', prompt: 'Say hello', icon: '👋' }
]

// CORRECT - remove icon
prompts: [
  { label: 'Hello', prompt: 'Say hello' }
]
```

**Blank Screen / No Chat UI**
```html
<!-- Missing CDN script in index.html -->
<head>
  <script src="https://cdn.platform.openai.com/deployments/chatkit/chatkit.js" async></script>
</head>
```

**History Not Loading on Page Refresh**
```typescript
// Need to persist thread ID
useEffect(() => {
  const saved = localStorage.getItem('chatkit-thread-id')
  setInitialThread(saved)
}, [])

// And save on change
onThreadChange: ({ threadId }) => {
  if (threadId) localStorage.setItem('chatkit-thread-id', threadId)
}
```

#### CORS Errors

```python
# Add CORS middleware to FastAPI
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Quick Diagnosis Checklist

Run through these checks:

- [ ] Backend starts without import errors
- [ ] Backend logs show "Starting server at..."
- [ ] Frontend compiles without errors
- [ ] Network shows 200 response from /chatkit
- [ ] Response is SSE stream (text/event-stream)
- [ ] Chat UI renders (not blank)
- [ ] Messages send and receive
- [ ] Agent remembers context across messages
- [ ] History persists on page refresh

---

## Execution

1. Identify error type from user input
2. Look up solution in error database
3. Provide specific fix with code example
4. If issue not in database, analyze and debug systematically
