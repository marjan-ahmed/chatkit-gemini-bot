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
      url: 'http://localhost:8000/chatkit',
      domainKey: 'localhost',
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
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#1a1a2e', color: '#4cc9f0' }}>Loading...</div>
  }

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      background: '#1a1a2e',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Main Page Content */}
      <div style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <h1 style={{
          color: '#4cc9f0',
          fontSize: '3rem',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          ChatKit Gemini
        </h1>
        <p style={{
          color: '#a0a0a0',
          fontSize: '1.25rem',
          marginBottom: '2rem',
          textAlign: 'center',
          maxWidth: '600px'
        }}>
          AI-powered chat assistant using Google Gemini
        </p>
        <button
          onClick={() => setIsChatOpen(true)}
          style={{
            padding: '1rem 2rem',
            background: 'linear-gradient(135deg, #4361ee, #4cc9f0)',
            color: 'white',
            border: 'none',
            borderRadius: '0.75rem',
            cursor: 'pointer',
            fontSize: '1.125rem',
            fontWeight: 'bold',
            boxShadow: '0 4px 20px rgba(76, 201, 240, 0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.boxShadow = '0 6px 30px rgba(76, 201, 240, 0.4)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(76, 201, 240, 0.3)'
          }}
        >
          Open Chat
        </button>
      </div>

      {/* Floating Chat Button (bottom-right) */}
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
            background: 'linear-gradient(135deg, #4361ee, #4cc9f0)',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(76, 201, 240, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s',
            zIndex: 100
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      )}

      {/* Chat Popup (bottom-right, above the button) */}
      {isChatOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsChatOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.3)',
              zIndex: 999
            }}
          />

          {/* Popup Window */}
          <div style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            width: '420px',
            height: '600px',
            maxWidth: 'calc(100vw - 4rem)',
            maxHeight: 'calc(100vh - 4rem)',
            background: '#16213e',
            borderRadius: '1rem',
            boxShadow: '0 10px 50px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 1000,
            animation: 'popupIn 0.25s ease-out'
          }}>
            {/* Chat Header */}
            <div style={{
              padding: '1rem 1.25rem',
              background: '#0f3460',
              borderBottom: '1px solid #1a1a2e',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <span style={{ color: '#4cc9f0', fontWeight: 'bold', fontSize: '1rem' }}>
                Gemini Assistant
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => {
                    localStorage.removeItem('chatkit-thread-id')
                    window.location.reload()
                  }}
                  style={{
                    padding: '0.4rem 0.6rem',
                    background: '#4361ee',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.7rem'
                  }}
                >
                  New Chat
                </button>
                <button
                  onClick={() => setIsChatOpen(false)}
                  style={{
                    padding: '0.4rem',
                    background: 'transparent',
                    color: '#a0a0a0',
                    border: '1px solid #a0a0a0',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>

            {/* Chat Content */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <ChatKit control={control} className="h-full w-full" />
            </div>
          </div>
        </>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes popupIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

export default App
