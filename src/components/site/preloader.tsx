"use client";

import { useEffect, useRef, useState } from "react";
import { RollingDigits } from "@/components/motion/rolling-digits";
import { getLenis } from "@/components/motion/smooth-scroll";
import { finishIntro, introPending } from "@/lib/intro";
import { gsap } from "@/lib/motion";

const GREETINGS = ["Halo!", "Hello", "こんにちは", "안녕하세요", "Hola", "Bonjour", "Ciao", "Halo!"];
const COLS = 28;
const ROWS = 4;
const MIN_MS = 1800; // long enough for the greetings to read
const MAX_MS = 4000; // a slow image never holds the page hostage

/** First-screen assets: fonts plus any image that isn't lazy. */
function trackAssets(onLoad: () => void) {
  const imgs = Array.from(document.images).filter((i) => i.loading !== "lazy");
  for (const i of imgs) {
    if (i.complete) onLoad();
    else {
      i.addEventListener("load", onLoad, { once: true });
      i.addEventListener("error", onLoad, { once: true });
    }
  }
  void document.fonts.ready.then(onLoad);
  return imgs.length + 1;
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
    let total = 0;
    total = trackAssets(() => {
      loaded = Math.min(loaded + 1, total);
    });
    // Lenis starts in a sibling effect; stop it on the next frame so the page can't scroll underneath.
    const lock = requestAnimationFrame(() => getLenis()?.stop());

    const start = performance.now();
    let raf = 0;
    let leaving = false;
    const greet = window.setInterval(() => setWord((w) => Math.min(w + 1, GREETINGS.length - 1)), MIN_MS / GREETINGS.length);

    const leave = () => {
      leaving = true;
      window.clearInterval(greet);
      const tl = gsap.timeline({ onComplete: () => setGone(true) });
      tl.to(".pl-fade", { autoAlpha: 0, y: -12, duration: 0.4, ease: "power2.in", stagger: 0.04 })
        .to(ref.current, { clipPath: "inset(0 0 100% 0)", duration: 0.9, ease: "expo.inOut" }, "-=0.05")
        // Release the page while the curtain is still lifting, so the hero animates in underneath it.
        .add(() => {
          getLenis()?.start();
          finishIntro();
        }, "-=0.55");
    };

    const tick = (now: number) => {
      const t = now - start;
      const time = Math.min(1, t / MIN_MS);
      const real = total ? loaded / total : 1;
      const p = t >= MAX_MS ? 1 : Math.min(time, Math.max(real, time * 0.9));
      setProgress(p);
      setAssets({ loaded, total });
      // p only reaches 1 once every asset is in, or when MAX_MS forces it.
      if (p >= 1) {
        if (!leaving) window.setTimeout(leave, 250);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(lock);
      window.clearInterval(greet);
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
      className="fixed inset-0 z-[100] hidden flex-col items-center justify-center bg-background px-4 text-foreground [clip-path:inset(0_0_0_0)] [html[data-intro]_&]:flex"
    >
      <p key={word} className="pl-fade pl-word font-display text-6xl font-bold tracking-tight md:text-8xl">
        {GREETINGS[word]}
      </p>
      <div className="pl-fade mt-8 grid gap-[5px]" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }} aria-hidden>
        {Array.from({ length: COLS * ROWS }, (_, i) => {
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          // Odd rows trail by a column, so the fill reads as a wave rather than a bar.
          const on = col < lit - (row % 2) || lit >= COLS;
          return (
            <span
              key={i}
              className="size-[6px] rounded-[1px] transition-colors duration-200 md:size-2"
              style={{ background: on ? "var(--primary)" : "color-mix(in oklch, var(--foreground) 10%, transparent)" }}
            />
          );
        })}
      </div>
      <p className="pl-fade meta mt-4">
        <span className="text-foreground">{assets.loaded}</span> / {assets.total} assets loaded
      </p>
      <p className="pl-fade meta absolute bottom-6 left-4 md:left-8">{brand} / portfolio</p>
      <RollingDigits value={pct} duration={250} className="pl-fade absolute right-4 bottom-4 font-display text-6xl font-bold tracking-tight md:right-8 md:text-8xl" />
    </div>
  );
}
