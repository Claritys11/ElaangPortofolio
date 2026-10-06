import type { Metadata } from "next";
import { SplitHeading } from "@/components/motion/split-heading";
import { SectionLabel } from "@/components/site/section-label";
import { WriteupFilter } from "@/components/site/writeup-filter";
import { getCategoryStats, getCompetitions, listWriteups } from "@/lib/data/writeups";
import { breadcrumbJsonLd, jsonLdScript, pageOpenGraph } from "@/lib/seo";
import { ids } from "@/lib/seo-graph";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [items, stats, competitions] = await Promise.all([listWriteups(), getCategoryStats(), getCompetitions()]);
  const mix = stats.map((s) => `${s.count} ${s.category.toLowerCase()}`).join(", ");
  return {
    title: "CTF Writeups — Pwn, Reverse Engineering & Forensics",
    description: `${items.length} CTF writeups by Elang Dimas Syadewa (Claritys): ${mix}. From ${competitions.slice(0, 4).join(", ")} and more.`,
    alternates: { canonical: "/writeups" },
    openGraph: pageOpenGraph("/writeups"),
  };
}

export default async function WriteupsPage() {
  const [items, stats] = await Promise.all([listWriteups(), getCategoryStats()]);
  const base = siteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${base}/writeups#page`,
        url: `${base}/writeups`,
        name: "CTF Writeups",
        isPartOf: { "@id": ids(base).website },
        about: stats.map((s) => s.category),
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: items.length,
          itemListElement: items.map((w, i) => ({ "@type": "ListItem", position: i + 1, url: `${base}${w.href}`, name: w.title })),
        },
      },
      breadcrumbJsonLd(base, [
        { name: "Home", path: "/" },
        { name: "Writeups", path: "/writeups" },
      ]),
    ],
  };
  return (
    <main className="mx-auto max-w-[1600px] px-4 pt-32 pb-24 md:px-8 md:pt-44">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <SectionLabel index={2} name="writeups" />
      <SplitHeading as="h1" text="Writeups" className="mt-4 mb-16 font-display text-[18vw] leading-[0.8] font-black tracking-[-0.05em] md:text-[12vw]" />
      <WriteupFilter items={items} categories={stats.map((s) => s.category)} />
    </main>
  );
}
