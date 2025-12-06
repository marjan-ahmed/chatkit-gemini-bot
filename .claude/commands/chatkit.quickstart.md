---
description: Create a complete ChatKit full-stack application with backend (Python/FastAPI/Gemini) and frontend (React/Vite)
---

<!-- Note: Frontend can use any React framework (Vite, Next.js, CRA, etc.) -->

## User Input

```text
$ARGUMENTS
```

Parse user input for:
- **AI Provider**: gemini (default), openai, anthropic, azure
- **Project Name**: defaults to current directory name
- **Theme**: dark (default), light
- **Custom greeting**: optional

## ChatKit Full-Stack Quickstart

This skill creates a complete ChatKit application in one command.

### Architecture Overview

```
project-root/
├── backend/
│   ├── main.py           # FastAPI + ChatKit + Agent
│   ├── requirements.txt  # Python deps
│   └── .venv/           # Virtual env (user creates)
├── frontend/
│   ├── index.html       # HTML + CDN
│   ├── package.json     # Node deps
│   ├── vite.config.ts   # Vite config
│   ├── tsconfig.json    # TypeScript
│   └── src/
│       ├── main.tsx     # Entry
│       └── App.tsx      # ChatKit UI
├── .env.example         # Environment template
└── README.md            # Setup instructions
```

### Step 1: Execute Backend Setup

Run `/chatkit.backend` with the specified AI provider.

### Step 2: Execute Frontend Setup

Run `/chatkit.frontend` with the specified theme and customizations.

### Step 3: Create .env.example

```env
# AI Provider API Key (choose one based on your provider)
GEMINI_API_KEY=your_gemini_api_key_here
# OPENAI_API_KEY=your_openai_api_key_here
# ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### Step 4: Create README.md

```markdown
# ChatKit Application

Full-stack chat application with AI-powered responses.

## Quick Start

### 1. Backend Setup

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# Linux/Mac
source .venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your API key
```

### 3. Start Backend

```bash
cd backend
python main.py
# Server runs at http://localhost:8000
```

### 4. Frontend Setup (new terminal)

```bash
cd frontend
npm install
npm run dev
# UI runs at http://localhost:3000
```

### 5. Open Browser

Navigate to http://localhost:3000

## Architecture

- **Backend**: FastAPI + OpenAI ChatKit Python + Agents SDK + LiteLLM
- **Frontend**: React + Vite + OpenAI ChatKit React
- **AI Model**: Gemini 2.0 Flash (via LiteLLM adapter)

## API Endpoints

- `POST /chatkit` - ChatKit protocol endpoint
- `GET /health` - Health check

## Features

- Streaming responses
- Conversation history persistence
- Thread management
- Dark theme UI
```

### Step 5: Verify Setup

Checklist:
- [ ] Backend requirements.txt created
- [ ] Backend main.py with all Store methods implemented
- [ ] Backend has conversation history builder
- [ ] Frontend package.json created
- [ ] Frontend index.html has CDN script
- [ ] Frontend App.tsx has domainKey configured
- [ ] Frontend uses 'label' not 'name' in prompts
- [ ] .env.example created
- [ ] README.md with setup instructions

### Common Issues Quick Reference

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError: chatkit.stores` | Use `chatkit.store` (singular) |
| `ImportError: Event` | Don't import Event from chatkit.server |
| `Can't instantiate abstract class` | Implement ALL Store methods including attachments |
| Agent doesn't remember context | Use `_build_conversation_history()` method |
| `FatalAppError: Invalid input at api` | Add `domainKey: 'localhost'` |
| `Unrecognized key "name"` | Use `label` in startScreen.prompts |
| Blank screen | Add ChatKit CDN script to index.html |

---

## Execution Flow

1. Create backend directory and files using chatkit.backend skill
2. Create frontend directory and files using chatkit.frontend skill
3. Create .env.example in project root
4. Create README.md with setup instructions
5. Report completion status and next steps to user

**Output to user:**
- List all created files
- Provide quick start commands
- Note any customizations applied
