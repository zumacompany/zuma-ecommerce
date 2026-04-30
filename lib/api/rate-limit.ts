/**
 * Simple in-memory rate limiter for serverless/edge environments.
 *
 * NOTE: This is per-instance. If you deploy across multiple serverless
 * instances, each gets its own counter map. For stricter enforcement,
 * switch to a Redis/KV-backed limiter (e.g. @upstash/ratelimit).
 *
 * Usage in a route handler:
 *   const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 })
 *   // ...
 *   const ip = getClientIp(req)
 *   if (!limiter.check(ip)) return apiTooManyRequests()
 */

type RateLimitEntry = {
  count: number
  resetAt: number
}

type RateLimiterConfig = {
  /** Max requests allowed per window */
  maxRequests: number
  /** Window duration in milliseconds */
  windowMs: number
}

export function createRateLimiter(config: RateLimiterConfig) {
  const store = new Map<string, RateLimitEntry>()

  // Periodic cleanup to prevent memory leaks
  const CLEANUP_INTERVAL = Math.max(config.windowMs * 2, 60_000)
  let lastCleanup = Date.now()

  function cleanup() {
    const now = Date.now()
    if (now - lastCleanup < CLEANUP_INTERVAL) return
    lastCleanup = now
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) store.delete(key)
    }
  }

  return {
    /**
     * Check if the key (typically an IP) is within the rate limit.
     * Returns `true` if the request is allowed, `false` if rate-limited.
     */
    check(key: string): boolean {
      cleanup()
      const now = Date.now()
      const entry = store.get(key)

      if (!entry || entry.resetAt <= now) {
        store.set(key, { count: 1, resetAt: now + config.windowMs })
        return true
      }

      entry.count += 1
      return entry.count <= config.maxRequests
    },
  }
}

/**
 * Extract client IP from a Request object.
 * Works with Vercel, Cloudflare, and standard proxies.
 */
export function getClientIp(req: Request): string {
  const headers = req.headers
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || headers.get('x-real-ip')
    || headers.get('cf-connecting-ip')
    || '0.0.0.0'
  )
}

// Pre-configured limiters for common use cases
export const orderLimiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 })
export const analyticsLimiter = createRateLimiter({ maxRequests: 30, windowMs: 60_000 })
export const publicApiLimiter = createRateLimiter({ maxRequests: 60, windowMs: 60_000 })
