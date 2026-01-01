import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { AppProvider } from '@/lib/context-v2'
import { useEffect } from 'react'
import { NotificationService } from '@/lib/notification-service'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Register service worker for PWA functionality
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered:', registration)
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error)
        })
    }

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
