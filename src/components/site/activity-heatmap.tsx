"use client";

import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { SectionLabel } from "@/components/site/section-label";
import { buildCalendar, type Calendar } from "@/lib/activity";
import type { DayCounts } from "@/lib/data/activity";
import { formatDate } from "@/lib/format";
import { gsap, NO_REDUCED } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Source = { key: "ctf" | "github"; label: string; noun: string; days: DayCounts; href: string; handle: string; external?: boolean };

const LEVEL = [
  "color-mix(in oklch, var(--foreground) 7%, transparent)",
  "color-mix(in oklch, var(--primary) 30%, transparent)",
  "color-mix(in oklch, var(--primary) 55%, transparent)",
  "color-mix(in oklch, var(--primary) 80%, transparent)",
  "var(--primary)",
];

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div>
      <p className="meta">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">{sub}</p>}
    </div>
  );
}

export function ActivityHeatmap({ sources, today }: { sources: Source[]; today: string }) {
  const ref = useRef<HTMLElement>(null);
  const [key, setKey] = useState(sources[0].key);
  const src = sources.find((s) => s.key === key) ?? sources[0];
  // Built here from the sparse day list, so only the active days travel in the page payload.
  const cal: Calendar = useMemo(() => buildCalendar(new Map(src.days), new Date(today)), [src, today]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(NO_REDUCED, () => {
        const trigger = { trigger: ".hm-card", start: "top 75%", once: true };
        // Weeks light up left to right, then the count runs up to the total.
        gsap.from(".hm-cell", { scale: 0, autoAlpha: 0, duration: 0.4, ease: "back.out(2)", stagger: { amount: 1.1, from: "start" }, scrollTrigger: trigger });
        const n = { v: 0 };
        const total = document.querySelector<HTMLElement>(".hm-total");
        gsap.to(n, {
          v: cal.total,
          duration: 1.6,
          ease: "expo.out",
          scrollTrigger: trigger,
          onUpdate: () => {
            if (total) total.textContent = String(Math.round(n.v));
          },
        });
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [key], revertOnUpdate: true },
  );

  const scroller = (el: HTMLDivElement | null) => {
    // On narrow screens the grid scrolls sideways; open on the recent weeks.
    if (el) el.scrollLeft = el.scrollWidth;
  };

  return (
    <section ref={ref} className="mx-auto max-w-[1600px] px-4 py-24 md:px-8 md:py-32">
      <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
        <div>
          <SectionLabel index={5} name="activity" />
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-6xl">One solve at a time.</h2>
        </div>
        {sources.length > 1 && (
          <div role="tablist" aria-label="Activity source" className="inline-flex rounded-full border border-border p-1">
            {sources.map((s) => (
              <button
                key={s.key}
                type="button"
                role="tab"
                aria-selected={s.key === key}
                onClick={() => setKey(s.key)}
                className={cn("rounded-full px-4 py-1.5 font-mono text-[11px] tracking-[0.14em] uppercase transition-colors", s.key === key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="hm-card relative overflow-hidden rounded-2xl border border-border bg-card p-6 md:p-10" role="tabpanel">
        {/* Soft glow behind the recent weeks, where the activity lands. */}
        <div aria-hidden className="pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-8">
          <div>
            <p className="font-display text-7xl leading-none font-black tracking-tight tabular-nums md:text-8xl">
              <span className="hm-total">{cal.total}</span>
            </p>
            <p className="meta mt-2">{src.noun} in the last year</p>
          </div>
          <div className="flex gap-8 md:gap-12">
            <Stat label="best day" value={cal.best?.count ?? 0} sub={cal.best ? formatDate(cal.best.date) : undefined} />
            <Stat label="longest streak" value={cal.longestStreak} sub="days" />
            <Stat label="active days" value={cal.activeDays} sub={`of ${cal.weeks.flat().length}`} />
          </div>
        </div>

        <div ref={scroller} className="relative mt-10 overflow-x-auto pb-2" aria-hidden>
          <div className="min-w-[680px]">
            <div className="mb-2 grid grid-cols-[repeat(53,minmax(0,1fr))] gap-[3px]">
              {cal.months.map((m) => (
                <span key={`${m.label}-${m.week}`} className="font-mono text-[10px] text-muted-foreground" style={{ gridColumn: m.week + 1 }}>
                  {m.label}
                </span>
              ))}
            </div>
            <div className="grid grid-flow-col grid-cols-[repeat(53,minmax(0,1fr))] grid-rows-7 gap-[3px]">
              {cal.weeks.map((week, w) =>
                week.map((d, i) => (
                  <span
                    key={d.date}
                    title={`${d.count} on ${formatDate(d.date)}`}
                    className={cn("hm-cell aspect-square rounded-[2px]", w === cal.weeks.length - 1 && i === week.length - 1 && "ring-1 ring-foreground/60")}
                    style={{ background: LEVEL[d.level], gridColumn: w + 1, gridRow: i + 1 }}
                  />
                )),
              )}
            </div>
          </div>
        </div>
        <p className="sr-only">
          {cal.total} {src.noun} over the last year, across {cal.activeDays} active days, longest streak {cal.longestStreak} days.
        </p>

        <div className="relative mt-6 flex items-center justify-between">
          <div className="meta flex items-center gap-1.5" aria-hidden>
            less
            {LEVEL.map((c) => (
              <span key={c} className="size-2.5 rounded-[2px]" style={{ background: c }} />
            ))}
            more
          </div>
          <Link
            href={src.href}
            target={src.external ? "_blank" : undefined}
            rel={src.external ? "noreferrer" : undefined}
            className="meta inline-flex items-center gap-1 border-b border-border pb-0.5 hover:text-foreground"
          >
            {src.handle} <ArrowUpRight className="size-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}
