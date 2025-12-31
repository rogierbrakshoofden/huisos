import { useEffect, useState } from 'react'

interface SyncIndicatorV4Props {
  isOnline: boolean
  lastSyncedAt?: Date
  syncError?: string
  isSyncing?: boolean
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 120) return '1m ago'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 7200) return '1h ago'
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export function SyncIndicatorV4({
  isOnline,
  lastSyncedAt,
  syncError,
  isSyncing = false,
}: SyncIndicatorV4Props) {
  const [isVisible, setIsVisible] = useState(true)

  // Auto-hide after 2s when online + no error + not syncing
  useEffect(() => {
    if (isOnline && !syncError && !isSyncing && lastSyncedAt) {
      const timer = setTimeout(() => setIsVisible(false), 2000)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(true)
    }
  }, [isOnline, syncError, lastSyncedAt, isSyncing])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 h-8 bg-slate-950/95 backdrop-blur-sm border-t border-slate-800/50">
      <div className="max-w-2xl mx-auto px-4 h-full flex items-center justify-center">
        {syncError ? (
          <div className="flex items-center gap-2 text-amber-400 text-xs">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span>{syncError}</span>
          </div>
        ) : !isOnline ? (
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span>Offline • Using cached data</span>
          </div>
        ) : isSyncing ? (
          <div className="flex items-center gap-2 text-yellow-400 text-xs">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span>Syncing...</span>
          </div>
        ) : lastSyncedAt ? (
          <div className="flex items-center gap-2 text-emerald-400 text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Synced {formatRelativeTime(lastSyncedAt)}</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
