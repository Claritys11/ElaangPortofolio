"use client"

import * as React from "react"
import { ExternalLink, Paperclip, ChevronDown } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { ProjectRecord } from "@/lib/portfolio-types"

export function ProjectAttachmentList({ attachments }: { attachments?: ProjectRecord["attachments"] }) {
  const normalized = React.useMemo(() => {
    return (attachments || [])
      .map((a) => ({
        name: typeof a?.name === "string" ? a.name.trim() : "",
        url: typeof a?.url === "string" ? a.url.trim() : "",
      }))
      .filter((a) => Boolean(a.url))
  }, [attachments])

  if (!normalized.length) return null

  return (
    <Collapsible className="mt-4 rounded-lg border border-border/60 bg-muted/20 p-2">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          data-interactive="true"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[10px] uppercase tracking-wider text-muted-foreground hover:bg-background/40"
        >
          <span className="flex items-center gap-1.5">
            <Paperclip className="h-3 w-3" /> Attachments ({normalized.length})
          </span>
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-1.5">
        {normalized.map((a, i) => (
          <a
            key={`${a.url}-${i}`}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            data-interactive="true"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex w-full items-center justify-between gap-2 rounded-md border border-border/60 bg-background/70 px-2 py-1.5 text-left text-xs text-primary hover:border-primary/40"
          >
            <span className="truncate">{a.name || `Attachment ${i + 1}`}</span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          </a>
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}
