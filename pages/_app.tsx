import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { AppProvider } from '@/lib/context-v2'
import { useEffect } from 'react'
import { NotificationService } from '@/lib/notification-service'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Register service worker for PWA functionality
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Try both locations for service worker
      const swLocations = ['/service-worker.js', '/sw.js']
      
      for (const swLocation of swLocations) {
        navigator.serviceWorker.register(swLocation)
          .then((registration) => {
            console.log(`[PWA] Service Worker registered from ${swLocation}:`, registration)
            return registration
          })
          .catch((error) => {
            console.warn(`[PWA] Service Worker registration failed for ${swLocation}:`, error)
          })
      }
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
