# Feature Specification: ChatKit Gemini Full-Stack Chat Application

**Feature Branch**: `master`
**Created**: 2025-12-06
**Status**: Implemented
**Input**: Build a full-stack AI chat application using OpenAI's ChatKit framework with Google Gemini as the LLM backend

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Chat with AI Assistant (Priority: P1)

Users can have real-time conversations with a Gemini-powered AI assistant through a modern chat interface.

**Why this priority**: Core functionality - without this, there is no product. Users need to send messages and receive AI responses.

**Independent Test**: Can be fully tested by opening the app, clicking the chat button, typing a message, and receiving a streamed AI response.

**Acceptance Scenarios**:

1. **Given** the app is loaded, **When** user clicks the chat button, **Then** a modal chat interface opens
2. **Given** the chat is open, **When** user types a message and sends it, **Then** the message appears in the chat history
3. **Given** a message was sent, **When** the AI responds, **Then** the response streams in real-time character by character
4. **Given** a conversation is ongoing, **When** user sends follow-up messages, **Then** the AI maintains conversation context

---

### User Story 2 - Conversation Persistence (Priority: P2)

Users can return to their previous conversation when reopening the app.

**Why this priority**: Improves user experience by not losing conversation history on page refresh.

**Independent Test**: Can be tested by having a conversation, refreshing the page, and verifying the thread ID persists and conversation can continue.

**Acceptance Scenarios**:

1. **Given** a conversation is active, **When** user refreshes the page, **Then** the thread ID is preserved in localStorage
2. **Given** a thread ID exists in localStorage, **When** the app loads, **Then** the ChatKit component initializes with that thread
3. **Given** a user wants to start fresh, **When** they click "New Chat", **Then** localStorage is cleared and a new thread begins

---

### User Story 3 - Suggested Prompts (Priority: P3)

New users see suggested prompts to help them get started with the chat.

**Why this priority**: Improves onboarding experience but not critical for core functionality.

**Independent Test**: Can be tested by opening a fresh chat (no history) and verifying three suggested prompts appear.

**Acceptance Scenarios**:

1. **Given** the chat modal opens with no history, **When** the start screen renders, **Then** three suggested prompt buttons appear
2. **Given** suggested prompts are visible, **When** user clicks one, **Then** that prompt is sent as a message

---

### Edge Cases

- What happens when the Gemini API key is missing or invalid? → Backend returns health check failure
- How does system handle network disconnection during streaming? → Stream terminates, partial response shown
- What happens when message IDs collide (Gemini/LiteLLM issue)? → Backend maps IDs to unique values
- How does system handle very long conversations? → Items paginated with cursor support (100 items per page)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a floating chat button that opens a modal chat interface
- **FR-002**: System MUST send user messages to a backend API endpoint via POST request
- **FR-003**: System MUST stream AI responses using Server-Sent Events (SSE)
- **FR-004**: System MUST maintain conversation context across multiple messages in a thread
- **FR-005**: System MUST persist thread ID to browser localStorage for session continuity
- **FR-006**: System MUST provide a "New Chat" button to reset the conversation
- **FR-007**: System MUST handle Gemini/LiteLLM message ID collisions by remapping IDs
- **FR-008**: System MUST provide health check endpoint for monitoring
- **FR-009**: System MUST provide debug endpoint for inspecting thread state
- **FR-010**: System MUST implement in-memory store for thread and message data

### Key Entities

- **Thread**: Represents a conversation session with unique ID, metadata, and creation timestamp
- **ThreadItem**: Individual message in a conversation (user message or AI response) with content, role, and ID
- **Attachment**: Optional file attachments associated with thread items (storage implemented but UI not exposed)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can send a message and receive a streamed response within 2 seconds of API call
- **SC-002**: Health check endpoint returns `{"status": "ok", "model": "gemini-2.0-flash"}` when service is healthy
- **SC-003**: Conversation context is maintained for at least 100 messages per thread
- **SC-004**: Page refresh preserves thread ID and allows conversation continuation
- **SC-005**: UI renders responsively on mobile devices (modal has max-width/max-height constraints)
