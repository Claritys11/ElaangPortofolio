"use client";

import { useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";

export function FlagReveal({ flag }: { flag: string }) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  const textRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);
  const copyRef = useRef<HTMLButtonElement>(null);
  const mask = "█".repeat(Math.min(28, Math.max(12, flag.length)));

  function reveal() {
    setShown(true);
    // Wait one frame for the revealed markup to mount, then decrypt it.
    requestAnimationFrame(() => {
      if (!textRef.current) return;
      if (prefersReducedMotion()) return;
      textRef.current.textContent = mask;
      gsap
        .timeline()
        .to(textRef.current, { duration: 1.1, ease: "none", scrambleText: { text: flag, chars: "█▓▒░0123456789abcdef{}_", revealDelay: 0.15, speed: 0.6 } })
        .fromTo(lineRef.current, { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "expo.out" }, "-=0.2")
        .fromTo(copyRef.current, { autoAlpha: 0, x: -6 }, { autoAlpha: 1, x: 0, duration: 0.3 }, "-=0.3");
    });
  }

  return (
    <div id="flag" className="my-16 scroll-mt-24 border-y border-border py-8">
      <p className="meta mb-3">flag</p>
      {shown ? (
        <div className="flex flex-wrap items-center gap-4">
          <span className="relative inline-block">
            <code ref={textRef} className="font-mono text-lg break-all text-primary">
              {flag}
            </code>
            <span ref={lineRef} aria-hidden className="absolute -bottom-1 left-0 h-px w-full origin-left bg-primary" />
          </span>
          <button
            ref={copyRef}
            type="button"
            className="meta hover:text-foreground"
            onClick={() => navigator.clipboard.writeText(flag).then(() => setCopied(true))}
          >
            {copied ? "copied ✓" : "copy"}
          </button>
        </div>
      ) : (
        <button type="button" onClick={reveal} className="group flex items-center gap-4" aria-label="Reveal flag">
          <span className="font-mono text-lg tracking-tight text-foreground/80 transition-colors select-none group-hover:text-primary/70" aria-hidden>
            {mask}
          </span>
          <span className="meta group-hover:text-primary">click to reveal</span>
        </button>
      )}
    </div>
  );
}
