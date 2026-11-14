"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { SectionLabel } from "@/components/site/section-label";
import { buildCalendar, type Calendar } from "@/lib/activity";
import { easeBackOut, easeOutExpo, heatmapStaggerDelay } from "@/lib/activity-motion";
import type { DayCounts } from "@/lib/data/activity";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type Source = { key: "ctf" | "github"; label: string; noun: string; days: DayCounts; href: string; handle: string; external?: boolean };

const LEVEL = [
  "color-mix(in oklch, var(--foreground) 7%, transparent)",
  "color-mix(in oklch, var(--primary) 30%, transparent)",
  "color-mix(in oklch, var(--primary) 55%, transparent)",
  "color-mix(in oklch, var(--primary) 80%, transparent)",
  "var(--primary)",
];
const GRID_GAP = 3;

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

  useEffect(() => {
    const card = ref.current?.querySelector(".hm-card");
    if (!card) return;
    const total = cal.total;
    const counter = card.querySelector<HTMLElement>(".hm-total");
    const grid = card.querySelector<HTMLElement>(".hm-cells");
    const canvas = card.querySelector<HTMLCanvasElement>(".hm-canvas");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;

    const reveal = () => {
      card.classList.add("is-visible");
      if (reducedMotion) {
        card.classList.add("is-complete");
        if (canvas) canvas.dataset.motionState = "reduced";
        if (counter) counter.textContent = String(total);
        return;
      }

      const cells = grid ? Array.from(grid.querySelectorAll<HTMLElement>(".hm-cell")) : [];
      const context = canvas?.getContext("2d");
      if (!grid || !canvas || !context || cells.length === 0) {
        card.classList.add("is-complete");
        if (canvas) canvas.dataset.motionState = "static";
        if (counter) counter.textContent = String(total);
        return;
      }

      const gridRect = grid.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(gridRect.width * ratio);
      canvas.height = Math.round(gridRect.height * ratio);
      canvas.style.width = `${gridRect.width}px`;
      canvas.style.height = `${gridRect.height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      // Resolve one representative DOM color per level instead of forcing 369 style reads.
      const palette = new Map<number, string>();
      for (const cell of cells) {
        const level = Number(cell.dataset.level);
        if (!palette.has(level)) palette.set(level, getComputedStyle(cell).backgroundColor);
      }

      // Grid geometry is regular, so one grid measurement replaces 369 cell measurements.
      const cellWidth = (gridRect.width - GRID_GAP * 52) / 53;
      const cellHeight = (gridRect.height - GRID_GAP * 6) / 7;
      const frames = cells.map((cell, index) => {
        const column = Number(cell.dataset.week);
        const row = Number(cell.dataset.day);
        return {
          x: column * (cellWidth + GRID_GAP),
          y: row * (cellHeight + GRID_GAP),
          width: cellWidth,
          height: cellHeight,
          color: palette.get(Number(cell.dataset.level)) ?? palette.get(0) ?? "transparent",
          delay: heatmapStaggerDelay(index, cells.length),
        };
      });
      const last = frames[frames.length - 1];
      const ringColor = getComputedStyle(card).color;
      const startedAt = performance.now();
      const countDuration = 1600;
      const cellDuration = 400;
      const animationDuration = Math.max(countDuration, last.delay + cellDuration);
      // Keep only the currently moving cells in the frame loop; settled boxes remain painted.
      const active = new Uint16Array(frames.length);
      let activeCount = 0;
      let nextCell = 0;
      let previousCount = -1;
      canvas.dataset.motionState = "animating";
      card.classList.add("is-animating");

      const tick = (now: number) => {
        const elapsed = now - startedAt;

        while (nextCell < frames.length && elapsed >= frames[nextCell].delay) {
          active[activeCount] = nextCell;
          activeCount += 1;
          nextCell += 1;
        }

        let remaining = 0;
        for (let activeIndex = 0; activeIndex < activeCount; activeIndex += 1) {
          const index = active[activeIndex];
          const cell = frames[index];
          const rawProgress = (elapsed - cell.delay) / cellDuration;
          const progress = Math.min(1, rawProgress);
          const scale = Math.max(0, easeBackOut(progress, 2));
          context.globalAlpha = Math.min(1, scale);
          context.fillStyle = cell.color;
          const width = cell.width * scale;
          const height = cell.height * scale;
          const x = cell.x + (cell.width - width) / 2;
          const y = cell.y + (cell.height - height) / 2;
          // Covers the Back.out(2) overshoot without clearing the adjacent 3px-gapped cells.
          const clearPadding = Math.max(cell.width, cell.height) * 0.07;
          context.clearRect(cell.x - clearPadding, cell.y - clearPadding, cell.width + clearPadding * 2, cell.height + clearPadding * 2);
          if (typeof context.roundRect === "function") {
            context.beginPath();
            context.roundRect(x, y, width, height, Math.min(2 * scale, width / 2, height / 2));
            context.fill();
          } else {
            context.fillRect(x, y, width, height);
          }
          if (rawProgress < 1) {
            active[remaining] = index;
            remaining += 1;
          }
        }
        activeCount = remaining;

        if (elapsed >= last.delay) {
          context.globalAlpha = 0.6;
          context.strokeStyle = ringColor;
          context.lineWidth = 1;
          if (typeof context.roundRect === "function") {
            context.beginPath();
            context.roundRect(last.x + 0.5, last.y + 0.5, last.width - 1, last.height - 1, 2);
            context.stroke();
          } else {
            context.strokeRect(last.x + 0.5, last.y + 0.5, last.width - 1, last.height - 1);
          }
        }
        context.globalAlpha = 1;

        const countProgress = Math.min(1, elapsed / countDuration);
        const value = countProgress === 1 ? total : Math.round(total * easeOutExpo(countProgress));
        if (counter && value !== previousCount) {
          counter.textContent = String(value);
          previousCount = value;
        }

        if (elapsed < animationDuration) {
          frame = requestAnimationFrame(tick);
        } else {
          card.classList.remove("is-animating");
          card.classList.add("is-complete");
          canvas.dataset.motionState = "complete";
          if (counter) counter.textContent = String(total);
        }
      };
      frame = requestAnimationFrame(tick);
    };

    if (reducedMotion || !("IntersectionObserver" in window)) {
      reveal();
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        reveal();
        observer.disconnect();
      }
    }, { threshold: 0.12 });
    observer.observe(card);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [cal.total, key]);

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

      <div key={key} className="hm-card relative overflow-hidden rounded-2xl border border-border bg-card p-6 md:p-10" role="tabpanel">
        {/* Soft glow behind the recent weeks, where the activity lands. */}
        <div aria-hidden className="hm-glow pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full" />
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

        <div ref={scroller} className="hm-grid-visual relative mt-10 overflow-x-auto pb-2" aria-hidden>
          <div className="min-w-[680px]">
            <div className="mb-2 grid grid-cols-[repeat(53,minmax(0,1fr))] gap-[3px]">
              {cal.months.map((m) => (
                <span key={`${m.label}-${m.week}`} className="font-mono text-[10px] text-muted-foreground" style={{ gridColumn: m.week + 1 }}>
                  {m.label}
                </span>
              ))}
            </div>
            <div className="hm-cells relative grid grid-flow-col grid-cols-[repeat(53,minmax(0,1fr))] grid-rows-7 gap-[3px]">
              {cal.weeks.flatMap((week, w) =>
                week.map((d, i) => {
                  return (
                    <span
                      key={d.date}
                      title={`${d.count} on ${formatDate(d.date)}`}
                      className={cn("hm-cell aspect-square rounded-[2px]", w === cal.weeks.length - 1 && i === week.length - 1 && "ring-1 ring-foreground/60")}
                      data-week={w}
                      data-day={i}
                      data-level={d.level}
                      style={{ background: LEVEL[d.level], gridColumn: w + 1, gridRow: i + 1 }}
                    />
                  );
                }),
              )}
              <canvas
                aria-hidden="true"
                className="hm-canvas pointer-events-none absolute inset-0 h-full w-full"
                data-cell-count={cal.weeks.flat().length}
                data-stagger-ms="1100"
                data-duration-ms="400"
                data-motion-state="idle"
              />
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
