import { normalizeCategory } from "@/lib/data/mappers";
import { guessLanguage } from "@/lib/lang-guess";

/**
 * Notion page exports: "# Title", then database properties, then the body. Reads both the English
 * property names and the Indonesian template (Dibuat / Kategori / Kompetisi / Status), the template's
 * "## TL;DR" as the summary and its "Flag" toggle as the flag.
 */
export type NotionPage = { title: string; summary: string; body: string; category?: string; competition?: string; difficulty?: string; date?: string; tags?: string[]; flag?: string };

type Field = "category" | "competition" | "difficulty" | "date" | "tags" | "ignored";

const FIELDS: Record<string, Field> = {
  category: "category",
  kategori: "category",
  competition: "competition",
  kompetisi: "competition",
  difficulty: "difficulty",
  kesulitan: "difficulty",
  date: "date",
  tanggal: "date",
  dibuat: "date",
  created: "date",
  tag: "tags",
  tags: "tags",
  status: "ignored",
  updated: "ignored",
};
const PROP = new RegExp(`^(${Object.keys(FIELDS).join("|")})\\s*:\\s*(.*)$`, "i");
/** A Notion page printed to PDF lays its properties out as a table, so the colon is gone. */
const PROP_NO_COLON = /^(dibuat|kategori|kompetisi|status)\s+(.+)$/i;

const CATEGORY_ALIASES: Record<string, string> = { binary: "Pwn", "binary exploitation": "Pwn", rev: "Reverse", re: "Reverse", reversing: "Reverse", "reverse engineering": "Reverse", foren: "Forensics", forensic: "Forensics", cryptography: "Crypto" };
const ID_MONTHS: Record<string, string> = { januari: "January", februari: "February", maret: "March", mei: "May", juni: "June", juli: "July", agustus: "August", oktober: "October", desember: "December", agu: "Aug", okt: "Oct", des: "Dec" };

/** The day as written, in UTC, so a page created at 11 PM doesn't slide to the next or previous date. */
function parseDate(value: string): string | undefined {
  const iso = /^\d{4}-\d{2}-\d{2}/.exec(value)?.[0];
  if (iso) return iso;
  const english = value.replace(/\p{L}+/gu, (w) => ID_MONTHS[w.toLowerCase()] ?? w);
  const t = Date.parse(`${english} UTC`);
  return Number.isNaN(t) ? undefined : new Date(t).toISOString().slice(0, 10);
}

/** Relation properties export as "Name (https://app.notion.com/…)"; only the name is wanted. */
const stripNotionLink = (value: string) => value.replace(/\s*\(https?:\/\/[^)\s]*\)/g, "").trim();

function parseCategory(value: string): string {
  const first = value.split(",")[0].trim();
  return CATEGORY_ALIASES[first.toLowerCase()] ?? normalizeCategory(first);
}

/** One "Key: value" property line, with its value cleaned up for the form. Null when it isn't one. */
export function readProperty(line: string, opts: { colonOptional?: boolean } = {}): { field: Field; value: string } | null {
  const m = PROP.exec(line) ?? (opts.colonOptional ? PROP_NO_COLON.exec(line) : null);
  if (!m) return null;
  const field = FIELDS[m[1].toLowerCase()];
  const raw = stripNotionLink(m[2]);
  if (field === "date") return { field, value: parseDate(raw) ?? "" };
  return { field, value: field === "category" && raw ? parseCategory(raw) : raw };
}

/** Per line: is it inside a ``` fence (the fence markers included)? Headings and flags in code don't count. */
function fenceMask(lines: string[]): boolean[] {
  let open = false;
  return lines.map((l) => {
    const marker = /^\s*```/.test(l);
    const inside = open || marker;
    if (marker) open = !open;
    return inside;
  });
}

const headingLevel = (line: string) => /^(#{1,6})\s/.exec(line)?.[1].length ?? 0;

/** The template leaves sections like "## Lessons learned" holding a bare "-" until they're written. */
function dropEmptySections(body: string): string {
  const lines = body.split("\n");
  const code = fenceMask(lines);
  const drop = new Set<number>();
  lines.forEach((line, i) => {
    const level = code[i] ? 0 : headingLevel(line);
    if (!level) return;
    let j = i + 1;
    while (j < lines.length && !code[j] && /^\s*([-*]\s*)?$/.test(lines[j])) j++;
    const next = j < lines.length && !code[j] ? headingLevel(lines[j]) : 0;
    if (j === lines.length || (next && next <= level)) for (let k = i; k < j; k++) drop.add(k);
  });
  return lines.filter((_, i) => !drop.has(i)).join("\n");
}

/** Takes the flag out of the body (a toggle, a "Flag: x" line or a "## Flag" section) so the page's reveal keeps it hidden. */
function extractFlag(body: string): { body: string; flag?: string } {
  const re = /^[ \t]*(?:#{1,4}[ \t]+|[-*][ \t]+)?\**flag\**[ \t]*:?[ \t]*(?:\n[ \t]*)*(?:`([^`\n]+)`|([^\s`]+\{[^}\n]*\}))[ \t]*$/gim;
  const code = fenceMask(body.split("\n"));
  const lineOf = (index: number) => body.slice(0, index).split("\n").length - 1;
  const hit = [...body.matchAll(re)].filter((m) => !code[lineOf(m.index)]).at(-1);
  if (!hit) return { body };
  return { body: body.slice(0, hit.index) + body.slice(hit.index + hit[0].length), flag: (hit[1] ?? hit[2]).trim() };
}

/** Notion labels every new code block "jsx" until told otherwise, so that label says nothing about the code. */
function relabelDefaultFences(body: string): string {
  return body.replace(/^([ \t]*```)jsx[ \t]*\n([\s\S]*?)^([ \t]*```)[ \t]*$/gm, (_m, open: string, code: string, close: string) => `${open}${guessLanguage(code) ?? ""}\n${code}${close}`);
}

const plain = (s: string) =>
  s
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_/g, (_m, a, b, c, d) => a ?? b ?? c ?? d)
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 260);

function tldr(body: string): string {
  const lines = body.split("\n");
  const code = fenceMask(lines);
  const start = lines.findIndex((l, i) => !code[i] && /^#{1,4}\s*(tl;?\s*dr|ringkasan|summary)\b/i.test(l));
  if (start < 0) return "";
  const end = lines.findIndex((l, i) => i > start && !code[i] && headingLevel(l) > 0);
  const section = lines.slice(start + 1, end < 0 ? undefined : end).filter((_, i) => !code[start + 1 + i]).join("\n").trim();
  // With no heading after it, only the first block is sure to belong to the TL;DR.
  const text = end < 0 ? section.split(/\n{2,}/)[0] : section;
  return plain(text.replace(/(^|\s)[-*]\s+/g, "$1"));
}

export function prepareNotionMarkdown(markdown: string, fileName: string): NotionPage {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const page: NotionPage = { title: "", summary: "", body: "" };
  let i = 0;
  while (i < lines.length && !lines[i].trim()) i++;
  const h1 = /^#\s+(.+)$/.exec(lines[i] ?? "");
  if (h1) {
    page.title = h1[1].trim();
    i++;
  }
  // Property block: "Key: value" lines (blank lines allowed) directly under the title.
  let j = i;
  while (j < lines.length && (!lines[j].trim() || PROP.test(lines[j].trim()))) {
    const prop = readProperty(lines[j].trim());
    if (prop?.value) {
      if (prop.field === "tags") page.tags = prop.value.split(",").map((t) => t.trim()).filter(Boolean);
      else if (prop.field !== "ignored") page[prop.field] = prop.value;
    }
    j++;
  }
  if (j > i && lines.slice(i, j).some((l) => PROP.test(l.trim()))) i = j;
  const { body, flag } = extractFlag(lines.slice(i).join("\n"));
  page.flag = flag;
  page.body = relabelDefaultFences(dropEmptySections(body)).trim();
  page.title ||= fileName.replace(/\.[^.]+$/, "").replace(/\s+[0-9a-f]{6,32}$/i, "").replace(/[-_]+/g, " ").trim() || "Imported Writeup";
  const firstPara = page.body.split(/\n{2,}/).find((b) => b.trim() && !/^(#|```|!\[|\||>|-\s|\*\s|\d+\.\s)/.test(b.trim())) ?? "";
  page.summary = tldr(page.body) || plain(firstPara);
  return page;
}
