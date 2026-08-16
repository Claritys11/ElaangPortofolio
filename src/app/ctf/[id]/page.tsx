import * as React from "react"
import { notFound, permanentRedirect } from "next/navigation"
import type { Metadata } from "next"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import {
  Calendar,
  Trophy,
  Tag as TagIcon,
  Flag,
  Unlock,
  FileText,
  Code,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getWriteupById, listWriteupSummaries } from "@/lib/server-storage"
import {
  BRAND_NAME,
  getWriteupMetaDescription,
  getWriteupMetaTitle,
  getWriteupPath,
  getWriteupUrl,
  SITE_BASE_URL,
  SITE_NAME,
} from "@/lib/seo-utils"
import { FlagReveal } from "./FlagReveal"
import { WriteupActions } from "./WriteupActions"
import Link from "next/link"

// ──────────────────────────────────────────
// Dynamic metadata per writeup — this is what
// gets indexed by Google and shown in link previews.
// ──────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const writeup = await getWriteupById(id).catch(() => null)

  if (!writeup) {
    return {
      title: "Write-up Not Found",
      description: "This CTF write-up could not be found.",
    }
  }

  const title = getWriteupMetaTitle(writeup)
  const description = getWriteupMetaDescription(writeup)
  const url = getWriteupUrl(writeup)

  return {
    title,
    description,
    alternates: { canonical: url },
    keywords: [
      "CTF",
      "writeup",
      "write-up",
      BRAND_NAME,
      writeup.category,
      writeup.competition,
      writeup.difficulty,
      ...(writeup.tags ?? []),
    ].filter(Boolean) as string[],
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: SITE_NAME,
      publishedTime: writeup.createdAt,
      modifiedTime: writeup.updatedAt,
      tags: writeup.tags,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

// ──────────────────────────────────────────
// Server Component — fetches writeup on the server
// so crawlers see full HTML content immediately.
// ──────────────────────────────────────────
export default async function WriteupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getWriteupById(id).catch(() => null)

  if (!data) {
    notFound()
  }

  if (data.slug && id !== data.slug) {
    permanentRedirect(getWriteupPath(data))
  }

  const allWriteups = await listWriteupSummaries().catch(() => [])
  const relatedWriteups = allWriteups
    .filter((writeup) => writeup.id !== data.id)
    .filter((writeup) => {
      const sharesCategory = writeup.category && writeup.category === data.category
      const sharesTag = (writeup.tags ?? []).some((tag) => (data.tags ?? []).includes(tag))
      return sharesCategory || sharesTag
    })
    .slice(0, 3)

  const canonicalUrl = getWriteupUrl(data)
  const articleJsonLd = {
    "@type": "BlogPosting",
    "@id": `${canonicalUrl}#article`,
    headline: data.title,
    description: getWriteupMetaDescription(data),
    url: canonicalUrl,
    mainEntityOfPage: canonicalUrl,
    datePublished: data.createdAt,
    dateModified: data.updatedAt,
    author: {
      "@type": "Person",
      "@id": `${SITE_BASE_URL}#person`,
      name: BRAND_NAME,
      url: SITE_BASE_URL,
    },
    publisher: {
      "@type": "Person",
      "@id": `${SITE_BASE_URL}#person`,
      name: BRAND_NAME,
    },
    articleSection: data.category,
    keywords: [
      data.category,
      data.competition,
      data.difficulty,
      ...(data.tags ?? []),
    ].filter(Boolean).join(", "),
  }

  const breadcrumbJsonLd = {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_BASE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "CTF Writeups",
        item: `${SITE_BASE_URL}/ctf`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: data.title,
        item: canonicalUrl,
      },
    ],
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 lg:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [articleJsonLd, breadcrumbJsonLd],
          }),
        }}
      />
      <Link
        href="/ctf"
        className="inline-flex items-center mb-8 text-sm text-muted-foreground hover:text-primary transition-colors pl-0"
      >
        ← Back to Database
      </Link>

      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <article className="max-w-none space-y-12 pb-20">
        <header className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-primary border-primary/30 uppercase text-[10px] tracking-widest"
            >
              {data.category}
            </Badge>
            <span
              className={cn(
                "text-[10px] uppercase font-bold px-2 py-0.5 rounded border",
                data.difficulty === "Hard"
                  ? "border-red-500/50 text-red-400"
                  : data.difficulty === "Medium"
                  ? "border-yellow-500/50 text-yellow-400"
                  : "border-green-500/50 text-green-400"
              )}
            >
              {data.difficulty}
            </span>
          </div>
          <h1 className="text-5xl font-headline font-bold leading-tight tracking-tight">
            {data.title}
          </h1>
          <p className="max-w-3xl text-base text-muted-foreground">
            {getWriteupMetaDescription(data)}
          </p>
        </div>

        {/* Properties Grid */}
        <div className="relative rounded-xl border border-border p-1">
          <GlowingEffect
            spread={40}
            glow={true}
            disabled={false}
            proximity={64}
            inactiveZone={0.01}
            borderWidth={2}
          />
          <dl className="relative grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 bg-muted/30 rounded-lg">
            <div className="flex items-center text-sm">
              <Trophy className="h-4 w-4 mr-3 text-muted-foreground" />
              <dt className="text-muted-foreground w-24">Competition</dt>
              <dd className="font-medium">{data.competition}</dd>
            </div>
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-3 text-muted-foreground" />
              <dt className="text-muted-foreground w-24">Date</dt>
              <dd className="font-medium">
                <time dateTime={data.date || data.createdAt}>{data.date}</time>
              </dd>
            </div>
            <div className="flex items-center text-sm">
              <Flag className="h-4 w-4 mr-3 text-muted-foreground" />
              <dt className="text-muted-foreground w-24">Solved</dt>
              <dd className="font-medium text-green-400 flex items-center">
                <Unlock className="h-3 w-3 mr-1" /> Decrypted
              </dd>
            </div>
            <div className="flex items-center text-sm">
              <TagIcon className="h-4 w-4 mr-3 text-muted-foreground" />
              <dt className="text-muted-foreground w-24">Tags</dt>
              <dd className="flex gap-2 flex-wrap">
                {(data.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-code border border-primary/20 bg-primary/10 text-primary px-2 py-0.5 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        </div>

        <WriteupActions writeup={data} />
        </header>

        <Separator className="bg-border/60" />

        {/* Content Body */}
          <section className="space-y-4">
            <h2 className="text-2xl font-headline font-bold flex items-center">
              <FileText className="h-5 w-5 mr-3 text-secondary" />
              Overview
            </h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {data.summary}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-headline font-bold flex items-center">
              <Code className="h-5 w-5 mr-3 text-secondary" />
              Documentation
            </h2>
            <div className="relative rounded-xl border border-border p-1">
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                borderWidth={2}
              />
              <div
                className="relative prose prose-invert prose-primary max-w-none bg-muted/20 p-6 rounded-lg font-body overflow-hidden"
                dangerouslySetInnerHTML={{ __html: data.content || "" }}
              />
            </div>
          </section>

          {/* Flag Reveal — isolated client component for interactivity */}
          <FlagReveal flag={data.flag} />

          {relatedWriteups.length > 0 && (
            <nav aria-label="Related writeups" className="space-y-4">
              <h2 className="text-2xl font-headline font-bold">Related Writeups</h2>
              <div className="grid gap-3">
                {relatedWriteups.map((writeup) => (
                  <Link
                    key={writeup.id}
                    href={getWriteupPath(writeup)}
                    className="rounded-lg border border-border bg-muted/20 px-4 py-3 transition-colors hover:border-primary/50"
                  >
                    <p className="font-semibold text-primary">{writeup.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{writeup.summary}</p>
                  </Link>
                ))}
              </div>
            </nav>
          )}
        </article>
      </div>
    </div>
  )
}
