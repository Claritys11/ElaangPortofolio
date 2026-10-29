"use client";

import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { Media } from "@/components/site/media";
import { SectionLabel } from "@/components/site/section-label";
import { gsap, NO_REDUCED } from "@/lib/motion";
import type { ProjectItem } from "@/lib/types";

const SHOWN = 6;
/** Each card sticks a little lower than the last, so the stack shows its edges. */
const STEP = 14;

export function ProjectStack({ projects }: { projects: ProjectItem[] }) {
  const ref = useRef<HTMLElement>(null);
  const shown = projects.slice(0, SHOWN);
  const pad = (n: number) => String(n).padStart(2, "0");

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      // Phones get a plain list: a card there is taller than the screen, so stacking would hide its image.
      mm.add(`${NO_REDUCED} and (min-width: 768px)`, () => {
        const cards = gsap.utils.toArray<HTMLElement>(".stack-card");
        cards.forEach((card, i) => {
          const next = cards[i + 1];
          if (!next) return;
          // As the next card slides up over this one, this one sinks back into the stack.
          // fromTo, not to: GSAP reads the computed `filter: none` as brightness(0), which flashed the card black.
          gsap.fromTo(
            card.querySelector(".stack-inner"),
            { scale: 1, filter: "brightness(1)" },
            {
              scale: 0.92,
              filter: "brightness(0.55)",
              ease: "none",
              scrollTrigger: { trigger: next, start: "top bottom", end: `top ${96 + (i + 1) * STEP}px`, scrub: true },
            },
          );
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className="mx-auto max-w-[1600px] px-4 py-24 md:px-8 md:py-32">
      <div className="mb-12 flex items-end justify-between">
        <SectionLabel index={3} name="projects" />
        <Link href="/projects" className="meta border-b border-primary pb-1 text-foreground">
          all {pad(projects.length)} →
        </Link>
      </div>
      <ol className="grid gap-8">
        {shown.map((p, i) => {
          const external = !!p.projectUrl?.startsWith("http");
          return (
            <li key={p.id} className="stack-card md:sticky" style={{ top: 96 + i * STEP }}>
              <article className="stack-inner grid origin-top gap-8 overflow-hidden rounded-2xl border border-border bg-card p-6 will-change-transform md:min-h-[min(70svh,560px)] md:grid-cols-12 md:p-10">
                <div className="flex flex-col md:col-span-5">
                  <div className="meta flex justify-between">
                    <span>
                      <span className="text-foreground">{pad(i + 1)}</span> / {pad(shown.length)}
                    </span>
                    <span>{p.category}</span>
                  </div>
                  <h3 className="mt-8 font-display text-3xl leading-[0.95] font-bold tracking-tight text-balance md:mt-auto md:text-5xl">{p.title}</h3>
                  <p className="mt-5 max-w-md text-muted-foreground">{p.description}</p>
                  {p.tags.length > 0 && (
                    <ul className="mt-5 flex flex-wrap gap-2">
                      {p.tags.slice(0, 4).map((t) => (
                        <li key={t} className="rounded-full border border-border px-3 py-1 font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                          {t}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link
                    href={p.projectUrl ?? "/projects"}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noreferrer" : undefined}
                    className="group mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    {external ? "Visit project" : "View project"}
                    <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </div>
                <div className="group relative overflow-hidden rounded-xl bg-muted md:col-span-7">
                  <Media src={p.imageUrl} alt={`${p.title} screenshot`} label={p.category} className="aspect-[16/10] w-full transition-transform duration-700 ease-out group-hover:scale-[1.03] md:absolute md:inset-0 md:aspect-auto md:h-full" />
                </div>
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
