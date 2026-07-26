import { useEffect } from 'react'

function App() {
  useEffect(() => {
    window.location.href = './dashboard_ui/index.html'
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a237e 0%, #0d1642 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontFamily: 'system-ui, sans-serif',
      textAlign: 'center'
    }}>
      <div>
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>⚓</div>
        <h1 style={{ margin: '0 0 8px', fontSize: '1.6rem' }}>Paramount Merchant Navy</h1>
        <p style={{ opacity: 0.8, margin: '0 0 20px' }}>Redirecting to Dashboard…</p>
        <p><a href="./dashboard_ui/index.html" style={{ color: '#ffd700' }}>Click here if not redirected</a></p>
      </div>
    </div>
  )
}

export default App
