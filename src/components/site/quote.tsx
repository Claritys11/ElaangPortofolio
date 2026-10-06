"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { gsap, NO_REDUCED, SplitText } from "@/lib/motion";

export function Quote({ text }: { text: string }) {
  const ref = useRef<HTMLQuoteElement>(null);
  const match = /^(.*?)["”]?\s*[-–—]\s*([^-–—]+)$/.exec(text.trim());
  const body = (match ? match[1] : text).replace(/^["“]|["”]$/g, "");
  const author = match?.[2]?.trim();
  useGSAP(
    () => {
      if (!ref.current) return;
      const mm = gsap.matchMedia();
      mm.add(NO_REDUCED, () => {
        const split = SplitText.create(ref.current!.querySelector("p")!, { type: "words" });
        gsap.from(split.words, {
          autoAlpha: 0,
          y: 20,
          stagger: 0.06,
          ease: "power2.out",
          scrollTrigger: { trigger: ref.current, start: "top 70%", end: "center 50%", scrub: true },
        });
        return () => split.revert();
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  if (!text) return null;
  return (
    <blockquote ref={ref} className="mx-auto flex min-h-[80svh] max-w-[1400px] flex-col justify-center px-4 py-24 md:px-8">
      <p className="font-display text-5xl leading-[1] font-light tracking-tight italic md:text-8xl">“{body}”</p>
      {author && <footer className="meta mt-8">— {author}</footer>}
    </blockquote>
  );
}
