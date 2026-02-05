# PWA Quick Start Guide

## Installation

The PWA is already set up! Just build and deploy:

```bash
npm run build
npm start
```

Visit the app and you'll see the install prompt (on supported browsers).

## Testing

### Test Offline Mode

1. Open DevTools → Application → Service Workers
2. Check "Offline"
3. Navigate the app - it should work!

### Test Service Worker

```bash
# Production build (SW only works in production)
npm run build
npm start

# Visit http://localhost:3000
# Check DevTools → Application → Service Workers
```

## Common Tasks

### 1. Add a New Page to Offline Cache

Edit `public/sw.js`:

```javascript
const OFFLINE_ROUTES = [
  '/',
  '/chat',
  '/calendar',
  '/your-new-page', // Add here
];
```

### 2. Queue an Offline Action

```tsx
import { queueMessage } from '@/lib/db-queue';

await queueMessage({ content: 'Hello', timestamp: Date.now() });
```

### 3. Use Network Status

```tsx
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';

function MyComponent() {
  const { isOnline, isSlowConnection } = useNetworkStatus();
  
  if (!isOnline) return <OfflineUI />;
  if (isSlowConnection) return <LightweightUI />;
  return <FullUI />;
}
```

### 4. Progressive Image

```tsx
import { AdaptiveImage } from '@/components/ProgressiveImage';

<AdaptiveImage
  src="/path/to/image.jpg"
  alt="Description"
  width={800}
  height={600}
/>
```

### 5. Glass Effect

```tsx
<div className="glass-medium-elevated rounded-2xl p-6">
  Your content with iOS-like frosted glass
</div>
```

## Testing Checklist

- [ ] Service worker registers (DevTools → Application)
- [ ] Offline page loads when offline
- [ ] Images cache and load offline
- [ ] Background sync works
- [ ] Install prompt appears
- [ ] PWA can be installed
- [ ] Standalone mode works
- [ ] Performance metrics logged

## Demo Page

Visit `/pwa-demo` to test all features interactively!

## Troubleshooting

**Service Worker not updating?**
```javascript
// In DevTools Console:
navigator.serviceWorker.getRegistration().then(reg => reg.update());
```

**Clear caches?**
```javascript
// In DevTools Console:
caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
```

**Reset IndexedDB?**
```javascript
// In DevTools Console:
indexedDB.deleteDatabase('dieter-hq-queue');
```

## Files to Know

- `public/sw.js` - Service Worker
- `src/components/PWAInitializer.tsx` - PWA UI
- `src/lib/sw-register.ts` - SW management
- `src/lib/performance.ts` - Performance tracking
- `src/app/manifest.ts` - PWA manifest

## Resources

- Full Guide: `PWA_GUIDE.md`
- Implementation Summary: `PWA_OPTIMIZATION_SUMMARY.md`
- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
