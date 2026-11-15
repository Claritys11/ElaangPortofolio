import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return { rules: [{ userAgent: "*", allow: "/" }], sitemap: `${base}/sitemap.xml` };
}
