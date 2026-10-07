"use client";

import Link from "next/link";
import { SectionLabel } from "@/components/site/section-label";
import { SqueezeCarousel, type SqueezeSlide } from "@/components/ui/carousel-squeeze";
import type { ProjectItem } from "@/lib/types";

/** Corner caption on the open panel: the project's number and category. */
const mark = (i: number, category: string) => (
  <span className="flex items-baseline gap-3 font-mono text-[11px] tracking-[0.14em] text-white uppercase">
    <span className="text-white/60">{String(i + 1).padStart(2, "0")}</span>
    {category}
  </span>
);

export function ProjectRail({ projects }: { projects: ProjectItem[] }) {
  const slides: SqueezeSlide[] = projects.map((p, i) => {
    const external = !!p.projectUrl?.startsWith("http");
    return {
      id: p.id,
      title: p.title,
      description: p.description,
      image: p.imageUrl ?? undefined,
      imageAlt: `${p.title} screenshot`,
      background: "linear-gradient(135deg, var(--muted), var(--background))",
      overlay: mark(i, p.category),
      action: external ? "Visit project" : "View project",
      href: p.projectUrl ?? "/projects",
      target: external ? "_blank" : undefined,
    };
  });

  return (
    <section className="mx-auto max-w-[1600px] px-4 py-24 md:px-8 md:py-32">
      <SqueezeCarousel
        slides={slides}
        label="Selected projects"
        height="clamp(200px, 34cqi, 520px)"
        autoplay
        interval={5000}
        className="[&>div:first-child]:mb-8"
        toolbar={
          <div className="flex items-baseline gap-6">
            <SectionLabel index={3} name="projects" />
            <Link href="/projects" className="meta border-b border-border pb-0.5 hover:text-foreground">
              all {String(projects.length).padStart(2, "0")} →
            </Link>
          </div>
        }
      />
    </section>
  );
}
