import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import type { TocItem } from "@/lib/html";
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

/** Offline copies get everything inlined; the print page is served from the site, so it can lean on the site. */
const noLazyImages = (html: string) => html.replace(/\sloading="lazy"/g, "");
const noCopyButtons = (html: string) => html.replace(/<button[^>]*data-copy[^>]*>[\s\S]*?<\/button>/g, "");
const fileList = (w: ExportWriteup, base: string) =>
  w.attachments.map((a) => `<li><a href="${esc(a.url.startsWith("/") ? base + a.url : a.url)}">${esc(displayName(a))}</a></li>`).join("");

/** Standalone document. `inlineImage` turns site-relative image URLs into data: URLs so the file works offline. */
export async function buildExportHtml(w: ExportWriteup, renderedHtml: string, inlineImage: (src: string) => Promise<string | null>, base: string): Promise<string> {
  let html = noLazyImages(noCopyButtons(unwrapDeadLinks(renderedHtml)));
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
${w.attachments.length ? `<h2>Attachments</h2><ul>${fileList(w, base)}</ul>` : ""}
<footer>Exported from ${esc(base + w.href)} · Elang Dimas Syadewa (Claritys)</footer>
</main>
</body>
</html>
`;
}

const PRINT_FONTS = "https://fonts.googleapis.com/css2?family=Archivo:wght@500;700;800&family=Inter+Tight:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap";
/** Code at this size or under stays on one page; anything longer may split, or it would leave a page half empty. */
const KEEP_TOGETHER_LINES = 24;

const printStyle = (footer: string) => `
:root { color-scheme: light; --fg: #16150f; --muted: #66625a; --line: #dcd8cf; --tint: #f6f4ef; --accent: #d9480f; }
@page {
  size: A4;
  margin: 20mm 18mm 20mm;
  @bottom-left { content: "${footer}"; font: 7.5pt "Geist Mono", ui-monospace, monospace; color: #66625a; }
  @bottom-right { content: counter(page) " / " counter(pages); font: 7.5pt "Geist Mono", ui-monospace, monospace; color: #66625a; }
}
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; background: #fff; color: var(--fg); font: 10.5pt/1.6 "Inter Tight", ui-sans-serif, system-ui, sans-serif; }
main { max-width: 174mm; margin: 0 auto; }
@media screen { main { padding: 20mm 0; } }
a { color: var(--accent); text-decoration: none; }
.mono { font-family: "Geist Mono", ui-monospace, monospace; }

.masthead { display: flex; justify-content: space-between; padding-bottom: 3mm; border-bottom: 1.5pt solid var(--fg); font: 500 7.5pt "Geist Mono", ui-monospace, monospace; letter-spacing: .12em; text-transform: uppercase; }
.masthead b { color: var(--accent); font-weight: 500; }
.masthead a { color: inherit; }
h1 { margin: 9mm 0 4mm; font: 800 34pt/1.02 Archivo, ui-sans-serif, sans-serif; letter-spacing: -.025em; overflow-wrap: anywhere; }
.summary { margin: 0 0 7mm; max-width: 150mm; font-size: 12pt; line-height: 1.5; color: var(--muted); }
.facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(30mm, 1fr)); margin: 0; border-block: .5pt solid var(--line); }
.facts div { padding: 2.5mm 3mm 2.5mm 0; }
.facts dt { font: 6.5pt "Geist Mono", ui-monospace, monospace; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); }
.facts dd { margin: 1mm 0 0; font-weight: 600; }
.tags { display: flex; flex-wrap: wrap; gap: 1.5mm; margin: 4mm 0 0; padding: 0; list-style: none; }
.tags li { padding: .4mm 2.2mm; border: .5pt solid var(--line); border-radius: 99px; font: 7pt "Geist Mono", ui-monospace, monospace; text-transform: uppercase; color: var(--muted); }
.toc { margin-top: 7mm; padding: 4mm 5mm; background: var(--tint); border-radius: 1mm; break-inside: avoid; }
.toc p { margin: 0 0 2mm; font: 6.5pt "Geist Mono", ui-monospace, monospace; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); }
.toc ol { margin: 0; padding: 0; list-style: none; columns: 2; column-gap: 8mm; font-size: 9.5pt; line-height: 1.7; }
.toc a { color: var(--fg); }
.toc .sub { padding-left: 4mm; color: var(--muted); }
.toc .sub a { color: var(--muted); }

article { margin-top: 9mm; }
article > * + * { margin-top: 3mm; }
article h2 { margin: 9mm 0 3mm; padding-top: 3mm; border-top: .5pt solid var(--line); font: 700 17pt/1.2 Archivo, ui-sans-serif, sans-serif; letter-spacing: -.015em; }
article h3 { margin: 6mm 0 2mm; font: 700 12.5pt/1.25 Archivo, ui-sans-serif, sans-serif; }
article h4 { margin: 5mm 0 1.5mm; font: 600 10.5pt/1.3 "Inter Tight", sans-serif; }
article > h2:first-child { margin-top: 0; }
h2, h3, h4 { break-after: avoid; }
p, li { orphans: 3; widows: 3; }
/* The sentence that introduces a picture or a listing stays with it. */
p:has(+ figure.code-block.keep), p:not(:has(> img)):has(+ p > img:only-child) { break-after: avoid; }
ul, ol { padding-left: 5.5mm; }
li + li, li > p + * { margin-top: 1mm; }
li > p { margin: 0; }
blockquote { margin: 3mm 0; padding-left: 4mm; border-left: 1.5pt solid var(--accent); color: var(--muted); }

p:has(> img:only-child) { text-align: center; }
img { display: inline-block; max-width: 100%; max-height: 100mm; width: auto; height: auto; border: .5pt solid var(--line); border-radius: 1mm; break-inside: avoid; }

:not(pre) > code { padding: .1em .35em; background: var(--tint); border-radius: .6mm; font: .86em "Geist Mono", ui-monospace, monospace; overflow-wrap: anywhere; }
figure.code-block { margin: 3.5mm 0; background: var(--tint); border: .5pt solid var(--line); border-radius: 1mm; break-inside: auto; }
figure.code-block.keep { break-inside: avoid; }
.code-head { padding: 1mm 3mm; border-bottom: .5pt solid var(--line); font: 6.5pt "Geist Mono", ui-monospace, monospace; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); break-after: avoid; }
pre { margin: 0; padding: 2.5mm 3mm; font: 8pt/1.5 "Geist Mono", ui-monospace, monospace; white-space: pre-wrap; overflow-wrap: anywhere; }
pre code { font: inherit; }
.shiki, .shiki span { color: var(--shiki-light) !important; background: transparent !important; }

table { width: 100%; border-collapse: collapse; font-size: 9pt; break-inside: auto; }
thead { display: table-header-group; }
tr { break-inside: avoid; }
th, td { padding: 1.2mm 2mm; border: .5pt solid var(--line); text-align: left; }
th { background: var(--tint); }

.flag { margin-top: 9mm; padding: 3mm 4mm; border: .75pt solid var(--accent); border-radius: 1mm; break-inside: avoid; }
.flag span { display: block; margin-bottom: 1mm; font: 6.5pt "Geist Mono", ui-monospace, monospace; letter-spacing: .14em; text-transform: uppercase; color: var(--accent); }
.flag code { font: 500 9.5pt "Geist Mono", ui-monospace, monospace; overflow-wrap: anywhere; }
.files { margin-top: 6mm; break-inside: avoid; }
.files h2 { margin: 0 0 1.5mm; font: 700 12.5pt Archivo, sans-serif; }
`;

const cssString = (s: string) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/</g, "\\3c ").replace(/\s+/g, " ");
/** Nerd-font prompt icons from terminal pastes (private-use code points) would print as empty boxes. */
const noPrivateUseGlyphs = (html: string) => html.replace(/[\uE000-\uF8FF]|[\u{F0000}-\u{10FFFD}]/gu, "");

function markShortCode(html: string): string {
  return html.replace(/<figure class="code-block">([\s\S]*?)<\/figure>/g, (block, inner: string) =>
    inner.split("\n").length <= KEEP_TOGETHER_LINES ? `<figure class="code-block keep">${inner}</figure>` : block,
  );
}

/** Opens the print dialog once every image and font is in, or after a while regardless. */
const PRINT_SCRIPT = `<script>addEventListener("load",function(){var ready=Promise.all([document.fonts.ready].concat([].map.call(document.images,function(i){return i.complete?0:new Promise(function(r){i.onload=i.onerror=r})})));Promise.race([ready,new Promise(function(r){setTimeout(r,15000)})]).then(function(){setTimeout(function(){print()},200)})})</script>`;

/** The document behind "Export PDF": paged A4 with a masthead, contents and page numbers; the browser's "Save as PDF" writes the file. */
export function buildPrintHtml(w: ExportWriteup, renderedHtml: string, toc: TocItem[], base: string): string {
  const html = markShortCode(noPrivateUseGlyphs(noLazyImages(noCopyButtons(unwrapDeadLinks(renderedHtml)))));
  // A template's TL;DR already says what the summary says.
  const summary = w.summary && !/<h2[^>]*>\s*(TL;?\s*DR|Ringkasan|Summary)\b/i.test(html) ? w.summary : "";
  const facts: [string, string | null][] = [
    ["Category", w.category],
    ["Competition", w.competition],
    ["Difficulty", w.difficulty],
    ["Date", w.date ? day(w.date) : null],
  ];
  const headings = toc.filter((t) => t.depth <= 3);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(writeupSeoTitle(w))}</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${PRINT_FONTS}">
<style>${printStyle(cssString(`${w.title} · Elang Dimas Syadewa (Claritys)`))}</style>
</head>
<body>
<main>
<div class="masthead"><span><b>Claritys</b> / CTF writeup</span><a href="${esc(base + w.href)}">${esc(base.replace(/^https?:\/\//, ""))}</a></div>
<h1>${esc(w.title)}</h1>
${summary ? `<p class="summary">${esc(summary)}</p>` : ""}
<dl class="facts">${facts
    .filter(([, v]) => v)
    .map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v!)}</dd></div>`)
    .join("")}</dl>
${w.tags.length ? `<ul class="tags">${w.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
${headings.length >= 3 ? `<nav class="toc"><p>Contents</p><ol>${headings.map((t) => `<li${t.depth === 3 ? ' class="sub"' : ""}><a href="#${esc(t.id)}">${esc(t.text)}</a></li>`).join("")}</ol></nav>` : ""}
<article>${html}</article>
${w.flag ? `<div class="flag"><span>Flag</span><code>${esc(w.flag)}</code></div>` : ""}
${w.attachments.length ? `<div class="files"><h2>Attachments</h2><ul>${fileList(w, base)}</ul></div>` : ""}
</main>
${PRINT_SCRIPT}
</body>
</html>
`;
}
