import type { Metadata } from "next"
import * as React from "react"
import { Cpu, ShieldCheck, Box, ExternalLink } from "lucide-react"
import { listProjects } from "@/lib/server-storage"
import { SITE_BASE_URL } from "@/lib/seo-utils"
import { ProjectCard } from "./ProjectCard"
import { PageBackground } from "@/components/PageBackground"
import { GlowingEffect } from "@/components/ui/glowing-effect"

const projectsUrl = `${SITE_BASE_URL}/projects`

export const metadata: Metadata = {
  title: "Technical Projects by Elang Dimas Syadewa",
  description:
    "Technical projects built by Elang Dimas Syadewa (Claritys), covering cybersecurity tools, web applications, and security research.",
  alternates: {
    canonical: projectsUrl,
  },
  openGraph: {
    title: "Technical Projects by Elang Dimas Syadewa | Claritys Portfolio",
    description:
      "Technical projects built by Elang Dimas Syadewa (Claritys), covering cybersecurity tools, web applications, and security research.",
    url: projectsUrl,
    type: "website",
  },
}

// Revalidate every 60 seconds — data stays fresh without hitting DB on every request.
export const revalidate = 60

// Server Component — data fetched at request time, crawlers see full HTML.
export default async function ProjectsPage() {
  const projects = await listProjects().catch(() => [])

  return (
    <main className="relative isolate min-h-screen overflow-x-hidden">
      <PageBackground />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-4 mb-12">
          <div className="flex items-center space-x-2 text-secondary">
            <Cpu className="h-5 w-5" />
            <span className="font-code text-sm font-bold uppercase tracking-widest">Showcase</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-headline font-bold">Technical Projects</h1>
          <p className="text-muted-foreground max-w-2xl text-sm md:text-base">
            A deep dive into the technical solutions I&apos;ve architected, focusing on security, performance, and
            scalability.
          </p>
        </div>

        {projects.length > 0 ? (
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {projects.map((project, idx) => (
              <li key={project.id || idx} className="list-none group">
                {/* ProjectCard is a Client Component — event handlers live there */}
                <ProjectCard project={project} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="relative rounded-xl border border-border p-1">
            <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
            <div className="relative rounded-lg border border-border bg-background/72 py-20 text-center backdrop-blur-sm">
              <Box className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground font-code">No technical projects documented in the database yet.</p>
            </div>
          </div>
        )}

        <div className="group relative mt-12 rounded-xl border border-border p-1 md:mt-20">
          <GlowingEffect spread={46} glow disabled={false} proximity={80} inactiveZone={0.01} borderWidth={2} />
          <div className="relative overflow-hidden rounded-lg border border-border bg-muted/30 p-6 text-center backdrop-blur-sm md:p-8">
            <div className="absolute inset-0 bg-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />
            <ShieldCheck className="relative z-10 mx-auto mb-4 h-8 w-8 text-primary md:h-10 md:w-10" />
            <h3 className="relative z-10 mb-2 text-lg font-headline font-bold md:text-xl">Commitment to Secure Coding</h3>
            <p className="relative z-10 mx-auto max-w-xl text-xs text-muted-foreground md:text-sm">
              Security-focused projects are documented with implementation notes and reviewed as they evolve. View more
              experiments on my{" "}
              <a
                href="https://github.com/Claritys11"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-primary hover:underline"
              >
                GitHub Laboratory <ExternalLink className="inline h-3 w-3" />
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
