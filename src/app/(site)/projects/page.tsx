import type { Metadata } from "next";
import { Reveal } from "@/components/motion/reveal";
import { SplitHeading } from "@/components/motion/split-heading";
import { Media } from "@/components/site/media";
import { SectionLabel } from "@/components/site/section-label";
import { listProjects } from "@/lib/data/projects";
import { breadcrumbJsonLd, jsonLdScript, pageOpenGraph, truncate } from "@/lib/seo";
import { ids } from "@/lib/seo-graph";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const projects = await listProjects();
  return {
    title: "Projects — Web Apps & Security Tooling",
    description: truncate(`Projects built by Elang Dimas Syadewa (Claritys): ${projects.map((p) => p.title.split(" — ")[0]).join(", ")}.`, 158),
    alternates: { canonical: "/projects" },
    openGraph: pageOpenGraph("/projects"),
  };
}

export default async function ProjectsPage() {
  const projects = await listProjects();
  const base = siteUrl();
  const abs = (u: string | null) => (u ? (u.startsWith("http") || u.startsWith("data:") ? u : `${base}${u}`) : undefined);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        url: `${base}/projects`,
        name: "Projects",
        isPartOf: { "@id": ids(base).website },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: projects.length,
          itemListElement: projects.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "CreativeWork",
              name: p.title,
              description: p.description,
              url: p.projectUrl ?? undefined,
              image: abs(p.imageUrl)?.startsWith("data:") ? undefined : abs(p.imageUrl),
              genre: p.category,
              keywords: p.tags.join(", "),
              creator: { "@id": ids(base).person },
            },
          })),
        },
      },
      breadcrumbJsonLd(base, [
        { name: "Home", path: "/" },
        { name: "Projects", path: "/projects" },
      ]),
    ],
  };
  return (
    <main className="mx-auto max-w-[1600px] px-4 pt-32 pb-24 md:px-8 md:pt-44">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <SectionLabel index={3} name="projects" />
      <SplitHeading as="h1" text="Projects" className="mt-4 mb-20 font-display text-[18vw] leading-[0.8] font-black tracking-[-0.05em] md:text-[12vw]" />
      <Reveal stagger className="grid gap-x-8 gap-y-20 md:grid-cols-2">
        {projects.map((p, i) => (
          <article key={p.id} className={i % 2 ? "md:mt-32" : ""}>
            <Media src={p.imageUrl} alt={p.title} className="aspect-[4/3] w-full" />
            <div className="mt-5 flex items-baseline justify-between gap-6">
              <h2 className="font-display text-3xl font-semibold tracking-tight">{p.title}</h2>
              <span className="meta shrink-0">{p.category}</span>
            </div>
            <p className="mt-3 text-muted-foreground">{p.description}</p>
            {p.tags.length > 0 && <p className="meta mt-4">{p.tags.join(" · ")}</p>}
            {p.projectUrl && (
              <a href={p.projectUrl} target="_blank" rel="noopener noreferrer" className="meta mt-5 inline-block border-b border-primary pb-1 text-foreground">
                visit ↗
              </a>
            )}
          </article>
        ))}
      </Reveal>
    </main>
  );
}
