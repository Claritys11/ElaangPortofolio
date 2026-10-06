import { gsap } from "gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

export { gsap, ScrambleTextPlugin, ScrollTrigger, SplitText };

export const NO_REDUCED = "(prefers-reduced-motion: no-preference)";

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function toHexProgress(p: number): string {
  const v = Number.isFinite(p) ? Math.min(1, Math.max(0, p)) : 0;
  return `0x${Math.round(v * 0xffff)
    .toString(16)
    .toUpperCase()
    .padStart(4, "0")}`;
}
