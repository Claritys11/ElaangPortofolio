import "server-only";
import { normalizeGithubUsername, parseGithubContributions } from "@/lib/activity";

export type DayCounts = [date: string, count: number][];

const TTL_MS = 6 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; days: DayCounts | null }>();

/**
 * Non-zero days from the public contributions page (no token needed). Cached in memory for six hours;
 * on failure the last good copy is kept, and a first failure hides the GitHub view instead of erroring.
 */
export async function getGithubDays(username: string | null): Promise<DayCounts | null> {
  const user = normalizeGithubUsername(username);
  if (!user) return null;
  const hit = cache.get(user);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.days;
  try {
    // Snapshot contributions at build time; the public site has no request-time server.
    const res = await fetch(`https://github.com/users/${user}/contributions`, { cache: "force-cache", signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    const days = [...parseGithubContributions(await res.text())].filter(([, n]) => n > 0);
    cache.set(user, { at: Date.now(), days });
    return days;
  } catch {
    // Retry in a minute rather than on every request while GitHub is unreachable.
    cache.set(user, { at: Date.now() - TTL_MS + 60_000, days: hit?.days ?? null });
    return hit?.days ?? null;
  }
}
