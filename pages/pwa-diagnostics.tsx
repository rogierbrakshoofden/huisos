import { useState, useEffect } from 'react'

export default function PWADiagnostics() {
  const [diagnostics, setDiagnostics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const runDiagnostics = async () => {
      const diags: any = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        manifestLink: null,
        manifestContent: null,
        serviceWorkerReady: false,
        errors: [],
      }

      try {
        // Check if manifest link exists in document
        const manifestLink = document.querySelector('link[rel="manifest"]')
        diags.manifestLink = manifestLink ? manifestLink.getAttribute('href') : 'NOT FOUND'

        // Try to fetch manifest
        try {
          const response = await fetch('/manifest.json')
          if (response.ok) {
            diags.manifestContent = await response.json()
            diags.manifestStatus = 'OK'
          } else {
            diags.errors.push(`Manifest fetch failed: ${response.status}`)
          }
        } catch (e: any) {
          diags.errors.push(`Manifest fetch error: ${e.message}`)
        }

        // Check service worker
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.getRegistration()
            diags.serviceWorkerReady = !!registration
            diags.serviceWorkerScope = registration?.scope
          } catch (e: any) {
            diags.errors.push(`Service worker check failed: ${e.message}`)
          }
        }

        setDiagnostics(diags)
      } finally {
        setLoading(false)
      }
    }

    runDiagnostics()
  }, [])

  if (loading) {
    return (
      <div className="p-8 bg-slate-900 text-white min-h-screen">
        <h1 className="text-2xl font-bold mb-4">PWA Diagnostics</h1>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-8 bg-slate-900 text-white min-h-screen font-mono text-sm">
      <h1 className="text-2xl font-bold mb-8">PWA Diagnostics</h1>

      <div className="space-y-6 max-w-4xl">
        <section className="bg-slate-800 p-4 rounded">
          <h2 className="text-lg font-bold mb-2">Manifest Status</h2>
          <p>
            <span className="text-yellow-400">Link in Document:</span>{' '}
            <span className={diagnostics.manifestLink !== 'NOT FOUND' ? 'text-green-400' : 'text-red-400'}>
              {diagnostics.manifestLink}
            </span>
          </p>
          <p>
            <span className="text-yellow-400">Manifest Accessible:</span>{' '}
            <span className={diagnostics.manifestStatus === 'OK' ? 'text-green-400' : 'text-red-400'}>
              {diagnostics.manifestStatus || 'FAILED'}
            </span>
          </p>
        </section>

        {diagnostics.manifestContent && (
          <section className="bg-slate-800 p-4 rounded">
            <h2 className="text-lg font-bold mb-2">Manifest Content</h2>
            <pre className="bg-slate-900 p-3 rounded overflow-auto max-h-96">
              {JSON.stringify(diagnostics.manifestContent, null, 2)}
            </pre>
          </section>
        )}

        <section className="bg-slate-800 p-4 rounded">
          <h2 className="text-lg font-bold mb-2">Service Worker</h2>
          <p>
            <span className="text-yellow-400">Status:</span>{' '}
            <span className={diagnostics.serviceWorkerReady ? 'text-green-400' : 'text-orange-400'}>
              {diagnostics.serviceWorkerReady ? 'REGISTERED' : 'NOT REGISTERED'}
            </span>
          </p>
          {diagnostics.serviceWorkerScope && (
            <p>
              <span className="text-yellow-400">Scope:</span> {diagnostics.serviceWorkerScope}
            </p>
          )}
        </section>

        {diagnostics.errors.length > 0 && (
          <section className="bg-red-900 border border-red-700 p-4 rounded">
            <h2 className="text-lg font-bold mb-2">Errors</h2>
            <ul className="list-disc pl-4 space-y-1">
              {diagnostics.errors.map((error: string, i: number) => (
                <li key={i} className="text-red-200">
                  {error}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="bg-slate-800 p-4 rounded">
          <h2 className="text-lg font-bold mb-2">Device Info</h2>
          <p>
            <span className="text-yellow-400">User Agent:</span> {diagnostics.userAgent}
          </p>
          <p>
            <span className="text-yellow-400">Timestamp:</span> {diagnostics.timestamp}
          </p>
        </section>
      </div>
    </div>
  )
}
