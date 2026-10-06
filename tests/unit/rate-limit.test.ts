import { describe, expect, it } from "vitest";
import { createRateLimiter } from "@/lib/rate-limit";

describe("rate limiter", () => {
  it("allows `limit` hits per window per key", () => {
    let t = 0;
    const rl = createRateLimiter({ limit: 3, windowMs: 1000, now: () => t });
    expect([rl.hit("a").ok, rl.hit("a").ok, rl.hit("a").ok, rl.hit("a").ok]).toEqual([true, true, true, false]);
    expect(rl.hit("b").ok).toBe(true);
    expect(rl.hit("a").retryAfter).toBe(1);
    t = 1001;
    expect(rl.hit("a").ok).toBe(true);
  });
});
