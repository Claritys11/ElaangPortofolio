import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SplitHeading } from "@/components/motion/split-heading";
import { ArticleBody } from "@/components/site/article-body";
import { ArticleSidebar } from "@/components/site/article-sidebar";
import { FlagReveal } from "@/components/site/flag-reveal";
import { RelatedWriteups } from "@/components/site/related-writeups";
import { getProfile } from "@/lib/data/profile";
import { getAdjacentWriteups, getWriteup, listWriteups } from "@/lib/data/writeups";
import { relatedWriteups } from "@/lib/related";
import { formatDate, readingMinutes } from "@/lib/format";
import { renderWriteupHtml } from "@/lib/html";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const w = await getWriteup((await params).slug);
  if (!w) return { title: "Not found" };
  return {
    title: w.title,
    description: w.summary || `${w.category} writeup from ${w.competition}`,
    alternates: { canonical: w.href },
    openGraph: { type: "article", title: w.title, description: w.summary, images: w.cover ? [w.cover] : undefined, publishedTime: w.date ?? undefined },
  };
}

export default async function WriteupPage({ params }: Params) {
  const w = await getWriteup((await params).slug);
  if (!w) notFound();
  const [{ html, toc }, adjacent, profile, all] = await Promise.all([renderWriteupHtml(w.content), getAdjacentWriteups(w), getProfile(), listWriteups()]);
  const related = relatedWriteups(w, all, 3);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: w.title,
    datePublished: w.date ?? undefined,
    author: { "@type": "Person", name: profile.displayName, url: profile.websiteUrl ?? undefined },
    keywords: w.tags.join(", "),
  };

  return (
    <main className="mx-auto max-w-[1600px] px-4 pt-32 pb-24 md:px-8 md:pt-44">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
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
        <ArticleBody html={html} />
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

      {w.attachments.length > 0 && (
        <section id="attachments" className="mt-16 scroll-mt-24">
          <p className="meta mb-4">attachments</p>
          <ul className="grid gap-2">
            {w.attachments.map((a) => (
              <li key={a.url}>
                <a href={a.url} download className="font-mono text-sm underline decoration-primary underline-offset-4">
                  {a.name.replace(/^[0-9a-f-]{36}-/, "")}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {w.flag && <FlagReveal flag={w.flag} />}

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
