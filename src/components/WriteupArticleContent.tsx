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

interface TransformedContent {
  html: string
  toc: TocItem[]
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

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function stripTags(value: string): string {
  return decodeHtml(value.replace(/<[^>]+>/g, ""))
}

function readAttribute(tag: string, name: string): string {
  const match = tag.match(new RegExp(`${name}=["']([^"']*)["']`, "i"))
  return match?.[1] ?? ""
}

function getCodeLanguage(preAttrs: string, codeAttrs: string, rawCode: string): string {
  const classNames = `${readAttribute(preAttrs, "class")} ${readAttribute(codeAttrs, "class")}`
  const declared =
    readAttribute(preAttrs, "data-language") ||
    readAttribute(codeAttrs, "data-language") ||
    classNames
      .split(/\s+/)
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

function transformWriteupHtml(html: string): TransformedContent {
  const headingCounts = new Map<string, number>()
  const toc: TocItem[] = []
  let headingIndex = 0

  const withHeadingIds = (html || "").replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (match, level: string, attrs: string, innerHtml: string) => {
      const text = stripTags(innerHtml).trim()
      if (!text) return match

      const existingId = readAttribute(attrs, "id")
      const baseId = existingId || slugifyHeading(text, headingIndex)
      const count = headingCounts.get(baseId) || 0
      headingCounts.set(baseId, count + 1)
      const id = count ? `${baseId}-${count + 1}` : baseId
      headingIndex += 1

      toc.push({ id, text, level: Number(level) === 3 ? 3 : 2 })

      const cleanAttrs = attrs
        .replace(/\s+id=["'][^"']*["']/i, "")
        .replace(/\s+class=["']([^"']*)["']/i, (_classMatch, className: string) => ` class="${className} scroll-mt-24"`)

      const hasClass = /\sclass=["'][^"']*["']/i.test(attrs)
      return `<h${level}${cleanAttrs} id="${escapeHtml(id)}"${hasClass ? "" : ' class="scroll-mt-24"'}>${innerHtml}</h${level}>`
    }
  )

  const transformedHtml = withHeadingIds.replace(
    /<pre([^>]*)>([\s\S]*?)<\/pre>/gi,
    (_match, preAttrs: string, preInner: string) => {
      const codeMatch = preInner.match(/<code([^>]*)>([\s\S]*?)<\/code>/i)
      const codeAttrs = codeMatch?.[1] ?? ""
      const rawCode = stripTags(codeMatch?.[2] ?? preInner).trimEnd()
      const language = getCodeLanguage(preAttrs, codeAttrs, rawCode)
      const highlighted = highlightCode(rawCode, language)

      return `<pre class="writeup-code-block group/code" data-language="${escapeHtml(language)}"><div class="writeup-code-header"><span class="writeup-code-language">${escapeHtml(language)}</span><button type="button" class="writeup-code-copy" data-code-copy="true" aria-label="Copy ${escapeHtml(language)} code block"><span class="writeup-code-copy-icon" aria-hidden="true"></span><span>Copy</span></button></div><code class="writeup-code language-${escapeHtml(language)}">${highlighted}</code></pre>`
    }
  )

  return { html: transformedHtml, toc }
}

export function WriteupArticleContent({ html }: WriteupArticleContentProps) {
  const contentRef = React.useRef<HTMLDivElement | null>(null)
  const transformed = React.useMemo(() => transformWriteupHtml(html), [html])

  React.useEffect(() => {
    const root = contentRef.current
    if (!root) return

    const handleClick = async (event: MouseEvent) => {
      const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>("[data-code-copy]")
      if (!button) return

      const pre = button.closest("pre")
      const code = pre?.querySelector("code")?.textContent?.trim() || ""

      try {
        await navigator.clipboard.writeText(code)
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

    root.addEventListener("click", handleClick)

    return () => {
      root.removeEventListener("click", handleClick)
    }
  }, [transformed.html])

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_17rem] xl:items-stretch">
      <div className="min-w-0">
        <div
          ref={contentRef}
          className="writeup-prose prose prose-invert prose-primary max-w-none"
          dangerouslySetInnerHTML={{ __html: transformed.html }}
        />

      </div>

      <aside className="relative hidden xl:block">
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-hidden rounded-lg border border-border/70 bg-background/60 p-4 backdrop-blur-sm">
          <div className="mb-3 flex items-center gap-2 font-code text-[10px] uppercase tracking-widest text-primary">
            <ListTree className="h-3.5 w-3.5" />
            On this write-up
          </div>
          {transformed.toc.length ? (
            <nav className="max-h-[calc(100vh-11rem)] space-y-1 overflow-y-auto pr-1">
              {transformed.toc.map((item) => (
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
