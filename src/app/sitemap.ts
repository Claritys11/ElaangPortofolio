import type { MetadataRoute } from "next";
import { listAchievements } from "@/lib/data/achievements";
import { listProjects } from "@/lib/data/projects";
import { listWriteups } from "@/lib/data/writeups";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [writeups, projects, achievements] = await Promise.all([
    listWriteups().catch(() => []),
    listProjects().catch(() => []),
    listAchievements().catch(() => []),
  ]);
  const abs = (u: string | null) => (u && !u.startsWith("data:") ? (u.startsWith("http") ? u : `${base}${u}`) : null);
  const latest = writeups.map((w) => w.updated).sort().at(-1);
  const images = (list: (string | null)[]) => list.map(abs).filter((u): u is string => !!u);

  return [
    { url: `${base}/`, lastModified: latest, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/writeups`, lastModified: latest, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/projects`, changeFrequency: "monthly", priority: 0.7, images: images(projects.map((p) => p.imageUrl)) },
    { url: `${base}/achievements`, changeFrequency: "monthly", priority: 0.6, images: images(achievements.map((a) => a.imageUrl)).slice(0, 50) },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.8 },
    ...writeups.map((w) => ({
      url: `${base}${w.href}`,
      lastModified: w.updated,
      changeFrequency: "yearly" as const,
      priority: w.category === "Pwn" ? 0.8 : 0.7,
      images: images([w.cover]),
    })),
  ];
}
