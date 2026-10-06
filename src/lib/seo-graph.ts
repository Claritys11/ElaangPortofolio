import type { Profile } from "@/lib/types";

/** Stable node ids so page-level JSON-LD can reference the site and the person without repeating them. */
export const ids = (base: string) => ({ website: `${base}/#website`, person: `${base}/#person` });

const abs = (base: string, url: string) => (url.startsWith("http") ? url : `${base}${url.startsWith("/") ? "" : "/"}${url}`);

export function siteGraph(p: Profile, base: string) {
  const id = ids(base);
  const school = p.education.at(-1);
  const sameAs = [...new Set([p.githubUrl, p.instagramUrl, ...p.seo.sameAs].filter((u): u is string => !!u && u.startsWith("http") && !u.startsWith(base)))];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": id.website,
        url: `${base}/`,
        name: p.seo.siteName ?? `${p.displayName} Portfolio`,
        alternateName: [p.alias, p.displayName],
        description: p.seo.description,
        inLanguage: ["en", "id"],
        publisher: { "@id": id.person },
      },
      {
        "@type": "Person",
        "@id": id.person,
        name: p.displayName,
        alternateName: p.alias,
        url: `${base}/`,
        image: abs(base, p.profileImageUrl),
        jobTitle: p.seo.jobTitle,
        description: p.aboutText || undefined,
        email: p.email ? `mailto:${p.email}` : undefined,
        sameAs,
        knowsAbout: p.skills.map((s) => s.name),
        ...(school ? { affiliation: { "@type": "EducationalOrganization", name: school.school } } : {}),
        homeLocation: { "@type": "Place", name: "Malang, East Java, Indonesia" },
      },
    ],
  };
}
