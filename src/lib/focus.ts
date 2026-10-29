/** Which projects back each complementary focus area, read from their category and tags. */

export const SYSADMIN = /\b(docker|coolify|traefik|homelab|infrastructure|systemd(-nspawn)?|server|monitoring|cachyos|arch linux|cloudflare tunnel|devsecops)\b/gi;
export const WEBDEV = /\b(next\.js( \d+)?|react|prisma|postgresql|tailwind( css)?|typescript|auth\.js|cms|web (platform|application|development))\b/gi;

type Tagged = { title: string; category: string; tags: string[] };

/** Projects ordered by how many terms they match (ties keep the admin's order); non-matches dropped. */
export function evidenceFor<T extends Tagged>(projects: T[], terms: RegExp, limit = 3): T[] {
  return projects
    .map((p, i) => ({ p, i, score: [p.category, ...p.tags].join(" · ").match(terms)?.length ?? 0 }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, limit)
    .map((x) => x.p);
}

/** "Homelab — Self-Hosted Deployment Platform" → "Homelab". */
export const shortTitle = (title: string) => title.split(/\s+[—–-]\s+/)[0];
