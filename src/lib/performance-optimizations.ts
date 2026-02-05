/**
 * Performance Optimizations for Dieter HQ
 * 
 * Includes:
 * - Lazy loading utilities
 * - Cache management
 * - Request deduplication
 * - Debouncing & throttling
 * - Memory management
 * - Bundle size optimizations
 */

// ============================================================================
// LAZY LOADING UTILITIES
// ============================================================================

/**
 * Prefetch a route for faster navigation
 */
export function prefetchRoute(href: string): void {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  link.as = 'document';
  
  // Avoid duplicate prefetches
  const existing = document.querySelector(`link[rel="prefetch"][href="${href}"]`);
  if (!existing) {
    document.head.appendChild(link);
  }
}

/**
 * Preload critical resources
 */
export function preloadResource(href: string, as: string): void {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  
  const existing = document.querySelector(`link[rel="preload"][href="${href}"]`);
  if (!existing) {
    document.head.appendChild(link);
  }
}

/**
 * Dynamic import with retry
 */
export async function dynamicImportWithRetry<T>(
  importFn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await importFn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return dynamicImportWithRetry(importFn, retries - 1, delay * 1.5);
    }
    throw error;
  }
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxSize: number;
  
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }
  
  set<T>(key: string, data: T, ttlMs = 5 * 60 * 1000): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldest = this.findOldest();
      if (oldest) this.cache.delete(oldest);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    
    // Check expiration
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  has(key: string): boolean {
    return this.get(key) !== null;
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  private findOldest(): string | null {
    let oldest: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, entry] of this.cache) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldest = key;
      }
    }
    
    return oldest;
  }
  
  getStats(): { size: number; maxSize: number } {
    return { size: this.cache.size, maxSize: this.maxSize };
  }
}

// Global cache instance
export const appCache = new MemoryCache(200);

// ============================================================================
// REQUEST DEDUPLICATION
// ============================================================================

const pendingRequests = new Map<string, Promise<unknown>>();

/**
 * Deduplicate concurrent requests for the same resource
 */
export async function deduplicatedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  cacheMs = 0
): Promise<T> {
  // Check cache first
  if (cacheMs > 0) {
    const cached = appCache.get<T>(key);
    if (cached) return cached;
  }
  
  // Check for pending request
  const pending = pendingRequests.get(key);
  if (pending) {
    return pending as Promise<T>;
  }
  
  // Start new request
  const request = fetchFn()
    .then((data) => {
      if (cacheMs > 0) {
        appCache.set(key, data, cacheMs);
      }
      return data;
    })
    .finally(() => {
      pendingRequests.delete(key);
    });
  
  pendingRequests.set(key, request);
  return request;
}

// ============================================================================
// DEBOUNCE & THROTTLE
// ============================================================================

/**
 * Debounce a function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttle a function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;
  
  return (...args: Parameters<T>) => {
    if (inThrottle) {
      lastArgs = args;
      return;
    }
    
    fn(...args);
    inThrottle = true;
    
    setTimeout(() => {
      inThrottle = false;
      if (lastArgs) {
        fn(...lastArgs);
        lastArgs = null;
      }
    }, limit);
  };
}

/**
 * Rate limiter for API calls
 */
export function createRateLimiter(
  maxRequests: number,
  windowMs: number
): () => boolean {
  const requests: number[] = [];
  
  return () => {
    const now = Date.now();
    
    // Remove expired timestamps
    while (requests.length > 0 && requests[0] < now - windowMs) {
      requests.shift();
    }
    
    if (requests.length >= maxRequests) {
      return false;
    }
    
    requests.push(now);
    return true;
  };
}

// ============================================================================
// MEMORY MANAGEMENT
// ============================================================================

/**
 * Monitor memory usage (when available)
 */
export function getMemoryUsage(): { used: number; total: number } | null {
  if (typeof window === 'undefined') return null;
  
  // @ts-expect-error - memory API not in all browsers
  const memory = performance.memory;
  if (!memory) return null;
  
  return {
    used: memory.usedJSHeapSize,
    total: memory.totalJSHeapSize,
  };
}

/**
 * Trigger garbage collection hint
 */
export function suggestGC(): void {
  // Clear caches if memory pressure is high
  const memory = getMemoryUsage();
  if (memory && memory.used / memory.total > 0.8) {
    appCache.clear();
    pendingRequests.clear();
  }
}

/**
 * Intersection Observer for lazy loading
 */
export function createLazyLoadObserver(
  callback: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }
  
  return new IntersectionObserver((entries) => {
    entries.forEach(callback);
  }, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  });
}

// ============================================================================
// BATCH UPDATES
// ============================================================================

type BatchCallback<T> = (items: T[]) => void;

/**
 * Batch multiple updates into a single callback
 */
export function createBatcher<T>(
  callback: BatchCallback<T>,
  delay = 16 // ~1 frame at 60fps
): (item: T) => void {
  let batch: T[] = [];
  let timeoutId: NodeJS.Timeout | null = null;
  
  const flush = () => {
    if (batch.length > 0) {
      callback([...batch]);
      batch = [];
    }
    timeoutId = null;
  };
  
  return (item: T) => {
    batch.push(item);
    
    if (!timeoutId) {
      timeoutId = setTimeout(flush, delay);
    }
  };
}

// ============================================================================
// IDLE CALLBACK
// ============================================================================

/**
 * Run task when browser is idle
 */
export function runWhenIdle(
  task: () => void,
  timeout = 2000
): () => void {
  if (typeof window === 'undefined') {
    task();
    return () => {};
  }
  
  let handle: number | NodeJS.Timeout;
  
  if ('requestIdleCallback' in window) {
    handle = window.requestIdleCallback(task, { timeout });
    return () => window.cancelIdleCallback(handle as number);
  } else {
    handle = setTimeout(task, 100);
    return () => clearTimeout(handle);
  }
}

/**
 * Split long task into chunks
 */
export async function* chunkTask<T>(
  items: T[],
  chunkSize = 50
): AsyncGenerator<T[], void, unknown> {
  for (let i = 0; i < items.length; i += chunkSize) {
    yield items.slice(i, i + chunkSize);
    
    // Yield to main thread
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}

// ============================================================================
// PERFORMANCE MARKERS
// ============================================================================

/**
 * Mark performance events
 */
export function markPerformance(name: string, detail?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !performance.mark) return;
  
  try {
    performance.mark(name, { detail });
  } catch {
    // Ignore errors in older browsers
  }
}

/**
 * Measure between two marks
 */
export function measurePerformance(
  name: string,
  startMark: string,
  endMark: string
): PerformanceMeasure | null {
  if (typeof window === 'undefined' || !performance.measure) return null;
  
  try {
    return performance.measure(name, startMark, endMark);
  } catch {
    return null;
  }
}

// ============================================================================
// VIRTUAL LIST HELPERS
// ============================================================================

interface VirtualListConfig {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

/**
 * Calculate visible items for virtual scrolling
 */
export function getVisibleRange(
  scrollTop: number,
  totalItems: number,
  config: VirtualListConfig
): { start: number; end: number; offset: number } {
  const { itemHeight, containerHeight, overscan = 3 } = config;
  
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const end = Math.min(totalItems, start + visibleCount + overscan * 2);
  const offset = start * itemHeight;
  
  return { start, end, offset };
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  prefetchRoute,
  preloadResource,
  dynamicImportWithRetry,
  appCache,
  deduplicatedFetch,
  debounce,
  throttle,
  createRateLimiter,
  getMemoryUsage,
  suggestGC,
  createLazyLoadObserver,
  createBatcher,
  runWhenIdle,
  chunkTask,
  markPerformance,
  measurePerformance,
  getVisibleRange,
};
