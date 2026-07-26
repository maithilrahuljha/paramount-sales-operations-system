import { useEffect } from 'react'

function App() {
  useEffect(() => {
    // Redirect to the dashboard
    window.location.href = './dashboard_ui/index.html'
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-blue-800 flex items-center justify-center">
      <div className="text-center text-white p-8">
        <div className="text-7xl mb-6">⚓</div>
        <h1 className="text-3xl font-bold mb-2">Paramount Merchant Navy</h1>
        <p className="text-indigo-200 mb-6">Redirecting to Sales Dashboard...</p>
        <div className="w-8 h-8 border-4 border-indigo-300 border-t-yellow-400 rounded-full animate-spin mx-auto mb-6"></div>
        <a 
          href="./dashboard_ui/index.html" 
          className="text-yellow-400 hover:text-yellow-300 underline"
        >
          Click here if not redirected
        </a>
      </div>
    </div>
  )
}

export default App
