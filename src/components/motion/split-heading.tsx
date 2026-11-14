"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { onIntroDone } from "@/lib/intro";
import { gsap, NO_REDUCED, SplitText } from "@/lib/motion";

type Props = { text: string; as?: "h1" | "h2" | "p" | "span"; className?: string; delay?: number; onScroll?: boolean; waitIntro?: boolean; deferUntilIdle?: boolean; keepWordsTogether?: boolean };

export function SplitHeading({ text, as: Tag = "h2", className, delay = 0, onScroll = false, waitIntro = false, deferUntilIdle = false, keepWordsTogether = false }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(NO_REDUCED, (_, mediaContextSafe) => {
        let disposed = false;
        let split: SplitText | undefined;
        let cancelIdle: (() => void) | undefined;
        const createSplitNow = () => {
          if (disposed || !ref.current) return;
          split = SplitText.create(ref.current, {
            // Only chars are animated; wrapping every word as well creates unused DOM nodes.
            type: "chars",
            charsClass: "split-heading-char",
            // Hero names can still wrap at spaces, but never between characters of one word.
            smartWrap: keepWordsTogether,
            mask: "chars",
            onSplit: (self) => {
              // SplitText applies overflow: clip on both axes; keep the vertical reveal mask
              // while allowing glyph side bearings to extend past each character's advance box.
              self.masks.forEach((mask) => {
                const maskElement = mask as HTMLElement;
                maskElement.style.overflowX = "visible";
                maskElement.style.overflowY = "clip";
              });
              return gsap.from(self.chars, {
                yPercent: 110,
                duration: 0.86,
                ease: "power3.out",
                stagger: 0.014,
                delay,
                scrollTrigger: onScroll ? { trigger: ref.current, start: "top 85%", once: true } : undefined,
              });
            },
          });
        };
        const createSplit = (mediaContextSafe?.(createSplitNow) as (() => void) | undefined) ?? createSplitNow;
        const scheduleSplit = () => {
          if (disposed) return;
          if (!deferUntilIdle) {
            createSplit();
            return;
          }
          const idleApi = window as Window & {
            requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
            cancelIdleCallback?: (handle: number) => void;
          };
          if (typeof idleApi.requestIdleCallback === "function") {
            const idleId = idleApi.requestIdleCallback(createSplit, { timeout: 1400 });
            cancelIdle = () => idleApi.cancelIdleCallback?.(idleId);
          } else {
            const timer = window.setTimeout(createSplit, 180);
            cancelIdle = () => window.clearTimeout(timer);
          }
        };
        const start = () => {
          if (document.fonts.status === "loaded") scheduleSplit();
          else void document.fonts.ready.then(scheduleSplit);
        };
        const off = waitIntro ? onIntroDone(start) : (start(), undefined);
        return () => {
          disposed = true;
          cancelIdle?.();
          off?.();
          split?.revert();
        };
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return (
    <Tag ref={ref} className={`split-heading ${className ?? ""}`}>
      {text}
    </Tag>
  );
}
