import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SplitHeading } from "@/components/motion/split-heading";
import { ArticleBody } from "@/components/site/article-body";
import { ArticleSidebar } from "@/components/site/article-sidebar";
import { FlagReveal } from "@/components/site/flag-reveal";
import { RelatedWriteups } from "@/components/site/related-writeups";
import { WriteupExport } from "@/components/site/writeup-export";
import { getProfile } from "@/lib/data/profile";
import { getAdjacentWriteups, getWriteup, listWriteups } from "@/lib/data/writeups";
import { relatedWriteups } from "@/lib/related";
import { formatDate, readingMinutes } from "@/lib/format";
import { renderWriteupHtml } from "@/lib/html";
import { breadcrumbJsonLd, detectLang, jsonLdScript, plainText, writeupSeoDescription, writeupSeoTitle } from "@/lib/seo";
import { ids } from "@/lib/seo-graph";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const w = await getWriteup((await params).slug);
  if (!w) return { title: "Not found", robots: { index: false } };
  const description = writeupSeoDescription(w, w.content);
  return {
    title: writeupSeoTitle(w),
    description,
    keywords: [...w.tags, w.category, w.competition, "CTF writeup"].filter(Boolean),
    alternates: { canonical: w.href },
    openGraph: {
      type: "article",
      url: w.href,
      siteName: "Elang Dimas Syadewa Portfolio",
      locale: "id_ID",
      title: writeupSeoTitle(w),
      description,
      publishedTime: w.date ?? undefined,
      modifiedTime: w.updated,
      section: w.category,
      tags: w.tags,
      authors: ["Elang Dimas Syadewa"],
    },
  };
}

export default async function WriteupPage({ params }: Params) {
  const w = await getWriteup((await params).slug);
  if (!w) notFound();
  const [{ html, toc }, adjacent, profile, all] = await Promise.all([renderWriteupHtml(w.content, { altPrefix: w.title }), getAdjacentWriteups(w), getProfile(), listWriteups()]);
  const related = relatedWriteups(w, all, 3);
  const base = siteUrl();
  const lang = detectLang(plainText(w.content));
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        "@id": `${base}${w.href}#article`,
        mainEntityOfPage: `${base}${w.href}`,
        headline: writeupSeoTitle(w),
        name: w.title,
        description: writeupSeoDescription(w, w.content),
        datePublished: w.date ?? undefined,
        dateModified: w.updated,
        author: { "@id": ids(base).person, name: profile.displayName },
        publisher: { "@id": ids(base).person },
        isPartOf: { "@id": ids(base).website },
        image: w.cover ? (w.cover.startsWith("http") ? w.cover : `${base}${w.cover}`) : `${base}/opengraph-image`,
        articleSection: w.category,
        keywords: w.tags.join(", "),
        about: [w.category, w.competition].filter(Boolean),
        inLanguage: lang,
        wordCount: plainText(w.content).split(" ").length,
        proficiencyLevel: w.difficulty ?? undefined,
      },
      breadcrumbJsonLd(base, [
        { name: "Home", path: "/" },
        { name: "Writeups", path: "/writeups" },
        { name: w.title, path: w.href },
      ]),
    ],
  };
  return (
    <main className="mx-auto max-w-[1600px] px-4 pt-32 pb-24 md:px-8 md:pt-44">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <Link href="/writeups" className="meta hover:text-foreground">
        ← writeups
      </Link>
      <header className="mt-8 border-b border-border pb-10">
        <p className="meta">
          <span className="text-primary">{w.category}</span>
          {w.difficulty && ` · ${w.difficulty}`}
          {w.competition && ` · ${w.competition}`} · {formatDate(w.date)}
        </p>
        <SplitHeading as="h1" text={w.title} className="mt-4 max-w-6xl font-display text-5xl leading-[0.9] font-black tracking-[-0.04em] md:text-8xl" />
        {w.summary && <p className="mt-8 max-w-2xl text-lg text-muted-foreground">{w.summary}</p>}
        {w.tags.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-2">
            {w.tags.map((t) => (
              <li key={t} className="rounded-full border border-border px-3 py-1 font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                {t}
              </li>
            ))}
          </ul>
        )}
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_17rem] xl:gap-20">
        <ArticleBody html={html} lang={lang} />
        <div>
          <ArticleSidebar
            toc={toc}
            info={{
              category: w.category,
              difficulty: w.difficulty,
              competition: w.competition,
              date: formatDate(w.date),
              minutes: readingMinutes(w.content),
              hasAttachments: w.attachments.length > 0,
              hasFlag: !!w.flag,
            }}
          />
        </div>
      </div>

      {w.flag && <FlagReveal flag={w.flag} />}

      <WriteupExport href={w.href} attachments={w.attachments} />

      <RelatedWriteups items={related} />

      <nav className="mt-16 grid gap-6 border-t border-border pt-8 md:grid-cols-2" aria-label="More writeups">
        {adjacent.prev ? (
          <Link href={adjacent.prev.href} className="group">
            <span className="meta">← newer {w.category}</span>
            <span className="mt-2 block font-display text-2xl font-semibold group-hover:text-primary">{adjacent.prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {adjacent.next && (
          <Link href={adjacent.next.href} className="group md:text-right">
            <span className="meta">older {w.category} →</span>
            <span className="mt-2 block font-display text-2xl font-semibold group-hover:text-primary">{adjacent.next.title}</span>
          </Link>
        )}
      </nav>
    </main>
  );
}
