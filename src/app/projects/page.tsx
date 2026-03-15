
"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Cpu, ShieldCheck, Lock, Box, Settings, Sparkles, Search, Loader2, ExternalLink } from "lucide-react"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"

export default function ProjectsPage() {
  const db = useFirestore()
  const projectsQuery = useMemoFirebase(() => query(collection(db, "projects"), orderBy("createdAt", "desc")), [db])
  const { data: dbProjects, isLoading } = useCollection(projectsQuery)

  // Use Firestore data if available, otherwise show empty or skeleton
  const displayProjects = dbProjects || []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-4 mb-12">
        <div className="flex items-center space-x-2 text-secondary">
          <Cpu className="h-5 w-5" />
          <span className="font-code text-sm font-bold uppercase tracking-widest">Showcase</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-headline font-bold">Technical Projects</h1>
        <p className="text-muted-foreground max-w-2xl text-sm md:text-base">
          A deep dive into the technical solutions I've architected, focusing on security, performance, and scalability.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="font-code text-muted-foreground">Retrieving project artifacts...</p>
        </div>
      ) : displayProjects.length > 0 ? (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayProjects.map((project, idx) => (
            <li key={project.id || idx} className="list-none group">
              <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-1.5 md:p-2">
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={3}
                />
                <div className="relative flex h-full flex-col overflow-hidden rounded-xl border-[0.75px] bg-background p-5 md:p-6 shadow-sm">
                  <div className="relative h-48 mb-6 rounded-lg overflow-hidden border border-border/50 bg-muted/20">
                    {project.imageUrl ? (
                      <img src={project.imageUrl} alt={project.title} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Box className="h-12 w-12 text-muted-foreground opacity-20" />
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-start mb-4">
                    <Badge variant="outline" className="text-[8px] md:text-[9px] uppercase tracking-tighter border-primary/20 text-primary/70 bg-primary/5">
                      {project.category}
                    </Badge>
                  </div>
                  <div className="space-y-3 flex-1">
                    <h3 className="text-xl leading-tight font-bold font-headline tracking-tight text-foreground group-hover:text-primary transition-colors">
                      {project.title}
                    </h3>
                    <p className="font-body text-xs md:text-sm leading-relaxed text-muted-foreground line-clamp-4">
                      {project.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-border/50">
                    {(project.tags || []).map(tag => (
                      <span key={tag} className="text-[9px] md:text-[10px] font-code px-2 py-0.5 rounded bg-muted border border-border/50">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
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
          All projects follow OWASP Top 10 guidelines and undergo rigorous manual code review. 
          View more experiments on my <a href="https://github.com/Claritys11" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">GitHub Laboratory <ExternalLink className="inline h-3 w-3" /></a>.
        </p>
      </div>
    </div>
  )
}
