---
description: Set up a ChatKit React frontend with Vite and TypeScript
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input for customization (theme colors, greeting text, layout type, etc).

**Layout Options:**
- `fullpage` (default): Full-screen chat UI with header
- `popup-right`: Floating button + popup window on bottom-right (recommended)
- `popup-left`: Floating button + popup window on bottom-left

## ChatKit Frontend Setup Guide

This skill creates a ChatKit React frontend with full conversation persistence.

### Step 1: Create Frontend Directory Structure

```
frontend/
├── index.html        # HTML with ChatKit CDN
├── package.json      # Dependencies
├── tsconfig.json     # TypeScript config
├── vite.config.ts    # Vite configuration
└── src/
    ├── main.tsx      # React entry point
    └── App.tsx       # ChatKit component
```

### Step 2: Create package.json

```json
{
  "name": "chatkit-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@openai/chatkit-react": "^1.3.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.6.3",
    "vite": "^6.0.3"
  }
}
```

### Step 3: Create index.html

**CRITICAL**: Include ChatKit CDN script:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ChatKit App</title>
    <script src="https://cdn.platform.openai.com/deployments/chatkit/chatkit.js" async></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body, #root { height: 100%; width: 100%; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      .h-full { height: 100%; }
      .w-full { width: 100%; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### Step 4: Create App.tsx

**CRITICAL GOTCHAS:**
1. **domainKey is REQUIRED**: `domainKey: 'localhost'` for local development
2. **startScreen.prompts**: Use `label` NOT `name`, do NOT include `icon`
3. **Thread persistence**: Use localStorage to persist thread ID

```tsx
import { ChatKit, useChatKit } from '@openai/chatkit-react'
import { useState, useEffect } from 'react'

function App() {
  const [initialThread, setInitialThread] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const savedThread = localStorage.getItem('chatkit-thread-id')
    setInitialThread(savedThread)
    setIsReady(true)
  }, [])

  const { control } = useChatKit({
    api: {
      url: 'http://localhost:8000/chatkit',
      domainKey: 'localhost',  // REQUIRED!
    },
    initialThread: initialThread,
    theme: {
      colorScheme: 'dark',
      color: {
        grayscale: { hue: 220, tint: 6, shade: -1 },
        accent: { primary: '#4cc9f0', level: 1 },
      },
      radius: 'round',
    },
    startScreen: {
      greeting: 'Welcome!',
      prompts: [
        { label: 'Hello', prompt: 'Say hello' },       // Use 'label' NOT 'name'
        { label: 'Help', prompt: 'What can you do?' }, // No 'icon' property
      ],
    },
    composer: {
      placeholder: 'Type a message...',
    },
    onThreadChange: ({ threadId }) => {
      if (threadId) {
        localStorage.setItem('chatkit-thread-id', threadId)
      }
    },
    onError: ({ error }) => console.error('ChatKit error:', error),
  })

  if (!isReady) return <div>Loading...</div>

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '1rem', background: '#16213e', color: '#4cc9f0' }}>
        <span>ChatKit App</span>
        <button onClick={() => { localStorage.removeItem('chatkit-thread-id'); window.location.reload() }}>
          New Chat
        </button>
      </header>
      <main style={{ flex: 1, overflow: 'hidden' }}>
        <ChatKit control={control} className="h-full w-full" />
      </main>
    </div>
  )
}

export default App
```

### Step 5: Create vite.config.ts

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/chatkit': 'http://localhost:8000'
    }
  }
})
```

### Step 6: Create tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

### Step 7: Create src/main.tsx

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### Step 8: Setup Commands

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:3000

### Common Errors and Fixes:

| Error | Fix |
|-------|-----|
| `FatalAppError: Invalid input at api` | Add `domainKey: 'localhost'` to api config |
| `Unrecognized key "name" at startScreen.prompts` | Change `name` to `label` |
| `Unrecognized key "icon"` | Remove `icon` from prompts |
| Blank screen | Ensure CDN script is in index.html |
| Chat not persisting | Implement localStorage for thread ID |

---

## Popup Layout (Bottom-Right)

For `popup-right` layout, use this App.tsx pattern:

```tsx
import { ChatKit, useChatKit } from '@openai/chatkit-react'
import { useState, useEffect } from 'react'

function App() {
  const [initialThread, setInitialThread] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)

  useEffect(() => {
    const savedThread = localStorage.getItem('chatkit-thread-id')
    setInitialThread(savedThread)
    setIsReady(true)
  }, [])

  const { control } = useChatKit({
    api: {
      url: 'http://localhost:8000/chatkit',
      domainKey: 'localhost',
    },
    initialThread: initialThread,
    theme: { colorScheme: 'dark' },
    startScreen: {
      greeting: 'Welcome!',
      prompts: [{ label: 'Hello', prompt: 'Say hello' }],
    },
    onThreadChange: ({ threadId }) => {
      if (threadId) localStorage.setItem('chatkit-thread-id', threadId)
    },
  })

  if (!isReady) return <div>Loading...</div>

  return (
    <div style={{ height: '100vh', width: '100vw', background: '#1a1a2e' }}>
      {/* Main page content */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <h1 style={{ color: '#4cc9f0' }}>Your App</h1>
      </div>

      {/* Floating Chat Button (bottom-right) */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          style={{
            position: 'fixed', bottom: '2rem', right: '2rem',
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #4361ee, #4cc9f0)',
            border: 'none', cursor: 'pointer', zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      )}

      {/* Chat Popup */}
      {isChatOpen && (
        <>
          <div onClick={() => setIsChatOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 999 }} />
          <div style={{
            position: 'fixed', bottom: '2rem', right: '2rem',
            width: '420px', height: '600px',
            maxWidth: 'calc(100vw - 4rem)', maxHeight: 'calc(100vh - 4rem)',
            background: '#16213e', borderRadius: '1rem', zIndex: 1000,
            display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            <div style={{ padding: '1rem', background: '#0f3460', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#4cc9f0', fontWeight: 'bold' }}>Assistant</span>
              <button onClick={() => setIsChatOpen(false)} style={{ background: 'transparent', border: 'none', color: '#a0a0a0', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <ChatKit control={control} className="h-full w-full" />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default App
```

**Key differences from fullpage:**
- `isChatOpen` state controls popup visibility
- Floating button with chat icon
- Backdrop overlay (click to close)
- Fixed-position popup window (420x600px)
- For `popup-left`: change `right: '2rem'` to `left: '2rem'`

---

## Execution

1. Create `frontend/` directory structure
2. Write all configuration files (package.json, tsconfig.json, vite.config.ts)
3. Write index.html with CDN script
4. Write src/main.tsx and src/App.tsx
5. Provide setup instructions to user
