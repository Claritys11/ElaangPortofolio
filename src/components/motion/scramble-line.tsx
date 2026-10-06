"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { gsap, NO_REDUCED } from "@/lib/motion";

export function ScrambleLine({ text, className, delay = 0.6 }: { text: string; className?: string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(NO_REDUCED, () => {
      gsap.to(ref.current, {
        delay,
        duration: 1.6,
        ease: "none",
        scrambleText: { text, chars: "0123456789abcdef", revealDelay: 0.4, speed: 0.5 },
      });
    });
    return () => mm.revert();
  });
  return (
    <span ref={ref} className={className} aria-label={text}>
      {text}
    </span>
  );
}
