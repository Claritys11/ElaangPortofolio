"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { Media } from "@/components/site/media";
import { SectionLabel } from "@/components/site/section-label";
import { gsap, NO_REDUCED } from "@/lib/motion";
import type { ProjectItem } from "@/lib/types";

export function ProjectRail({ projects }: { projects: ProjectItem[] }) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`${NO_REDUCED} and (min-width: 768px)`, () => {
        const distance = () => Math.max(0, track.current!.scrollWidth - window.innerWidth);
        gsap.to(track.current, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: { trigger: section.current, pin: true, scrub: 1, end: () => `+=${distance()}`, invalidateOnRefresh: true },
        });
      });
      return () => mm.revert();
    },
    { scope: section },
  );
  return (
    <section ref={section} className="overflow-hidden py-24 md:flex md:h-svh md:flex-col md:justify-center md:py-0">
      <div className="mx-auto mb-10 flex w-full max-w-[1600px] items-end justify-between px-4 md:px-8">
        <SectionLabel index={3} name="projects" />
        <span className="meta">{String(projects.length).padStart(2, "0")} selected</span>
      </div>
      <div ref={track} className="flex flex-col gap-10 px-4 md:w-max md:flex-row md:gap-8 md:px-8">
        {projects.map((p, i) => (
          <a
            key={p.id}
            href={p.projectUrl ?? "/projects"}
            {...(p.projectUrl?.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="group block md:w-[56vw] lg:w-[44vw]"
          >
            <div className="overflow-hidden">
              <Media src={p.imageUrl} alt={p.title} className="aspect-[16/10] w-full transition-transform duration-700 group-hover:scale-[1.03]" />
            </div>
            <div className="mt-4 flex items-baseline justify-between gap-6">
              <h3 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
                <span className="mr-3 font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                {p.title}
              </h3>
              <span className="meta shrink-0">{p.category}</span>
            </div>
            <p className="mt-2 line-clamp-2 max-w-xl text-sm text-muted-foreground">{p.description}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
