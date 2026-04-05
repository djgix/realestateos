const buckets = new Map<string, { count: number; reset: number }>()

/** Simple in-memory limiter (best-effort per server instance). */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  let b = buckets.get(key)
  if (!b || now > b.reset) {
    b = { count: 0, reset: now + windowMs }
    buckets.set(key, b)
  }
  if (b.count >= max) return false
  b.count++
  return true
}
