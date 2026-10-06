import type { Metadata } from "next";
import { SplitHeading } from "@/components/motion/split-heading";
import { AchievementList } from "@/components/site/achievement-list";
import { SectionLabel } from "@/components/site/section-label";
import { listAchievements } from "@/lib/data/achievements";
import { breadcrumbJsonLd, jsonLdScript, pageOpenGraph, truncate } from "@/lib/seo";
import { ids } from "@/lib/seo-graph";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const items = await listAchievements();
  const notable = items.filter((a) => a.weight >= 4).map((a) => a.title.split(" – ")[0]);
  return {
    title: "Achievements & CTF Record",
    description: truncate(`${items.length} achievements and certificates of Elang Dimas Syadewa (Claritys). Highlights: ${notable.join(", ")}.`, 158),
    alternates: { canonical: "/achievements" },
    openGraph: pageOpenGraph("/achievements"),
  };
}

export default async function AchievementsPage() {
  const items = await listAchievements();
  const base = siteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        url: `${base}/achievements`,
        name: "Achievements & CTF Record",
        isPartOf: { "@id": ids(base).website },
        about: { "@id": ids(base).person },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: items.length,
          itemListElement: items.map((a, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "CreativeWork",
              name: a.title,
              description: [a.issuer ?? a.platform, a.description].filter(Boolean).join(" — ") || undefined,
              dateCreated: a.date ?? undefined,
              image: a.imageUrl ? `${base}${a.imageUrl}` : undefined,
              creator: a.issuer ? { "@type": "Organization", name: a.issuer } : undefined,
              about: { "@id": ids(base).person },
            },
          })),
        },
      },
      breadcrumbJsonLd(base, [
        { name: "Home", path: "/" },
        { name: "Achievements", path: "/achievements" },
      ]),
    ],
  };
  return (
    <main className="mx-auto max-w-[1600px] px-4 pt-32 pb-24 md:px-8 md:pt-44">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <SectionLabel index={4} name="record" />
      <SplitHeading as="h1" text="Record" className="mt-4 mb-16 font-display text-[18vw] leading-[0.8] font-black tracking-[-0.05em] md:text-[12vw]" />
      <AchievementList items={items} />
    </main>
  );
}
