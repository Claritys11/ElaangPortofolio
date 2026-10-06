import type { Metadata } from "next";
import { Reveal } from "@/components/motion/reveal";
import { SplitHeading } from "@/components/motion/split-heading";
import { Media } from "@/components/site/media";
import { SectionLabel } from "@/components/site/section-label";
import { getProfile } from "@/lib/data/profile";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "About" };

export default async function AboutPage() {
  const p = await getProfile();
  return (
    <main className="mx-auto max-w-[1600px] px-4 pt-32 pb-24 md:px-8 md:pt-44">
      <SectionLabel index={1} name="about" />
      <SplitHeading as="h1" text={p.alias} className="mt-4 mb-16 font-display text-[18vw] leading-[0.8] font-black tracking-[-0.05em] md:text-[12vw]" />
      <div className="grid gap-12 md:grid-cols-12">
        <Media src={p.profileImageUrl} alt={p.displayName} className="aspect-[3/4] w-full grayscale md:col-span-4" eager />
        <div className="md:col-span-7 md:col-start-6">
          <p className="font-display text-2xl leading-snug tracking-tight md:text-4xl">{p.aboutText}</p>
        </div>
      </div>

      <section className="mt-32 grid gap-10 md:grid-cols-12">
        <h2 className="meta md:col-span-3">skills</h2>
        <Reveal as="ul" stagger y={12} className="md:col-span-9">
          {p.skills.map((s, i) => (
            <li key={s.name} className="grid grid-cols-[1fr_auto] items-center gap-6 border-b border-border py-4">
              <span className={i === 0 ? "font-display text-3xl font-semibold text-primary" : "text-lg"}>{s.name}</span>
              <span className="flex items-center gap-3">
                <span className="relative block h-px w-24 bg-border md:w-48">
                  <span className="absolute inset-y-0 left-0 bg-foreground" style={{ width: `${s.level}%` }} />
                </span>
                <span className="w-8 text-right font-mono text-xs text-muted-foreground">{s.level}</span>
              </span>
            </li>
          ))}
        </Reveal>
      </section>

      {p.journey.length > 0 && (
        <section className="mt-32 grid gap-10 md:grid-cols-12">
          <h2 className="meta md:col-span-3">journey</h2>
          <Reveal as="ol" stagger className="grid gap-12 md:col-span-9">
            {p.journey.map((j) => (
              <li key={`${j.role}-${j.period}`} className="grid gap-2 md:grid-cols-[10rem_1fr]">
                <span className="meta">{j.period}</span>
                <div>
                  <h3 className="font-display text-2xl font-semibold tracking-tight">{j.role}</h3>
                  <p className="meta mt-1">{j.company}</p>
                  <p className="mt-3 max-w-2xl text-muted-foreground">{j.desc}</p>
                </div>
              </li>
            ))}
          </Reveal>
        </section>
      )}

      {p.education.length > 0 && (
        <section className="mt-32 grid gap-10 md:grid-cols-12">
          <h2 className="meta md:col-span-3">education</h2>
          <ul className="md:col-span-9">
            {p.education.map((e) => (
              <li key={e.school} className="grid grid-cols-[1fr_auto] gap-6 border-b border-border py-4">
                <span>
                  <span className="text-lg">{e.school}</span> <span className="meta ml-2">{e.level}</span>
                </span>
                <span className="meta">{e.period}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
