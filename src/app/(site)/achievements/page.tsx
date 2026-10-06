import type { Metadata } from "next";
import { SplitHeading } from "@/components/motion/split-heading";
import { AchievementList } from "@/components/site/achievement-list";
import { SectionLabel } from "@/components/site/section-label";
import { listAchievements } from "@/lib/data/achievements";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Record" };

export default async function AchievementsPage() {
  const items = await listAchievements();
  return (
    <main className="mx-auto max-w-[1600px] px-4 pt-32 pb-24 md:px-8 md:pt-44">
      <SectionLabel index={4} name="record" />
      <SplitHeading as="h1" text="Record" className="mt-4 mb-16 font-display text-[18vw] leading-[0.8] font-black tracking-[-0.05em] md:text-[12vw]" />
      <AchievementList items={items} />
    </main>
  );
}
