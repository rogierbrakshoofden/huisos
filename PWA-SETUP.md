# HuisOS PWA + Push Notifications Setup Guide

## What Was Added

HuisOS V4 now supports:
- ✅ **Install from Home Screen** (iOS & Android)
- ✅ **Fullscreen Mode** (no address bar)
- ✅ **Push Notifications** (local & server-sent)
- ✅ **Offline Support** (service worker)
- ✅ **Web App Manifest** (PWA config)

---

## 🚀 Quick Start

### 1. Generate VAPID Keys (for push notifications)

```bash
npx web-push generate-vapid-keys
```

This will output:
```
Public Key: <your_public_key>
Private Key: <your_private_key>
```

### 2. Add to `.env.local`

```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<your_public_key>
VAPID_PRIVATE_KEY=<your_private_key>
VAPID_SUBJECT=mailto:your-email@example.com
```

### 3. Generate App Icons

```bash
npm install sharp  # (if not already installed)
node scripts/generate-icons.js icon-source.png
```

This creates:
- `icon-192x192.png` - App icon (standard)
- `icon-512x512.png` - Splash screen icon
- `icon-maskable-192x192.png` - Adaptive icon (Android)
- `apple-touch-icon-180x180.png` - iOS home screen
- `badge-72x72.png` - Notification badge

**Don't have an icon?** Create a simple design and save as PNG, or use the guide below.

### 4. Deploy

```bash
git push
# Vercel auto-deploys
```

---

## 📱 Installing from Home Screen

### iOS (Safari)
1. Open `https://huisos.vercel.app/` in Safari
2. Tap **Share** → **Add to Home Screen**
3. Choose a name (default: "HuisOS")
4. App opens fullscreen (no address bar)

### Android (Chrome)
1. Open `https://huisos.vercel.app/` in Chrome
2. Tap **⋮ (menu)** → **Install app**
3. Confirm installation
4. App opens fullscreen (no address bar)

---

## 🔔 Using Push Notifications

### Local Notifications (No Server Required)

In your component:

```typescript
import { NotificationService } from '@/lib/notification-service'

// Send a local test notification
await NotificationService.sendTestNotification(
  'Task Complete! 🎉',
  {
    body: 'You completed your chores',
    tag: 'task-complete'
  }
)
```

### Server-Sent Notifications (With VAPID Keys)

From your backend:

```typescript
import { NotificationService } from '@/lib/notification-service'

// User subscribes to notifications
const subscription = await NotificationService.subscribe()

// Later, send from server
await fetch('/api/notifications/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subscription,
    title: 'Chore Reminder',
    body: 'Anne needs to do the dishes',
    tag: 'chore-reminder'
  })
})
```

### Integration Example: Task Completion

```typescript
// In your task completion handler
async function completeTask(task: Task) {
  // Update DB...
  
  // Notify family
  await NotificationService.sendTestNotification(
    `${task.title} Complete! ✅`,
    {
      body: `Completed by ${user.name}`,
      tag: `task-${task.id}`,
      data: { taskId: task.id }
    }
  )
}
```

---

## 🧪 Testing Checklist

### Fullscreen Mode
- [ ] Open app from home screen on iOS
- [ ] Verify address bar is hidden
- [ ] Open app from home screen on Android
- [ ] Verify address bar is hidden
- [ ] Check safe area (notch) is respected

### Notifications
- [ ] Permission request appears on first load
- [ ] Test notification appears after permission granted
- [ ] Clicking notification opens/focuses app
- [ ] Notification appears even when app is closed
- [ ] App launches when tapping notification

### Manifest
In DevTools → Application → Manifest:
- [ ] `display: "standalone"` present
- [ ] Icons are listed
- [ ] `start_url: "/"` correct
- [ ] Theme colors present

### Service Worker
In DevTools → Application → Service Workers:
- [ ] Status shows "activated and running"
- [ ] Scope is "/"

---

## 🎨 Custom Icon Design Tips

### Required Sizes
- **192x192** - Used by Android, browsers
- **512x512** - Used for splash screens
- **Maskable** - Safe zone: keep content in center 40%
- **Apple Touch** - iOS, with rounded corners
- **Badge** - Monochrome, will be tinted by system

### Design Guidelines
1. **Regular Icon**: Full color, centered with padding
2. **Maskable Icon**: 
   - Important content in center 40%
   - Safe background (dark color)
   - Works when cropped to circle
3. **Badge Icon**: Single color, monochrome, simple shape
4. **Colors**: Match your theme
   - Background: `#0f172a` (slate-900)
   - Theme: `#1e293b` (slate-800)

### Quick DIY Icon (Using Figma/Illustrator)
1. Create 512x512 canvas
2. Design icon (e.g., "H" for HuisOS)
3. Export as PNG with transparent background
4. Run icon generator script
5. All sizes created automatically

---

## 📚 Files Added

```
public/
  ├── manifest.json          # PWA config
  ├── sw.js                  # Service worker
  └── icons/                 # App icons (auto-generated)
      ├── icon-192x192.png
      ├── icon-512x512.png
      ├── icon-maskable-192x192.png
      ├── icon-maskable-512x512.png
      ├── apple-touch-icon-180x180.png
      └── badge-72x72.png

pages/
  ├── _document.tsx          # PWA meta tags
  ├── _app.tsx               # Updated with notification init
  └── api/notifications/
      ├── subscribe.ts       # User subscription endpoint
      ├── unsubscribe.ts     # Unsubscribe endpoint
      └── send.ts            # Send push notification endpoint

lib/
  └── notification-service.ts  # Notification logic

scripts/
  └── generate-icons.js      # Icon generator tool
```

---

## 🔧 Troubleshooting

### App won't install
- Ensure manifest.json loads (DevTools → Network)
- Check service worker is registered (DevTools → Application)
- Wait 30s and refresh (caching)

### Notifications don't appear
- Check permission was granted (Settings → Notifications)
- Verify service worker is "activated and running"
- Check browser console for errors
- VAPID keys must be set in `.env.local`

### Icons don't show
- Ensure PNG files are in `public/icons/`
- File sizes must be exact (192x192, 512x512, etc.)
- Try hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

### Service Worker not updating
- DevTools → Application → Service Workers → "Unregister"
- Hard refresh (Cmd+Shift+R)
- Or: `updateViaCache: 'none'` in registration (already set)

---

## 📖 Next Steps

1. **Generate VAPID keys** (see Quick Start)
2. **Create app icon** and run icon generator
3. **Test on device** (iOS Safari / Android Chrome)
4. **Integrate notifications** into tasks/chores
5. **Monitor logs** in DevTools → Console

---

## 🎯 Phase Integration

This PWA setup works with **HuisOS Phase 8+** (Multiple Assignees & Rotation Logic).

Notifications can be triggered when:
- Tasks are completed
- Chores are rotated
- Events are coming up
- Family members take actions
- Reminders/deadlines approach

---

## 📝 Production Checklist

- [ ] VAPID keys generated and in `.env.local`
- [ ] App icons created and in `public/icons/`
- [ ] Manifest.json correct
- [ ] Service worker loading (no 404s)
- [ ] Tested on iOS device
- [ ] Tested on Android device
- [ ] Notification permissions working
- [ ] Deployed to Vercel
- [ ] Links from home screen work
