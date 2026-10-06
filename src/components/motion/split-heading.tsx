"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { gsap, NO_REDUCED, SplitText } from "@/lib/motion";

type Props = { text: string; as?: "h1" | "h2" | "p" | "span"; className?: string; delay?: number; onScroll?: boolean };

export function SplitHeading({ text, as: Tag = "h2", className, delay = 0, onScroll = false }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(NO_REDUCED, () => {
        const split = SplitText.create(ref.current!, {
          type: "chars,words",
          mask: "chars",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.chars, {
              yPercent: 110,
              duration: 1.1,
              ease: "expo.out",
              stagger: 0.022,
              delay,
              scrollTrigger: onScroll ? { trigger: ref.current, start: "top 85%", once: true } : undefined,
            }),
        });
        return () => split.revert();
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return (
    <Tag ref={ref} className={className}>
      {text}
    </Tag>
  );
}
