/**
 * Simple in-memory rate limiter for login attempts.
 * In production with multiple instances, use Redis or similar.
 */

interface RateLimitEntry {
  attempts: number;
  resetAt: number;
  lockedUntil: number | null;
}

// In-memory store (cleared on restart)
const store = new Map<string, RateLimitEntry>();

// Config
const MAX_ATTEMPTS = 5; // Max attempts before lockout
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
const LOCKOUT_MS = 30 * 60 * 1000; // 30 minutes lockout after max attempts

/**
 * Check if an IP is currently rate limited.
 * Returns null if allowed, or the number of seconds until unlock.
 */
export function checkRateLimit(ip: string): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry) {
    return { allowed: true };
  }

  // Check if locked out
  if (entry.lockedUntil && now < entry.lockedUntil) {
    const retryAfterSec = Math.ceil((entry.lockedUntil - now) / 1000);
    return { allowed: false, retryAfterSec };
  }

  // Reset if window expired
  if (now > entry.resetAt) {
    store.delete(ip);
    return { allowed: true };
  }

  // Check attempts
  if (entry.attempts >= MAX_ATTEMPTS) {
    // Apply lockout
    entry.lockedUntil = now + LOCKOUT_MS;
    const retryAfterSec = Math.ceil(LOCKOUT_MS / 1000);
    return { allowed: false, retryAfterSec };
  }

  return { allowed: true };
}

/**
 * Record a failed login attempt for an IP.
 */
export function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, {
      attempts: 1,
      resetAt: now + WINDOW_MS,
      lockedUntil: null,
    });
    return;
  }

  entry.attempts += 1;

  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_MS;
  }
}

/**
 * Clear rate limit for an IP (e.g., after successful login).
 */
export function clearRateLimit(ip: string): void {
  store.delete(ip);
}

/**
 * Get remaining attempts for an IP.
 */
export function getRemainingAttempts(ip: string): number {
  const entry = store.get(ip);
  if (!entry) return MAX_ATTEMPTS;
  if (Date.now() > entry.resetAt) return MAX_ATTEMPTS;
  return Math.max(0, MAX_ATTEMPTS - entry.attempts);
}
