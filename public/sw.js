// Service Worker v2 - Push notifications + cache management
const CACHE_NAME = 'huisos-v1'
const RUNTIME_CACHE = 'huisos-runtime-v1'

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v2...')
  self.skipWaiting() // Activate immediately
})

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v2...')
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    })
  )
  
  self.clients.claim() // Control all pages immediately
})

// Network first strategy - try network, fall back to cache
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return

  // Skip internal API calls - let them go through normally
  if (event.request.url.includes('/api/')) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseToCache = response.clone()
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        return response
      })
      .catch(() => {
        // Fall back to cache
        return caches.match(event.request)
      })
  )
})

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  
  const options = {
    body: data.body || 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: data.tag || 'notification',
    requireInteraction: data.requireInteraction || false,
    actions: [
      {
        action: 'open',
        title: 'Open',
        icon: '/icons/action-open.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/action-close.png'
      }
    ],
    data: data.data || {}
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'HuisOS', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'close') {
    return
  }

  // Focus or open the app
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (let client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/')
      }
    })
  )
})

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag)
})

// Background sync (optional - for offline tasks)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(
      fetch('/api/sync', { method: 'POST' })
        .then(() => console.log('[SW] Sync complete'))
        .catch(err => console.error('[SW] Sync failed:', err))
    )
  }
})