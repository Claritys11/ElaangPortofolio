"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { gsap, NO_REDUCED } from "@/lib/motion";
import type { Skill } from "@/lib/types";

export function SkillBars({ skills }: { skills: Skill[] }) {
  const ref = useRef<HTMLUListElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(NO_REDUCED, () => {
        gsap.from(".skill-fill", { scaleX: 0, duration: 1.2, ease: "expo.out", stagger: 0.06, scrollTrigger: { trigger: ref.current, start: "top 80%", once: true } });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return (
    <ul ref={ref} className="grid gap-5">
      {skills.map((s) => (
        <li key={s.name} className="grid gap-2">
          <div className="flex items-baseline justify-between gap-6">
            <span className="text-lg">{s.name}</span>
            <span className="font-mono text-xs text-muted-foreground tabular-nums">{s.level}</span>
          </div>
          <span className="relative block h-[3px] w-full bg-border">
            <span className="skill-fill absolute inset-y-0 left-0 origin-left bg-foreground" style={{ width: `${s.level}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}
