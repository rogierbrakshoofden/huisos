import { useState, useEffect } from 'react'

interface DiagnosticsData {
  version: string
  timestamp: string
  environment: {
    supabaseUrl: boolean
    supabaseServiceKey: boolean
    vercelUrl: boolean
    nodeEnv: string
  }
  status: 'healthy' | 'degraded'
}

interface TestResult {
  endpoint: string
  method: string
  status?: number
  statusText?: string
  responseText: string
  success: boolean
}

export default function Diagnostics() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticsData | null>(null)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchDiagnostics = async () => {
      try {
        const res = await fetch('/api/diagnostics')
        if (res.ok) {
          const data = await res.json()
          setDiagnostics(data)
        }
      } catch (err) {
        console.error('Failed to fetch diagnostics:', err)
      }
    }

    fetchDiagnostics()
  }, [])

  const runTests = async () => {
    setLoading(true)
    setTestResults([])

    const results: TestResult[] = []

    // Test 1: Diagnostics endpoint
    try {
      const res = await fetch('/api/diagnostics')
      results.push({
        endpoint: '/api/diagnostics',
        method: 'GET',
        status: res.status,
        statusText: res.statusText,
        responseText: await res.text(),
        success: res.ok,
      })
    } catch (err) {
      results.push({
        endpoint: '/api/diagnostics',
        method: 'GET',
        responseText: (err as Error).message,
        success: false,
      })
    }

    // Test 2: Tasks create (will fail but shows the real error)
    try {
      const res = await fetch('/api/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Task',
          assignee_ids: ['test-id'],
          recurrence_type: 'once',
          due_date: '2025-12-31',
          token_value: 1,
          created_by: 'test-user',
        }),
      })
      const text = await res.text()
      results.push({
        endpoint: '/api/tasks/create',
        method: 'POST',
        status: res.status,
        statusText: res.statusText,
        responseText: text,
        success: res.ok,
      })
    } catch (err) {
      results.push({
        endpoint: '/api/tasks/create',
        method: 'POST',
        responseText: (err as Error).message,
        success: false,
      })
    }

    setTestResults(results)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">HuisOS Diagnostics</h1>
        <p className="text-slate-400 mb-8">System Status & API Health Check</p>

        {/* Environment Status */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            Environment Status
          </h2>
          {diagnostics ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Version:</span>
                <span className="font-mono text-emerald-400 text-lg font-bold">
                  v{diagnostics.version}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Status:</span>
                <span
                  className={`font-semibold ${
                    diagnostics.status === 'healthy'
                      ? 'text-emerald-400'
                      : 'text-yellow-400'
                  }`}
                >
                  {diagnostics.status === 'healthy' ? '✓ Healthy' : '⚠ Degraded'}
                </span>
              </div>
              <div className="border-t border-slate-700 pt-3 mt-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Supabase URL:</span>
                    <span
                      className={
                        diagnostics.environment.supabaseUrl
                          ? 'text-emerald-400'
                          : 'text-red-400'
                      }
                    >
                      {diagnostics.environment.supabaseUrl ? '✓' : '✗'} Set
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Service Role Key:</span>
                    <span
                      className={
                        diagnostics.environment.supabaseServiceKey
                          ? 'text-emerald-400'
                          : 'text-red-400'
                      }
                    >
                      {diagnostics.environment.supabaseServiceKey
                        ? '✓'
                        : '✗'}{' '}
                      {diagnostics.environment.supabaseServiceKey
                        ? 'Set'
                        : 'MISSING'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Vercel URL:</span>
                    <span
                      className={
                        diagnostics.environment.vercelUrl
                          ? 'text-emerald-400'
                          : 'text-slate-500'
                      }
                    >
                      {diagnostics.environment.vercelUrl ? '✓' : '—'} Set
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Node Env:</span>
                    <span className="text-slate-300">
                      {diagnostics.environment.nodeEnv}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slate-400">Loading...</p>
          )}
        </div>

        {/* Critical Issue Alert */}
        {diagnostics &&
          !diagnostics.environment.supabaseServiceKey && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-red-400 mb-3">
                🚨 Critical Issue: Missing Environment Variable
              </h3>
              <p className="text-red-200 mb-4">
                <code className="bg-red-950/50 px-2 py-1 rounded">
                  SUPABASE_SERVICE_ROLE_KEY
                </code>{' '}
                is not set on Vercel.
              </p>
              <ol className="list-decimal list-inside space-y-2 text-red-200 text-sm">
                <li>Go to Vercel Dashboard</li>
                <li>
                  Click on your Project → Settings → Environment Variables
                </li>
                <li>
                  Add <code className="bg-red-950/50 px-1">
                    SUPABASE_SERVICE_ROLE_KEY
                  </code>
                </li>
                <li>Paste your Supabase service role key</li>
                <li>Redeploy the project</li>
              </ol>
            </div>
          )}

        {/* Test API Endpoints */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            API Health Tests
          </h2>
          <button
            onClick={runTests}
            disabled={loading}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium disabled:opacity-50 mb-6"
          >
            {loading ? 'Testing...' : 'Run Tests'}
          </button>

          {testResults.length > 0 && (
            <div className="space-y-4">
              {testResults.map((result, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg p-4 border ${
                    result.success
                      ? 'bg-emerald-950/30 border-emerald-700/50'
                      : 'bg-red-950/30 border-red-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className={`font-mono font-bold ${
                        result.success
                          ? 'text-emerald-400'
                          : 'text-red-400'
                      }`}
                    >
                      {result.status || 'ERROR'}
                    </span>
                    <span className="text-slate-300">
                      {result.method} {result.endpoint}
                    </span>
                  </div>
                  <div className="bg-slate-950/50 rounded p-3 overflow-auto max-h-64">
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap break-words">
                      {result.responseText.length > 500
                        ? result.responseText.substring(0, 500) +
                          '...\n(truncated)'
                        : result.responseText}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-3">
            🔍 How to Debug
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-300 text-sm">
            <li>Check that all environment variables are set on Vercel</li>
            <li>Run the API Health Tests above to see actual error responses</li>
            <li>
              Check the Vercel deployment logs for any runtime errors
            </li>
            <li>
              Verify your Supabase credentials are correct and have the right
              permissions
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
