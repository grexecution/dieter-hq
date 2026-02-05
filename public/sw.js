// Dieter HQ Service Worker
// Handles offline support, caching, and background sync

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `dieter-hq-${CACHE_VERSION}`;
const OFFLINE_CACHE = `${CACHE_NAME}-offline`;
const RUNTIME_CACHE = `${CACHE_NAME}-runtime`;
const IMAGE_CACHE = `${CACHE_NAME}-images`;

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/icon-192.png',
  '/icon-512.png',
];

// Routes that should work offline
const OFFLINE_ROUTES = [
  '/',
  '/chat',
  '/calendar',
  '/kanban',
  '/events',
];

// Maximum cache sizes
const MAX_CACHE_SIZE = {
  runtime: 50,
  images: 30,
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(OFFLINE_CACHE)
      .then((cache) => {
        console.log('[SW] Precaching offline assets');
        return cache.addAll(PRECACHE_ASSETS.map(url => new Request(url, { cache: 'reload' })));
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('dieter-hq-') && name !== CACHE_NAME && !name.startsWith(CACHE_NAME))
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - network-first with cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome extension and other protocols
  if (!url.protocol.startsWith('http')) return;

  // Skip API calls for background sync (handle separately)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle images
  if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // Handle navigation requests (pages)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Handle other requests (CSS, JS, fonts, etc.)
  event.respondWith(handleAssetRequest(request));
});

// Network-first strategy for API requests
async function handleApiRequest(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.log('[SW] API request failed, checking cache:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Return offline response for failed API calls
    return new Response(
      JSON.stringify({ error: 'Offline', message: 'You are currently offline' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Cache-first strategy for images with size limit
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      // Clone and cache the response
      const clonedResponse = response.clone();
      cache.put(request, clonedResponse);
      // Manage cache size
      await manageCacheSize(IMAGE_CACHE, MAX_CACHE_SIZE.images);
    }
    return response;
  } catch (error) {
    console.log('[SW] Image fetch failed:', request.url);
    // Return a placeholder or cached version
    return new Response('', { status: 404 });
  }
}

// Network-first with cache fallback for navigation
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    
    // Cache successful navigation responses
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Navigation request failed, checking cache:', request.url);
    
    // Try to serve from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Try to serve the offline page for known routes
    const url = new URL(request.url);
    if (OFFLINE_ROUTES.some(route => url.pathname === route || url.pathname.startsWith(route + '/'))) {
      const offlineResponse = await caches.match('/offline');
      if (offlineResponse) {
        return offlineResponse;
      }
    }

    // Fallback to root
    const rootResponse = await caches.match('/');
    if (rootResponse) {
      return rootResponse;
    }

    // Last resort: basic offline message
    return new Response(
      '<html><body><h1>Offline</h1><p>You are currently offline. Please check your connection.</p></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

// Stale-while-revalidate for static assets
async function handleAssetRequest(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        cache.put(request, response.clone());
        await manageCacheSize(RUNTIME_CACHE, MAX_CACHE_SIZE.runtime);
      }
      return response;
    })
    .catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

// Manage cache size by removing oldest entries
async function manageCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxSize) {
    // Remove oldest entries (FIFO)
    const keysToDelete = keys.slice(0, keys.length - maxSize);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
  }
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
  
  if (event.tag === 'sync-events') {
    event.waitUntil(syncEvents());
  }
});

// Sync queued messages
async function syncMessages() {
  try {
    console.log('[SW] Syncing messages...');
    // Retrieve queued messages from IndexedDB or another storage
    const queuedMessages = await getQueuedMessages();
    
    for (const message of queuedMessages) {
      try {
        const response = await fetch('/api/chat/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message),
        });
        
        if (response.ok) {
          await removeFromQueue('messages', message.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync message:', error);
      }
    }
    
    // Notify clients that sync is complete
    await notifyClients({ type: 'SYNC_COMPLETE', data: 'messages' });
  } catch (error) {
    console.error('[SW] Message sync failed:', error);
  }
}

// Sync queued events
async function syncEvents() {
  try {
    console.log('[SW] Syncing events...');
    const queuedEvents = await getQueuedEvents();
    
    for (const event of queuedEvents) {
      try {
        const response = await fetch('/api/calendar/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        });
        
        if (response.ok) {
          await removeFromQueue('events', event.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync event:', error);
      }
    }
    
    await notifyClients({ type: 'SYNC_COMPLETE', data: 'events' });
  } catch (error) {
    console.error('[SW] Event sync failed:', error);
  }
}

// Message handler for communication with clients
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'QUEUE_MESSAGE') {
    queueForSync('messages', event.data.payload);
  }
  
  if (event.data.type === 'QUEUE_EVENT') {
    queueForSync('events', event.data.payload);
  }
  
  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then(cache => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

// Queue item for background sync
async function queueForSync(type, data) {
  // In a real implementation, this would use IndexedDB
  console.log('[SW] Queuing for sync:', type, data);
  // TODO: Implement IndexedDB queue
}

// Get queued messages
async function getQueuedMessages() {
  // TODO: Implement IndexedDB retrieval
  return [];
}

// Get queued events
async function getQueuedEvents() {
  // TODO: Implement IndexedDB retrieval
  return [];
}

// Remove from queue
async function removeFromQueue(type, id) {
  // TODO: Implement IndexedDB deletion
  console.log('[SW] Removing from queue:', type, id);
}

// Notify all clients
async function notifyClients(message) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.forEach(client => client.postMessage(message));
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let data = { title: 'Dieter HQ', body: 'New notification' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      tag: data.tag || 'default',
      requireInteraction: data.requireInteraction || false,
      data: data.data || {},
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

console.log('[SW] Service worker loaded');
