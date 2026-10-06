export function createRateLimiter({ limit, windowMs, now = Date.now }: { limit: number; windowMs: number; now?: () => number }) {
  const buckets = new Map<string, { start: number; count: number }>();
  return {
    hit(key: string) {
      const t = now();
      let b = buckets.get(key);
      if (!b || t - b.start > windowMs) {
        b = { start: t, count: 0 };
        buckets.set(key, b);
      }
      b.count += 1;
      if (buckets.size > 5000) for (const [k, v] of buckets) if (t - v.start > windowMs) buckets.delete(k);
      return { ok: b.count <= limit, retryAfter: Math.ceil((b.start + windowMs - t) / 1000) };
    },
  };
}
