import { PDFParse } from "pdf-parse";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

/**
 * PDF → writeup HTML that survives a round trip: lines are rebuilt from text positions (not the
 * PDF's arbitrary text segments), monospace becomes code, larger text becomes headings, browser
 * print headers/footers are dropped, images are put back where they sit on the page, and the old
 * site's export layout (Competition/Category/… + Overview/Documentation) fills the form fields.
 */

export type ImportedPdf = {
  title: string;
  summary: string;
  html: string;
  competition?: string;
  category?: string;
  difficulty?: string;
  date?: string;
  pageCount: number;
  imageCount: number;
};

type StoreImage = (name: string, png: Buffer) => Promise<string>;

type Run = { text: string; x: number; w: number; mono: boolean };
type Line = { kind: "line"; page: number; y: number; h: number; runs: Run[]; mono: boolean; text: string; x: number };
type Img = { kind: "img"; page: number; y: number; url: string };
type Entry = Line | Img;

const MONO = /mono|courier|consol|menlo|code|fixed/i;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Terminal screenshots-as-text lose powerline/nerd-font glyphs: separator bars become "????…",
 * prompt segments become "?? ? ?" before the path, and the prompt arrow becomes "?" or "???".
 * Returns null for lines that were nothing but lost glyphs.
 */
export function cleanCodeLine(line: string): string | null {
  const trimmed = line.trim();
  if (/^\?{4,}$/.test(trimmed)) return null;
  return line
    .replace(/^(\s*)(\?{1,3}\s+)+(?=[~/])/, "$1")
    .replace(/^(\s*)\?{1,3}(?=\s)/, "$1❯");
}

/** Emoji and some symbols don't survive PDF text extraction and come out as "?" / "??". */
function cleanLostGlyphs(text: string, code: boolean): string {
  if (code) return cleanCodeLine(text) ?? "";
  return text
    .replace(/^(\?{1,3}\s+)+/, "")
    .replace(/\s\?{2,3}(?=\s|$)/g, "")
    .replace(/(\S)\s\?\s(?=\S)/g, "$1 — ")
    .trim();
}

const BROWSER_HEADER = /^\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(\s*[AP]M)?\b/i;
const BROWSER_FOOTER = /^(https?:\/\/|about:blank|file:\/\/)\S*(\s+\d+\s*\/\s*\d+)?$/i;
const PAGE_MARKER = /^-*\s*\d+\s*(of|\/)\s*\d+\s*-*$/i;

async function readLines(data: Uint8Array): Promise<{ lines: Line[]; pageCount: number; positions: Map<string, { page: number; y: number }>; pageHeights: number[] }> {
  const doc = await pdfjs.getDocument({ data, useSystemFonts: false, isEvalSupported: false, verbosity: pdfjs.VerbosityLevel.ERRORS }).promise;
  const lines: Line[] = [];
  const positions = new Map<string, { page: number; y: number }>();
  const pageHeights: number[] = [];
  try {
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      pageHeights.push(page.view[3] - page.view[1]);
      const ops = await page.getOperatorList();
      collectImagePositions(ops, p, positions);
      const content = await page.getTextContent();
      const fontIsMono = (fontName: string) => {
        const family = (content.styles as Record<string, { fontFamily?: string }>)[fontName]?.fontFamily ?? "";
        const loaded = page.commonObjs.has(fontName) ? (page.commonObjs.get(fontName) as { name?: string; isMonospace?: boolean }) : null;
        return family === "monospace" || !!loaded?.isMonospace || MONO.test(`${family} ${loaded?.name ?? ""}`);
      };
      const items = (content.items as { str?: string; transform?: number[]; width?: number; height?: number; fontName?: string }[])
        .filter((it) => it.str !== undefined && it.transform && it.str.length > 0)
        .map((it) => ({ str: it.str!, x: it.transform![4], y: it.transform![5], w: it.width ?? 0, h: Math.hypot(it.transform![2], it.transform![3]) || it.height || 10, mono: fontIsMono(it.fontName ?? "") }))
        .sort((a, b) => b.y - a.y || a.x - b.x);
      let cur: { y: number; h: number; items: typeof items } | null = null;
      const flush = () => {
        if (!cur) return;
        const sorted = cur.items.sort((a, b) => a.x - b.x);
        const runs: Run[] = [];
        let prevEnd = -Infinity;
        for (const it of sorted) {
          const gap = it.x - prevEnd;
          const needsSpace = runs.length > 0 && gap > cur.h * 0.15 && !/\s$/.test(runs[runs.length - 1].text) && !/^\s/.test(it.str);
          const last = runs[runs.length - 1];
          if (last && last.mono === it.mono) last.text += (needsSpace ? " " : "") + it.str;
          else runs.push({ text: (needsSpace ? " " : "") + it.str, x: it.x, w: it.w, mono: it.mono });
          prevEnd = it.x + it.w;
        }
        const text = runs.map((r) => r.text).join("");
        if (text.trim()) {
          const mono = runs.every((r) => r.mono || !r.text.trim());
          lines.push({ kind: "line", page: p, y: cur.y, h: cur.h, runs, mono, text, x: sorted[0].x });
        }
        cur = null;
      };
      for (const it of items) {
        if (cur && Math.abs(it.y - cur.y) <= Math.max(cur.h, it.h) * 0.5) {
          cur.items.push(it);
          cur.h = Math.max(cur.h, it.h);
        } else {
          flush();
          cur = { y: it.y, h: it.h, items: [it] };
        }
      }
      flush();
      page.cleanup();
    }
    return { lines, pageCount: doc.numPages, positions, pageHeights };
  } finally {
    await doc.destroy();
  }
}

/** Track the transform matrix through the operator list to find where each image is painted. */
function collectImagePositions(ops: { fnArray: number[]; argsArray: unknown[][] }, page: number, out: Map<string, { page: number; y: number }>) {
  const OPS = pdfjs.OPS;
  let ctm = [1, 0, 0, 1, 0, 0];
  const stack: number[][] = [];
  const mul = (m: number[], n: number[]) => [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ];
  ops.fnArray.forEach((fn, i) => {
    const args = ops.argsArray[i];
    if (fn === OPS.save) stack.push(ctm);
    else if (fn === OPS.restore) ctm = stack.pop() ?? ctm;
    else if (fn === OPS.transform) ctm = mul(ctm, args as number[]);
    else if (fn === OPS.paintImageXObject || fn === OPS.paintImageXObjectRepeat) {
      const name = String(args[0]);
      // Top edge of the unit square after the transform.
      out.set(`${page}:${name}`, { page, y: ctm[5] + Math.max(0, ctm[3]) });
    }
  });
}

async function readImages(data: Uint8Array, positions: Map<string, { page: number; y: number }>, store: StoreImage): Promise<Img[]> {
  const parser = new PDFParse({ data });
  try {
    const result = await parser.getImage({ imageThreshold: 80, imageBuffer: true, imageDataUrl: false });
    const out: Img[] = [];
    for (const pg of result.pages) {
      for (const [i, im] of pg.images.entries()) {
        const pos = positions.get(`${pg.pageNumber}:${im.name}`);
        if (!pos || !im.data?.length) continue;
        const url = await store(`pdf-p${pg.pageNumber}-${i + 1}.png`, Buffer.from(im.data));
        out.push({ kind: "img", page: pg.pageNumber, y: pos.y, url });
      }
    }
    return out;
  } finally {
    await parser.destroy();
  }
}

function dropPageFurniture(lines: Line[], pageHeights: number[], pageCount: number): Line[] {
  const norm = (s: string) => s.replace(/\d+/g, "#").replace(/\s+/g, " ").trim().toLowerCase();
  const nearEdge = (l: Line) => {
    const h = pageHeights[l.page - 1] ?? 842;
    return l.y > h * 0.92 || l.y < h * 0.08;
  };
  const seen = new Map<string, Set<number>>();
  for (const l of lines) if (nearEdge(l)) seen.set(norm(l.text), (seen.get(norm(l.text)) ?? new Set()).add(l.page));
  return lines.filter((l) => {
    const t = l.text.trim();
    if (PAGE_MARKER.test(t)) return false;
    if (nearEdge(l) && (BROWSER_HEADER.test(t) || BROWSER_FOOTER.test(t))) return false;
    if (pageCount > 1 && nearEdge(l) && (seen.get(norm(t))?.size ?? 0) >= Math.ceil(pageCount / 2)) return false;
    return true;
  });
}

const META = /^(Competition|Category|Difficulty|Date|Tags?|Updated)\s*:\s*(.+)$/i;
// Lost-emoji markers ("??") started new sections in the original writeups; flattened exports keep them inline.
const SECTION = "\u0001";

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 11;
}

function inlineHtml(runs: Run[]): string {
  return runs
    .map((r) => ({ ...r, text: r.mono ? r.text : r.text.replace(/(^|\s)\?{2,3}(?=\s|$)/g, ` ${SECTION} `) }))
    .map((r) => {
      // Keep each run's own surrounding whitespace; only its core is cleaned/escaped.
      const lead = /^\s*/.exec(r.text)![0];
      const trail = /\s*$/.exec(r.text)![0];
      const core = cleanLostGlyphs(r.text.trim(), false);
      if (!core) return lead || trail ? " " : "";
      return lead + (r.mono ? `<code>${esc(core)}</code>` : esc(core)) + trail;
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

export async function importPdfDocument(buffer: Buffer, opts: { storeImage?: StoreImage } = {}): Promise<ImportedPdf> {
  const data = new Uint8Array(buffer);
  const { lines: raw, pageCount, positions, pageHeights } = await readLines(data.slice());
  const lines = dropPageFurniture(raw, pageHeights, pageCount);
  if (!lines.length) throw new Error("No readable text was found in this PDF.");
  const images = opts.storeImage ? await readImages(data.slice(), positions, opts.storeImage) : [];

  // ---- Metadata (title, legacy export fields, Overview → summary) ----
  const body = median(lines.filter((l) => !l.mono).map((l) => l.h));
  const meta: Partial<ImportedPdf> = {};
  let i = 0;
  const titleLine = lines.slice(0, 5).reduce((a, b) => (b.h > a.h ? b : a), lines[0]);
  meta.title = cleanLostGlyphs(titleLine.text, false);
  const consumed = new Set<Line>([titleLine]);
  for (; i < Math.min(lines.length, 12); i++) {
    const m = META.exec(lines[i].text.trim());
    if (m) {
      const key = m[1].toLowerCase().replace(/s$/, "") as "competition" | "category" | "difficulty" | "date" | "tag" | "updated";
      if (key !== "tag" && key !== "updated") meta[key] = m[2].trim();
      consumed.add(lines[i]);
    }
  }
  const label = (l: Line, words: string[]) => words.includes(l.text.trim().toLowerCase().replace(/:$/, ""));
  const overview = lines.findIndex((l) => label(l, ["overview", "summary"]));
  const documentation = lines.findIndex((l) => label(l, ["documentation", "content"]));
  let summary = "";
  if (overview >= 0 && documentation > overview) {
    const part = lines.slice(overview + 1, documentation);
    summary = cleanLostGlyphs(part.map((l) => l.text.trim()).join(" "), false);
    for (const l of lines.slice(overview, documentation + 1)) consumed.add(l);
  }
  const attachments = lines.findIndex((l) => /^challenge attachments$/i.test(l.text.trim()));
  const contentLines = lines.filter((l, idx) => !consumed.has(l) && (attachments < 0 || idx < attachments));

  // ---- Interleave images with text by page and vertical position ----
  const entries: Entry[] = [...contentLines, ...images].sort((a, b) => a.page - b.page || b.y - a.y);

  // ---- Blocks ----
  const out: string[] = [];
  let para: Line[] = [];
  let code: Line[] = [];
  let list: string[] = [];
  const flushPara = () => {
    if (para.length) {
      const html = para.map((l) => inlineHtml(l.runs)).join(" ");
      for (const part of html.split(SECTION)) {
        const text = part.replace(/\s+/g, " ").trim();
        if (text) out.push(`<p>${text}</p>`);
      }
    }
    para = [];
  };
  const flushCode = () => {
    if (code.length) {
      const minX = Math.min(...code.map((l) => l.x));
      const cw = (code[0].h || 10) * 0.6;
      const text = code
        .map((l) => {
          const cleaned = cleanCodeLine(l.text.replace(/\s+$/, ""));
          return cleaned === null ? null : " ".repeat(Math.max(0, Math.round((l.x - minX) / cw))) + cleaned;
        })
        .filter((l): l is string => l !== null)
        .join("\n");
      if (text.trim()) out.push(`<pre><code>${esc(text)}</code></pre>`);
    }
    code = [];
  };
  const flushList = () => {
    if (list.length) out.push(`<ul>${list.map((li) => `<li>${li}</li>`).join("")}</ul>`);
    list = [];
  };
  const flushAll = () => {
    flushPara();
    flushCode();
    flushList();
  };
  let prev: Line | null = null;
  for (const e of entries) {
    if (e.kind === "img") {
      flushAll();
      out.push(`<img src="${esc(e.url)}" alt="">`);
      prev = null;
      continue;
    }
    const gap = prev && prev.page === e.page ? prev.y - e.y : Infinity;
    const text = e.text.trim();
    if (e.mono) {
      flushPara();
      flushList();
      if (code.length && gap > e.h * 2.4) flushCode();
      code.push(e);
    } else if (/^[•●◦▪‣∙·*-]\s+/.test(text)) {
      flushPara();
      flushCode();
      list.push(inlineHtml([{ ...e.runs[0], text: e.runs[0].text.replace(/^\s*[•●◦▪‣∙·*-]\s+/, "") }, ...e.runs.slice(1)]));
    } else if (e.h >= body * 1.2 && text.length <= 120) {
      flushAll();
      const heading = cleanLostGlyphs(text, false);
      if (heading) out.push(e.h >= body * 1.5 ? `<h2>${esc(heading)}</h2>` : `<h3>${esc(heading)}</h3>`);
    } else {
      flushCode();
      flushList();
      if (para.length && (gap > e.h * 1.8 || Math.abs(e.h - para[0].h) > 1)) flushPara();
      para.push(e);
    }
    prev = e;
  }
  flushAll();

  const html = out.join("\n");
  if (!summary) {
    const firstPara = /<p>(.*?)<\/p>/.exec(html)?.[1] ?? "";
    summary = firstPara.replace(/<[^>]+>/g, "").slice(0, 260);
  }
  return {
    title: meta.title || "Imported Writeup",
    summary,
    html,
    competition: meta.competition,
    category: meta.category,
    difficulty: meta.difficulty,
    date: meta.date,
    pageCount,
    imageCount: images.length,
  };
}
