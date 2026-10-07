/** Notion page exports: "# Title", then optional database properties, then the body. */
export type NotionPage = { title: string; summary: string; body: string; category?: string; competition?: string; difficulty?: string; date?: string; tags?: string[] };

const PROP = /^(Category|Competition|Difficulty|Date|Tags?)\s*:\s*(.+)$/i;

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
    const m = PROP.exec(lines[j].trim());
    if (m) {
      const key = m[1].toLowerCase();
      const value = m[2].trim();
      if (key.startsWith("tag")) page.tags = value.split(",").map((t) => t.trim()).filter(Boolean);
      else if (key === "date") page.date = Number.isNaN(Date.parse(value)) ? undefined : new Date(`${value} UTC`).toISOString().slice(0, 10);
      else page[key as "category" | "competition" | "difficulty"] = value;
    }
    j++;
  }
  if (j > i && lines.slice(i, j).some((l) => PROP.test(l.trim()))) i = j;
  page.body = lines.slice(i).join("\n").trim();
  page.title ||= fileName.replace(/\.[^.]+$/, "").replace(/\s+[0-9a-f]{6,32}$/i, "").replace(/[-_]+/g, " ").trim() || "Imported Writeup";
  const firstPara = page.body.split(/\n{2,}/).find((b) => b.trim() && !/^(#|```|!\[|\||>|-\s|\*\s|\d+\.\s)/.test(b.trim())) ?? "";
  page.summary = firstPara
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_/g, (_m, a, b, c, d) => a ?? b ?? c ?? d)
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 260);
  return page;
}
