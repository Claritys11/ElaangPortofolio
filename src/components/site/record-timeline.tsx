"use client";

import { useState } from "react";
import { Reveal } from "@/components/motion/reveal";
import { HoverPreview } from "@/components/site/hover-preview";
import { type Emphasis, emphasisFor } from "@/lib/achievements";
import { formatDate } from "@/lib/format";
import type { AchievementItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = { items: AchievementItem[]; limit?: number; onOpen?: (id: string) => void };

export function RecordTimeline({ items, limit, onOpen }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  // With a limit (home page), keep the most notable entries, then show them newest first.
  const shown = limit
    ? [...items]
        .sort((a, b) => b.weight - a.weight || (b.date ?? "").localeCompare(a.date ?? ""))
        .slice(0, limit)
        .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
    : items;
  const TITLE: Record<Emphasis, string> = {
    xl: "font-display text-3xl font-bold tracking-tight md:text-4xl",
    lg: "font-display text-2xl font-semibold tracking-tight md:text-3xl",
    base: "text-lg",
  };
  // Groups keep first-appearance order, so a custom admin order carries through.
  const groups = new Map<string, AchievementItem[]>();
  for (const a of shown) {
    const k = a.year ? String(a.year) : "Undated";
    groups.set(k, [...(groups.get(k) ?? []), a]);
  }
  return (
    <div className="grid gap-16">
      <HoverPreview src={hover} />
      {[...groups.entries()].map(([year, list]) => (
        <div key={year} className="grid gap-6 md:grid-cols-12">
          <h3 className="font-display text-6xl font-black tracking-tight text-muted-foreground/40 md:sticky md:top-24 md:col-span-3 md:self-start md:text-8xl">{year}</h3>
          <Reveal as="ul" stagger y={16} className="md:col-span-9">
            {list.map((a) => {
              const title = <span className={TITLE[emphasisFor(a.weight)]}>{a.title}</span>;
              return (
                <li
                  key={a.id}
                  className="grid gap-1 border-b border-border py-5 md:grid-cols-[1fr_auto] md:gap-8"
                  onPointerEnter={() => setHover(a.imageUrl)}
                  onPointerLeave={() => setHover(null)}
                >
                  <div>
                    {onOpen && a.imageUrl ? (
                      <button
                        type="button"
                        onClick={() => {
                          setHover(null);
                          onOpen(a.id);
                        }}
                        className={cn("text-left transition-colors hover:text-primary")}
                        aria-label={`View certificate: ${a.title}`}
                      >
                        {title}
                      </button>
                    ) : (
                      title
                    )}
                    <p className="meta mt-1">{a.issuer ?? a.platform ?? "Independent"}</p>
                  </div>
                  <span className="meta md:text-right">{formatDate(a.date)}</span>
                </li>
              );
            })}
          </Reveal>
        </div>
      ))}
    </div>
  );
}
