import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readSiteConfig } from "./site-config.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = readSiteConfig(ROOT);
const OUT = path.join(ROOT, SITE.outputDirectory);
const CONTENT = path.join(ROOT, "content");
const PUBLIC = path.join(ROOT, "public");
const errors = [];

function fail(message) {
  errors.push(message);
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(path.join(CONTENT, file), "utf8"));
  } catch (error) {
    fail("Cannot read content/" + file + ": " + error.message);
    return null;
  }
}

function walkFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(absolute) : entry.isFile() ? [absolute] : [];
  });
}

function route(pathname) {
  const clean = (pathname.startsWith("/") ? pathname : "/" + pathname).replace(/\/{2,}/g, "/");
  const normalized = clean === "/" ? "/" : clean.replace(/\/+$/, "");
  const suffix = SITE.trailingSlash ? (normalized === "/" ? "/" : normalized + "/") : normalized;
  return SITE.baseUrl + suffix;
}

function outputForRoute(pathname) {
  const clean = pathname.replace(/^\//, "").replace(/\/$/, "");
  if (!clean) return path.join(OUT, "index.html");
  return SITE.trailingSlash
    ? path.join(OUT, clean, "index.html")
    : path.join(OUT, clean + ".html");
}

const projects = readJson("projects.json") ?? [];
const published = walkFiles(path.join(CONTENT, "writeups"))
  .filter((file) => file.endsWith(".md"))
  .map((file) => {
    const raw = readFileSync(file, "utf8");
    const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
    if (!match) {
      fail("Missing frontmatter: " + path.relative(CONTENT, file));
      return null;
    }
    const metadata = {};
    for (const line of match[1].split(/\r?\n/)) {
      const field = /^([a-zA-Z][\w-]*):\s*(.*)$/.exec(line);
      if (!field) continue;
      try { metadata[field[1]] = JSON.parse(field[2]); }
      catch { metadata[field[1]] = field[2]; }
    }
    return metadata.status === "published" ? metadata : null;
  })
  .filter(Boolean);

if (!existsSync(OUT)) fail("Missing dist/ directory; run the production build first.");

for (const pathname of ["/", "/about", "/projects", "/achievements", "/writeups", "/ctf", "/links"]) {
  if (!existsSync(outputForRoute(pathname))) fail("Missing static output: " + pathname);
}
for (const file of ["robots.txt", "sitemap.xml"]) if (!existsSync(path.join(OUT, file))) fail("Missing static output: " + file);

for (const project of projects) {
  const routeFile = outputForRoute("/projects/" + project.id);
  if (!existsSync(routeFile)) fail("Missing project detail output: projects/" + project.id);
}

const sitemapPath = path.join(OUT, "sitemap.xml");
let sitemap = "";
if (existsSync(sitemapPath)) sitemap = readFileSync(sitemapPath, "utf8");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const uniqueSitemapUrls = new Set(sitemapUrls);
if (uniqueSitemapUrls.size !== sitemapUrls.length) fail("Sitemap contains duplicate URLs.");
if (sitemapUrls.some((url) => !url.startsWith(SITE.baseUrl + "/"))) {
  fail("Sitemap contains a URL outside the configured canonical origin/basePath.");
}

const staticRoutes = ["/", "/writeups", "/projects", "/achievements", "/about", "/links"];
for (const pathname of staticRoutes) {
  if (!sitemapUrls.includes(route(pathname))) fail("Static page missing from sitemap: " + pathname);
}

for (const item of published) {
  if (!item?.slug) continue;
  for (const prefix of ["writeups", "ctf"]) {
    const routeFile = outputForRoute("/" + prefix + "/" + item.slug);
    if (!existsSync(routeFile)) fail("Missing generated article route: " + prefix + "/" + item.slug);
  }
  const expected = route("/writeups/" + encodeURIComponent(item.slug));
  if (!sitemapUrls.includes(expected)) fail("Published article missing from sitemap: " + item.slug);
}

for (const project of projects) {
  const expected = route("/projects/" + encodeURIComponent(project.id));
  if (!sitemapUrls.includes(expected)) fail("Project detail missing from sitemap: " + project.id);
}

const expectedUrlCount = staticRoutes.length + published.length + projects.length;
if (sitemapUrls.length !== expectedUrlCount) {
  fail(`Expected ${expectedUrlCount} canonical sitemap URLs (6 static + ${published.length} writeups + ${projects.length} projects), found ${sitemapUrls.length}.`);
}

const sourceUploads = walkFiles(path.join(PUBLIC, "assets", "uploads"));
const outputUploads = walkFiles(path.join(OUT, "assets", "uploads"));
if (sourceUploads.length !== outputUploads.length) {
  fail("Upload asset count mismatch: public=" + sourceUploads.length + ", dist=" + outputUploads.length);
}

if (SITE.origin && !SITE.origin.endsWith(".github.io")) {
  const cnamePath = path.join(OUT, "CNAME");
  if (!existsSync(cnamePath) || readFileSync(cnamePath, "utf8").trim() !== new URL(SITE.url).hostname) {
    fail("dist/CNAME is missing or does not match the configured canonical hostname.");
  }
}

for (const relative of ["src/app/admin", "src/app/api", "src/lib/db.ts", "src/lib/session.ts", "src/generated/prisma", "prisma"]) {
  if (existsSync(path.join(ROOT, relative))) fail("Server/database-only path remains in website source: " + relative);
}

const packageJson = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8"));
for (const dependency of ["@prisma/client", "@prisma/adapter-pg", "pg", "prisma"]) {
  if (packageJson.dependencies?.[dependency] || packageJson.devDependencies?.[dependency]) {
    fail("Database dependency remains in package.json: " + dependency);
  }
}

const staleApiRefs = walkFiles(CONTENT).filter((file) => /\.(md|mdx|json)$/i.test(file)).filter((file) => readFileSync(file, "utf8").includes("/api/public/uploads/"));
if (staleApiRefs.length) fail("Legacy upload API references remain in content: " + staleApiRefs.map((file) => path.relative(CONTENT, file)).join(", "));

const summary = {
  outputDirectory: SITE.outputDirectory,
  basePath: SITE.basePath || "/",
  canonicalBaseUrl: SITE.baseUrl,
  outputFiles: walkFiles(OUT).length,
  staticPages: staticRoutes.length,
  publishedWriteups: published.length,
  projects: projects.length,
  sitemapUrls: sitemapUrls.length,
  expectedSitemapUrls: expectedUrlCount,
  sourceUploads: sourceUploads.length,
  outputUploads: outputUploads.length,
  errors: errors.length,
};
console.log(JSON.stringify(summary, null, 2));
errors.forEach((error) => console.error("ERROR " + error));
if (errors.length) process.exitCode = 1;
