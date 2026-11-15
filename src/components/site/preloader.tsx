"use client";

import { useEffect, useRef, useState } from "react";
import { RollingDigits } from "@/components/motion/rolling-digits";
import { getLenis } from "@/components/motion/smooth-scroll";
import { finishIntro, introPending, introProgress } from "@/lib/intro";
import { gsap } from "@/lib/motion";

const GREETINGS = ["Halo!", "Hello", "こんにちは", "안녕하세요", "Hola", "Bonjour", "Ciao", "Halo!"];
const COLS = 28;
const ROWS = 4;
const MIN_MS = 1800; // long enough for the greetings to read
const MAX_MS = 4000; // a slow eager image never holds the page hostage
const PROGRESS_UPDATE_MS = 100;
const CELLS = Array.from({ length: COLS * ROWS }, (_, index) => ({
  key: index,
  col: index % COLS,
  row: Math.floor(index / COLS),
}));

/** Track only fonts and eager images already present in this document. */
function trackInitialAssets(onProgress: (loaded: number, total: number) => void) {
  const imgs = Array.from(document.images).filter((i) => i.loading !== "lazy");
  const total = imgs.length + 1;
  let loaded = imgs.filter((image) => image.complete).length;
  let stopped = false;
  let fontSettled = false;
  const listeners: Array<{ image: HTMLImageElement; finish: () => void }> = [];

  const report = () => {
    if (!stopped) onProgress(loaded, total);
  };

  for (const i of imgs) {
    if (i.complete) continue;
    let settled = false;
    const finish = () => {
      if (settled || stopped) return;
      settled = true;
      i.removeEventListener("load", finish);
      i.removeEventListener("error", finish);
      loaded++;
      report();
    };
    i.addEventListener("load", finish, { once: true });
    i.addEventListener("error", finish, { once: true });
    listeners.push({ image: i, finish });
  }

  void document.fonts.ready.then(() => {
    if (stopped || fontSettled) return;
    fontSettled = true;
    loaded++;
    report();
  });
  report();

  return () => {
    stopped = true;
    for (const { image, finish } of listeners) {
      image.removeEventListener("load", finish);
      image.removeEventListener("error", finish);
    }
  };
}

export function Preloader({ brand }: { brand: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [assets, setAssets] = useState({ loaded: 0, total: 0 });
  const [word, setWord] = useState(0);

  useEffect(() => {
    // No intro this visit: the CSS keeps the overlay hidden, so there is nothing to run.
    if (!introPending()) return;
    let loaded = 0;
    let total = 1;
    const stopTracking = trackInitialAssets((nextLoaded, nextTotal) => {
      loaded = nextLoaded;
      total = nextTotal;
      setAssets({ loaded: nextLoaded, total: nextTotal });
    });
    // Lenis starts in a sibling effect; stop it on the next frame so the page can't scroll underneath.
    const lock = requestAnimationFrame(() => getLenis()?.stop());

    const start = performance.now();
    let raf = 0;
    let leaving = false;
    let lastPercent = -1;
    let lastProgressAt = start - PROGRESS_UPDATE_MS;
    let leaveTimer: number | undefined;
    let leaveTimeline: gsap.core.Timeline | undefined;
    const greet = window.setInterval(() => setWord((w) => Math.min(w + 1, GREETINGS.length - 1)), MIN_MS / GREETINGS.length);

    const leave = () => {
      leaving = true;
      window.clearInterval(greet);
      leaveTimeline = gsap.timeline({ onComplete: () => setGone(true) });
      leaveTimeline.to(".pl-fade", { autoAlpha: 0, y: -12, duration: 0.35, ease: "power2.in", stagger: 0.035 })
        .to(ref.current, { yPercent: -100, duration: 0.78, ease: "expo.inOut", force3D: true }, "-=0.02")
        // Keep only a short overlap with the hero; avoid two full-screen/large-text animations running together.
        .add(() => {
          getLenis()?.start();
          finishIntro();
        }, "-=0.12");
    };

    const tick = (now: number) => {
      const t = now - start;
      const p = introProgress(t, loaded, total, MIN_MS, MAX_MS);
      const percent = Math.round(p * 100);
      // Update React only when the visible integer percentage changes, not on every animation frame.
      if (percent !== lastPercent && (now - lastProgressAt >= PROGRESS_UPDATE_MS || percent === 100)) {
        lastPercent = percent;
        lastProgressAt = now;
        setProgress(percent / 100);
      }
      // p only reaches 1 once every asset is in, or when MAX_MS forces it.
      if (p >= 1) {
        if (!leaving) {
          leaving = true;
          leaveTimer = window.setTimeout(leave, 250);
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(lock);
      window.clearInterval(greet);
      if (leaveTimer !== undefined) window.clearTimeout(leaveTimer);
      leaveTimeline?.kill();
      stopTracking();
    };
  }, []);

  if (gone) return null;
  const lit = Math.round(progress * COLS);
  const pct = String(Math.round(progress * 100)).padStart(3, "0");

  return (
    <div
      ref={ref}
      role="status"
      aria-label="Loading"
      // Hidden unless the head script flagged this visit, so returning visitors never see a flash.
      className="fixed inset-0 z-[100] hidden flex-col items-center justify-center bg-background px-4 text-foreground [html[data-intro]_&]:flex"
    >
      <p key={word} className="pl-fade pl-word font-display text-6xl font-bold tracking-tight md:text-8xl">
        {GREETINGS[word]}
      </p>
      <div className="pl-fade mt-8 grid gap-[5px]" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }} aria-hidden>
        {CELLS.map(({ key, col, row }) => {
          // Odd rows trail by a column, so the fill reads as a wave rather than a bar.
          const on = col < lit - (row % 2) || lit >= COLS;
          return (
            <span
              key={key}
              className="size-[6px] rounded-[1px] transition-colors duration-200 md:size-2"
              style={{ background: on ? "var(--primary)" : "color-mix(in oklch, var(--foreground) 10%, transparent)" }}
            />
          );
        })}
      </div>
      <p className="pl-fade meta mt-4">
        <span className="text-foreground">{assets.loaded}</span> / {assets.total} fonts + eager images settled
      </p>
      <p className="pl-fade meta absolute bottom-6 left-4 md:left-8">{brand} / portfolio</p>
      <RollingDigits value={pct} duration={100} className="pl-fade absolute right-4 bottom-4 font-display text-6xl font-bold tracking-tight md:right-8 md:text-8xl" />
    </div>
  );
}
