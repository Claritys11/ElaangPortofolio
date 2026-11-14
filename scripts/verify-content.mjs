import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeBasePath } from "./site-config.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = path.join(ROOT, "content");
const PUBLIC = path.join(ROOT, "public");
const errors = [];
const warnings = [];

function fail(message) {
  errors.push(message);
}

function readJson(relative) {
  const file = path.join(CONTENT, relative);
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    fail("Cannot parse content/" + relative + ": " + error.message);
    return null;
  }
}

function frontmatter(raw, file) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!match) {
    fail("Missing frontmatter: " + file);
    return null;
  }
  const values = {};
  for (const line of match[1].split(/\r?\n/)) {
    const property = /^([a-zA-Z][\w-]*):\s*(.*)$/.exec(line);
    if (!property) continue;
    try {
      values[property[1]] = JSON.parse(property[2]);
    } catch {
      values[property[1]] = property[2];
    }
  }
  return { metadata: values, body: match[2] };
}

function verifyAsset(rawUrl, source) {
  if (!rawUrl || typeof rawUrl !== "string") return;
  if (rawUrl.startsWith("data:") || /^https?:\/\//i.test(rawUrl)) return;
  if (rawUrl.startsWith("/api/public/uploads/")) {
    fail(source + " still references the legacy uploads API: " + rawUrl);
    return;
  }
  if (!rawUrl.startsWith("/")) return;
  const pathname = decodeURIComponent(rawUrl.split(/[?#]/, 1)[0]);
  const absolute = path.resolve(PUBLIC, "." + pathname);
  if (absolute !== PUBLIC && !absolute.startsWith(PUBLIC + path.sep)) {
    fail(source + " escapes the public directory: " + rawUrl);
    return;
  }
  if (!existsSync(absolute) || !statSync(absolute).isFile()) {
    fail(source + " references a missing public file: " + rawUrl);
  }
}

const site = readJson("site.json");
if (site) {
  try {
    const url = new URL(site.url);
    if (!["https:", "http:"].includes(url.protocol)) fail("site.json url must use HTTP(S)");
    if (url.pathname !== "/" || url.search || url.hash) fail("site.json url must contain only the canonical origin; use basePath for path prefixes");
  } catch {
    fail("site.json url is not a valid URL");
  }
  if (site.schemaVersion !== 2) fail("Unsupported content schemaVersion: " + site.schemaVersion);
  try {
  try {
    if ((normalizeBasePath(site.basePath ?? "/") || "/") !== (site.basePath ?? "/")) fail("site.json basePath must be `/` or a normalized URL-safe path");
  } catch { fail("site.json basePath must be `/` or a normalized URL-safe path"); }
  } catch {
    fail("site.json basePath is invalid");
  }
  if (site.outputDirectory !== "dist") fail("site.json outputDirectory must be `dist`");
}

const appearance = readJson("appearance.json");
if (appearance) {
  if (!["dark", "light"].includes(appearance.defaultTheme)) fail("appearance.json defaultTheme must be dark or light");
  if (!Number.isInteger(appearance.radius) || appearance.radius < 2 || appearance.radius > 24) fail("appearance.json radius must be an integer from 2 to 24");
  for (const font of ["display", "body", "mono"]) {
    if (typeof appearance.typography?.[font] !== "string" || !appearance.typography[font]) fail("appearance.json is missing typography." + font);
  }
  const colorKeys = ["background", "foreground", "card", "primary", "secondary", "muted", "mutedForeground"];
  for (const mode of ["light", "dark"]) {
    for (const key of colorKeys) {
      if (!/^#[0-9a-fA-F]{6}$/.test(appearance.colors?.[mode]?.[key] ?? "")) {
        fail("appearance.json has an invalid " + mode + " colour: " + key);
      }
    }
  }
}

const profile = readJson("profile.json");
if (profile) {
  if (!profile.displayName || !profile.alias || !profile.brand) fail("profile.json is missing identity fields");
  verifyAsset(profile.profileImageUrl, "profile.json");
  for (const url of profile.seo?.sameAs ?? []) {
    try { new URL(url); } catch { fail("Invalid profile social URL: " + url); }
  }
}

const projects = readJson("projects.json");
const achievements = readJson("achievements.json");
for (const [label, records] of [["projects.json", projects], ["achievements.json", achievements]]) {
  if (!Array.isArray(records)) continue;
  const ids = new Set();
  for (const record of records) {
    if (!record.id || !record.title) fail(label + " contains a record without id/title");
    if (ids.has(record.id)) fail(label + " contains duplicate id: " + record.id);
    ids.add(record.id);
    verifyAsset(record.imageUrl, label + " / " + record.id);
    verifyAsset(record.documentUrl, label + " / " + record.id);
  }
}

const writeupRoot = path.join(CONTENT, "writeups");
let publishedCount = 0;
let draftCount = 0;
const slugs = new Set();
if (!existsSync(writeupRoot)) {
  fail("Missing content/writeups directory");
} else {
  const files = readdirSync(writeupRoot).filter((file) => file.endsWith(".md")).sort();
  for (const filename of files) {
    const absolute = path.join(writeupRoot, filename);
    const parsed = frontmatter(readFileSync(absolute, "utf8"), filename);
    if (!parsed) continue;
    const item = parsed.metadata;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug ?? "")) fail(filename + " has an invalid slug");
    if (filename !== (item.slug ?? "") + ".md") fail(filename + " filename does not match frontmatter slug");
    if (slugs.has(item.slug)) fail("Duplicate writeup slug: " + item.slug);
    slugs.add(item.slug);
    if (!item.title || typeof item.title !== "string") fail(filename + " has no title");
    if (!["draft", "published"].includes(item.status)) fail(filename + " status must be draft or published");
    if (item.status === "published") publishedCount += 1;
    else draftCount += 1;
    if (item.date && !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) fail(filename + " date must be YYYY-MM-DD");
    if (!Array.isArray(item.tags)) fail(filename + " tags must be an array");
    if (!Array.isArray(item.attachments)) fail(filename + " attachments must be an array");
    if (/\/api\/public\/uploads\//.test(parsed.body)) fail(filename + " body still references the legacy uploads API");
    const markdownImages = [...parsed.body.matchAll(/!\[[^\]]*]\(([^)\s]+)(?:\s+[^)]*)?\)/g)].map((match) => match[1]);
    const htmlImages = [...parsed.body.matchAll(/<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']/gi)].map((match) => match[1]);
    [...markdownImages, ...htmlImages].forEach((url) => verifyAsset(url, filename));
    (item.attachments ?? []).forEach((attachment) => verifyAsset(attachment.url, filename + " attachment"));
  }
}

if (publishedCount === 0) fail("No published writeups were found");
if (!Array.isArray(projects)) fail("projects.json must be an array");
if (!Array.isArray(achievements)) fail("achievements.json must be an array");

const summary = {
  site: site?.url ?? null,
  publishedWriteups: publishedCount,
  drafts: draftCount,
  projects: Array.isArray(projects) ? projects.length : null,
  achievements: Array.isArray(achievements) ? achievements.length : null,
  errors: errors.length,
};
console.log(JSON.stringify(summary, null, 2));
warnings.forEach((warning) => console.warn("WARN " + warning));
errors.forEach((error) => console.error("ERROR " + error));
if (errors.length) process.exitCode = 1;
