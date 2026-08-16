"use client"

import * as React from "react"
import { Award, Trophy, CheckCircle2, ZoomIn, Paperclip, ChevronDown, ExternalLink } from "lucide-react"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { AchievementRecord } from "@/lib/portfolio-types"

// ── Attachment list (client — uses Collapsible state) ──────────────────────
function AchievementAttachmentList({
  attachments,
  stopCardAction = false,
}: {
  attachments?: AchievementRecord["attachments"]
  stopCardAction?: boolean
}) {
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
    <Collapsible className="mt-3 w-full min-w-0 overflow-hidden rounded-lg border border-border/60 bg-muted/20 p-2">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          onClick={(e) => { if (stopCardAction) e.stopPropagation() }}
          onPointerDown={(e) => { if (stopCardAction) e.stopPropagation() }}
          className="flex w-full min-w-0 items-center justify-between rounded-md px-2 py-1.5 text-left text-[10px] uppercase tracking-wider text-muted-foreground hover:bg-background/40"
        >
          <span className="flex min-w-0 items-center gap-1.5 truncate">
            <Paperclip className="h-3 w-3" /> Attachments ({normalized.length})
          </span>
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 min-w-0 space-y-1.5 overflow-hidden">
        {normalized.map((a, i) => (
          <a
            key={`${a.url}-${i}`}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => { if (stopCardAction) e.stopPropagation() }}
            onPointerDown={(e) => { if (stopCardAction) e.stopPropagation() }}
            className="flex w-full min-w-0 items-center justify-between gap-2 rounded-md border border-border/60 bg-background/70 px-2 py-1.5 text-xs text-primary hover:border-primary/40"
          >
            <span className="min-w-0 truncate">{a.name || `Attachment ${i + 1}`}</span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          </a>
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

// ── Main client component ───────────────────────────────────────────────────
interface AchievementClientProps {
  certifications: AchievementRecord[]
  quickStats: AchievementRecord[]
}

export function AchievementClient({ certifications, quickStats }: AchievementClientProps) {
  return (
    <>
      {/* Certifications grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20 items-start">
        {certifications.length > 0 ? (
          certifications.map((cert, idx) => (
            <Dialog key={cert.id || idx}>
              <DialogTrigger asChild>
                <div className="relative group min-w-0 rounded-xl border border-border p-1 block cursor-zoom-in transition-transform hover:scale-[1.02]">
                  <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
                  <div className="relative min-w-0 bg-background rounded-lg overflow-hidden h-full flex flex-col">
                    <div className="relative h-56 bg-muted/20">
                      {cert.imageUrl ? (
                        <img
                          src={cert.imageUrl}
                          alt={cert.title}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Award className="h-12 w-12 text-primary opacity-20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors" />
                      <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        <ZoomIn className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                    <div className="p-6 min-w-0 flex-1 flex flex-col justify-between border-t border-border/50">
                      <div>
                        <p className="text-[10px] font-code text-primary uppercase mb-1">{cert.issuer}</p>
                        <h3 className="text-lg font-headline font-bold">{cert.title}</h3>
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">{cert.description}</p>
                        <AchievementAttachmentList attachments={cert.attachments} stopCardAction />
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center text-xs text-muted-foreground font-code">
                          <CheckCircle2 className="h-3 w-3 mr-1 text-primary" />
                          VERIFIED
                        </div>
                        <p className="text-xs text-muted-foreground">{cert.date}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-5xl bg-background/95 backdrop-blur-md border-primary/20 p-0 overflow-hidden">
                <div className="relative w-full h-full flex items-center justify-center bg-black/20">
                  <img
                    src={cert.imageUrl}
                    alt={cert.title}
                    className="max-w-full max-h-[85vh] object-contain shadow-2xl"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
                    <p className="text-xs font-code text-primary uppercase mb-1">{cert.issuer}</p>
                    <DialogTitle className="text-xl font-headline font-bold">{cert.title}</DialogTitle>
                    <DialogDescription className="text-sm opacity-80 text-white/90">{cert.description}</DialogDescription>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ))
        ) : (
          <div className="col-span-full text-center py-10 opacity-50 font-code text-sm">
            No visual credentials recorded.
          </div>
        )}
      </div>

      {/* Competitive milestones */}
      <h2 className="text-2xl font-headline font-bold mb-8 flex items-center">
        <Trophy className="h-6 w-6 mr-3 text-secondary" />
        Competitive Milestones
      </h2>

      <div className="grid md:grid-cols-3 gap-6 items-start">
        {quickStats.length > 0 ? (
          quickStats.map((item, idx) => (
            <div key={item.id || idx} className="relative group min-w-0 rounded-xl border border-border p-1">
              <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
              <div className="relative p-6 min-w-0 h-full flex flex-col bg-background rounded-lg border border-border group-hover:bg-muted/10 transition-colors">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <p className="text-xs font-code text-secondary mb-1">{item.platform || item.issuer}</p>
                <h3 className="text-lg font-headline font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>
                <AchievementAttachmentList attachments={item.attachments} />
                <div className="mt-auto pt-4 text-[10px] font-code text-muted-foreground">{item.date}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-10 opacity-50 font-code text-sm">No milestones logged.</div>
        )}
      </div>
    </>
  )
}
