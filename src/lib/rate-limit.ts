/**
 * In-memory sliding-window rate limiter & account lockout protector for PCC VMS
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

interface LockoutRecord {
  failedAttempts: number;
  lockedUntil: number | null;
  lastAttempt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();
const lockoutStore = new Map<string, LockoutRecord>();

// Cleanup stale memory records every 5 minutes
if (typeof setInterval !== 'undefined') {
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key);
      }
    }
    for (const [key, record] of lockoutStore.entries()) {
      if (record.lockedUntil && now > record.lockedUntil && now - record.lastAttempt > 3600000) {
        lockoutStore.delete(key);
      }
    }
  }, 300000);
  if (typeof cleanupTimer.unref === 'function') {
    cleanupTimer.unref();
  }
}

/**
 * Standard sliding-window rate limit checker
 * @param key unique identifier (e.g. IP address or user ID)
 * @param limit maximum allowed requests within the window
 * @param windowMs time window in milliseconds (default 60 seconds)
 */
export function checkRateLimit(
  key: string,
  limit: number = 30,
  windowMs: number = 60000
): {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
} {
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || now > existing.resetTime) {
    const record: RateLimitRecord = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, record);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Math.ceil((record.resetTime - now) / 1000),
    };
  }

  if (existing.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: Math.ceil((existing.resetTime - now) / 1000),
    };
  }

  existing.count += 1;
  return {
    success: true,
    limit,
    remaining: limit - existing.count,
    reset: Math.ceil((existing.resetTime - now) / 1000),
  };
}

/**
 * Account Lockout Configuration
 * - Max failed attempts: 5
 * - Lockout window: 15 minutes (900,000 ms)
 */
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Check if an account identifier is currently locked out
 */
export function isAccountLocked(identifier: string): { locked: boolean; remainingMinutes?: number } {
  const now = Date.now();
  const record = lockoutStore.get(identifier.toLowerCase());

  if (!record || !record.lockedUntil) {
    return { locked: false };
  }

  if (now > record.lockedUntil) {
    // Lockout has expired — reset lock
    record.lockedUntil = null;
    record.failedAttempts = 0;
    return { locked: false };
  }

  const remainingMinutes = Math.ceil((record.lockedUntil - now) / 60000);
  return { locked: true, remainingMinutes };
}

/**
 * Record a failed authentication attempt
 */
export function recordFailedLogin(identifier: string): {
  attempts: number;
  isLocked: boolean;
  remainingAttempts: number;
} {
  const key = identifier.toLowerCase();
  const now = Date.now();
  const record = lockoutStore.get(key) || {
    failedAttempts: 0,
    lockedUntil: null,
    lastAttempt: now,
  };

  record.failedAttempts += 1;
  record.lastAttempt = now;

  if (record.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    lockoutStore.set(key, record);
    return {
      attempts: record.failedAttempts,
      isLocked: true,
      remainingAttempts: 0,
    };
  }

  lockoutStore.set(key, record);
  return {
    attempts: record.failedAttempts,
    isLocked: false,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - record.failedAttempts),
  };
}

/**
 * Clear failed attempts after successful authentication
 */
export function clearFailedLogin(identifier: string): void {
  lockoutStore.delete(identifier.toLowerCase());
}

/**
 * Helper to get client IP from Next.js request headers
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || '127.0.0.1';
}

