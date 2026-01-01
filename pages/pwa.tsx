import Head from 'next/head'
import { useState, useEffect } from 'react'

export default function PWAPage() {
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
      console.log('[PWA] Install prompt available')
    }

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      console.log('[PWA] App is installed in standalone mode')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('[PWA] Service Worker registered:', reg))
        .catch(err => console.error('[PWA] Service Worker failed:', err))
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      console.log('[PWA] User choice:', outcome)
      setInstallPrompt(null)
    }
  }

  return (
    <>
      <Head>
        {/* Inline manifest to ensure it's always present */}
        <link rel="manifest" href="/api/manifest" />
        <meta name="theme-color" content="#66bb6a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="HuisOS" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180x180.png" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">HuisOS PWA Setup</h1>

          <div className="space-y-6">
            {/* Status */}
            <section className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Status</h2>
              <div className="space-y-2">
                <p>
                  <span className={`inline-block w-3 h-3 rounded-full mr-2 ${isInstalled ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                  Installed: {isInstalled ? '✓ Yes' : '✗ Not yet'}
                </p>
                <p>
                  <span className={`inline-block w-3 h-3 rounded-full mr-2 ${installPrompt ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                  Install Ready: {installPrompt ? '✓ Yes' : '✗ No'}
                </p>
              </div>
            </section>

            {/* Install Button */}
            {installPrompt && !isInstalled && (
              <section className="bg-slate-800 rounded-lg p-6">
                <button
                  onClick={handleInstall}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  📱 Install HuisOS
                </button>
                <p className="text-sm text-gray-400 mt-2">Click to install the app on your home screen</p>
              </section>
            )}

            {/* Manual Installation Instructions */}
            <section className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Manual Installation</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg mb-2">iOS (Safari)</h3>
                  <ol className="list-decimal list-inside space-y-1 text-gray-300">
                    <li>Tap the Share button (arrow up icon)</li>
                    <li>Select "Add to Home Screen"</li>
                    <li>Enter app name and tap "Add"</li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-2">Android (Chrome)</h3>
                  <ol className="list-decimal list-inside space-y-1 text-gray-300">
                    <li>Look for the install banner at the bottom</li>
                    <li>Tap "Install" to add to home screen</li>
                    <li>Or: Menu → "Install app"</li>
                  </ol>
                </div>
              </div>
            </section>

            {/* Manifest Link */}
            <section className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Manifest</h2>
              <p className="text-sm text-gray-400 mb-2">Click to verify manifest is accessible:</p>
              <a
                href="/api/manifest"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline break-all"
              >
                /api/manifest
              </a>
            </section>

            {/* Troubleshooting */}
            <section className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Troubleshooting</h2>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>✓ Check DevTools Console for errors</li>
                <li>✓ Verify Network tab shows /api/manifest request</li>
                <li>✓ Service Worker should show in Application tab</li>
                <li>✓ Clear browser cache and reload</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </>
  )
}
