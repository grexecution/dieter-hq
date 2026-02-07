/**
 * Agent Activity Cache
 * In-memory cache for OpenClaw agent activity data
 * Updated via cron job every 10 seconds
 */

export interface AgentSession {
  key: string;
  label?: string;
  channel?: string;
  updatedAt: number;
  model?: string;
  totalTokens?: number;
  contextTokens?: number;
  abortedLastRun?: boolean;
  lastMessage?: string;
}

export interface AgentActivityData {
  sessions: AgentSession[];
  updatedAt: string;
}

interface CacheEntry {
  data: AgentActivityData;
  timestamp: number;
}

const TTL_MS = 15_000; // 15 seconds
const STALE_THRESHOLD_MS = 30_000; // Consider stale after 30 seconds

class AgentActivityCache {
  private static instance: AgentActivityCache | null = null;
  private cache: CacheEntry | null = null;

  private constructor() {}

  static getInstance(): AgentActivityCache {
    if (!AgentActivityCache.instance) {
      AgentActivityCache.instance = new AgentActivityCache();
    }
    return AgentActivityCache.instance;
  }

  /**
   * Store activity data in cache
   */
  set(data: AgentActivityData): void {
    this.cache = {
      data: {
        ...data,
        updatedAt: new Date().toISOString(),
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Get cached activity data
   * Returns null if cache is empty or expired
   */
  get(): AgentActivityData | null {
    if (!this.cache) {
      return null;
    }

    const age = Date.now() - this.cache.timestamp;
    
    // Return null if cache is too old (missed several updates)
    if (age > STALE_THRESHOLD_MS) {
      return null;
    }

    return this.cache.data;
  }

  /**
   * Check if cache is stale (needs refresh)
   */
  isStale(): boolean {
    if (!this.cache) return true;
    return Date.now() - this.cache.timestamp > TTL_MS;
  }

  /**
   * Check if cache has any data (even if stale)
   */
  hasData(): boolean {
    return this.cache !== null;
  }

  /**
   * Get cache age in milliseconds
   */
  getAge(): number | null {
    if (!this.cache) return null;
    return Date.now() - this.cache.timestamp;
  }

  /**
   * Clear the cache
   */
  clear(): void {
    this.cache = null;
  }

  /**
   * Get cache stats for debugging
   */
  getStats(): {
    hasData: boolean;
    isStale: boolean;
    ageMs: number | null;
    sessionCount: number;
  } {
    return {
      hasData: this.hasData(),
      isStale: this.isStale(),
      ageMs: this.getAge(),
      sessionCount: this.cache?.data.sessions.length ?? 0,
    };
  }
}

// Export singleton instance
export const agentActivityCache = AgentActivityCache.getInstance();
