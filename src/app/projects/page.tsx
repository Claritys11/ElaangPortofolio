import type { Metadata } from "next"
import * as React from "react"
import { Cpu, ShieldCheck, Box, ExternalLink } from "lucide-react"
import { listProjects } from "@/lib/server-storage"
import { SITE_BASE_URL } from "@/lib/seo-utils"
import { ProjectCard } from "./ProjectCard"

const projectsUrl = `${SITE_BASE_URL}/projects`

export const metadata: Metadata = {
  title: "Technical Projects",
  description:
    "A showcase of technical projects built by Claritys — covering cybersecurity tools, web applications, and security research.",
  alternates: {
    canonical: projectsUrl,
  },
  openGraph: {
    title: "Technical Projects | Claritys Portfolio",
    description:
      "A showcase of technical projects built by Claritys — covering cybersecurity tools, web applications, and security research.",
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
        <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
          <Box className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground font-code">No technical projects documented in the database yet.</p>
        </div>
      )}

      <div className="mt-12 md:mt-20 p-6 md:p-8 border border-border bg-muted/30 rounded-lg text-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <ShieldCheck className="h-8 md:h-10 w-8 md:w-10 text-primary mx-auto mb-4 relative z-10" />
        <h3 className="text-lg md:text-xl font-headline font-bold mb-2 relative z-10">Commitment to Secure Coding</h3>
        <p className="text-muted-foreground max-w-xl mx-auto text-xs md:text-sm relative z-10">
          Security-focused projects are documented with implementation notes and reviewed as they evolve. View more
          experiments on my{" "}
          <a
            href="https://github.com/Claritys11"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-bold"
          >
            GitHub Laboratory <ExternalLink className="inline h-3 w-3" />
          </a>
          .
        </p>
      </div>
    </div>
  )
}
