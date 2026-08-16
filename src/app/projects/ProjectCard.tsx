"use client"

import * as React from "react"
import { Box, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { cn } from "@/lib/utils"
import { ProjectAttachmentList } from "./ProjectAttachmentList"
import type { ProjectRecord } from "@/lib/portfolio-types"

export function ProjectCard({ project }: { project: ProjectRecord }) {
  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!project.projectUrl) return
      const target = e.target as HTMLElement | null
      if (target?.closest('[data-interactive="true"]')) return
      window.open(project.projectUrl, "_blank", "noopener,noreferrer")
    },
    [project.projectUrl]
  )

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!project.projectUrl) return
      if (e.target !== e.currentTarget) return
      if (e.key !== "Enter" && e.key !== " ") return
      e.preventDefault()
      window.open(project.projectUrl, "_blank", "noopener,noreferrer")
    },
    [project.projectUrl]
  )

  return (
    <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-1.5 md:p-2">
      <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={3} />
      <div
        className={cn(
          "relative flex h-full flex-col overflow-hidden rounded-xl border-[0.75px] bg-background p-5 md:p-6 shadow-sm transition-all",
          project.projectUrl ? "cursor-pointer hover:border-primary/50" : "cursor-default"
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role={project.projectUrl ? "button" : undefined}
        tabIndex={project.projectUrl ? 0 : undefined}
      >
        <div className="relative h-48 mb-6 rounded-lg overflow-hidden border border-border/50 bg-muted/20">
          {project.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.imageUrl}
              alt={project.title ?? "Project image"}
              className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Box className="h-12 w-12 text-muted-foreground opacity-20" />
            </div>
          )}
          {project.projectUrl && (
            <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalLink className="h-4 w-4 text-primary" />
            </div>
          )}
        </div>
        <div className="flex justify-between items-start mb-4">
          <Badge
            variant="outline"
            className="text-[8px] md:text-[9px] uppercase tracking-tighter border-primary/20 text-primary/70 bg-primary/5"
          >
            {project.category}
          </Badge>
        </div>
        <div className="space-y-3 flex-1">
          <h2 className="text-xl leading-tight font-bold font-headline tracking-tight text-foreground group-hover:text-primary transition-colors">
            {project.title}
          </h2>
          <p className="font-body text-xs md:text-sm leading-relaxed text-muted-foreground line-clamp-4">
            {project.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-border/50">
          {(project.tags || []).map((tag) => (
            <span
              key={tag}
              className="text-[9px] md:text-[10px] font-code px-2 py-0.5 rounded bg-muted border border-border/50"
            >
              {tag}
            </span>
          ))}
        </div>
        <ProjectAttachmentList attachments={project.attachments} />
      </div>
    </div>
  )
}
