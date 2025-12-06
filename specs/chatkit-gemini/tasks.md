# Tasks: ChatKit Gemini Full-Stack Chat Application

**Input**: Design documents from `/specs/chatkit-gemini/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)
**Status**: All tasks completed

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create project directory structure with `backend/` and `frontend/` folders
- [x] T002 [P] Initialize Python backend with FastAPI in `backend/requirements.txt`
- [x] T003 [P] Initialize React frontend in `frontend/package.json`
- [x] T004 [P] Create `.env.example` with GEMINI_API_KEY template
- [x] T005 [P] Create `run.sh` startup script for Unix
- [x] T006 [P] Create `run.bat` startup script for Windows

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T007 Implement MemoryStore class with ChatKit Store interface in `backend/main.py:45-150`
  - Thread CRUD operations (create, get, save, delete)
  - Item pagination with cursor support
  - Attachment storage methods
  - ThreadState dataclass for state management

- [x] T008 Implement GeminiChatKitServer class extending ChatKitServer in `backend/main.py:152-250`
  - Initialize **OpenAI Agents SDK** `Agent` class with LiteLLM backend
  - Set up system instructions for AI behavior
  - Configure model as `gemini/gemini-2.0-flash` (LiteLLM format)

- [x] T009 Configure FastAPI app with CORS middleware in `backend/main.py:260-280`
  - Allow all origins for development
  - Mount static files for production build

- [x] T010 [P] Create health check endpoint `GET /health` in `backend/main.py:285-290`
- [x] T011 [P] Create debug endpoint `GET /debug/threads` in `backend/main.py:292-310`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Chat with AI Assistant (Priority: P1)

**Goal**: Users can have real-time conversations with Gemini AI through a chat interface

**Independent Test**: Open app, click chat button, send message, receive streamed response

### Implementation for User Story 1

- [x] T012 [US1] Implement `respond()` method in GeminiChatKitServer `backend/main.py:180-245`
  - Load conversation history from MemoryStore
  - Convert ThreadItems to Agent input format using ThreadItemConverter
  - Use **OpenAI Agents SDK** `stream_agent_response()` to stream from Agent
  - Yield ThreadItemAdded, ThreadItemUpdated, ThreadItemDone events

- [x] T013 [US1] Implement ID collision fix for Gemini/LiteLLM `backend/main.py:220-241`
  - Create `old_id_to_new_id` mapping dictionary
  - Generate unique IDs with `chatcmpl-{uuid}` format
  - Apply mapping to all stream events

- [x] T014 [US1] Create POST `/chatkit` endpoint with StreamingResponse `backend/main.py:280-285`

- [x] T015 [P] [US1] Create React App component with ChatKit integration `frontend/src/App.tsx:1-50`
  - Import useChatKit hook from @openai/chatkit-react
  - Configure API endpoint as `http://localhost:8000/chatkit`

- [x] T016 [P] [US1] Implement floating chat button UI `frontend/src/App.tsx:180-220`
  - Position fixed bottom-right with cyan accent color
  - Chat icon when closed, X icon when open
  - Hover effects and animations

- [x] T017 [US1] Implement modal chat popup `frontend/src/App.tsx:100-180`
  - Dark theme with #1a1a2e background
  - Header with title and close button
  - ChatKit component rendering
  - Backdrop overlay for dismissal

- [x] T018 [US1] Style chat interface with dark theme `frontend/src/App.tsx:50-100`
  - Primary: #1a1a2e (dark navy)
  - Header: #0f3460 (darker blue)
  - Accent: #4cc9f0 (cyan)
  - popupIn animation keyframe

**Checkpoint**: User Story 1 complete - users can chat with AI

---

## Phase 4: User Story 2 - Conversation Persistence (Priority: P2)

**Goal**: Users can return to their previous conversation when reopening the app

**Independent Test**: Have conversation, refresh page, verify thread ID persists

### Implementation for User Story 2

- [x] T019 [US2] Implement localStorage thread ID persistence `frontend/src/App.tsx:20-35`
  - Load initial thread ID from localStorage on mount
  - Set `isReady` state after async initialization

- [x] T020 [US2] Add `onThreadChange` callback to save thread ID `frontend/src/App.tsx:60-65`
  - Save new thread ID to localStorage when thread changes

- [x] T021 [US2] Implement "New Chat" button functionality `frontend/src/App.tsx:140-155`
  - Clear localStorage thread ID
  - Reload page to reset ChatKit state

- [x] T022 [US2] Implement thread history loading in backend `backend/main.py:185-200`
  - Load all items (up to 100) from MemoryStore
  - Pass conversation history to Agent for context

**Checkpoint**: User Story 2 complete - conversations persist across sessions

---

## Phase 5: User Story 3 - Suggested Prompts (Priority: P3)

**Goal**: New users see suggested prompts to help them get started

**Independent Test**: Open fresh chat (no history), verify three suggested prompts appear

### Implementation for User Story 3

- [x] T023 [US3] Configure ChatKit startScreen with suggested prompts `frontend/src/App.tsx:70-85`
  - "What can you help me with?"
  - "Tell me a fun fact"
  - "How does this chat work?"

**Checkpoint**: User Story 3 complete - new users have onboarding prompts

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T024 [P] Configure dev server proxy for backend API (framework-specific config)
- [x] T025 [P] Add responsive styles for mobile `frontend/src/App.tsx` (maxWidth/maxHeight)
- [x] T026 [P] Add onReady and onError callbacks for debugging `frontend/src/App.tsx:85-95`
- [x] T027 Create landing page with CTA button `frontend/src/App.tsx:230-260`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - started immediately
- **Foundational (Phase 2)**: Depends on Setup completion
- **User Story 1 (Phase 3)**: Depends on Foundational - core chat functionality
- **User Story 2 (Phase 4)**: Depends on US1 - adds persistence layer
- **User Story 3 (Phase 5)**: Depends on US1 - adds onboarding UX
- **Polish (Phase 6)**: Parallel with user stories

### Task Dependencies Within Phases

```
Phase 2: T007 (MemoryStore) → T008 (Server) → T009 (FastAPI) → T010, T011 (endpoints)
Phase 3: T012 (respond) → T013 (ID fix) → T014 (endpoint) | T015-T18 (frontend parallel)
Phase 4: T019 → T020 → T021 (frontend) | T022 (backend independent)
Phase 5: T023 (standalone)
Phase 6: All parallel
```

---

## Completion Summary

| Phase | Tasks | Status |
|-------|-------|--------|
| Setup | 6 | Complete |
| Foundational | 5 | Complete |
| User Story 1 | 7 | Complete |
| User Story 2 | 4 | Complete |
| User Story 3 | 1 | Complete |
| Polish | 4 | Complete |
| **Total** | **27** | **All Complete** |

---

## Validation Commands

```bash
# Health check
curl http://localhost:8000/health

# Debug threads
curl http://localhost:8000/debug/threads

# Start application
./run.sh  # Unix
run.bat   # Windows
```
