"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* Line drawings on a 64×40 grid. Strokes take the text colour; .fx-a pieces fill with the accent.
   The fx-* classes loop only while their cell is active (globals.css, "Focus areas"). */

/** Stack smash: the payload fills the frame bottom-up, overwrites ret, and lands in a shell. */
function PwnArt() {
  const slots = [32, 25, 18, 11, 4];
  return (
    <>
      {slots.map((y) => (
        <rect key={y} x="5" y={y} width="20" height="5.5" rx="1" />
      ))}
      {slots.map((y, i) => (
        <rect key={`p${y}`} className="fx-a fx-fill" x="7" y={y + 1.5} width="16" height="2.5" rx=".6" style={{ "--d": `${i * 0.14}s` } as React.CSSProperties} />
      ))}
      <path className="fx-draw" d="M27 6.5c6 0 9 2 10 6" pathLength={1} style={{ "--d": "0.75s" } as React.CSSProperties} />
      <g className="fx-pop" style={{ "--d": "0.9s" } as React.CSSProperties}>
        <rect x="35" y="13" width="25" height="18" rx="2" />
        <path d="M39.5 19.5l3 2.5-3 2.5" />
        <rect className="fx-a fx-blink" x="45" y="24" width="5" height="1.8" rx=".5" />
      </g>
    </>
  );
}

/** Rack: three units, status LEDs blinking in turn, a load bar filling. */
function RackArt() {
  const units = [4, 15.5, 27];
  return (
    <>
      {units.map((y, i) => (
        <g key={y}>
          <rect x="12" y={y} width="40" height="9" rx="1.5" />
          <circle className="fx-a fx-blink" cx="17.5" cy={y + 4.5} r="1.4" style={{ "--d": `${i * 0.3}s` } as React.CSSProperties} />
          <path d={`M30 ${y + 4.5}h17`} opacity=".35" />
        </g>
      ))}
      <path className="fx-load fx-stroke-a" d="M30 20h17" style={{ "--d": "0.2s" } as React.CSSProperties} />
      <path d="M17 36v2.5M47 36v2.5" />
    </>
  );
}

/** Browser: </> draws itself while the layout blocks load in. */
function WebArt() {
  return (
    <>
      <rect x="4" y="3" width="56" height="34" rx="4" />
      <path d="M4 10h56" />
      <path className="fx-draw fx-stroke-a" d="M14 18l-4.5 5 4.5 5M22 18l4.5 5-4.5 5M19.5 16.5l-3 13" pathLength={1} />
      <rect className="fx-a fx-load" x="32" y="15" width="22" height="5" rx="1.5" style={{ "--d": "0.15s" } as React.CSSProperties} />
      <path className="fx-load" d="M32 25.5h20" style={{ "--d": "0.3s" } as React.CSSProperties} />
      <path className="fx-load" d="M32 30.5h13" style={{ "--d": "0.45s" } as React.CSSProperties} />
    </>
  );
}

const ART = { pwn: PwnArt, sysadmin: RackArt, web: WebArt };

/** One focus drawing on its own, looping while it is on screen (static under reduced motion). */
export function FocusIcon({ kind, className }: { kind: keyof typeof ART; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.6 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  const Art = ART[kind];
  return (
    <span ref={ref} data-on={inView || undefined} className={cn("inline-block", className)}>
      <svg viewBox="0 0 64 40" aria-hidden className="focus-art size-full">
        <Art />
      </svg>
    </span>
  );
}

const AREAS = [
  { title: "Cybersecurity", sub: "pwn · web exploitation", Art: PwnArt, main: true },
  { title: "System Administration", sub: "linux · infrastructure", Art: RackArt, main: false },
  { title: "Web Development", sub: "frontend · backend", Art: WebArt, main: false },
];
const CYCLE_MS = 3200;

/**
 * Three focus areas in a strip. The active cell lifts onto a card and plays its drawing; it cycles on its own
 * while in view and follows the pointer. Cybersecurity is the main focus: it opens active and takes the wide cell.
 */
export function FocusAreas({ className }: { className?: string }) {
  const [on, setOn] = useState(0);
  const [held, setHeld] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.5 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || held || prefersReducedMotion()) return;
    const id = window.setInterval(() => setOn((i) => (i + 1) % AREAS.length), CYCLE_MS);
    return () => window.clearInterval(id);
  }, [visible, held]);

  return (
    <ul ref={ref} aria-label="Focus areas" className={cn("grid grid-cols-2 border-y border-border md:grid-cols-4", className)} onMouseLeave={() => setHeld(false)}>
      {AREAS.map(({ title, sub, Art, main }, i) => {
        const active = on === i;
        return (
          <li
            key={title}
            data-on={active || undefined}
            onMouseEnter={() => {
              setOn(i);
              setHeld(true);
            }}
            className={cn(
              "relative flex flex-col items-center justify-center overflow-hidden border-border px-4 pt-12 pb-8 text-center transition-colors duration-500 md:min-h-56",
              main ? "col-span-2 min-h-56 border-b md:border-b-0" : "min-h-60 border-l [&:nth-child(2)]:border-l-0 md:[&:nth-child(2)]:border-l",
              active && "bg-card",
            )}
          >
            <span className="meta absolute top-4 left-4 text-left">
              {String(i + 1).padStart(2, "0")}
              {main && <span className="ml-2 text-primary">main focus</span>}
            </span>
            {/* In flow, so opening the drawing pushes the title down instead of overlapping it, however the title wraps. */}
            <svg
              viewBox="0 0 64 40"
              aria-hidden
              className={cn(
                "focus-art pointer-events-none shrink-0 transition-[height,margin,opacity,scale] duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)]",
                main ? "w-[6rem]" : "w-[4.8rem]",
                active ? (main ? "mb-3 h-[3.75rem] scale-100 opacity-100" : "mb-3 h-12 scale-100 opacity-100") : "mb-0 h-0 scale-75 opacity-0",
              )}
            >
              <Art />
            </svg>
            <p className={cn("font-display font-semibold tracking-tight", main ? "text-3xl md:text-4xl" : "text-xl md:text-2xl")}>{title}</p>
            <p className="meta mt-1">{sub}</p>
          </li>
        );
      })}
    </ul>
  );
}
