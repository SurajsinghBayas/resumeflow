// In-memory sliding-window rate limiter.
// Good enough for a single instance; across serverless instances each
// instance enforces its own budget, so treat this as abuse friction,
// not a hard global quota. Per-user spend caps (see lib/limits.ts) are
// the authoritative cost guard.
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();
const SWEEP_INTERVAL_MS = 60_000;

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function checkRateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  sweep(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetMs: windowMs };
  }
  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, resetMs: Math.max(0, bucket.resetAt - now) };
  }
  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, resetMs: Math.max(0, bucket.resetAt - now) };
}

export function rateLimitedResponse(resetMs: number) {
  return Response.json(
    { error: "Too many attempts. Please wait a moment and try again." },
    {
      status: 429,
      headers: { "Retry-After": String(Math.max(1, Math.ceil(resetMs / 1000))) },
    },
  );
}
