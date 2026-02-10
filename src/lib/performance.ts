// Performance Monitoring and Web Vitals
// Tracks Core Web Vitals and custom metrics

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

export interface WebVitals {
  CLS?: PerformanceMetric;  // Cumulative Layout Shift
  FID?: PerformanceMetric;  // First Input Delay
  LCP?: PerformanceMetric;  // Largest Contentful Paint
  FCP?: PerformanceMetric;  // First Contentful Paint
  TTFB?: PerformanceMetric; // Time to First Byte
  INP?: PerformanceMetric;  // Interaction to Next Paint
}

// Thresholds for Web Vitals (in milliseconds)
const THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  LCP: { good: 2500, poor: 4000 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

/**
 * Get rating for a metric value
 */
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

// Only log in development
const isDev = process.env.NODE_ENV === 'development';

/**
 * Report metric to analytics
 */
function reportMetric(metric: PerformanceMetric) {
  // Only log in development
  if (isDev) {
    console.log(`[Performance] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
    });
  }

  // Send to analytics endpoint
  if (typeof window !== 'undefined' && navigator.sendBeacon) {
    const body = JSON.stringify({
      type: 'web-vital',
      metric: metric.name,
      value: metric.value,
      rating: metric.rating,
      timestamp: metric.timestamp,
      url: window.location.href,
      userAgent: navigator.userAgent,
    });

    navigator.sendBeacon('/api/analytics/vitals', body);
  }

  // Emit custom event for app to handle
  window.dispatchEvent(
    new CustomEvent('performance-metric', { detail: metric })
  );
}

/**
 * Initialize Web Vitals monitoring
 */
export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') return;

  // Monitor CLS (Cumulative Layout Shift)
  monitorCLS();

  // Monitor LCP (Largest Contentful Paint)
  monitorLCP();

  // Monitor FID (First Input Delay)
  monitorFID();

  // Monitor FCP (First Contentful Paint)
  monitorFCP();

  // Monitor TTFB (Time to First Byte)
  monitorTTFB();

  // Monitor INP (Interaction to Next Paint)
  monitorINP();

  // Monitor custom metrics
  monitorNavigationTiming();
  monitorResourceTiming();
  monitorLongTasks();
}

/**
 * Monitor Cumulative Layout Shift
 */
function monitorCLS() {
  if (!('PerformanceObserver' in window)) return;

  let clsValue = 0;
  let sessionValue = 0;
  let sessionEntries: any[] = [];

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      // Only count layout shifts without recent user input
      if (!(entry as any).hadRecentInput) {
        const firstSessionEntry = sessionEntries[0];
        const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

        // If the entry occurred less than 1 second after the previous entry
        // and less than 5 seconds after the first entry in the session,
        // include the entry in the current session. Otherwise, start a new session.
        if (
          sessionValue &&
          entry.startTime - lastSessionEntry.startTime < 1000 &&
          entry.startTime - firstSessionEntry.startTime < 5000
        ) {
          sessionValue += (entry as any).value;
          sessionEntries.push(entry);
        } else {
          sessionValue = (entry as any).value;
          sessionEntries = [entry];
        }

        // Update CLS value if this session's value is greater
        if (sessionValue > clsValue) {
          clsValue = sessionValue;
          
          reportMetric({
            name: 'CLS',
            value: clsValue,
            rating: getRating('CLS', clsValue),
            timestamp: Date.now(),
          });
        }
      }
    }
  });

  observer.observe({ type: 'layout-shift', buffered: true });
}

/**
 * Monitor Largest Contentful Paint
 */
function monitorLCP() {
  if (!('PerformanceObserver' in window)) return;

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1] as any;

    reportMetric({
      name: 'LCP',
      value: lastEntry.renderTime || lastEntry.loadTime,
      rating: getRating('LCP', lastEntry.renderTime || lastEntry.loadTime),
      timestamp: Date.now(),
    });
  });

  observer.observe({ type: 'largest-contentful-paint', buffered: true });
}

/**
 * Monitor First Input Delay
 */
function monitorFID() {
  if (!('PerformanceObserver' in window)) return;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const fid = (entry as any).processingStart - entry.startTime;

      reportMetric({
        name: 'FID',
        value: fid,
        rating: getRating('FID', fid),
        timestamp: Date.now(),
      });
    }
  });

  observer.observe({ type: 'first-input', buffered: true });
}

/**
 * Monitor First Contentful Paint
 */
function monitorFCP() {
  if (!('PerformanceObserver' in window)) return;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        reportMetric({
          name: 'FCP',
          value: entry.startTime,
          rating: getRating('FCP', entry.startTime),
          timestamp: Date.now(),
        });
      }
    }
  });

  observer.observe({ type: 'paint', buffered: true });
}

/**
 * Monitor Time to First Byte
 */
function monitorTTFB() {
  if (!window.performance || !window.performance.timing) return;

  // Wait for load event
  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as any;
    if (navigation) {
      const ttfb = navigation.responseStart - navigation.requestStart;

      reportMetric({
        name: 'TTFB',
        value: ttfb,
        rating: getRating('TTFB', ttfb),
        timestamp: Date.now(),
      });
    }
  });
}

/**
 * Monitor Interaction to Next Paint
 */
function monitorINP() {
  if (!('PerformanceObserver' in window)) return;

  let maxDuration = 0;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const duration = (entry as any).duration;
      if (duration > maxDuration) {
        maxDuration = duration;

        reportMetric({
          name: 'INP',
          value: duration,
          rating: getRating('INP', duration),
          timestamp: Date.now(),
        });
      }
    }
  });

  observer.observe({ type: 'event', durationThreshold: 16, buffered: true } as any);
}

/**
 * Monitor Navigation Timing
 */
function monitorNavigationTiming() {
  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as any;
    if (!navigation) return;

    const metrics = {
      dns: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcp: navigation.connectEnd - navigation.connectStart,
      request: navigation.responseStart - navigation.requestStart,
      response: navigation.responseEnd - navigation.responseStart,
      dom: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      load: navigation.loadEventEnd - navigation.loadEventStart,
      total: navigation.loadEventEnd - navigation.fetchStart,
    };

    if (isDev) {
      console.log('[Performance] Navigation timing:', metrics);
    }

    // Send to analytics
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/navigation', JSON.stringify({
        type: 'navigation-timing',
        metrics,
        timestamp: Date.now(),
      }));
    }
  });
}

/**
 * Monitor Resource Timing
 */
function monitorResourceTiming() {
  if (!('PerformanceObserver' in window)) return;

  const observer = new PerformanceObserver((list) => {
    const resources = list.getEntries().map((entry: any) => ({
      name: entry.name,
      type: entry.initiatorType,
      duration: entry.duration,
      size: entry.transferSize,
      cached: entry.transferSize === 0,
    }));

    // Log slow resources (only in dev)
    if (isDev) {
      const slowResources = resources.filter(r => r.duration > 1000);
      if (slowResources.length > 0) {
        console.warn('[Performance] Slow resources:', slowResources);
      }
    }
  });

  observer.observe({ type: 'resource', buffered: true });
}

/**
 * Monitor Long Tasks
 */
function monitorLongTasks() {
  if (!('PerformanceObserver' in window)) return;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (isDev) {
        console.warn('[Performance] Long task detected:', {
          duration: entry.duration,
          startTime: entry.startTime,
        });
      }

      // Send to analytics
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/long-task', JSON.stringify({
          type: 'long-task',
          duration: entry.duration,
          startTime: entry.startTime,
          timestamp: Date.now(),
        }));
      }
    }
  });

  // Only observe if longtask is supported
  try {
    observer.observe({ type: 'longtask', buffered: true });
  } catch (e) {
    // longtask not supported
  }
}

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics(): {
  memory?: any;
  navigation?: any;
  resources?: any;
} {
  if (typeof window === 'undefined' || !window.performance) {
    return {};
  }

  return {
    memory: (performance as any).memory,
    navigation: performance.getEntriesByType('navigation')[0],
    resources: performance.getEntriesByType('resource'),
  };
}

/**
 * Mark a custom performance point
 */
export function markPerformance(name: string) {
  if (typeof window === 'undefined' || !window.performance) return;

  performance.mark(name);
}

/**
 * Measure performance between two marks
 */
export function measurePerformance(name: string, startMark: string, endMark: string) {
  if (typeof window === 'undefined' || !window.performance) return;

  try {
    performance.measure(name, startMark, endMark);
    const measure = performance.getEntriesByName(name)[0];
    
    if (isDev) {
      console.log(`[Performance] ${name}:`, measure.duration, 'ms');
    }
    
    return measure.duration;
  } catch (e) {
    console.error('[Performance] Measure failed:', e);
  }
}

/**
 * Clear performance marks and measures
 */
export function clearPerformance() {
  if (typeof window === 'undefined' || !window.performance) return;

  performance.clearMarks();
  performance.clearMeasures();
}

/**
 * Check if device has low memory
 */
export function isLowMemoryDevice(): boolean {
  const memory = (navigator as any).deviceMemory;
  return memory && memory < 4; // Less than 4GB
}

/**
 * Check if connection is slow
 */
export function isSlowConnection(): boolean {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  if (!connection) return false;

  return (
    connection.saveData === true ||
    connection.effectiveType === 'slow-2g' ||
    connection.effectiveType === '2g' ||
    connection.effectiveType === '3g'
  );
}

/**
 * Get performance recommendations
 */
export function getPerformanceRecommendations(): string[] {
  const recommendations: string[] = [];

  if (isLowMemoryDevice()) {
    recommendations.push('Device has limited memory - consider reducing cache size');
  }

  if (isSlowConnection()) {
    recommendations.push('Slow connection detected - enable data saver mode');
  }

  const metrics = getPerformanceMetrics();
  if (metrics.memory && (metrics.memory as any).usedJSHeapSize) {
    const heapUsage = ((metrics.memory as any).usedJSHeapSize / (metrics.memory as any).jsHeapSizeLimit) * 100;
    if (heapUsage > 80) {
      recommendations.push('High memory usage detected - consider clearing caches');
    }
  }

  return recommendations;
}
