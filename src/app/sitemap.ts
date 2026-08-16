import type { MetadataRoute } from 'next';
import { listWriteupSummaries, listProjects } from '@/lib/server-storage';
import { getWriteupUrl, SITE_BASE_URL } from '@/lib/seo-utils';

// Force dynamic rendering — sitemap must always reflect the latest DB content.
// Without this, Next.js would statically bake the sitemap at build time and
// new writeups/projects would NOT appear until the next deployment.
export const dynamic = 'force-dynamic';

const BASE_URL = SITE_BASE_URL;

// Static pages with their priorities
const staticPages: MetadataRoute.Sitemap = [
  {
    url: BASE_URL,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 1.0,
  },
  {
    url: `${BASE_URL}/about`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  },
  {
    url: `${BASE_URL}/ctf`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.9,
  },
  {
    url: `${BASE_URL}/projects`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.9,
  },
  {
    url: `${BASE_URL}/achievements`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  },
  {
    url: `${BASE_URL}/contact`,
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: 0.5,
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch dynamic content from DB — runs at request time so always fresh
  const [writeups, projects] = await Promise.allSettled([
    listWriteupSummaries(),
    listProjects(),
  ]);

  // Map CTF writeups to sitemap entries
  const writeupEntries: MetadataRoute.Sitemap =
    writeups.status === 'fulfilled'
      ? writeups.value.map((w) => ({
          url: getWriteupUrl(w),
          lastModified: w.updatedAt ? new Date(w.updatedAt) : new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.8,
        }))
      : [];

  // Map projects to sitemap entries (list page only — no individual project pages yet)
  // If individual project pages are added in the future, map them here similarly to writeups.
  void projects; // currently unused, projects have no individual pages

  return [...staticPages, ...writeupEntries];
}
