import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { AboutFocus } from "@/components/site/about-focus";
import { AboutIntro } from "@/components/site/about-intro";
import { CategoryStats } from "@/components/site/category-stats";
import { JourneyLine } from "@/components/site/journey-line";
import { Quote } from "@/components/site/quote";
import { SectionLabel } from "@/components/site/section-label";
import { listAchievements } from "@/lib/data/achievements";
import { getProfile } from "@/lib/data/profile";
import { listProjects } from "@/lib/data/projects";
import { getCategoryStats, getCompetitions, listWriteups } from "@/lib/data/writeups";
import { evidenceFor, SYSADMIN, WEBDEV } from "@/lib/focus";
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
  const [p, writeups, stats, competitions, achievements, projects] = await Promise.all([
    getProfile(),
    listWriteups(),
    getCategoryStats(),
    getCompetitions(),
    listAchievements(),
    listProjects(),
  ]);
  const pwnCount = stats.find((s) => s.category === "Pwn")?.count ?? 0;
  const webCount = stats.find((s) => s.category === "Web")?.count ?? 0;
  const pwn = writeups.filter((w) => w.category === "Pwn").slice(0, 4);
  const web = writeups.filter((w) => w.category === "Web").slice(0, 2);
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
        <AboutFocus
          focusName={focus.name}
          pwnCount={pwnCount}
          webCount={webCount}
          total={writeups.length}
          topTags={topTags}
          pwn={pwn}
          web={web}
          sysadmin={evidenceFor(projects, SYSADMIN)}
          webdev={evidenceFor(projects, WEBDEV)}
          skills={rest}
        />
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
