import { useEffect } from 'react'

function App() {
  useEffect(() => {
    // Get the current path base (works for any repo name)
    // e.g. /paramount-sales-operations-system/ → redirect to dashboard_ui/ inside it
    const pathParts = window.location.pathname.split('/').filter(Boolean)
    // pathParts[0] is the repo name on GitHub Pages
    const repoBase = pathParts.length > 0 ? '/' + pathParts[0] + '/' : '/'
    window.location.href = repoBase + 'dashboard_ui/index.html'
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
