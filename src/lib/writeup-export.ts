import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import { writeupSeoTitle } from "@/lib/seo";
import type { Attachment } from "@/lib/types";

/** Writeup exports: Markdown (front matter + GFM) and a standalone, offline HTML document. */

type ExportWriteup = {
  title: string;
  href: string;
  competition: string;
  category: string;
  difficulty: string | null;
  date: string | null;
  summary: string;
  tags: string[];
  flag: string | null;
  attachments: Attachment[];
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const displayName = (a: Attachment) => a.name.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i, "");
const absolutize = (html: string, base: string) => html.replace(/\b(src|href)="\/(?!\/)/g, `$1="${base}/`);
/** Notion exports wrap images in links to their local files ("image%209.png"); those go nowhere once published. */
const unwrapDeadLinks = (html: string) =>
  html.replace(/<a\b[^>]*\bhref="(?!https?:|\/|#|mailto:)[^"]*"[^>]*>([\s\S]*?)<\/a>/g, "$1");
const day = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

export function toMarkdown(w: ExportWriteup, contentHtml: string, base: string): string {
  const td = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced", fence: "```", bulletListMarker: "-", emDelimiter: "_" });
  td.use(gfm);
  const body = td.turndown(absolutize(unwrapDeadLinks(contentHtml), base)).trim();
  const front = [
    "---",
    `title: ${JSON.stringify(w.title)}`,
    w.competition && `ctf: ${JSON.stringify(w.competition)}`,
    `category: ${w.category}`,
    w.difficulty && `difficulty: ${w.difficulty}`,
    w.date && `date: ${day(w.date)}`,
    w.tags.length && `tags: [${w.tags.join(", ")}]`,
    `source: ${base}${w.href}`,
    "---",
  ].filter(Boolean);
  const parts = [front.join("\n"), `# ${w.title}`];
  if (w.summary) parts.push(`> ${w.summary.replace(/\n+/g, " ")}`);
  parts.push(body);
  if (w.flag) parts.push(`## Flag\n\n\`${w.flag}\``);
  if (w.attachments.length) parts.push(`## Attachments\n\n${w.attachments.map((a) => `- [${displayName(a)}](${a.url.startsWith("/") ? base : ""}${a.url})`).join("\n")}`);
  return `${parts.join("\n\n")}\n`;
}

const STYLE = `
:root { color-scheme: light; --fg: #0e0e0c; --muted: #5d5a54; --line: #e3e0d9; --accent: #c2410c; }
* { box-sizing: border-box; }
body { margin: 0; background: #faf9f6; color: var(--fg); font: 16px/1.7 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
main { max-width: 780px; margin: 0 auto; padding: 56px 24px 80px; }
.meta { font: 12px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
.meta b { color: var(--accent); font-weight: 600; }
h1 { font-size: 44px; line-height: 1; letter-spacing: -.02em; margin: 12px 0 16px; }
h2 { font-size: 26px; margin: 2.2em 0 .5em; } h3 { font-size: 20px; margin: 1.8em 0 .4em; }
.summary { color: var(--muted); font-size: 18px; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; margin: 16px 0 32px; padding: 0; list-style: none; }
.tags li { border: 1px solid var(--line); border-radius: 999px; padding: 2px 10px; font: 11px ui-monospace, monospace; text-transform: uppercase; color: var(--muted); }
article > * + * { margin-top: 1.1em; }
img { max-width: 100%; height: auto; border: 1px solid var(--line); border-radius: 6px; }
a { color: var(--accent); }
:not(pre) > code { font: .88em ui-monospace, SFMono-Regular, Menlo, monospace; background: #efece6; padding: .1em .35em; border-radius: 4px; }
figure.code-block { margin: 1.2em 0; border: 1px solid var(--line); border-radius: 6px; background: #fff; overflow: hidden; }
.code-head { display: flex; justify-content: space-between; padding: 4px 14px; border-bottom: 1px solid var(--line); font: 11px ui-monospace, monospace; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); }
pre { margin: 0; padding: 14px 16px; overflow-x: auto; font: 13px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace; white-space: pre; }
.shiki, .shiki span { color: var(--shiki-light) !important; background: transparent !important; }
table { border-collapse: collapse; width: 100%; font-size: 14px; } th, td { border: 1px solid var(--line); padding: 6px 10px; text-align: left; }
blockquote { border-left: 2px solid var(--accent); margin-left: 0; padding-left: 14px; color: var(--muted); }
.flag { margin-top: 40px; padding: 16px; border: 1px solid var(--line); border-radius: 6px; font: 15px ui-monospace, monospace; color: var(--accent); word-break: break-all; }
footer { margin-top: 56px; padding-top: 16px; border-top: 1px solid var(--line); font: 12px ui-monospace, monospace; color: var(--muted); }
@media print {
  body { background: #fff; } main { padding: 0; max-width: none; }
  pre { white-space: pre-wrap; word-break: break-word; }
  figure.code-block, img, table { break-inside: avoid; }
  img { max-height: 130mm; width: auto; object-fit: contain; }
  h2, h3 { break-after: avoid; }
  a { color: var(--fg); }
}
`;

/** Standalone document. `inlineImage` turns site-relative image URLs into data: URLs so the file works offline. */
export async function buildExportHtml(w: ExportWriteup, renderedHtml: string, inlineImage: (src: string) => Promise<string | null>, base: string): Promise<string> {
  let html = unwrapDeadLinks(renderedHtml).replace(/<button[^>]*data-copy[^>]*>[\s\S]*?<\/button>/g, "");
  const srcs = [...new Set([...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map((m) => m[1]))];
  for (const src of srcs) {
    const data = src.startsWith("/") ? await inlineImage(src) : null;
    if (data) html = html.split(`src="${src}"`).join(`src="${data}"`);
  }
  html = absolutize(html, base);
  const meta = [`<b>${esc(w.category)}</b>`, w.difficulty && esc(w.difficulty), w.competition && esc(w.competition), w.date && esc(day(w.date))].filter(Boolean).join(" · ");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(writeupSeoTitle(w))}</title>
<style>${STYLE}</style>
</head>
<body>
<main>
<p class="meta">${meta}</p>
<h1>${esc(w.title)}</h1>
${w.summary ? `<p class="summary">${esc(w.summary)}</p>` : ""}
${w.tags.length ? `<ul class="tags">${w.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
<article>${html}</article>
${w.flag ? `<p class="meta">flag</p><div class="flag">${esc(w.flag)}</div>` : ""}
${w.attachments.length ? `<h2>Attachments</h2><ul>${w.attachments.map((a) => `<li><a href="${esc(a.url.startsWith("/") ? base + a.url : a.url)}">${esc(displayName(a))}</a></li>`).join("")}</ul>` : ""}
<footer>Exported from ${esc(base + w.href)} · Elang Dimas Syadewa (Claritys)</footer>
</main>
</body>
</html>
`;
}
