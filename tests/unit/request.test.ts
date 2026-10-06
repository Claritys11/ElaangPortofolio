import { afterEach, describe, expect, it } from "vitest";
import { clientIp } from "@/lib/request";

afterEach(() => {
  delete process.env.TRUSTED_PROXY_HOPS;
});

describe("clientIp", () => {
  it("uses the hop appended by our reverse proxy (rightmost), not the client-controlled leftmost", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "6.6.6.6, 1.2.3.4" }))).toBe("1.2.3.4");
  });
  it("cannot be rotated by a client prepending fake hops", () => {
    const a = clientIp(new Headers({ "x-forwarded-for": "10.0.0.1, 1.2.3.4" }));
    const b = clientIp(new Headers({ "x-forwarded-for": "10.0.0.2, 1.2.3.4" }));
    expect(a).toBe(b);
  });
  it("honours TRUSTED_PROXY_HOPS for chained proxies", () => {
    process.env.TRUSTED_PROXY_HOPS = "2";
    expect(clientIp(new Headers({ "x-forwarded-for": "6.6.6.6, 1.2.3.4, 172.18.0.5" }))).toBe("1.2.3.4");
  });
  it("falls back to x-real-ip, then unknown", () => {
    expect(clientIp(new Headers({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(clientIp(new Headers())).toBe("unknown");
  });
  it("prefers Cloudflare's CF-Connecting-IP (set by the edge, client values overwritten)", () => {
    expect(clientIp(new Headers({ "cf-connecting-ip": "203.0.113.7", "x-forwarded-for": "6.6.6.6, 198.51.100.1" }))).toBe("203.0.113.7");
  });
});
