import { useEffect } from 'react'

export function usePresenceTracking(activeUserId: string | null) {
  useEffect(() => {
    if (!activeUserId) return

    const updatePresence = async () => {
      try {
        await fetch('/api/presence/update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberId: activeUserId,
            isHome: true,
          }),
        })
      } catch (err) {
        console.warn('Presence update failed:', err)
      }
    }

    // Update immediately on mount
    updatePresence()

    // Then every 30 seconds (heartbeat)
    const interval = setInterval(updatePresence, 30000)

    // On page unload, set to away
    const handleUnload = () => {
      fetch('/api/presence/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: activeUserId,
          isHome: false,
        }),
      }).catch(() => {})
    }

    window.addEventListener('beforeunload', handleUnload)

    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [activeUserId])
}
