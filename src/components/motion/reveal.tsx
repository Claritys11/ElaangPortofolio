"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { gsap, NO_REDUCED } from "@/lib/motion";

type Props = { children: React.ReactNode; className?: string; y?: number; stagger?: boolean; as?: "div" | "section" | "ul" | "ol" };

export function Reveal({ children, className, y = 32, stagger = false, as: Tag = "div" }: Props) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(NO_REDUCED, () => {
        const targets = stagger ? Array.from(ref.current!.children) : ref.current;
        gsap.from(targets, {
          y,
          autoAlpha: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: stagger ? 0.08 : 0,
          scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return (
    <Tag ref={ref as React.Ref<never>} className={className}>
      {children}
    </Tag>
  );
}
