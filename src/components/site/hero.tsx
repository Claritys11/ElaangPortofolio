import { ScrambleLine } from "@/components/motion/scramble-line";
import { SplitHeading } from "@/components/motion/split-heading";
import { Greeting, LiveDot, LocalClock } from "@/components/site/hero-live";
import { resolveHeroNameLines } from "@/lib/hero-name";

type Props = { name: string; nameLines?: string[] | null; alias: string; role: string; location: string; school: string };

export function Hero({ name, nameLines, alias, role, location, school }: Props) {
  const lines = resolveHeroNameLines(name, nameLines).map((line) => line.toUpperCase());
  return (
    <section className="relative mx-auto flex min-h-svh max-w-[1600px] flex-col px-4 pt-28 pb-10 md:px-8 md:pt-28 md:pb-14">
      <div className="mb-8 flex flex-col justify-between gap-6 md:mb-10 md:flex-row md:items-end">
        <div className="grid gap-2">
          <Greeting className="font-display text-2xl font-medium tracking-tight md:text-3xl" />
          <p className="meta">
            aka <span className="text-foreground">{alias}</span>
          </p>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase md:text-right">
          <dt>based</dt>
          <dd className="text-foreground">{location}</dd>
          <dt>local</dt>
          <dd className="text-foreground">
            <LocalClock />
          </dd>
          <dt>school</dt>
          <dd className="text-foreground">{school}</dd>
          <dt>status</dt>
          <dd className="text-foreground">
            <LiveDot />
            open to CTF teams
          </dd>
        </dl>
      </div>
      <div className="flex flex-1 flex-col">
        {/* One h1 carrying the full name (search engines read it as the page's main subject). */}
        <h1 className="mb-10">
          {lines.map((line, index) => (
            <SplitHeading
              key={`${index}-${line}`}
              as="span"
              text={line}
              delay={index * 0.15}
              waitIntro
              deferUntilIdle
              keepWordsTogether
              className={index === 0
                ? "hero-name-line block font-display text-[22vw] leading-[0.8] font-black tracking-[-0.05em] md:text-[17vw]"
                : "hero-name-line block font-display text-[11vw] leading-[0.9] font-light tracking-[-0.04em] [font-stretch:125%] md:text-[8.5vw]"}
            />
          ))}
        </h1>
        {/* Pinned to the bottom of the first screen, so the page opens on the hero alone. */}
        <div className="mt-auto flex items-center justify-between border-t border-border pt-5">
          <ScrambleLine text={role} className="font-mono text-sm tracking-[0.2em] md:text-base" />
          <span className="meta hidden md:inline">scroll ↓</span>
        </div>
      </div>
    </section>
  );
}
