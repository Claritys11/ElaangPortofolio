
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  Terminal, 
  Calendar, 
  Trophy, 
  Tag as TagIcon, 
  ChevronLeft, 
  Flag, 
  Lock, 
  Unlock,
  FileText,
  Code,
  Download,
  Paperclip,
  Loader2,
  Eye,
  EyeOff
} from "lucide-react"
import { cn } from "@/lib/utils"
import { fetchJson } from "@/lib/api-client"
import type { WriteupRecord } from "@/lib/portfolio-types"

export default function WriteupDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [isFlagRevealed, setIsFlagRevealed] = React.useState(false)
  const [data, setData] = React.useState<WriteupRecord | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    let isActive = true

    const loadWriteup = async () => {
      try {
        const nextWriteup = await fetchJson<WriteupRecord>(`/api/public/writeups/${id}`)
        if (isActive) {
          setData(nextWriteup)
        }
      } catch {
        if (isActive) {
          setData(null)
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    if (id) {
      void loadWriteup()
    } else {
      setIsLoading(false)
    }

    return () => {
      isActive = false
    }
  }, [id])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="font-code text-muted-foreground">Decrypting write-up data...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Terminal className="h-12 w-12 text-muted" />
        <h1 className="text-2xl font-bold">Write-up not found</h1>
        <Button onClick={() => router.push('/ctf')}>Return to Repository</Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 lg:py-20">
      <Button 
        variant="ghost" 
        size="sm" 
        className="mb-8 text-muted-foreground hover:text-primary pl-0"
        onClick={() => router.back()}
      >
        <ChevronLeft className="h-4 w-4 mr-1" /> Back to Database
      </Button>

      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-primary border-primary/30 uppercase text-[10px] tracking-widest">
              {data.category}
            </Badge>
            <span className={cn(
              "text-[10px] uppercase font-bold px-2 py-0.5 rounded border",
              data.difficulty === "Hard" ? "border-red-500/50 text-red-400" : 
              data.difficulty === "Medium" ? "border-yellow-500/50 text-yellow-400" : 
              "border-green-500/50 text-green-400"
            )}>
              {data.difficulty}
            </span>
          </div>
          <h1 className="text-5xl font-headline font-bold leading-tight tracking-tight">
            {data.title}
          </h1>
        </div>

        {/* Properties Grid - Notion Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 bg-muted/30 border border-border rounded-xl">
          <div className="flex items-center text-sm">
            <Trophy className="h-4 w-4 mr-3 text-muted-foreground" />
            <span className="text-muted-foreground w-24">Competition</span>
            <span className="font-medium">{data.competition}</span>
          </div>
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 mr-3 text-muted-foreground" />
            <span className="text-muted-foreground w-24">Date</span>
            <span className="font-medium">{data.date}</span>
          </div>
          <div className="flex items-center text-sm">
            <Flag className="h-4 w-4 mr-3 text-muted-foreground" />
            <span className="text-muted-foreground w-24">Solved</span>
            <span className="font-medium text-green-400 flex items-center">
              <Unlock className="h-3 w-3 mr-1" /> Decrypted
            </span>
          </div>
          <div className="flex items-center text-sm">
            <TagIcon className="h-4 w-4 mr-3 text-muted-foreground" />
            <span className="text-muted-foreground w-24">Tags</span>
            <div className="flex gap-2">
              {(data.tags || []).map(tag => (
                <span key={tag} className="text-[10px] font-code border border-primary/20 bg-primary/10 text-primary px-2 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <Separator className="bg-border/60" />

        {/* Content Body - Notion Style Layout */}
        <article className="max-w-none space-y-12 pb-20">
          <section className="space-y-4">
            <h2 className="text-2xl font-headline font-bold flex items-center">
              <FileText className="h-5 w-5 mr-3 text-secondary" />
              Overview
            </h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {data.summary}
            </p>
          </section>

          <section className="space-y-4">
             <h2 className="text-2xl font-headline font-bold flex items-center">
              <Code className="h-5 w-5 mr-3 text-secondary" />
              Documentation
            </h2>
            <div 
              className="prose prose-invert prose-primary max-w-none bg-muted/20 p-6 rounded-lg border border-border/50 font-body overflow-hidden"
              dangerouslySetInnerHTML={{ __html: data.content || "" }}
            />
          </section>

          {(data.attachments || []).length > 0 && (
            <section className="space-y-4">
              <h2 className="text-2xl font-headline font-bold flex items-center">
                <Paperclip className="h-5 w-5 mr-3 text-secondary" />
                Challenge Attachments
              </h2>
              <div className="space-y-2">
                {(data.attachments || []).map((attachment, index) => (
                  <a
                    key={`${attachment.url}-${index}`}
                    href={attachment.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3 hover:border-primary/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-primary break-all">
                        {attachment.name || `Attachment ${index + 1}`}
                      </p>
                      {attachment.contentType ? (
                        <p className="text-[10px] text-muted-foreground">{attachment.contentType}</p>
                      ) : null}
                    </div>
                    <Download className="h-4 w-4 text-primary shrink-0 ml-3" />
                  </a>
                ))}
              </div>
            </section>
          )}

          <section className="p-8 bg-primary/5 border border-primary/20 rounded-xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-headline font-bold text-primary flex items-center">
                <Flag className="h-5 w-5 mr-3" />
                Flag Captured
              </h3>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-primary/50 text-primary hover:bg-primary/10"
                onClick={() => setIsFlagRevealed(!isFlagRevealed)}
              >
                {isFlagRevealed ? (
                  <><EyeOff className="h-3 w-3 mr-2" /> HIDE SIGNAL</>
                ) : (
                  <><Eye className="h-3 w-3 mr-2" /> REVEAL FLAG SIGNAL</>
                )}
              </Button>
            </div>
            
            <div className={cn(
              "p-6 rounded-lg font-code text-center text-lg font-bold border transition-all duration-500",
              isFlagRevealed 
                ? "bg-primary/20 border-primary/50 text-primary blur-none" 
                : "bg-black/40 border-dashed border-primary/20 text-primary/10 blur-[6px] select-none"
            )}>
              {isFlagRevealed ? (data.flag || "FLAG_RECOVERED_SUCCESSFULLY") : "XXXXXXXXXXXXXXXXXXXXXXXXXXXX"}
            </div>
            
            {!isFlagRevealed && (
              <p className="text-[10px] text-center font-code text-muted-foreground uppercase tracking-widest animate-pulse">
                Click reveal button to authorize data visualization
              </p>
            )}
          </section>
        </article>
      </div>
    </div>
  )
}
