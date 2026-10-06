"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { SplitHeading } from "@/components/motion/split-heading";
import { Media } from "@/components/site/media";
import { SectionLabel } from "@/components/site/section-label";
import { gsap, NO_REDUCED, SplitText } from "@/lib/motion";

export function AboutIntro({ alias, name, text, imageUrl, location }: { alias: string; name: string; text: string; imageUrl: string; location: string }) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(NO_REDUCED, () => {
        const split = SplitText.create(".about-lines", { type: "lines", mask: "lines", autoSplit: true });
        gsap.from(split.lines, { yPercent: 100, duration: 1, ease: "expo.out", stagger: 0.08, delay: 0.3 });
        gsap.fromTo(".about-portrait", { clipPath: "inset(100% 0 0 0)", scale: 1.15 }, { clipPath: "inset(0% 0 0 0)", scale: 1, duration: 1.6, ease: "expo.out" });
        gsap.to(".about-portrait img", { yPercent: 8, ease: "none", scrollTrigger: { trigger: ref.current, start: "top top", end: "bottom top", scrub: true } });
        return () => split.revert();
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return (
    <section ref={ref} className="grid gap-12 md:grid-cols-12 md:items-end">
      <div className="md:col-span-7">
        <SectionLabel index={1} name="about" />
        <SplitHeading as="h1" text={alias} className="mt-4 font-display text-[20vw] leading-[0.98] font-black tracking-[-0.05em] md:text-[11vw]" />
        <p className="meta mt-6">
          {name} · {location}
        </p>
        <p className="about-lines mt-10 max-w-2xl font-display text-2xl leading-snug tracking-tight md:text-[2.1rem]">{text}</p>
      </div>
      <div className="about-portrait overflow-hidden md:col-span-4 md:col-start-9">
        <Media src={imageUrl} alt={name} className="aspect-[3/4] w-full scale-110 grayscale" eager />
      </div>
    </section>
  );
}
