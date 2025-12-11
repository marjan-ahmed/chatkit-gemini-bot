import { ChatKit, useChatKit } from '@openai/chatkit-react'
import { useState, useEffect } from 'react'

function App() {
  const [initialThread, setInitialThread] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)

  // Load saved thread ID on mount
  useEffect(() => {
    const savedThread = localStorage.getItem('chatkit-thread-id')
    setInitialThread(savedThread)
    setIsReady(true)
  }, [])

  const { control } = useChatKit({
    api: {
      url: 'http://localhost:8001/chatkit',
      domainKey: 'localhost',
    },
    initialThread: initialThread,
    startScreen: {
      greeting: 'Welcome to ChatKit Gemini!',
      prompts: [
        { label: 'Hello', prompt: 'Say hello and introduce yourself' },
        { label: 'Help', prompt: 'What can you help me with?' },
        { label: 'Code', prompt: 'Write a simple Python hello world' },
      ],
    },
    composer: {
      placeholder: 'Ask Gemini anything...',
    },
    onThreadChange: ({ threadId }) => {
      console.log('Thread changed:', threadId)
      if (threadId) {
        localStorage.setItem('chatkit-thread-id', threadId)
      }
    },
    onError: ({ error }) => {
      console.error('ChatKit error:', error)
    },
    onReady: () => {
      console.log('ChatKit is ready!')
    },
  })

  if (!isReady) {
    return <div>Loading...</div>
  }

  return (
    <div style={{ 
      height: '100vh', 
      width: '100vw', 
      position: 'relative', 
      backgroundColor: '#f5f5f5', /* Light background for the main page */
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif'
    }}>
      
      {/* Placeholder Main Content */}
      <div style={{ textAlign: 'center', color: '#333' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>ChatKit Gemini Demo</h1>
        <p>Click the button in the bottom right to chat.</p>
      </div>

      {/* Floating Chat Button */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'black', /* Default ChatKit-ish black */
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            transition: 'transform 0.2s',
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      )}

      {/* Chat Popup Container */}
      {isChatOpen && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '350px',
          height: '500px', // Fixed height for standard popup feel
          maxHeight: 'calc(100vh - 4rem)',
          maxWidth: 'calc(100vw - 4rem)',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.3s ease-out'
        }}>
          {/* Header/Close Button (Optional, but good UX) */}
            {/* 
               We can render a tiny header or just a close button overlay.
               ChatKit usually has its own header, but we need a way to close the popup.
               Let's add a small absolute close button at the top right if ChatKit doesn't provide one easily hookable.
            */}
          <button 
            onClick={() => setIsChatOpen(false)}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              zIndex: 10,
              background: 'rgba(0,0,0,0.5)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px'
            }}
          >
            ×
          </button>

          {/* The ChatKit Component */}
          <div style={{ flex: 1, position: 'relative' }}>
             <ChatKit control={control} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default App
