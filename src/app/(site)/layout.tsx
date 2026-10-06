import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { ContactSection } from "@/components/site/contact-section";
import { Nav } from "@/components/site/nav";
import { CinematicFooter, type FooterLink } from "@/components/ui/motion-footer";
import { getProfile } from "@/lib/data/profile";
import { getCategoryStats, getCompetitions } from "@/lib/data/writeups";

export const dynamic = "force-dynamic";

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
      <Nav brand={profile.brand} />
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
