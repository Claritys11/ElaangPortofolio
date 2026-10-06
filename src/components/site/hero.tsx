import { ScrambleLine } from "@/components/motion/scramble-line";
import { SplitHeading } from "@/components/motion/split-heading";

type Props = { name: string; alias: string; role: string; location: string; school: string };

export function Hero({ name, alias, role, location, school }: Props) {
  const [first, ...rest] = name.toUpperCase().split(" ");
  return (
    <section className="relative mx-auto flex min-h-svh max-w-[1600px] flex-col justify-end px-4 pt-28 pb-10 md:px-8 md:pb-14">
      <div className="mb-10 flex flex-col justify-between gap-6 md:mb-16 md:flex-row md:items-end">
        <p className="meta">
          aka <span className="text-foreground">{alias}</span>
        </p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase md:text-right">
          <dt>based</dt>
          <dd className="text-foreground">{location}</dd>
          <dt>school</dt>
          <dd className="text-foreground">{school}</dd>
          <dt>status</dt>
          <dd className="text-foreground">open to CTF teams</dd>
        </dl>
      </div>
      {/* One h1 carrying the full name (search engines read it as the page's main subject). */}
      <h1>
        <SplitHeading as="span" text={first} className="block font-display text-[22vw] leading-[0.8] font-black tracking-[-0.05em] md:text-[17vw]" />
        {rest.length > 0 && (
          <SplitHeading
            as="span"
            text={rest.join(" ")}
            delay={0.15}
            className="block font-display text-[11vw] leading-[0.9] font-light tracking-[-0.04em] [font-stretch:125%] md:text-[8.5vw]"
          />
        )}
      </h1>
      <div className="mt-10 flex items-center justify-between border-t border-border pt-5">
        <ScrambleLine text={role} className="font-mono text-sm tracking-[0.2em] md:text-base" />
        <span className="meta hidden md:inline">scroll ↓</span>
      </div>
    </section>
  );
}
