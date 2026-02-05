// IndexedDB Queue for Background Sync
// Stores offline actions to sync when connection is restored

const DB_NAME = 'dieter-hq-queue';
const DB_VERSION = 1;
const STORES = {
  messages: 'messages',
  events: 'events',
  tasks: 'tasks',
};

export interface QueuedItem<T = any> {
  id: string;
  type: string;
  data: T;
  timestamp: number;
  retries: number;
  lastError?: string;
}

/**
 * Initialize IndexedDB
 */
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores if they don't exist
      Object.values(STORES).forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('retries', 'retries', { unique: false });
        }
      });
    };
  });
}

/**
 * Add item to queue
 */
export async function addToQueue<T>(
  store: keyof typeof STORES,
  data: T,
  type: string = 'create'
): Promise<string> {
  const db = await initDB();
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const item: QueuedItem<T> = {
    id,
    type,
    data,
    timestamp: Date.now(),
    retries: 0,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES[store]], 'readwrite');
    const objectStore = transaction.objectStore(STORES[store]);
    const request = objectStore.add(item);

    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all items from queue
 */
export async function getQueueItems<T>(
  store: keyof typeof STORES
): Promise<QueuedItem<T>[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES[store]], 'readonly');
    const objectStore = transaction.objectStore(STORES[store]);
    const request = objectStore.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get single item from queue
 */
export async function getQueueItem<T>(
  store: keyof typeof STORES,
  id: string
): Promise<QueuedItem<T> | null> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES[store]], 'readonly');
    const objectStore = transaction.objectStore(STORES[store]);
    const request = objectStore.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update item in queue
 */
export async function updateQueueItem<T>(
  store: keyof typeof STORES,
  id: string,
  updates: Partial<QueuedItem<T>>
): Promise<void> {
  const db = await initDB();
  const item = await getQueueItem<T>(store, id);

  if (!item) {
    throw new Error(`Item ${id} not found in queue`);
  }

  const updatedItem = { ...item, ...updates };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES[store]], 'readwrite');
    const objectStore = transaction.objectStore(STORES[store]);
    const request = objectStore.put(updatedItem);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Remove item from queue
 */
export async function removeFromQueue(
  store: keyof typeof STORES,
  id: string
): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES[store]], 'readwrite');
    const objectStore = transaction.objectStore(STORES[store]);
    const request = objectStore.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all items from queue
 */
export async function clearQueue(store: keyof typeof STORES): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES[store]], 'readwrite');
    const objectStore = transaction.objectStore(STORES[store]);
    const request = objectStore.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get queue size
 */
export async function getQueueSize(store: keyof typeof STORES): Promise<number> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES[store]], 'readonly');
    const objectStore = transaction.objectStore(STORES[store]);
    const request = objectStore.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Process queue with retry logic
 */
export async function processQueue<T>(
  store: keyof typeof STORES,
  processor: (item: QueuedItem<T>) => Promise<boolean>,
  maxRetries: number = 3
): Promise<{ processed: number; failed: number }> {
  const items = await getQueueItems<T>(store);
  let processed = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const success = await processor(item);

      if (success) {
        await removeFromQueue(store, item.id);
        processed++;
      } else {
        // Increment retry count
        const newRetries = item.retries + 1;

        if (newRetries >= maxRetries) {
          // Max retries reached, remove from queue
          await removeFromQueue(store, item.id);
          failed++;
        } else {
          // Update retry count
          await updateQueueItem(store, item.id, { retries: newRetries });
        }
      }
    } catch (error) {
      console.error('[Queue] Processing error:', error);

      // Update error and retry count
      const newRetries = item.retries + 1;
      if (newRetries >= maxRetries) {
        await removeFromQueue(store, item.id);
        failed++;
      } else {
        await updateQueueItem(store, item.id, {
          retries: newRetries,
          lastError: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  return { processed, failed };
}

/**
 * Queue message for sync
 */
export async function queueMessage(message: any): Promise<string> {
  return addToQueue('messages', message, 'send');
}

/**
 * Queue event for sync
 */
export async function queueEvent(event: any): Promise<string> {
  return addToQueue('events', event, 'create');
}

/**
 * Queue task for sync
 */
export async function queueTask(task: any): Promise<string> {
  return addToQueue('tasks', task, 'create');
}

/**
 * Sync all queues
 */
export async function syncAllQueues(): Promise<{
  messages: { processed: number; failed: number };
  events: { processed: number; failed: number };
  tasks: { processed: number; failed: number };
}> {
  const results = {
    messages: { processed: 0, failed: 0 },
    events: { processed: 0, failed: 0 },
    tasks: { processed: 0, failed: 0 },
  };

  // Sync messages
  results.messages = await processQueue('messages', async (item) => {
    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.data),
      });
      return response.ok;
    } catch {
      return false;
    }
  });

  // Sync events
  results.events = await processQueue('events', async (item) => {
    try {
      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.data),
      });
      return response.ok;
    } catch {
      return false;
    }
  });

  // Sync tasks
  results.tasks = await processQueue('tasks', async (item) => {
    try {
      const response = await fetch('/api/kanban/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.data),
      });
      return response.ok;
    } catch {
      return false;
    }
  });

  return results;
}

/**
 * Get total pending items across all queues
 */
export async function getTotalPending(): Promise<number> {
  const sizes = await Promise.all([
    getQueueSize('messages'),
    getQueueSize('events'),
    getQueueSize('tasks'),
  ]);

  return sizes.reduce((sum, size) => sum + size, 0);
}
