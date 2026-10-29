"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { onIntroDone } from "@/lib/intro";
import { gsap, NO_REDUCED, SplitText } from "@/lib/motion";

type Props = { text: string; as?: "h1" | "h2" | "p" | "span"; className?: string; delay?: number; onScroll?: boolean; waitIntro?: boolean };

export function SplitHeading({ text, as: Tag = "h2", className, delay = 0, onScroll = false, waitIntro = false }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(NO_REDUCED, () => {
        // Split right away so the chars sit hidden under their masks, then play once the preloader lifts.
        let ready = !waitIntro;
        const tweens: gsap.core.Tween[] = [];
        const split = SplitText.create(ref.current!, {
          type: "chars,words",
          mask: "chars",
          autoSplit: true,
          onSplit: (self) => {
            const tw = gsap.from(self.chars, {
              yPercent: 110,
              duration: 1.1,
              ease: "expo.out",
              stagger: 0.022,
              delay,
              paused: !ready,
              scrollTrigger: onScroll ? { trigger: ref.current, start: "top 85%", once: true } : undefined,
            });
            tweens.push(tw);
            return tw;
          },
        });
        const off = waitIntro
          ? onIntroDone(() => {
              ready = true;
              for (const tw of tweens) tw.play();
            })
          : undefined;
        return () => {
          off?.();
          split.revert();
        };
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
