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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function getCodeLanguage(pre: HTMLPreElement, code: HTMLElement | null, rawCode: string): string {
  const declared =
    pre.getAttribute("data-language") ||
    code?.getAttribute("data-language") ||
    Array.from(code?.classList || [])
      .find((className) => className.startsWith("language-"))
      ?.replace("language-", "")

  if (declared) return declared.toLowerCase()

  const trimmed = rawCode.trim()
  if (/^\s*(\$|#)\s+\w+/m.test(trimmed) || /\b(checksec|objdump|nc|python3|chmod|ls|cat|grep|sed)\b/.test(trimmed)) return "bash"
  if (/\b(from\s+\w+\s+import|import\s+\w+|def\s+\w+|print\(|context\.arch)\b/.test(trimmed)) return "python"
  if (/\b(#include|int\s+main|printf\(|malloc\(|void\s+\w+)\b/.test(trimmed)) return "c"
  if (/\b(const|let|function|export|import\s+.*from|console\.log)\b/.test(trimmed)) return "javascript"
  if (/\b(FROM|COPY|RUN|CMD|ENTRYPOINT)\b/.test(trimmed)) return "dockerfile"
  if (/^\s*[{}[\],":\d.\s-]+$/m.test(trimmed) && /[{[]/.test(trimmed)) return "json"

  return "text"
}

function highlightCode(rawCode: string, language: string): string {
  const escaped = escapeHtml(rawCode)

  if (language === "bash" || language === "shell" || language === "sh") {
    return escaped.replace(
      /^(\s*[$#])(\s*)([^\s]+)|(#.*$)|(&quot;.*?&quot;|&#39;.*?&#39;)|(--?[a-zA-Z0-9][\w-]*)/gm,
      (match, prompt: string, gap: string, command: string, comment: string, quote: string, attr: string) => {
        if (prompt && command) {
          return `<span class="code-token-prompt">${prompt}</span>${gap}<span class="code-token-keyword">${command}</span>`
        }
        if (comment) return `<span class="code-token-comment">${comment}</span>`
        if (quote) return `<span class="code-token-string">${quote}</span>`
        if (attr) return `<span class="code-token-attr">${attr}</span>`
        return match
      }
    )
  }

  return escaped.replace(
    /(\/\/.*$|#.*$|\/\*[\s\S]*?\*\/)|(&quot;.*?&quot;|&#39;.*?&#39;|`.*?`)|\b(import|from|def|return|class|if|else|elif|for|while|try|except|with|as|const|let|var|function|export|async|await|new|int|char|void|struct|define|include|FROM|COPY|RUN|CMD|ENTRYPOINT)\b|\b(0x[a-fA-F0-9]+|\d+(?:\.\d+)?)\b/gm,
    (match, comment: string, quote: string, keyword: string, number: string) => {
      if (comment) return `<span class="code-token-comment">${comment}</span>`
      if (quote) return `<span class="code-token-string">${quote}</span>`
      if (keyword) return `<span class="code-token-keyword">${keyword}</span>`
      if (number) return `<span class="code-token-number">${number}</span>`
      return match
    }
  )
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
      const code = pre.querySelector<HTMLElement>("code")
      const rawCode = code?.textContent || pre.textContent || ""
      const language = getCodeLanguage(pre, code, rawCode)

      pre.classList.add("writeup-code-block", "relative", "group/code")
      pre.setAttribute("data-language", language)
      if (code) {
        code.classList.add("writeup-code")
        code.innerHTML = highlightCode(rawCode, language)
      }

      const header = document.createElement("div")
      header.className = "writeup-code-header"

      const languageLabel = document.createElement("span")
      languageLabel.className = "writeup-code-language"
      languageLabel.textContent = language

      const button = document.createElement("button")
      button.type = "button"
      button.className = "writeup-code-copy"
      button.setAttribute("aria-label", `Copy code block ${index + 1}`)
      button.innerHTML = `<span class="writeup-code-copy-icon" aria-hidden="true"></span><span>Copy</span>`

      const handleClick = async () => {
        try {
          await navigator.clipboard.writeText(rawCode.trim())
          button.innerHTML = `<span class="writeup-code-copy-icon is-copied" aria-hidden="true"></span><span>Copied</span>`
          window.setTimeout(() => {
            button.innerHTML = `<span class="writeup-code-copy-icon" aria-hidden="true"></span><span>Copy</span>`
          }, 1500)
        } catch {
          button.innerHTML = `<span class="writeup-code-copy-icon" aria-hidden="true"></span><span>Failed</span>`
          window.setTimeout(() => {
            button.innerHTML = `<span class="writeup-code-copy-icon" aria-hidden="true"></span><span>Copy</span>`
          }, 1500)
        }
      }

      button.addEventListener("click", handleClick)
      header.append(languageLabel, button)
      pre.prepend(header)

      return () => {
        button.removeEventListener("click", handleClick)
        header.remove()
        if (code) {
          code.textContent = rawCode
        }
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
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-hidden rounded-lg border border-border/70 bg-background/60 p-4 backdrop-blur-sm">
          <div className="mb-3 flex items-center gap-2 font-code text-[10px] uppercase tracking-widest text-primary">
            <ListTree className="h-3.5 w-3.5" />
            On this write-up
          </div>
          {tocItems.length ? (
            <nav className="max-h-[calc(100vh-11rem)] space-y-1 overflow-y-auto pr-1">
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
