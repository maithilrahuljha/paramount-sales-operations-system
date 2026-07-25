import { useState, useEffect } from 'react'

function App() {
  const [activeTab, setActiveTab] = useState('overview')
  const [files, setFiles] = useState<{ name: string; path: string; type: string }[]>([])

  useEffect(() => {
    // Define all project files
    setFiles([
      { name: 'morning_briefing.yml', path: '.github/workflows/', type: 'workflow' },
      { name: 'hourly_aggregation.yml', path: '.github/workflows/', type: 'workflow' },
      { name: 'monthly_archive.yml', path: '.github/workflows/', type: 'workflow' },
      { name: 'google_sheets_connector.py', path: 'scripts/', type: 'python' },
      { name: 'send_slack_email.py', path: 'scripts/', type: 'python' },
      { name: 'archive_leads.py', path: 'scripts/', type: 'python' },
      { name: 'index.html', path: 'dashboard_ui/', type: 'html' },
      { name: 'style.css', path: 'dashboard_ui/', type: 'css' },
      { name: 'app.js', path: 'dashboard_ui/', type: 'javascript' },
      { name: 'config.js', path: 'dashboard_ui/', type: 'javascript' },
      { name: 'Code.gs', path: 'apps_script_backup/', type: 'script' },
      { name: 'paramount_dashboard.json', path: 'looker_studio_export/', type: 'json' },
      { name: 'index.html', path: 'docs/', type: 'html' },
      { name: 'requirements.txt', path: '', type: 'config' },
      { name: 'README.md', path: '', type: 'markdown' },
      { name: '.gitignore', path: '', type: 'config' },
      { name: 'LICENSE', path: '', type: 'license' },
    ])
  }, [])

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'workflow': return '⚙️'
      case 'python': return '🐍'
      case 'html': return '🌐'
      case 'css': return '🎨'
      case 'javascript': return '📜'
      case 'script': return '📝'
      case 'json': return '📊'
      case 'markdown': return '📖'
      case 'config': return '⚡'
      case 'license': return '📜'
      default: return '📄'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-blue-800">
      {/* Header */}
      <header className="bg-indigo-950/50 backdrop-blur-sm border-b border-indigo-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-5xl">⚓</span>
              <div>
                <h1 className="text-2xl font-bold text-white">Paramount Merchant Navy</h1>
                <p className="text-indigo-300 text-sm">Sales Operations CRM System</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                ✓ All Files Generated
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-indigo-950/30 border-b border-indigo-700/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {[
              { id: 'overview', label: '📋 Overview' },
              { id: 'files', label: '📁 Files' },
              { id: 'setup', label: '🔧 Quick Setup' },
              { id: 'dashboard', label: '📊 Preview Dashboard' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-yellow-400 border-b-2 border-yellow-400'
                    : 'text-indigo-300 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="bg-indigo-800/30 rounded-2xl p-8 border border-indigo-600/30">
              <h2 className="text-3xl font-bold text-white mb-4">
                🚀 Complete CRM System Generated!
              </h2>
              <p className="text-indigo-200 text-lg mb-6">
                All 17 files have been successfully generated. This system includes automated 
                workflows, a real-time dashboard, Python scripts for data processing, and 
                comprehensive documentation.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { icon: '📊', label: 'Dashboard Files', count: 4 },
                  { icon: '⚙️', label: 'GitHub Workflows', count: 3 },
                  { icon: '🐍', label: 'Python Scripts', count: 3 },
                  { icon: '📄', label: 'Config & Docs', count: 7 },
                ].map((stat, i) => (
                  <div key={i} className="bg-indigo-700/30 rounded-xl p-4 text-center">
                    <span className="text-3xl">{stat.icon}</span>
                    <p className="text-2xl font-bold text-white mt-2">{stat.count}</p>
                    <p className="text-indigo-300 text-sm">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: '📬',
                  title: 'Morning Briefings',
                  desc: 'Automated daily briefings via Slack and Email at 8:30 AM IST',
                },
                {
                  icon: '📈',
                  title: 'KPI Tracking',
                  desc: 'Hourly aggregation of leads, conversions, and follow-ups',
                },
                {
                  icon: '🗄️',
                  title: 'Auto Archiving',
                  desc: 'Monthly archival of enrolled leads to keep data organized',
                },
                {
                  icon: '🌐',
                  title: 'Live Dashboard',
                  desc: 'Real-time dashboard on GitHub Pages with auto-refresh',
                },
                {
                  icon: '🔢',
                  title: 'Lead ID Generator',
                  desc: 'Auto-generates unique IDs (PMN-2026-XXXX) via Apps Script',
                },
                {
                  icon: '📊',
                  title: 'Looker Studio',
                  desc: 'Advanced analytics with pre-built dashboard schema',
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-yellow-500/50 transition-colors"
                >
                  <span className="text-4xl">{feature.icon}</span>
                  <h3 className="text-xl font-semibold text-white mt-4">{feature.title}</h3>
                  <p className="text-indigo-200 mt-2">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-4 bg-indigo-800/50 border-b border-indigo-600/30">
              <h2 className="text-xl font-semibold text-white">📁 Generated Files ({files.length})</h2>
              <p className="text-indigo-300 text-sm mt-1">
                All files are ready for upload to your GitHub repository
              </p>
            </div>
            <div className="divide-y divide-indigo-700/30">
              {files.map((file, i) => (
                <div
                  key={i}
                  className="px-4 py-3 flex items-center justify-between hover:bg-indigo-700/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getFileIcon(file.type)}</span>
                    <div>
                      <p className="text-white font-medium">{file.name}</p>
                      <p className="text-indigo-400 text-sm">{file.path || '/'}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                    ✓ Ready
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Setup Tab */}
        {activeTab === 'setup' && (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6">🔧 Quick Setup Guide</h2>
              
              <div className="space-y-4">
                {[
                  {
                    step: 1,
                    title: 'Download All Files',
                    desc: 'Copy all generated files from this project to your local machine',
                  },
                  {
                    step: 2,
                    title: 'Create Google Sheets',
                    desc: 'Create Lead_Register, Followup_Tracker, Student_Master_DB, and Daily_Sales_Log sheets',
                  },
                  {
                    step: 3,
                    title: 'Create Google Forms',
                    desc: 'Create Lead Intake, Followup Log, and Daily Report forms linked to sheets',
                  },
                  {
                    step: 4,
                    title: 'Setup Service Account',
                    desc: 'Create a Google Cloud project and service account with Sheets/Drive API access',
                  },
                  {
                    step: 5,
                    title: 'Create GitHub Repository',
                    desc: 'Upload all files to a new GitHub repository',
                  },
                  {
                    step: 6,
                    title: 'Configure GitHub Secrets',
                    desc: 'Add GOOGLE_SERVICE_ACCOUNT_JSON, DRIVE_FOLDER_ID, SLACK_WEBHOOK_URL, GMAIL_USER, GMAIL_APP_PASSWORD',
                  },
                  {
                    step: 7,
                    title: 'Enable GitHub Pages',
                    desc: 'Enable Pages from Settings and set source to /dashboard_ui folder',
                  },
                  {
                    step: 8,
                    title: 'Deploy Apps Script',
                    desc: 'Open Lead_Register → Extensions → Apps Script → Paste Code.gs',
                  },
                  {
                    step: 9,
                    title: 'Update config.js',
                    desc: 'Replace placeholder URLs with your actual published CSV URLs',
                  },
                  {
                    step: 10,
                    title: 'Test Workflows',
                    desc: 'Run each GitHub Action manually to verify everything works',
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="flex gap-4 p-4 bg-indigo-700/20 rounded-xl border border-indigo-600/30"
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-yellow-500 text-indigo-900 rounded-full flex items-center justify-center font-bold">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{item.title}</h3>
                      <p className="text-indigo-300 text-sm mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* GitHub Secrets Reference */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-4">🔐 Required GitHub Secrets</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-indigo-600/30">
                      <th className="py-2 px-4 text-indigo-300 font-medium">Secret Name</th>
                      <th className="py-2 px-4 text-indigo-300 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-700/30">
                    {[
                      { name: 'GOOGLE_SERVICE_ACCOUNT_JSON', desc: 'Full JSON content of service account key' },
                      { name: 'DRIVE_FOLDER_ID', desc: 'ID of your Paramount_CRM_Data folder' },
                      { name: 'SLACK_WEBHOOK_URL', desc: 'Slack incoming webhook URL (optional)' },
                      { name: 'GMAIL_USER', desc: 'Gmail address for sending briefings' },
                      { name: 'GMAIL_APP_PASSWORD', desc: '16-character Gmail App Password' },
                    ].map((secret, i) => (
                      <tr key={i} className="hover:bg-indigo-700/20">
                        <td className="py-2 px-4 font-mono text-yellow-400 text-sm">{secret.name}</td>
                        <td className="py-2 px-4 text-indigo-200 text-sm">{secret.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Preview Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10">
              <div className="p-4 bg-indigo-800/50 border-b border-indigo-600/30 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">📊 Dashboard Preview</h2>
                  <p className="text-indigo-300 text-sm mt-1">
                    This is a preview of the dashboard that will be hosted on GitHub Pages
                  </p>
                </div>
                <a
                  href="/dashboard_ui/index.html"
                  target="_blank"
                  className="px-4 py-2 bg-yellow-500 text-indigo-900 rounded-lg font-medium hover:bg-yellow-400 transition-colors"
                >
                  Open Full Dashboard →
                </a>
              </div>
              <div className="aspect-video bg-indigo-950/50">
                <iframe
                  src="/dashboard_ui/index.html"
                  className="w-full h-full border-0"
                  title="Dashboard Preview"
                />
              </div>
            </div>

            {/* Dashboard Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">✨ Dashboard Features</h3>
                <ul className="space-y-2 text-indigo-200">
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> Real-time KPI cards
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> Priority follow-up list (P1/P2)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> Lead source breakdown
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> Auto-refresh every 5 minutes
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> Mobile responsive design
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> Quick Add Lead button
                  </li>
                </ul>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">🎨 Branding</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#1a237e] rounded-lg"></div>
                    <div>
                      <p className="text-white font-medium">Navy Blue</p>
                      <p className="text-indigo-400 text-sm font-mono">#1a237e</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#ffd700] rounded-lg"></div>
                    <div>
                      <p className="text-white font-medium">Gold</p>
                      <p className="text-indigo-400 text-sm font-mono">#ffd700</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-5xl">⚓</span>
                    <div>
                      <p className="text-white font-medium">Logo Icon</p>
                      <p className="text-indigo-400 text-sm">Anchor Emoji</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-indigo-950/50 border-t border-indigo-700/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-indigo-300">
              <span>⚓</span>
              <span>Paramount Merchant Navy CRM System v1.0.0</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-indigo-400 text-sm">
                © 2026 Paramount Merchant Navy. MIT License.
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
