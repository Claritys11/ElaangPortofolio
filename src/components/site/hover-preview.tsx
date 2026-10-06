"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";

export function HoverPreview({ src }: { src: string | null }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const el = ref.current!;
    const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" });
    const move = (e: PointerEvent) => {
      xTo(e.clientX + 24);
      yTo(e.clientY - 120);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);
  useEffect(() => {
    gsap.to(ref.current, { autoAlpha: src ? 1 : 0, scale: src ? 1 : 0.9, duration: prefersReducedMotion() ? 0 : 0.3 });
  }, [src]);
  return (
    <div
      ref={ref}
      className="pointer-events-none fixed top-0 left-0 z-40 hidden h-48 w-72 overflow-hidden rounded-sm opacity-0 shadow-2xl [@media(pointer:fine)]:block"
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img src={src} alt="" className="h-full w-full object-cover" />}
    </div>
  );
}
