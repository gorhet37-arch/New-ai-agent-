const buckets = new Map();
export function rateLimit(key, { max = 60, windowMs = 60000 } = {}) {
  const now = Date.now();
  const b = buckets.get(key) || { count: 0, reset: now + windowMs };
  if (now > b.reset) { b.count = 0; b.reset = now + windowMs; }
  b.count++;
  buckets.set(key, b);
  return { ok: b.count <= max, remaining: Math.max(0, max - b.count), reset: b.reset };
}
