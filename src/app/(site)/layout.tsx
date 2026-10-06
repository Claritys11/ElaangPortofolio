import type { Metadata } from "next";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { ContactSection } from "@/components/site/contact-section";
import { Nav } from "@/components/site/nav";
import { CinematicFooter, type FooterLink } from "@/components/ui/motion-footer";
import { getProfile } from "@/lib/data/profile";
import { getCategoryStats, getCompetitions } from "@/lib/data/writeups";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const p = await getProfile();
  return {
    keywords: p.seo.keywords,
    description: p.seo.description ?? "Pwn-focused CTF player and builder from Malang, Indonesia.",
    openGraph: { siteName: p.alias, locale: p.seo.locale },
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: profile.displayName,
            alternateName: profile.alias,
            jobTitle: profile.seo.jobTitle,
            url: profile.websiteUrl,
            sameAs: profile.seo.sameAs,
            knowsAbout: profile.skills.map((s) => s.name),
          }).replace(/</g, "\\u003c"),
        }}
      />
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
