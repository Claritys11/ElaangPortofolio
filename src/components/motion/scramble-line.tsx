"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { onIntroDone } from "@/lib/intro";
import { gsap, NO_REDUCED } from "@/lib/motion";

export function ScrambleLine({ text, className, delay = 0.6 }: { text: string; className?: string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(NO_REDUCED, () => {
      const tw = gsap.to(ref.current, {
        delay,
        duration: 1.6,
        ease: "none",
        paused: true,
        scrambleText: { text, chars: "0123456789abcdef", revealDelay: 0.4, speed: 0.5 },
      });
      return onIntroDone(() => tw.play());
    });
    return () => mm.revert();
  });
  return (
    <span ref={ref} className={className} aria-label={text}>
      {text}
    </span>
  );
}
