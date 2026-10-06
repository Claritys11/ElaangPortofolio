import type { Metadata } from "next";
import Link from "next/link";
import { AboutShort } from "@/components/site/about-short";
import { CategoryStats } from "@/components/site/category-stats";
import { Hero } from "@/components/site/hero";
import { ProjectRail } from "@/components/site/project-rail";
import { Quote } from "@/components/site/quote";
import { RecordTimeline } from "@/components/site/record-timeline";
import { SectionLabel } from "@/components/site/section-label";
import { WriteupIndex } from "@/components/site/writeup-index";
import { listAchievements } from "@/lib/data/achievements";
import { getProfile } from "@/lib/data/profile";
import { listProjects } from "@/lib/data/projects";
import { getCategoryStats, listWriteups } from "@/lib/data/writeups";
import { pageOpenGraph, truncate } from "@/lib/seo";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const [p, writeups, stats] = await Promise.all([getProfile(), listWriteups(), getCategoryStats()]);
  const pwn = stats.find((s) => s.category === "Pwn")?.count ?? 0;
  const description = truncate(
    `${p.displayName} (${p.alias}) — ${p.seo.jobTitle ?? "CTF player"} from Malang, Indonesia. ${writeups.length} CTF writeups (${pwn} pwn), projects and a competition record.`,
    158,
  );
  return { description, alternates: { canonical: "/" }, openGraph: pageOpenGraph("/", { description }) };
}

export default async function Home() {
  const [profile, writeups, stats, projects, achievements] = await Promise.all([getProfile(), listWriteups(), getCategoryStats(), listProjects(), listAchievements()]);
  const school = profile.education.at(-1)?.school ?? "SMK Telkom Malang";
  const intro = profile.aboutText
    .split(/(?<=\.)\s+/)
    .slice(0, 2)
    .join(" ");

  return (
    <main>
      <Hero name={profile.displayName} alias={profile.alias} role="pwn · rev · forensics" location="Malang, ID" school={school} />
      {intro && <AboutShort text={intro} imageUrl={profile.profileImageUrl} />}

      <section className="mx-auto max-w-[1600px] px-4 py-24 md:px-8 md:py-36">
        <div className="mb-12 flex items-end justify-between">
          <SectionLabel index={2} name="writeups" />
          <Link href="/writeups" className="meta border-b border-primary pb-1 text-foreground">
            all {writeups.length} →
          </Link>
        </div>
        <CategoryStats stats={stats} />
        <div className="mt-16">
          <WriteupIndex items={writeups.slice(0, 8)} />
        </div>
      </section>

      {projects.length > 0 && <ProjectRail projects={projects} />}

      <section className="mx-auto max-w-[1600px] px-4 py-24 md:px-8 md:py-36">
        <div className="mb-16 flex items-end justify-between">
          <SectionLabel index={4} name="record" />
          <Link href="/achievements" className="meta border-b border-primary pb-1 text-foreground">
            full record →
          </Link>
        </div>
        <RecordTimeline items={achievements} limit={10} />
      </section>

      <Quote text={profile.philosophyText} />
    </main>
  );
}
