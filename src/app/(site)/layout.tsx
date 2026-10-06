import type { Metadata } from "next";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { ContactSection } from "@/components/site/contact-section";
import { Nav } from "@/components/site/nav";
import { CinematicFooter, type FooterLink } from "@/components/ui/motion-footer";
import { getProfile } from "@/lib/data/profile";
import { getCategoryStats, getCompetitions } from "@/lib/data/writeups";
import { jsonLdScript, pageOpenGraph, truncate } from "@/lib/seo";
import { siteGraph } from "@/lib/seo-graph";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const p = await getProfile();
  const siteName = p.seo.siteName ?? `${p.displayName} Portfolio`;
  return {
    // absolute: the root layout's own template must not wrap the site's home title.
    title: {
      absolute: p.seo.defaultTitle ?? `${p.displayName} (${p.alias}) — Pwn & CTF Writeups`,
      template: p.seo.titleTemplate ?? `%s — ${p.displayName} (${p.alias})`,
    },
    description: truncate(p.seo.description ?? "Pwn-focused CTF player and builder from Malang, Indonesia.", 158),
    keywords: p.seo.keywords,
    authors: [{ name: p.displayName, url: siteUrl() }],
    creator: p.displayName,
    applicationName: siteName,
    openGraph: pageOpenGraph("/", { siteName, locale: p.seo.locale ?? "id_ID" }),
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
    category: "technology",
  };
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [profile, stats, competitions] = await Promise.all([getProfile(), getCategoryStats(), getCompetitions()]);
  const primaryLinks: FooterLink[] = [
    ...(profile.githubUrl ? [{ label: "GitHub", href: profile.githubUrl, icon: "github" as const, external: true }] : []),
    ...(profile.email ? [{ label: "Email me", href: `mailto:${profile.email}`, icon: "mail" as const }] : []),
  ];
  const secondaryLinks: FooterLink[] = [
    ...(profile.instagramUrl ? [{ label: "Instagram", href: profile.instagramUrl, external: true }] : []),
    { label: "Writeups", href: "/writeups" },
    { label: "Projects", href: "/projects" },
  ];
  return (
    <SmoothScroll>
      {/* Fade under the blend-mode nav so long-form text doesn't scroll visibly through it. */}
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-40 h-20 bg-gradient-to-b from-background via-background/80 to-transparent" />
      <Nav brand={profile.brand} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(siteGraph(profile, siteUrl())) }} />
      <div id="content" className="relative z-10 bg-background">
        {children}
        <ContactSection />
      </div>
      <CinematicFooter
        giantText="ELANG"
        secretText={profile.alias.toUpperCase()}
        marquee={[...stats.map((s) => s.category.toUpperCase()), ...competitions.slice(0, 6)]}
        heading="Got a binary for me?"
        primaryLinks={primaryLinks}
        secondaryLinks={secondaryLinks}
        copyright={`© ${new Date().getFullYear()} ${profile.displayName}`}
        creditName={profile.alias}
      />
    </SmoothScroll>
  );
}
