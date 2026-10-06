import { Reveal } from "@/components/motion/reveal";
import { formatDate } from "@/lib/format";
import type { AchievementItem } from "@/lib/types";

export function RecordTimeline({ items, limit }: { items: AchievementItem[]; limit?: number }) {
  const shown = limit
    ? [...items]
        .sort((a, b) => b.proofScore - a.proofScore)
        .slice(0, limit)
        .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
    : items;
  const top = new Set(
    [...shown]
      .sort((a, b) => b.proofScore - a.proofScore)
      .slice(0, 3)
      .map((a) => a.id),
  );
  const groups = new Map<string, AchievementItem[]>();
  for (const a of shown) {
    const k = a.year ? String(a.year) : "Undated";
    groups.set(k, [...(groups.get(k) ?? []), a]);
  }
  return (
    <div className="grid gap-16">
      {[...groups.entries()].map(([year, list]) => (
        <div key={year} className="grid gap-6 md:grid-cols-12">
          <h3 className="font-display text-6xl font-black tracking-tight text-muted-foreground/40 md:sticky md:top-24 md:col-span-3 md:self-start md:text-8xl">{year}</h3>
          <Reveal as="ul" stagger y={16} className="md:col-span-9">
            {list.map((a) => (
              <li key={a.id} className="grid gap-1 border-b border-border py-5 md:grid-cols-[1fr_auto] md:gap-8">
                <div>
                  <p className={top.has(a.id) ? "font-display text-2xl font-semibold tracking-tight md:text-3xl" : "text-lg"}>{a.title}</p>
                  <p className="meta mt-1">{a.issuer ?? a.platform ?? "Independent"}</p>
                </div>
                <span className="meta md:text-right">{formatDate(a.date)}</span>
              </li>
            ))}
          </Reveal>
        </div>
      ))}
    </div>
  );
}
