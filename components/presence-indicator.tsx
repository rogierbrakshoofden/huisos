'use client'

interface PresenceIndicatorProps {
  isHome: boolean
  note?: string
}

export function PresenceIndicator({ isHome, note }: PresenceIndicatorProps) {
  return (
    <div
      className={`w-4 h-4 rounded-full border-2 border-slate-900 ${
        isHome ? 'bg-green-500' : 'bg-slate-500'
      }`}
      title={isHome ? 'Home' : note || 'Away'}
    />
  )
}
