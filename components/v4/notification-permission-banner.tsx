import { Bell } from 'lucide-react'
import { NotificationService } from '@/lib/notification-service'
import { useState, useEffect } from 'react'

export function NotificationPermissionBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
      // Show banner only if permission is default (not yet asked)
      if (Notification.permission === 'default') {
        setIsVisible(true)
      }
    }
  }, [])

  const handleRequestPermission = async () => {
    const granted = await NotificationService.requestPermission()
    if (granted) {
      setPermission('granted')
      setIsVisible(false)
      // Try to subscribe to push
      await NotificationService.subscribe().catch(err => {
        console.warn('Push subscription failed:', err)
      })
    } else {
      setPermission('denied')
      setIsVisible(false)
    }
  }

  if (!isVisible || permission !== 'default') {
    return null
  }

  return (
    <div className="fixed top-20 left-4 right-4 z-40 max-w-sm mx-auto">
      <div className="bg-slate-800/95 backdrop-blur-md border border-slate-700 rounded-lg p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-white mb-1">Enable Notifications?</h3>
            <p className="text-sm text-slate-300 mb-3">
              Get instant updates on task reminders and family events.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleRequestPermission}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
              >
                Allow
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
