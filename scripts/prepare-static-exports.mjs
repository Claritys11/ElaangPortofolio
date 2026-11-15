import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import { readSiteConfig } from "./site-config.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WRITEUPS = path.join(ROOT, "content", "writeups");
const OUTPUT = path.join(ROOT, "public", "assets", "exports");
const SITE_CONFIG = readSiteConfig(ROOT);

function parseArticle(file) {
  const raw = readFileSync(file, "utf8");
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!match) throw new Error("Missing frontmatter: " + file);
  const metadata = {};
  for (const line of match[1].split(/\r?\n/)) {
    const item = /^([a-zA-Z][\w-]*):\s*(.*)$/.exec(line);
    if (!item) continue;
    try { metadata[item[1]] = JSON.parse(item[2]); }
    catch { metadata[item[1]] = item[2]; }
  }
  return { metadata, body: match[2].trim() };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function mimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  return ({
    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml",
    ".pdf": "application/pdf", ".txt": "text/plain", ".zip": "application/zip",
  })[ext] ?? "application/octet-stream";
}

function inlineLocalImages(body) {
  return body.replace(/!\[([^\]]*)\]\((\/assets\/[^)\s]+)(?:\s+[^)]*)?\)/g, (whole, alt, url) => {
    const filename = path.resolve(ROOT, "public", "." + decodeURIComponent(url));
    const publicRoot = path.resolve(ROOT, "public");
    if (!filename.startsWith(publicRoot + path.sep) || !existsSync(filename)) return whole;
    const data = readFileSync(filename).toString("base64");
    return '<img alt="' + escapeHtml(alt) + '" src="data:' + mimeType(filename) + ';base64,' + data + '">';
  });
}

async function main() {
  mkdirSync(OUTPUT, { recursive: true });
  const files = existsSync(WRITEUPS) ? readdirSync(WRITEUPS) : [];
  const markdownFiles = files.filter((name) => name.endsWith(".md")).sort();
  const summary = { total: markdownFiles.length, generated: 0, skippedDrafts: 0, errors: [] };

  for (const name of markdownFiles) {
    try {
      const { metadata, body } = parseArticle(path.join(WRITEUPS, name));
      if (metadata.status !== "published") {
        summary.skippedDrafts += 1;
        continue;
      }
      const slug = metadata.slug;
      if (typeof slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        throw new Error("Invalid slug");
      }
      const title = metadata.title || slug;
      const date = metadata.date || "";
      const tags = Array.isArray(metadata.tags) ? metadata.tags : [];
      const exportBody = body
        + (metadata.flag ? "\n\n## Flag\n\n\`" + String(metadata.flag).replace(/\`/g, "") + "\`" : "")
        + ((metadata.attachments ?? []).length ? "\n\n## Attachments\n\n" + metadata.attachments.map((item) => "- [" + item.name + "](" + item.url + ")").join("\n") : "");
      const markdown = [
        "---",
        "title: " + JSON.stringify(title),
        "ctf: " + JSON.stringify(metadata.competition || ""),
        "category: " + JSON.stringify(metadata.category || "Misc"),
        "difficulty: " + JSON.stringify(metadata.difficulty || ""),
        "date: " + JSON.stringify(date),
        "tags: " + JSON.stringify(tags),
        "source: " + JSON.stringify(SITE_CONFIG.baseUrl + "/writeups/" + slug),
        "---",
        "",
        "# " + title,
        "",
        body,
        metadata.flag ? "\n## Flag\n\n\`" + String(metadata.flag).replace(/\`/g, "") + "\`" : "",
        (metadata.attachments ?? []).length ? "\n## Attachments\n\n" + metadata.attachments.map((item) => "- [" + item.name + "](" + item.url + ")").join("\n") : "",
        "",
      ].join("\n");
      const htmlBody = await marked.parse(inlineLocalImages(exportBody), { gfm: true });
      const tagsHtml = tags.map((tag) => "<li>" + escapeHtml(tag) + "</li>").join("");
      const html = [
        "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">",
        "<title>" + escapeHtml(title) + " — Claritys</title>",
        "<style>",
        ":root{color-scheme:light;--ink:#0e0e0c;--paper:#faf9f6;--muted:#66625a;--line:#e3e0d9;--accent:#ff5b1f}",
        "*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.72 system-ui,sans-serif}",
        "main{max-width:860px;margin:0 auto;padding:56px 24px 80px}.meta{font:11px/1.6 ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}",
        "h1,h2,h3{font-family:Archivo,system-ui,sans-serif;line-height:1.08;letter-spacing:-.035em}h1{font-size:clamp(2.5rem,8vw,5rem);margin:1rem 0}h2{font-size:2rem;margin:2.4em 0 .5em;padding-top:.7em;border-top:1px solid var(--line)}",
        "a{color:var(--accent)}img{display:block;max-width:100%;height:auto;margin:2rem auto;border:1px solid var(--line);border-radius:4px}",
        "pre{overflow:auto;padding:1rem;background:#efede8;border:1px solid var(--line);border-radius:4px;font:13px/1.6 ui-monospace,monospace}code{font-family:ui-monospace,monospace}blockquote{border-left:2px solid var(--accent);padding-left:1rem;color:var(--muted);margin-left:0}",
        "table{border-collapse:collapse;width:100%;font-size:.9rem}th,td{border:1px solid var(--line);padding:.5rem;text-align:left}ul.tags{display:flex;gap:.4rem;flex-wrap:wrap;padding:0;list-style:none}ul.tags li{border:1px solid var(--line);border-radius:999px;padding:.15rem .65rem;font:10px ui-monospace,monospace;text-transform:uppercase;color:var(--muted)}",
        ".flag{border:1px solid var(--accent);padding:1rem;overflow-wrap:anywhere;font:14px ui-monospace,monospace}",
        "@media print{body{background:#fff}main{padding:0;max-width:none}pre{white-space:pre-wrap;overflow-wrap:anywhere}img{break-inside:avoid}a{color:inherit}}",
        "</style></head><body><main>",
        "<p class=\"meta\">" + escapeHtml([metadata.category, metadata.competition, metadata.difficulty, date].filter(Boolean).join(" · ")) + "</p>",
        "<h1>" + escapeHtml(title) + "</h1>",
        metadata.summary ? "<p>" + escapeHtml(metadata.summary) + "</p>" : "",
        tagsHtml ? "<ul class=\"tags\">" + tagsHtml + "</ul>" : "",
        "<article>" + htmlBody + "</article>",
        "<footer class=\"meta\">Exported from " + escapeHtml(SITE_CONFIG.baseUrl) + " · Elang Dimas Syadewa (Claritys)</footer>",
        "</main></body></html>",
      ].join("");
      writeFileSync(path.join(OUTPUT, slug + ".md"), markdown);
      writeFileSync(path.join(OUTPUT, slug + ".html"), html);
      summary.generated += 1;
    } catch (error) {
      summary.errors.push({ file: name, error: error.message });
    }
  }
  console.log(JSON.stringify(summary, null, 2));
  if (summary.errors.length || summary.generated === 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
