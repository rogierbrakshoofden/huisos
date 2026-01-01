export class NotificationService {
  static async init() {
    // Check support
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
      console.warn('[Notifications] Service Worker or Notifications not supported')
      return false
    }

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      })
      console.log('[Notifications] Service Worker registered:', registration)

      // Request permission
      await this.requestPermission()
      
      return true
    } catch (error) {
      console.error('[Notifications] Setup failed:', error)
      return false
    }
  }

  static async requestPermission() {
    if (Notification.permission === 'granted') {
      console.log('[Notifications] Already permitted')
      return true
    }

    if (Notification.permission === 'denied') {
      console.log('[Notifications] User denied permission')
      return false
    }

    // Ask for permission
    const permission = await Notification.requestPermission()
    
    if (permission === 'granted') {
      console.log('[Notifications] Permission granted')
      return true
    }

    console.log('[Notifications] Permission request dismissed')
    return false
  }

  static async subscribe() {
    if (Notification.permission !== 'granted') {
      const granted = await this.requestPermission()
      if (!granted) return null
    }

    try {
      const registration = await navigator.serviceWorker.ready
      
      // Subscribe to push (requires VAPID public key from server)
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        )
      })

      console.log('[Notifications] Subscribed to push:', subscription)
      
      // Send subscription to server
      await this.sendSubscriptionToServer(subscription)
      
      return subscription
    } catch (error) {
      console.error('[Notifications] Subscribe failed:', error)
      return null
    }
  }

  static async sendSubscriptionToServer(subscription: PushSubscription) {
    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    })

    if (!response.ok) {
      throw new Error('Failed to send subscription to server')
    }

    return response.json()
  }

  static async unsubscribe() {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()
        console.log('[Notifications] Unsubscribed from push')
        
        // Notify server
        await fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription)
        })
      }
    } catch (error) {
      console.error('[Notifications] Unsubscribe failed:', error)
    }
  }

  // Test notification (local, doesn't require server)
  static async sendTestNotification(title: string, options?: NotificationOptions) {
    if (Notification.permission !== 'granted') {
      const granted = await this.requestPermission()
      if (!granted) return
    }

    const registration = await navigator.serviceWorker.ready
    registration.showNotification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'test-notification',
      ...options
    })
  }

  private static urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }

    return outputArray
  }
}