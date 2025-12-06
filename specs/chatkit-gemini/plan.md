# Implementation Plan: ChatKit Gemini

**Branch**: `master` | **Date**: 2025-12-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/chatkit-gemini/spec.md`

## Summary

Build a full-stack AI chat application that integrates OpenAI's ChatKit framework with the **OpenAI Agents SDK** to orchestrate conversations with Google's Gemini model via LiteLLM. The solution provides a React-based floating chat UI that communicates with a FastAPI backend, featuring real-time streaming responses powered by the Agents SDK's `Agent` class, conversation persistence, and in-memory thread storage.

## Technical Context

**Language/Version**: Python 3.11+ (backend), TypeScript (frontend)
**Primary Dependencies**:
- Backend: FastAPI, **OpenAI Agents SDK** (`openai-agents[litellm]`), openai-chatkit
- Frontend: React 18+, @openai/chatkit-react (compatible with any React framework: Vite, Next.js, CRA, etc.)
**Storage**: In-memory (MemoryStore class) with localStorage for thread ID persistence
**Testing**: Manual testing via health/debug endpoints
**Target Platform**: Web browser (any modern browser)
**Project Type**: Web application (frontend + backend)
**Performance Goals**: Real-time streaming with minimal latency
**Constraints**: Requires GEMINI_API_KEY environment variable
**Scale/Scope**: Single-user local development (can scale with persistent storage)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Single responsibility: Each component has clear purpose
- [x] Minimal dependencies: Only essential packages included
- [x] No hardcoded secrets: API key loaded from environment
- [x] Error handling: Health check and debug endpoints for monitoring

## Project Structure

### Documentation (this feature)

```text
specs/chatkit-gemini/
├── spec.md              # Feature specification
├── plan.md              # This file - architectural decisions
└── tasks.md             # Implementation tasks (completed)
```

### Source Code (repository root)

```text
backend/
├── main.py              # FastAPI app, GeminiChatKitServer, MemoryStore
├── requirements.txt     # Python dependencies
└── .python-version      # Python version specification

frontend/
├── src/
│   ├── App.tsx          # Main React component with chat UI
│   └── main.tsx         # React entry point
├── package.json         # npm dependencies
└── tsconfig.json        # TypeScript configuration

# Root files
├── .env.example         # Environment variable template
├── run.sh               # Unix startup script
└── run.bat              # Windows startup script
```

**Structure Decision**: Web application structure selected with separate `backend/` and `frontend/` directories. This cleanly separates Python (FastAPI) from TypeScript (React/Vite) concerns while allowing coordinated startup via run scripts.

## Key Architectural Decisions

### ADR-001: ChatKit Framework for Protocol Compatibility

**Context**: Need a standardized chat protocol for frontend-backend communication.

**Decision**: Use OpenAI's ChatKit framework (@openai/chatkit-react frontend, openai-chatkit backend).

**Rationale**:
- Provides battle-tested chat UI components
- Handles streaming, threading, and pagination automatically
- Standardized event protocol (ThreadItemAdded, ThreadItemUpdated, ThreadItemDone)
- Reduces custom code significantly

**Tradeoffs**: Tied to OpenAI's component API; limited customization of chat internals.

---

### ADR-002: OpenAI Agents SDK for Agent Orchestration

**Context**: Need a framework to manage AI agent behavior, conversation flow, and streaming responses.

**Decision**: Use the **OpenAI Agents SDK** (`openai-agents` package) as the core agent orchestration layer.

**Rationale**:
- Provides `Agent` class for defining AI behavior with system instructions
- Built-in streaming support via `Runner.run_streamed()` and response event handling
- Native integration with ChatKit's event protocol (ThreadItemAdded, ThreadItemUpdated, ThreadItemDone)
- `stream_agent_response()` helper for easy SSE streaming
- Supports tool/function calling for agentic workflows (extensible for future features)
- LiteLLM integration via `openai-agents[litellm]` enables non-OpenAI models

**Implementation**:
```python
from agents import Agent
from agents.extensions.chatkit import stream_agent_response

agent = Agent(
    name="Gemini Assistant",
    instructions="You are a helpful assistant...",
    model="gemini/gemini-2.0-flash"  # LiteLLM model string
)

# In respond() method:
async for event in stream_agent_response(agent, items):
    yield event
```

**Tradeoffs**: Tied to OpenAI's agent paradigm; learning curve for Agents SDK concepts (Runner, Agent, Tools).

---

### ADR-003: LiteLLM for Multi-Provider Model Support

**Context**: Want to use Gemini but maintain flexibility for other providers.

**Decision**: Use LiteLLM via `openai-agents[litellm]` for model abstraction.

**Rationale**:
- Single API for multiple LLM providers (Gemini, OpenAI, Anthropic, etc.)
- Easy to switch models by changing configuration
- Maintains OpenAI-compatible interface expected by ChatKit

**Tradeoffs**: Additional abstraction layer; must handle provider-specific quirks (like ID collisions).

---

### ADR-004: In-Memory Storage with MemoryStore

**Context**: Need to persist thread state for conversation continuity.

**Decision**: Implement custom MemoryStore class that fulfills ChatKit's Store interface.

**Rationale**:
- No external database dependencies for hackathon/demo purposes
- Full control over thread/item lifecycle
- Easy to swap for persistent storage later (Redis, PostgreSQL)

**Tradeoffs**: Data lost on server restart; not suitable for production multi-user scenarios.

---

### ADR-005: ID Collision Fix for Gemini/LiteLLM

**Context**: Gemini via LiteLLM returns messages with potentially colliding IDs, causing message overwrites in ChatKit.

**Decision**: Implement ID remapping in `GeminiChatKitServer.respond()` that maps old IDs to new unique IDs for all stream events.

**Rationale**:
- Critical bug fix - without this, messages overwrite each other
- Documented issue in ChatKit knowledge base
- Minimal performance impact (simple dict lookup)

**Implementation**: Lines 220-241 in `backend/main.py` - maintains `old_id_to_new_id` mapping dict and applies to ThreadItemAdded, ThreadItemDone, ThreadItemUpdated events.

---

### ADR-006: Floating Chat Button UI Pattern

**Context**: Need a non-intrusive way to access chat functionality.

**Decision**: Implement floating action button (FAB) that opens modal chat overlay.

**Rationale**:
- Common UX pattern (Intercom, Drift, etc.)
- Doesn't interfere with main page content
- Easy to dismiss/reopen
- Mobile-friendly

**Tradeoffs**: Takes up screen real estate when open; may conflict with other FABs.

## API Contract

### POST /chatkit

**Purpose**: Main chat endpoint for sending messages and receiving streamed responses.

**Request**: JSON body handled by ChatKit framework (thread_id, message content)

**Response**: `text/event-stream` with Server-Sent Events containing:
- `thread.item.added` - New message added to thread
- `thread.item.updated` - Message content updated (during streaming)
- `thread.item.done` - Message complete

### GET /health

**Purpose**: Service health check.

**Response**:
```json
{"status": "ok", "model": "gemini-2.0-flash"}
```

### GET /debug/threads

**Purpose**: Debug endpoint to inspect all stored threads.

**Response**: JSON object with all thread states, items, and metadata.

## Data Flow

```
User Browser (React + ChatKit)
    │
    ├── Click chat button → Open modal
    ├── Type message → Send to ChatKit hook
    │
    └──► POST /chatkit (streaming)
         │
         └──► FastAPI Backend
              │
              ├── Load thread history from MemoryStore
              ├── Convert items to Agent input format (ThreadItemConverter)
              │
              └──► OpenAI Agents SDK
                   │
                   ├── Agent class with Gemini model config
                   ├── stream_agent_response() generates events
                   ├── LiteLLM routes to Gemini API
                   │
                   └──► Stream Events (ThreadItemAdded/Updated/Done)
                        │
                        ├── Remap IDs (collision fix)
                        └── Return SSE stream
                             │
                             └──► ChatKit React updates UI in real-time
                                  │
                                  └── Thread ID saved to localStorage
```

## Complexity Tracking

No constitution violations requiring justification. The implementation follows minimal complexity principles:

- Single backend file (main.py) with clear class separation
- Single frontend component (App.tsx) with inline styles
- No unnecessary abstractions or patterns
- Direct function calls, no event buses or complex state management
