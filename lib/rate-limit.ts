/**
 * Small in-memory sliding-window rate limiter (the Next.js equivalent of express-rate-limit).
 *
 * State lives in this server instance's memory: it resets on restart and isn't shared between
 * serverless instances. That's enough to stop floods and brute force from a single IP; for a hard
 * global limit swap the Map for Redis/Upstash.
 */

type Bucket = number[]; // request timestamps (ms) inside the current window
const buckets = new Map<string, Bucket>();
let lastSweep = 0;

export type LimitResult = { ok: boolean; limit: number; remaining: number; resetSec: number };

/** Count one hit for `key`; `ok` is false once more than `limit` hits fall inside `windowMs`. */
export function hit(key: string, limit: number, windowMs: number): LimitResult {
  const now = Date.now();
  sweep(now, windowMs);
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  buckets.set(key, recent);
  const resetSec = Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000));
  return { ok: recent.length <= limit, limit, remaining: Math.max(0, limit - recent.length), resetSec };
}

/** Like `hit` but only reads — doesn't count a request. */
export function peek(key: string, limit: number, windowMs: number): LimitResult {
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  const resetSec = recent.length ? Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000)) : 0;
  return { ok: recent.length < limit, limit, remaining: Math.max(0, limit - recent.length), resetSec };
}

/** Drop idle buckets now and then so memory doesn't grow with every IP ever seen. */
function sweep(now: number, windowMs: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  const maxAge = Math.max(windowMs, 60 * 60_000);
  for (const [k, ts] of buckets) if (!ts.length || now - ts[ts.length - 1] > maxAge) buckets.delete(k);
}

/** Client IP behind Vercel / a reverse proxy. */
export function clientIp(request: Request): string {
  const h = request.headers;
  return (
    h.get("x-real-ip")?.trim() ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local"
  );
}

/** 429 JSON response in the same `{ error }` shape the API already uses, with standard RateLimit headers. */
export function tooMany(r: LimitResult, message = "Хэт олон хандалт илэрлээ. Түр хүлээгээд дахин оролдоно уу.") {
  return Response.json({ error: message }, { status: 429, headers: { ...limitHeaders(r), "Retry-After": String(r.resetSec) } });
}

export function limitHeaders(r: LimitResult): Record<string, string> {
  return {
    "RateLimit-Limit": String(r.limit),
    "RateLimit-Remaining": String(r.remaining),
    "RateLimit-Reset": String(r.resetSec),
  };
}
