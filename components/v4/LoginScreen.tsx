'use client'

import { useState } from 'react'
import { loginWithPasscode } from '@/lib/passcode'

interface LoginScreenProps {
  onLoginSuccess: () => void
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      loginWithPasscode(code)
      onLoginSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code')
      setCode('')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits, max 6 characters
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6)
    setCode(digits)
  }

  const isFilled = code.length === 6

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 mb-4">
            <span className="text-2xl font-bold text-white">🏠</span>
          </div>
          <h1 className="text-3xl font-bold text-white">HuisOS</h1>
          <p className="text-slate-400 text-sm">Family Coordination System</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6 bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50 backdrop-blur-sm">
          <div className="space-y-2">
            <label htmlFor="passcode" className="block text-sm font-semibold text-slate-200">
              Family Access Code
            </label>
            <input
              id="passcode"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={handleInputChange}
              placeholder="●●●●●●"
              disabled={loading}
              className="w-full px-6 py-4 text-center text-3xl font-mono font-bold bg-slate-900/50 border-2 border-slate-600 text-white placeholder-slate-500 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed tracking-widest"
            />
            <p className="text-xs text-slate-400 text-center">
              6-digit code (ask your family)
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400 text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!isFilled || loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying...
              </span>
            ) : (
              'Access Family Hub'
            )}
          </button>
        </form>

        {/* Help Text */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-2">
          <p className="text-xs font-semibold text-blue-300">💡 First time?</p>
          <p className="text-xs text-slate-300">
            Ask whoever set up HuisOS for the 6-digit family access code.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-slate-500">
            Your access code keeps family data private and secure.
          </p>
        </div>
      </div>
    </div>
  )
}
