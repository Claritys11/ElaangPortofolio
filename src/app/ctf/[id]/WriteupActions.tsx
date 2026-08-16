"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import type { WriteupRecord } from "@/lib/portfolio-types"
import { Download, FileDown, FileType, Paperclip } from "lucide-react"

interface WriteupActionsProps {
  writeup: WriteupRecord
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function getExportFilename(title?: string): string {
  const slug = (title || "ctf-writeup")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

  return `${slug || "ctf-writeup"}.html`
}

function getPdfTitle(title?: string): string {
  return `${(title || "CTF Writeup").replace(/[<>:"/\\|?*\u0000-\u001f]/g, "").trim() || "CTF Writeup"} - PDF Export`
}

function buildWriteupHtml(writeup: WriteupRecord, baseUrl: string, documentTitle = writeup.title || "CTF Writeup"): string {
  const tags = (writeup.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")
  const attachments = (writeup.attachments || [])
    .filter((attachment) => attachment.url)
    .map((attachment, index) => {
      const name = attachment.name || `Attachment ${index + 1}`
      return `<li><a href="${escapeHtml(attachment.url || "")}">${escapeHtml(name)}</a></li>`
    })
    .join("")

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <base href="${escapeHtml(baseUrl)}">
  <title>${escapeHtml(documentTitle)}</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; background: #09090b; color: #f4f4f5; }
    body { margin: 0; padding: 48px 20px; }
    main { max-width: 860px; margin: 0 auto; }
    h1 { font-size: clamp(2rem, 6vw, 4rem); line-height: 1; margin: 0 0 16px; }
    h2 { margin-top: 40px; }
    .meta, .tags { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0; }
    .meta span, .tags span { border: 1px solid #3f3f46; border-radius: 6px; padding: 6px 10px; color: #d4d4d8; font-size: 0.875rem; }
    .summary { color: #d4d4d8; white-space: pre-wrap; line-height: 1.7; }
    .content { border: 1px solid #27272a; border-radius: 10px; padding: 24px; background: #18181b; overflow-wrap: anywhere; }
    .content img { max-width: 100%; height: auto; border-radius: 8px; }
    a { color: #67e8f9; }
    code, pre { white-space: pre-wrap; word-break: break-word; }
    @media print {
      :root { color-scheme: light; background: #ffffff; color: #111827; }
      body { background: #ffffff; color: #111827; padding: 0; }
      main { max-width: none; }
      .content { background: #ffffff; border-color: #d1d5db; }
      .summary, .meta span, .tags span { color: #374151; }
      a { color: #0369a1; }
    }
  </style>
</head>
<body>
  <main>
    <h1>${escapeHtml(writeup.title || "Untitled Writeup")}</h1>
    <div class="meta">
      ${writeup.competition ? `<span>Competition: ${escapeHtml(writeup.competition)}</span>` : ""}
      ${writeup.category ? `<span>Category: ${escapeHtml(writeup.category)}</span>` : ""}
      ${writeup.difficulty ? `<span>Difficulty: ${escapeHtml(writeup.difficulty)}</span>` : ""}
      ${writeup.date ? `<span>Date: ${escapeHtml(writeup.date)}</span>` : ""}
    </div>
    ${tags ? `<div class="tags">${tags}</div>` : ""}
    <h2>Overview</h2>
    <p class="summary">${escapeHtml(writeup.summary || "")}</p>
    <h2>Documentation</h2>
    <section class="content">${writeup.content || ""}</section>
    ${attachments ? `<h2>Challenge Attachments</h2><ul>${attachments}</ul>` : ""}
  </main>
</body>
</html>`
}

export function WriteupActions({ writeup }: WriteupActionsProps) {
  const attachments = React.useMemo(
    () => (writeup.attachments || []).filter((attachment) => attachment.url),
    [writeup.attachments]
  )

  const exportWriteup = () => {
    const blob = new Blob([buildWriteupHtml(writeup, window.location.origin)], { type: "text/html;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = getExportFilename(writeup.title)
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const exportPdf = () => {
    const printWindow = window.open("", "_blank")

    if (!printWindow) {
      window.print()
      return
    }

    printWindow.document.open()
    printWindow.document.write(buildWriteupHtml(writeup, window.location.origin, getPdfTitle(writeup.title)))
    printWindow.document.close()

    const printWhenReady = () => {
      const images = Array.from(printWindow.document.images)
      const imageLoads = images.map((image) => {
        if (image.complete) {
          return Promise.resolve()
        }

        return new Promise<void>((resolve) => {
          image.addEventListener("load", () => resolve(), { once: true })
          image.addEventListener("error", () => resolve(), { once: true })
        })
      })

      void Promise.all(imageLoads).then(() => {
        window.setTimeout(() => {
          printWindow.focus()
          printWindow.print()
        }, 250)
      })
    }

    if (printWindow.document.readyState === "complete") {
      printWhenReady()
      return
    }

    printWindow.addEventListener("load", () => {
      printWhenReady()
    })
  }

  return (
    <div className="relative rounded-xl border border-border p-1">
      <GlowingEffect
        spread={40}
        glow={true}
        disabled={false}
        proximity={64}
        inactiveZone={0.01}
        borderWidth={2}
      />
      <div className="relative flex flex-col gap-3 rounded-lg bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center text-sm text-muted-foreground">
          <FileDown className="h-4 w-4 mr-2 text-primary" />
          Export writeup and challenge assets
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={exportWriteup}>
            <Download className="h-4 w-4" />
            Export Writeup
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={exportPdf}>
            <FileType className="h-4 w-4" />
            Export PDF
          </Button>
          {attachments.map((attachment, index) => (
            <Button key={`${attachment.url}-${index}`} asChild variant="outline" size="sm">
              <a href={attachment.url} download target="_blank" rel="noopener noreferrer">
                <Paperclip className="h-4 w-4" />
                {attachment.name || `Attachment ${index + 1}`}
              </a>
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
