// Labels that describe the category/difficulty/arch rather than the technique; they don't make writeups "related".
const GENERIC = new Set([
  "pwn", "binary exploitation", "forensic", "forensics", "reverse", "reverse engineering", "rev", "crypto", "cryptography",
  "web", "web exploitation", "misc", "osint", "easy", "medium", "hard", "insane", "easy-medium", "medium-hard", "beginner", "x64", "x86", "amd64",
  "linux", "shell", "ctf", "exercise", "hands-on",
]);

export const tagKey = (t: string) => t.trim().toLowerCase();
export const isGenericTag = (t: string) => GENERIC.has(tagKey(t));

export type TagStat = { tag: string; count: number; byCategory: Record<string, number> };

/** One entry per tag (case-insensitive), spelled the way it is most often written. */
export function buildTagIndex(rows: { category: string; tags: string[] }[]): TagStat[] {
  type Entry = { spellings: Map<string, number>; count: number; byCategory: Record<string, number> };
  const byKey = new Map<string, Entry>();
  for (const row of rows) {
    for (const raw of new Set(row.tags.map((t) => t.trim()).filter(Boolean))) {
      const k = tagKey(raw);
      const e: Entry = byKey.get(k) ?? { spellings: new Map(), count: 0, byCategory: {} };
      e.spellings.set(raw, (e.spellings.get(raw) ?? 0) + 1);
      e.count += 1;
      e.byCategory[row.category] = (e.byCategory[row.category] ?? 0) + 1;
      byKey.set(k, e);
    }
  }
  return [...byKey.values()]
    .map((e) => ({ tag: [...e.spellings.entries()].sort((a, b) => b[1] - a[1])[0][0], count: e.count, byCategory: e.byCategory }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function suggestTags(index: TagStat[], opts: { query: string; category: string | null; selected: string[]; limit?: number }): TagStat[] {
  const { query, category, selected, limit = 8 } = opts;
  const taken = new Set(selected.map(tagKey));
  const q = tagKey(query);
  const pool = index.filter((t) => !taken.has(tagKey(t.tag)));
  if (!q) {
    // Nothing typed: technique tags popular in this category first, then globally popular ones.
    const inCat = (t: TagStat) => (category ? (t.byCategory[category] ?? 0) : 0);
    return pool
      .filter((t) => !isGenericTag(t.tag))
      .sort((a, b) => inCat(b) - inCat(a) || b.count - a.count)
      .slice(0, limit);
  }
  const rank = (t: TagStat) => (tagKey(t.tag).startsWith(q) ? 0 : tagKey(t.tag).includes(q) ? 1 : 2);
  return pool
    .filter((t) => rank(t) < 2)
    .sort((a, b) => rank(a) - rank(b) || b.count - a.count)
    .slice(0, limit);
}
