"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { gsap, NO_REDUCED } from "@/lib/motion";

export function CategoryStats({ stats, cols = 5 }: { stats: { category: string; count: number }[]; cols?: 4 | 5 }) {
  const ref = useRef<HTMLDListElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(NO_REDUCED, () => {
        ref.current!.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
          const end = Number(el.dataset.count);
          const obj = { v: 0 };
          gsap.to(obj, {
            v: end,
            duration: 1.4,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
            onUpdate: () => {
              el.textContent = String(Math.round(obj.v)).padStart(2, "0");
            },
          });
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return (
    <dl ref={ref} className={`grid grid-cols-2 gap-px bg-border ${cols === 4 ? "lg:grid-cols-4" : "sm:grid-cols-3 lg:grid-cols-5"}`}>
      {stats.map((s, i) => (
        <div key={s.category} className="bg-background p-5 md:p-6">
          <dt className="meta">{s.category}</dt>
          <dd data-count={s.count} className={`mt-3 font-display text-6xl font-black tracking-tight tabular-nums md:text-7xl ${i === 0 ? "text-primary" : ""}`}>
            {String(s.count).padStart(2, "0")}
          </dd>
        </div>
      ))}
    </dl>
  );
}
