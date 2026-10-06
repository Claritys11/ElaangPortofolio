/**
 * Client IP for rate limiting and access logs.
 *
 * X-Forwarded-For entries left of our own proxies are client-controlled, so the
 * trustworthy address is the one appended by the outermost proxy we run
 * (Coolify/Traefik): counted from the right by TRUSTED_PROXY_HOPS (default 1).
 */
export function clientIp(h: Headers): string {
  const hops = Math.max(1, Number.parseInt(process.env.TRUSTED_PROXY_HOPS ?? "1", 10) || 1);
  const chain = (h.get("x-forwarded-for") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (chain.length) return chain[Math.max(0, chain.length - hops)];
  return h.get("x-real-ip")?.trim() || "unknown";
}
