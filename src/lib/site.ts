/**
 * Public base URL, read at runtime. Deliberately not NEXT_PUBLIC_*: those are inlined at build time,
 * and the Docker build has no access to deployment env, so they would bake in a wrong value.
 */
export function siteUrl(): string {
  return (process.env.SITE_URL || "https://claritys.web.id").replace(/\/+$/, "");
}
