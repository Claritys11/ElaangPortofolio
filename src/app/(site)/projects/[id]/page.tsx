import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Media } from "@/components/site/media";
import { SectionLabel } from "@/components/site/section-label";
import { SplitHeading } from "@/components/motion/split-heading";
import { listProjects } from "@/lib/data/projects";
import { breadcrumbJsonLd, jsonLdScript, pageOpenGraph, truncate } from "@/lib/seo";
import { ids } from "@/lib/seo-graph";
import { siteUrl } from "@/lib/site";

export const dynamicParams = false;

type Params = { params: Promise<{ id: string }> };

async function getProject(id: string) {
  return (await listProjects()).find((project) => project.id === id) ?? null;
}

export async function generateStaticParams() {
  return (await listProjects()).map((project) => ({ id: project.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const project = await getProject((await params).id);
  if (!project) return { title: "Not found", robots: { index: false } };
  const pathname = `/projects/${encodeURIComponent(project.id)}`;
  return {
    title: project.title,
    description: truncate(project.description || `${project.title} — ${project.category} project by Elang Dimas Syadewa.`, 158),
    alternates: { canonical: pathname },
    openGraph: pageOpenGraph(pathname),
  };
}

export default async function ProjectDetailPage({ params }: Params) {
  const project = await getProject((await params).id);
  if (!project) notFound();

  const base = siteUrl();
  const pathname = `/projects/${encodeURIComponent(project.id)}`;
  const detailUrl = `${base}${pathname}`;
  const image = project.imageUrl
    ? (project.imageUrl.startsWith("http") || project.imageUrl.startsWith("data:") ? project.imageUrl : `${base}${project.imageUrl.startsWith("/") ? project.imageUrl : `/${project.imageUrl}`}`)
    : undefined;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        "@id": `${detailUrl}#project`,
        url: detailUrl,
        name: project.title,
        description: project.description,
        image: image?.startsWith("data:") ? undefined : image,
        genre: project.category,
        keywords: project.tags.join(", "),
        creator: { "@id": ids(base).person },
        isPartOf: { "@id": ids(base).website },
        sameAs: project.projectUrl ?? undefined,
      },
      breadcrumbJsonLd(base, [
        { name: "Home", path: "/" },
        { name: "Projects", path: "/projects" },
        { name: project.title, path: pathname },
      ]),
    ],
  };

  return (
    <main className="mx-auto max-w-[1200px] px-4 pt-32 pb-24 md:px-8 md:pt-44">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <Link href="/projects" className="meta hover:text-foreground">← all projects</Link>
      <div className="mt-10">
        <SectionLabel index={3} name={project.category.toLowerCase()} />
        <SplitHeading as="h1" text={project.title} deferUntilIdle className="mt-4 mb-10 max-w-6xl font-display text-[14vw] leading-[0.86] font-black tracking-[-0.05em] md:text-[8vw]" />
      </div>
      {project.imageUrl && <Media src={project.imageUrl} alt={project.title} eager className="aspect-[16/9] w-full" />}
      <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,1fr)_18rem]">
        <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">{project.description}</p>
        <aside className="grid content-start gap-4">
          <p className="meta">{project.category}</p>
          {project.tags.length > 0 && <p className="meta leading-relaxed">{project.tags.join(" · ")}</p>}
          {project.projectUrl && (
            <a href={project.projectUrl} target="_blank" rel="noopener noreferrer" className="meta inline-block w-fit border-b border-primary pb-1 text-foreground">
              visit project ↗
            </a>
          )}
        </aside>
      </div>
    </main>
  );
}
