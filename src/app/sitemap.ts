import type { MetadataRoute } from "next";
import { listWriteups } from "@/lib/data/writeups";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://claritys.web.id";
  const writeups = await listWriteups().catch(() => []);
  return [
    ...["", "/writeups", "/projects", "/achievements", "/about"].map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const })),
    ...writeups.map((w) => ({ url: `${base}${w.href}`, lastModified: w.date ?? undefined })),
  ];
}
