import type { Metadata } from "next";
import { SplitHeading } from "@/components/motion/split-heading";
import { SectionLabel } from "@/components/site/section-label";
import { WriteupFilter } from "@/components/site/writeup-filter";
import { getCategoryStats, listWriteups } from "@/lib/data/writeups";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Writeups", description: "CTF writeups — mostly pwn, plus reverse engineering and forensics." };

export default async function WriteupsPage() {
  const [items, stats] = await Promise.all([listWriteups(), getCategoryStats()]);
  return (
    <main className="mx-auto max-w-[1600px] px-4 pt-32 pb-24 md:px-8 md:pt-44">
      <SectionLabel index={2} name="writeups" />
      <SplitHeading as="h1" text="Writeups" className="mt-4 mb-16 font-display text-[18vw] leading-[0.8] font-black tracking-[-0.05em] md:text-[12vw]" />
      <WriteupFilter items={items} categories={stats.map((s) => s.category)} />
    </main>
  );
}
