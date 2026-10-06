/**
 * Client IP for rate limiting and access logs.
 *
 * Behind Cloudflare (tunnel or proxy), CF-Connecting-IP is set by the edge and overwrites any
 * client-supplied value. Otherwise, X-Forwarded-For entries left of our own proxies are
 * client-controlled, so the trustworthy address is the one appended by the outermost proxy we run:
 * counted from the right by TRUSTED_PROXY_HOPS (default 1).
 *
 * Both headers are only trustworthy because the app port is bound to localhost (docker-compose.yml):
 * nobody can reach it without going through the tunnel/proxy.
 */
export function clientIp(h: Headers): string {
  const cf = h.get("cf-connecting-ip")?.trim();
  if (cf) return cf;
  const hops = Math.max(1, Number.parseInt(process.env.TRUSTED_PROXY_HOPS ?? "1", 10) || 1);
  const chain = (h.get("x-forwarded-for") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (chain.length) return chain[Math.max(0, chain.length - hops)];
  return h.get("x-real-ip")?.trim() || "unknown";
}
