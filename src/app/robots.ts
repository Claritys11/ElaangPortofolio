import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://claritys.web.id";
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/admin", "/api/auth"] }], sitemap: `${base}/sitemap.xml` };
}
