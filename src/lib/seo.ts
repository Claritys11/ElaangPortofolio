const stripTags = (html: string) =>
  html
    .replace(/<(script|style|pre)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x?27;|&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 0 ? cut.lastIndexOf(" ") : cut.length).replace(/[\s,.;:—-]+$/, "")}…`;
}

type WriteupLike = { title: string; competition: string; category: string; difficulty: string | null; summary: string };

export function writeupSeoTitle(w: Pick<WriteupLike, "title" | "competition" | "category">): string {
  return `${w.title} — ${w.competition ? `${w.competition} ` : ""}${w.category} Writeup`;
}

/** Leads with what the page is (for search snippets), then the challenge summary or opening text. */
export function writeupSeoDescription(w: WriteupLike, contentHtml: string, max = 158): string {
  const lead = `${w.category} CTF writeup${w.competition ? ` from ${w.competition}` : ""}${w.difficulty ? ` (${w.difficulty})` : ""}`;
  const body = w.summary.trim() || stripTags(contentHtml);
  return truncate(body ? `${lead}: ${body}` : lead, max);
}

const ID_WORDS = new Set(["yang", "dan", "ini", "itu", "untuk", "dengan", "dari", "tidak", "kita", "akan", "adalah", "bisa", "pada", "ke", "di", "jadi", "kalau", "sudah", "karena", "kemudian", "beberapa", "diberi", "lalu", "saya"]);
const EN_WORDS = new Set(["the", "and", "is", "to", "with", "we", "this", "that", "of", "for", "are", "be", "it", "an", "on", "then", "can", "goal", "given"]);

/** Rough language guess for article prose (writeups are a mix of Indonesian and English). */
export function detectLang(text: string): "id" | "en" {
  let id = 0;
  let en = 0;
  for (const word of text.toLowerCase().match(/[a-z]+/g) ?? []) {
    if (ID_WORDS.has(word)) id++;
    else if (EN_WORDS.has(word)) en++;
  }
  return id > en ? "id" : "en";
}

export const plainText = stripTags;

export function breadcrumbJsonLd(base: string, items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${base}${it.path}` })),
  };
}

/** Serialise JSON-LD safely for a <script> tag. */
export const jsonLdScript = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");

/**
 * Per-page openGraph. Next.js replaces (not merges) a parent's openGraph object, so every page
 * passes the shared fields again, including the generated site card as the default image.
 */
export function pageOpenGraph(path: string, extra: Record<string, unknown> = {}) {
  return {
    type: "website" as const,
    url: path,
    siteName: "Elang Dimas Syadewa Portfolio",
    locale: "id_ID",
    alternateLocale: ["en_US"],
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Elang Dimas Syadewa (Claritys)" }],
    ...extra,
  };
}
