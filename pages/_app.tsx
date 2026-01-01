import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { AppProvider } from '@/lib/context-v2'
import { useEffect } from 'react'
import { NotificationService } from '@/lib/notification-service'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize notifications on app load
    if (typeof window !== 'undefined') {
      NotificationService.init().then((success) => {
        if (success) {
          console.log('[App] Notifications initialized')
        }
      })
    }
  }, [])

  return (
    <AppProvider>
      <Component {...pageProps} />
    </AppProvider>
  )
}