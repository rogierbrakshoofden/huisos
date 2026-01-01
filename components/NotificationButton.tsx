import { useState } from 'react'
import { NotificationService } from '@/lib/notification-service'
import { Bell } from 'lucide-react'

interface NotificationButtonProps {
  title?: string
  body?: string
  className?: string
}

export function NotificationButton({
  title = 'HuisOS Test',
  body = 'This is a test notification',
  className = ''
}: NotificationButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSendNotification = async () => {
    setIsLoading(true)
    setMessage('')

    try {
      await NotificationService.sendTestNotification(title, { body })
      setMessage('✅ Notification sent!')
    } catch (error) {
      setMessage('❌ Failed to send notification')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <button
        onClick={handleSendNotification}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
      >
        <Bell size={16} />
        {isLoading ? 'Sending...' : 'Test Notification'}
      </button>
      {message && (
        <span className="text-sm text-gray-300">{message}</span>
      )}
    </div>
  )
}