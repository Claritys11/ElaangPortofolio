import { isGenericTag, tagKey } from "@/lib/tags";
import type { WriteupSummary } from "@/lib/types";

export type RelatedWriteup = WriteupSummary & { shared: string[] };

/**
 * Same category weighs most, then shared technique tags (generic labels like "pwn"/"medium" ignored),
 * then same competition. Ties go to the newer writeup.
 */
export function relatedWriteups(current: WriteupSummary, all: WriteupSummary[], n = 3): RelatedWriteup[] {
  const mine = current.tags.filter((t) => !isGenericTag(t));
  return all
    .filter((w) => w.id !== current.id)
    .map((w) => {
      const theirs = new Set(w.tags.map(tagKey));
      const shared = mine.filter((t) => theirs.has(tagKey(t)));
      const score = (w.category === current.category ? 3 : 0) + shared.length * 2 + (current.competition && w.competition === current.competition ? 1 : 0);
      return { ...w, shared, score };
    })
    .filter((w) => w.score > 0)
    .sort((a, b) => b.score - a.score || (b.date ?? "").localeCompare(a.date ?? ""))
    .slice(0, n)
    .map(({ score, ...w }) => {
      void score;
      return w;
    });
}
