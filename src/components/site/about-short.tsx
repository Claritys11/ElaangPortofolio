"use client";

import { useGSAP } from "@gsap/react";
import Link from "next/link";
import { useRef } from "react";
import { Media } from "@/components/site/media";
import { SectionLabel } from "@/components/site/section-label";
import { gsap, NO_REDUCED, SplitText } from "@/lib/motion";

export function AboutShort({ text, imageUrl }: { text: string; imageUrl: string }) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(NO_REDUCED, () => {
        const split = SplitText.create(".about-copy", { type: "words" });
        gsap.fromTo(
          split.words,
          { opacity: 0.15 },
          { opacity: 1, stagger: 0.05, ease: "none", scrollTrigger: { trigger: ".about-copy", start: "top 75%", end: "bottom 45%", scrub: true } },
        );
        gsap.fromTo(
          ".about-photo",
          { clipPath: "inset(100% 0 0 0)" },
          { clipPath: "inset(0% 0 0 0)", ease: "expo.out", duration: 1.4, scrollTrigger: { trigger: ".about-photo", start: "top 80%", once: true } },
        );
        return () => split.revert();
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return (
    <section ref={ref} className="mx-auto grid max-w-[1600px] gap-10 px-4 py-24 md:grid-cols-12 md:px-8 md:py-40">
      <SectionLabel index={1} name="about" className="md:col-span-12" />
      <p className="about-copy font-display text-3xl leading-[1.12] font-medium tracking-tight md:col-span-8 md:text-5xl">{text}</p>
      <div className="flex flex-col gap-4 md:col-span-3 md:col-start-10">
        <Media src={imageUrl} alt="Portrait of Elang" className="about-photo aspect-[3/4] w-full grayscale" />
        <Link href="/about" className="meta w-fit border-b border-primary pb-1 text-foreground">
          more about me →
        </Link>
      </div>
    </section>
  );
}
