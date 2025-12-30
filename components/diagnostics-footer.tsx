import { useState, useEffect } from 'react'

interface DiagnosticsData {
  version: string
  environment: {
    supabaseUrl: boolean
    supabaseServiceKey: boolean
    vercelUrl: boolean
    nodeEnv: string
  }
  status: 'healthy' | 'degraded'
}

interface DiagnosticsFooterProps {
  isOnline: boolean
}

export function DiagnosticsFooter({ isOnline }: DiagnosticsFooterProps) {
  const [diagnostics, setDiagnostics] = useState<DiagnosticsData | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const fetchDiagnostics = async () => {
      try {
        const res = await fetch('/api/diagnostics')
        if (res.ok) {
          const data = await res.json()
          setDiagnostics(data)
        }
      } catch (err) {
        console.warn('Failed to fetch diagnostics:', err)
      }
    }

    fetchDiagnostics()
  }, [])

  if (!diagnostics) return null

  const statusIcon =
    diagnostics.status === 'healthy' ? '✓' : '⚠'
  const statusColor =
    diagnostics.status === 'healthy' ? 'text-emerald-400' : 'text-yellow-400'

  return (
    <div className="fixed bottom-32 left-4 text-xs pointer-events-auto">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`block mb-2 px-2 py-1 rounded bg-slate-800/50 ${statusColor} hover:bg-slate-800 transition-colors`}
      >
        <span>HuisOS v{diagnostics.version}</span>
        <span className="ml-2">{statusIcon}</span>
      </button>

      {showDetails && (
        <div className="bg-slate-900/95 border border-slate-700 rounded p-3 space-y-1 w-48 mb-2 backdrop-blur">
          <div className="text-slate-300">
            <p className="font-mono text-xs">
              Supabase URL:{' '}
              <span className={diagnostics.environment.supabaseUrl ? 'text-emerald-400' : 'text-red-400'}>
                {diagnostics.environment.supabaseUrl ? '✓' : '✗'}
              </span>
            </p>
            <p className="font-mono text-xs">
              Service Key:{' '}
              <span className={diagnostics.environment.supabaseServiceKey ? 'text-emerald-400' : 'text-red-400'}>
                {diagnostics.environment.supabaseServiceKey ? '✓' : '✗'}
              </span>
            </p>
            <p className="font-mono text-xs">
              Node Env: <span className="text-slate-400">{diagnostics.environment.nodeEnv}</span>
            </p>
          </div>
        </div>
      )}

      <p className="text-slate-600 pointer-events-none">
        Realtime sync: {isOnline ? '🟢' : '🔴'}
      </p>
    </div>
  )
}
