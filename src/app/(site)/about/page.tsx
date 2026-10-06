import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { AboutIntro } from "@/components/site/about-intro";
import { CategoryStats } from "@/components/site/category-stats";
import { JourneyLine } from "@/components/site/journey-line";
import { Quote } from "@/components/site/quote";
import { SectionLabel } from "@/components/site/section-label";
import { SkillBars } from "@/components/site/skill-bars";
import { listAchievements } from "@/lib/data/achievements";
import { getProfile } from "@/lib/data/profile";
import { getCategoryStats, getCompetitions, listWriteups } from "@/lib/data/writeups";
import { formatDate } from "@/lib/format";
import { breadcrumbJsonLd, jsonLdScript, pageOpenGraph, truncate } from "@/lib/seo";
import { ids } from "@/lib/seo-graph";
import { siteUrl } from "@/lib/site";
import { isGenericTag } from "@/lib/tags";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const p = await getProfile();
  return {
    title: "About",
    description: truncate(`${p.displayName} (${p.alias}) — ${p.seo.jobTitle ?? "CTF player"} from Malang, Indonesia. ${p.aboutText}`, 158),
    alternates: { canonical: "/about" },
    openGraph: pageOpenGraph("/about", { type: "profile", firstName: p.displayName.split(" ")[0], lastName: p.displayName.split(" ").slice(1).join(" "), username: p.alias }),
  };
}

export default async function AboutPage() {
  const [p, writeups, stats, competitions, achievements] = await Promise.all([getProfile(), listWriteups(), getCategoryStats(), getCompetitions(), listAchievements()]);
  const pwnCount = stats.find((s) => s.category === "Pwn")?.count ?? 0;
  const pwn = writeups.filter((w) => w.category === "Pwn").slice(0, 4);
  const [focus, ...rest] = p.skills;
  const latest = writeups.find((w) => w.competition);
  const base = siteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        url: `${base}/about`,
        name: `About ${p.displayName}`,
        isPartOf: { "@id": ids(base).website },
        mainEntity: { "@id": ids(base).person },
        dateModified: writeups[0]?.updated,
      },
      breadcrumbJsonLd(base, [
        { name: "Home", path: "/" },
        { name: "About", path: "/about" },
      ]),
    ],
  };
  // Most common technique tags across pwn writeups (generic labels skipped).
  const tagCounts = new Map<string, number>();
  for (const w of writeups.filter((x) => x.category === "Pwn")) for (const t of w.tags) if (!isGenericTag(t)) tagCounts.set(t.toLowerCase(), (tagCounts.get(t.toLowerCase()) ?? 0) + 1);
  const topTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([t]) => t);

  return (
    <main className="mx-auto max-w-[1600px] px-4 pt-32 pb-24 md:px-8 md:pt-44">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <AboutIntro alias={p.alias} name={p.displayName} text={p.aboutText} imageUrl={p.profileImageUrl} location="Malang, ID" />

      <section className="mt-32 md:mt-44">
        <SectionLabel index={2} name="by the numbers" className="mb-8" />
        <CategoryStats
          cols={4}
          stats={[
            { category: "pwn writeups", count: pwnCount },
            { category: "writeups", count: writeups.length },
            { category: "ctfs", count: competitions.length },
            { category: "achievements", count: achievements.length },
          ]}
        />
      </section>

      {focus && (
        <section className="mt-32 grid gap-16 md:mt-44 md:grid-cols-12">
          <div className="md:col-span-6">
            <SectionLabel index={3} name="focus" />
            <h2 className="mt-6 font-display text-6xl leading-[0.9] font-black tracking-[-0.04em] md:text-8xl">
              {focus.name.split(" ").map((word, i) => (
                <span key={word} className={i === 0 ? "block text-primary" : "block"}>
                  {word}
                </span>
              ))}
            </h2>
            <p className="mt-8 max-w-md text-muted-foreground">
              {pwnCount} of {writeups.length} writeups are pwn{topTags.length > 0 ? ` — mostly ${topTags.join(", ")}` : ""}.
            </p>
            {pwn.length > 0 && (
              <ul className="mt-10 border-t border-border">
                {pwn.map((w) => (
                  <li key={w.id} className="border-b border-border">
                    <Link href={w.href} className="group flex items-baseline justify-between gap-6 py-4">
                      <span className="font-display text-2xl font-semibold tracking-tight transition-transform duration-500 group-hover:translate-x-2 group-hover:text-primary">
                        {w.title}
                      </span>
                      <span className="meta shrink-0">{w.competition || w.difficulty}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="md:col-span-5 md:col-start-8 md:pt-16">
            <p className="meta mb-6">also</p>
            <SkillBars skills={rest} />
          </div>
        </section>
      )}

      {p.journey.length > 0 && (
        <section className="mt-32 grid gap-12 md:mt-44 md:grid-cols-12">
          <div className="md:col-span-3">
            <SectionLabel index={4} name="journey" />
          </div>
          <div className="md:col-span-9">
            <JourneyLine items={p.journey} />
          </div>
        </section>
      )}

      <section className="mt-32 grid gap-px bg-border md:mt-44 md:grid-cols-2">
        {latest && (
          <Link href={latest.href} className="group bg-background p-6 md:p-10">
            <p className="meta">currently playing</p>
            <p className="mt-6 font-display text-4xl font-bold tracking-tight transition-colors group-hover:text-primary md:text-5xl">{latest.competition}</p>
            <p className="meta mt-4">
              latest: {latest.title} · {formatDate(latest.date)} →
            </p>
          </Link>
        )}
        <Reveal stagger className="bg-background p-6 md:p-10">
          <p className="meta mb-6">education</p>
          {p.education.map((e) => (
            <div key={e.school} className="flex items-baseline justify-between gap-6 border-b border-border py-4 last:border-0">
              <div>
                <p className="text-lg">{e.school}</p>
                <p className="meta mt-1">{e.level}</p>
              </div>
              <span className="meta shrink-0">{e.period}</span>
            </div>
          ))}
        </Reveal>
      </section>

      <Quote text={p.philosophyText} />
    </main>
  );
}
