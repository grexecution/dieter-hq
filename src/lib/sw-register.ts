// Service Worker Registration and Management
// Handles SW lifecycle, updates, and communication

export interface SWRegistrationResult {
  registration: ServiceWorkerRegistration | null;
  isSupported: boolean;
  isOnline: boolean;
}

export interface SWMessagePayload {
  type: string;
  payload?: any;
  urls?: string[];
}

/**
 * Register service worker with update handling
 */
export async function registerServiceWorker(): Promise<SWRegistrationResult> {
  // Check if service workers are supported
  if (!('serviceWorker' in navigator)) {
    console.warn('[SW] Service workers not supported');
    return {
      registration: null,
      isSupported: false,
      isOnline: navigator.onLine,
    };
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[SW] Registration successful:', registration.scope);

    // Check for updates periodically (every hour)
    setInterval(() => {
      registration.update().catch((error) => {
        console.error('[SW] Update check failed:', error);
      });
    }, 60 * 60 * 1000);

    // Handle service worker updates
    handleServiceWorkerUpdate(registration);

    // Set up message listener
    setupMessageListener();

    return {
      registration,
      isSupported: true,
      isOnline: navigator.onLine,
    };
  } catch (error) {
    console.error('[SW] Registration failed:', error);
    return {
      registration: null,
      isSupported: true,
      isOnline: navigator.onLine,
    };
  }
}

/**
 * Handle service worker updates
 */
function handleServiceWorkerUpdate(registration: ServiceWorkerRegistration) {
  // Detect when a new service worker is waiting
  registration.addEventListener('updatefound', () => {
    const newWorker = registration.installing;
    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New service worker is waiting - notify user
        notifyUserOfUpdate(registration);
      }
    });
  });

  // Check if there's already a waiting service worker
  if (registration.waiting) {
    notifyUserOfUpdate(registration);
  }
}

/**
 * Notify user of available update
 */
function notifyUserOfUpdate(registration: ServiceWorkerRegistration) {
  // Emit custom event for app to handle
  const event = new CustomEvent('sw-update-available', {
    detail: { registration },
  });
  window.dispatchEvent(event);

  // Auto-update after 5 seconds if user doesn't respond
  setTimeout(() => {
    activateUpdate(registration);
  }, 5000);
}

/**
 * Activate service worker update
 */
export function activateUpdate(registration: ServiceWorkerRegistration) {
  if (!registration.waiting) return;

  // Tell the waiting service worker to activate
  registration.waiting.postMessage({ type: 'SKIP_WAITING' });

  // Reload page when the new service worker activates
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

/**
 * Set up message listener for service worker messages
 */
function setupMessageListener() {
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('[SW] Message from service worker:', event.data);

    const { type, data } = event.data;

    switch (type) {
      case 'SYNC_COMPLETE':
        // Emit event for sync completion
        window.dispatchEvent(
          new CustomEvent('sw-sync-complete', { detail: data })
        );
        break;
      case 'CACHE_UPDATED':
        window.dispatchEvent(
          new CustomEvent('sw-cache-updated', { detail: data })
        );
        break;
      default:
        // Emit generic event
        window.dispatchEvent(
          new CustomEvent('sw-message', { detail: event.data })
        );
    }
  });
}

/**
 * Send message to service worker
 */
export async function sendMessageToSW(message: SWMessagePayload): Promise<void> {
  if (!navigator.serviceWorker.controller) {
    console.warn('[SW] No active service worker');
    return;
  }

  navigator.serviceWorker.controller.postMessage(message);
}

/**
 * Queue message for background sync
 */
export async function queueMessage(message: any): Promise<void> {
  await sendMessageToSW({
    type: 'QUEUE_MESSAGE',
    payload: message,
  });

  // Request background sync
  if ('sync' in navigator.serviceWorker) {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-messages');
  }
}

/**
 * Queue event for background sync
 */
export async function queueEvent(event: any): Promise<void> {
  await sendMessageToSW({
    type: 'QUEUE_EVENT',
    payload: event,
  });

  // Request background sync
  if ('sync' in navigator.serviceWorker) {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-events');
  }
}

/**
 * Precache specific URLs
 */
export async function precacheUrls(urls: string[]): Promise<void> {
  await sendMessageToSW({
    type: 'CACHE_URLS',
    urls,
  });
}

/**
 * Check if app is running as PWA
 */
export function isPWA(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Check if app can be installed
 */
export function canInstallPWA(): boolean {
  return 'BeforeInstallPromptEvent' in window;
}

/**
 * Get network status
 */
export function getNetworkStatus(): {
  isOnline: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
} {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

  return {
    isOnline: navigator.onLine,
    effectiveType: connection?.effectiveType,
    downlink: connection?.downlink,
    rtt: connection?.rtt,
    saveData: connection?.saveData,
  };
}

/**
 * Set up online/offline listeners
 */
export function setupNetworkListeners(callbacks: {
  onOnline?: () => void;
  onOffline?: () => void;
}): () => void {
  const handleOnline = () => {
    console.log('[Network] Online');
    callbacks.onOnline?.();
  };

  const handleOffline = () => {
    console.log('[Network] Offline');
    callbacks.onOffline?.();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Request persistent storage
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!('storage' in navigator) || !('persist' in navigator.storage)) {
    return false;
  }

  try {
    const isPersisted = await navigator.storage.persist();
    console.log(`[Storage] Persistent storage ${isPersisted ? 'granted' : 'denied'}`);
    return isPersisted;
  } catch (error) {
    console.error('[Storage] Persistent storage request failed:', error);
    return false;
  }
}

/**
 * Get storage estimate
 */
export async function getStorageEstimate(): Promise<{
  usage: number;
  quota: number;
  percentage: number;
}> {
  if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
    return { usage: 0, quota: 0, percentage: 0 };
  }

  try {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentage = quota > 0 ? (usage / quota) * 100 : 0;

    return { usage, quota, percentage };
  } catch (error) {
    console.error('[Storage] Failed to get storage estimate:', error);
    return { usage: 0, quota: 0, percentage: 0 };
  }
}
