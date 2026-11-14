"use client";

import { useEffect, useRef, useState } from "react";
import { HoverPreview } from "@/components/site/hover-preview";
import { type Emphasis, emphasisFor } from "@/lib/achievements";
import { formatDate } from "@/lib/format";
import type { AchievementItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = { items: AchievementItem[]; onOpen?: (id: string) => void };

export function RecordTimeline({ items, onOpen }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const groups = [...root.querySelectorAll<HTMLElement>(".tl-group")];
    const entries = [...root.querySelectorAll<HTMLElement>(".tl-item")];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      groups.forEach((group) => group.classList.add("is-on"));
      entries.forEach((entry) => entry.classList.add("is-on"));
      return;
    }

    const observer = new IntersectionObserver((changes) => {
      for (const change of changes) change.target.classList.toggle("is-on", change.isIntersecting);
    }, { rootMargin: "-12% 0px -12% 0px", threshold: 0.05 });
    groups.forEach((group) => observer.observe(group));
    entries.forEach((entry) => observer.observe(entry));
    return () => observer.disconnect();
  }, [items]);
  const TITLE: Record<Emphasis, string> = {
    xl: "font-display text-3xl font-bold tracking-tight md:text-4xl",
    lg: "font-display text-2xl font-semibold tracking-tight md:text-3xl",
    base: "text-lg",
  };
  // Groups keep first-appearance order, so a custom admin order carries through.
  const groups = new Map<string, AchievementItem[]>();
  for (const a of items) {
    const k = a.year ? String(a.year) : "Undated";
    groups.set(k, [...(groups.get(k) ?? []), a]);
  }
  return (
    <div ref={ref} className="grid gap-16">
      <HoverPreview src={hover} />
      {[...groups.entries()].map(([year, list]) => (
        <div key={year} className="tl-group grid gap-6 md:grid-cols-12">
          <h3 className="font-display text-6xl font-black tracking-tight text-muted-foreground/40 md:sticky md:top-24 md:col-span-3 md:self-start md:text-8xl">{year}</h3>
          <div className="relative pl-6 md:col-span-9 md:pl-10">
            <span aria-hidden className="absolute inset-y-0 left-0 w-px bg-border">
              <span className="tl-fill absolute inset-0 origin-top bg-primary" />
            </span>
            <ul>
              {list.map((a) => {
                const title = <span className={TITLE[emphasisFor(a.weight)]}>{a.title}</span>;
                return (
                  <li
                    key={a.id}
                    className="tl-item group/tl relative grid gap-1 border-b border-border py-5 md:grid-cols-[1fr_auto] md:gap-8"
                    onPointerEnter={() => setHover(a.imageUrl)}
                    onPointerLeave={() => setHover(null)}
                  >
                    <span
                      aria-hidden
                      className="absolute top-7 -left-6 size-2 -translate-x-1/2 rounded-full border border-border bg-background transition-colors duration-500 group-[.is-on]/tl:border-primary group-[.is-on]/tl:bg-primary md:-left-10"
                    />
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
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
