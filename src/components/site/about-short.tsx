"use client";

import { useGSAP } from "@gsap/react";
import { Binary, CodeXml, Flag, type LucideIcon, Server, ShieldHalf, SquareTerminal } from "lucide-react";
import Link from "next/link";
import { Fragment, useRef } from "react";
import { FocusAreas } from "@/components/site/focus-areas";
import { Media } from "@/components/site/media";
import { SectionLabel } from "@/components/site/section-label";
import { gsap, NO_REDUCED, SplitText } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Words that earn an inline icon chip. The text comes from the admin, so these are matched, not placed. */
const CHIPS: [RegExp, LucideIcon][] = [
  [/cybersecurity/i, ShieldHalf],
  [/linux( systems)?/i, SquareTerminal],
  [/server infrastructure|infrastructure/i, Server],
  [/web development/i, CodeXml],
  [/\bpwn\b/i, Binary],
  [/CTF competitions/i, Flag],
];
const MAX_CHIPS = 4;
/** The first of these found in the text gets the highlighter stroke: the main focus. */
const HIGHLIGHTS = [/binary and web exploitation/i, /binary exploitation/i, /exploitation/i];

const OUTER = ["pwntools", "gdb", "ghidra", "ida", "python", "c / asm"];
const INNER = ["linux", "docker", "burp"];

type Piece = { kind: "text"; text: string } | { kind: "chip"; text: string; Icon: LucideIcon } | { kind: "mark"; text: string };

/** Splits the intro into plain text, chip-prefixed words and one highlighted phrase. */
function decorate(text: string): Piece[] {
  const marks: { start: number; end: number; piece: Piece }[] = [];
  const hl = HIGHLIGHTS.map((r) => r.exec(text)).find(Boolean);
  if (hl) marks.push({ start: hl.index, end: hl.index + hl[0].length, piece: { kind: "mark", text: hl[0] } });
  for (const [re, Icon] of CHIPS) {
    if (marks.filter((m) => m.piece.kind === "chip").length >= MAX_CHIPS) break;
    const m = re.exec(text);
    if (!m || marks.some((x) => m.index < x.end && m.index + m[0].length > x.start)) continue;
    marks.push({ start: m.index, end: m.index + m[0].length, piece: { kind: "chip", text: m[0], Icon } });
  }
  marks.sort((a, b) => a.start - b.start);
  const out: Piece[] = [];
  let at = 0;
  for (const m of marks) {
    if (m.start > at) out.push({ kind: "text", text: text.slice(at, m.start) });
    out.push(m.piece);
    at = m.end;
  }
  if (at < text.length) out.push({ kind: "text", text: text.slice(at) });
  return out;
}

function Orbit({ imageUrl }: { imageUrl: string }) {
  const ring = (tools: string[], inset: string, speed: string) => (
    <div className={cn("orbit-ring absolute rounded-full border border-dashed border-border", inset)} style={{ "--orbit-speed": speed } as React.CSSProperties}>
      {tools.map((t, i) => {
        const a = (i / tools.length) * Math.PI * 2 - Math.PI / 2;
        return (
          // A zero-size anchor on the ring; the CSS counter-rotation turns it about the point, keeping the chip upright.
          <span key={t} className="absolute size-0" style={{ left: `${50 + 50 * Math.cos(a)}%`, top: `${50 + 50 * Math.sin(a)}%` }}>
            <span
              className={cn(
                "orbit-chip absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] whitespace-nowrap uppercase",
                t === "pwntools" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground",
              )}
            >
              {t}
            </span>
          </span>
        );
      })}
    </div>
  );
  return (
    <div className="orbit relative mx-auto aspect-square w-full max-w-[min(22rem,80vw)]" role="group" aria-label="Tools I use most: pwntools, gdb, Ghidra, IDA, Python, C and assembly, Linux, Docker, Burp Suite">
      {ring(OUTER, "inset-[6%]", "70s")}
      {ring(INNER, "inset-[22%]", "46s")}
      <div className="about-photo absolute inset-[31%] overflow-hidden rounded-full border border-border">
        <Media src={imageUrl} alt="Portrait of Elang" className="size-full grayscale transition-[filter] duration-700 hover:grayscale-0" />
      </div>
    </div>
  );
}

export function AboutShort({ text, imageUrl }: { text: string; imageUrl: string }) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(NO_REDUCED, () => {
        const split = SplitText.create(".about-copy", { type: "words" });
        const scrub = { trigger: ".about-copy", start: "top 75%", end: "bottom 45%", scrub: true };
        gsap.fromTo(split.words, { opacity: 0.15 }, { opacity: 1, stagger: 0.05, ease: "none", scrollTrigger: scrub });
        // The highlighter strokes across its phrase as the reading pass reaches it.
        gsap.fromTo(".about-mark", { backgroundSize: "0% 0.32em" }, { backgroundSize: "100% 0.32em", ease: "none", scrollTrigger: { trigger: ".about-mark", start: "top 70%", end: "top 45%", scrub: true } });
        for (const chip of gsap.utils.toArray<HTMLElement>(".about-chip")) {
          gsap.from(chip, { scale: 0, rotate: -25, duration: 0.7, ease: "back.out(2.2)", scrollTrigger: { trigger: chip, start: "top 72%", once: true } });
        }
        gsap.fromTo(
          ".about-photo",
          { clipPath: "circle(0% at 50% 50%)" },
          { clipPath: "circle(50% at 50% 50%)", ease: "expo.out", duration: 1.4, scrollTrigger: { trigger: ".orbit", start: "top 80%", once: true } },
        );
        gsap.from(".orbit-chip", { scale: 0, autoAlpha: 0, duration: 0.6, ease: "back.out(2)", stagger: 0.06, delay: 0.3, scrollTrigger: { trigger: ".orbit", start: "top 80%", once: true } });
        return () => split.revert();
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return (
    <section ref={ref} className="mx-auto grid max-w-[1600px] gap-10 overflow-x-clip px-4 pt-16 pb-24 md:grid-cols-12 md:px-8 md:pt-20 md:pb-40">
      <SectionLabel index={1} name="about" className="md:col-span-12" />
      <p className="about-copy font-display text-3xl leading-[1.18] font-medium tracking-tight md:col-span-7 md:text-5xl">
        {decorate(text).map((p, i) =>
          p.kind === "text" ? (
            <Fragment key={i}>{p.text}</Fragment>
          ) : p.kind === "mark" ? (
            <mark
              key={i}
              className="about-mark bg-transparent bg-[linear-gradient(color-mix(in_oklch,var(--primary)_55%,transparent),color-mix(in_oklch,var(--primary)_55%,transparent))] [background-position:0_86%] bg-no-repeat [background-size:100%_0.32em] text-inherit [box-decoration-break:clone]"
            >
              {p.text}
            </mark>
          ) : (
            <Fragment key={i}>
              <span
                aria-hidden
                className={cn(
                  "about-chip mr-[0.2em] inline-grid size-[0.82em] translate-y-[0.06em] place-items-center rounded-[0.2em] align-baseline",
                  i % 2 ? "bg-foreground text-background" : "bg-primary text-primary-foreground",
                )}
              >
                <p.Icon className="size-[0.5em]" strokeWidth={2.5} />
              </span>
              {p.text}
            </Fragment>
          ),
        )}
      </p>
      <div className="flex flex-col items-center gap-6 md:col-span-4 md:col-start-9 md:items-end">
        <Orbit imageUrl={imageUrl} />
        <Link href="/about" className="meta w-fit border-b border-primary pb-1 text-foreground">
          more about me →
        </Link>
      </div>
      {/* Runs edge to edge of the section, like a ruled strip under the statement. */}
      <FocusAreas className="-mx-4 mt-4 md:col-span-12 md:-mx-8 md:mt-8" />
    </section>
  );
}
