"use client"

import * as React from "react"
import { ListTree } from "lucide-react"
import { cn } from "@/lib/utils"

interface TocItem {
  id: string
  text: string
  level: 2 | 3
}

interface WriteupArticleContentProps {
  html: string
}

function slugifyHeading(value: string, index: number): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")

  return slug || `section-${index + 1}`
}

export function WriteupArticleContent({ html }: WriteupArticleContentProps) {
  const contentRef = React.useRef<HTMLDivElement | null>(null)
  const [tocItems, setTocItems] = React.useState<TocItem[]>([])

  React.useEffect(() => {
    const root = contentRef.current
    if (!root) return

    const headingCounts = new Map<string, number>()
    const headings = Array.from(root.querySelectorAll<HTMLHeadingElement>("h2, h3"))
    const nextToc = headings
      .map((heading, index) => {
        const text = heading.textContent?.trim() || ""
        if (!text) return null

        const baseId = heading.id || slugifyHeading(text, index)
        const count = headingCounts.get(baseId) || 0
        headingCounts.set(baseId, count + 1)
        const id = count ? `${baseId}-${count + 1}` : baseId
        heading.id = id
        heading.classList.add("scroll-mt-24")

        return {
          id,
          text,
          level: heading.tagName.toLowerCase() === "h3" ? 3 : 2,
        } satisfies TocItem
      })
      .filter((item): item is TocItem => Boolean(item))

    setTocItems(nextToc)

    const cleanups = Array.from(root.querySelectorAll<HTMLPreElement>("pre")).map((pre, index) => {
      pre.classList.add("relative", "group/code")
      const button = document.createElement("button")
      button.type = "button"
      button.textContent = "Copy"
      button.setAttribute("aria-label", `Copy code block ${index + 1}`)
      button.className =
        "absolute right-3 top-3 z-10 rounded-md border border-border/70 bg-background/90 px-2.5 py-1 font-code text-[10px] uppercase tracking-widest text-muted-foreground opacity-0 shadow-sm backdrop-blur transition group-hover/code:opacity-100 hover:border-primary/50 hover:text-primary"

      const handleClick = async () => {
        try {
          await navigator.clipboard.writeText(pre.innerText.replace(button.innerText, "").trim())
          button.textContent = "Copied"
          window.setTimeout(() => {
            button.textContent = "Copy"
          }, 1500)
        } catch {
          button.textContent = "Failed"
          window.setTimeout(() => {
            button.textContent = "Copy"
          }, 1500)
        }
      }

      button.addEventListener("click", handleClick)
      pre.appendChild(button)

      return () => {
        button.removeEventListener("click", handleClick)
        button.remove()
      }
    })

    return () => {
      cleanups.forEach((cleanup) => cleanup())
    }
  }, [html])

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_17rem] xl:items-start">
      <div className="min-w-0">
        <div
          ref={contentRef}
          className="writeup-prose prose prose-invert prose-primary max-w-none"
          dangerouslySetInnerHTML={{ __html: html || "" }}
        />

      </div>

      <aside className="hidden xl:block">
        <div className="sticky top-24 rounded-lg border border-border/70 bg-background/60 p-4 backdrop-blur-sm">
          <div className="mb-3 flex items-center gap-2 font-code text-[10px] uppercase tracking-widest text-primary">
            <ListTree className="h-3.5 w-3.5" />
            On this write-up
          </div>
          {tocItems.length ? (
            <nav className="space-y-1">
              {tocItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={cn(
                    "block rounded-md px-2 py-1.5 text-xs leading-5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary",
                    item.level === 3 && "pl-5"
                  )}
                >
                  {item.text}
                </a>
              ))}
            </nav>
          ) : (
            <p className="text-xs leading-5 text-muted-foreground">Add headings in the editor to build a table of contents.</p>
          )}
        </div>
      </aside>

    </div>
  )
}
