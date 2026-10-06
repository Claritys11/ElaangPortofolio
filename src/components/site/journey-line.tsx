"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { gsap, NO_REDUCED } from "@/lib/motion";
import type { JourneyItem } from "@/lib/types";

/** Vertical timeline whose line draws with scroll; each milestone lights up as the line reaches it. */
export function JourneyLine({ items }: { items: JourneyItem[] }) {
  const ref = useRef<HTMLOListElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(NO_REDUCED, () => {
        gsap.fromTo(".journey-progress", { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: ref.current, start: "top 70%", end: "bottom 60%", scrub: true } });
        gsap.utils.toArray<HTMLElement>(".journey-item").forEach((el) => {
          gsap.from(el, { autoAlpha: 0.15, x: 24, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 65%", once: true } });
          gsap.fromTo(el.querySelector(".journey-dot"), { backgroundColor: "var(--background)" }, { backgroundColor: "var(--primary)", scrollTrigger: { trigger: el, start: "top 65%", toggleActions: "play none none reverse" } });
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return (
    <ol ref={ref} className="relative grid gap-16 pl-10">
      <span aria-hidden className="absolute top-2 bottom-2 left-[7px] w-px bg-border" />
      <span aria-hidden className="journey-progress absolute top-2 bottom-2 left-[7px] w-px origin-top bg-primary" />
      {items.map((j) => (
        <li key={`${j.role}-${j.period}`} className="journey-item relative grid gap-2 md:grid-cols-[10rem_1fr] md:gap-8">
          <span aria-hidden className="journey-dot absolute top-1.5 -left-10 h-[15px] w-[15px] rounded-full border border-primary bg-primary" />
          <span className="meta pt-1">{j.period}</span>
          <div>
            <h3 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{j.role}</h3>
            <p className="meta mt-2">{j.company}</p>
            <p className="mt-4 max-w-2xl text-muted-foreground">{j.desc}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
