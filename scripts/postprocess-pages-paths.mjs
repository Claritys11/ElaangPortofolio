import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readSiteConfig, normalizeBasePath } from "./site-config.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = readSiteConfig(ROOT);
const OUT = path.join(ROOT, SITE.outputDirectory);
const ROUTES_MANIFEST = path.join(ROOT, ".next", "routes-manifest.json");
if (!existsSync(ROUTES_MANIFEST)) throw new Error("Missing .next/routes-manifest.json; run next build first.");
const ROUTES = JSON.parse(readFileSync(ROUTES_MANIFEST, "utf8"));
const BASE = normalizeBasePath(ROUTES.basePath ?? SITE.basePath);

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : entry.isFile() ? [absolute] : [];
  });
}

let changed = 0;
for (const file of walk(OUT)) {
  if (!/\.(html|css)$/.test(file)) continue;
  const original = readFileSync(file, "utf8");
  const prefixPath = (pathname) => {
    if (!BASE || pathname === BASE || pathname.startsWith(`${BASE}/`) || pathname.startsWith(`${BASE}?`) || pathname.startsWith(`${BASE}#`)) return pathname;
    return `${BASE}${pathname}`;
  };
  const updated = original
    .replace(/((?:href|src|poster|action|formaction)=["'])(\/(?!\/)[^"']*)/g, (_whole, attribute, pathname) => `${attribute}${prefixPath(pathname)}`)
    .replace(/url\((["']?)(\/(?!\/)[^)"']*)\1\)/g, (_whole, quote, pathname) => `url(${quote}${prefixPath(pathname)}${quote})`);
  if (updated !== original) {
    writeFileSync(file, updated);
    changed++;
  }
}
if (!SITE.origin.endsWith(".github.io")) writeFileSync(path.join(OUT, "CNAME"), new URL(SITE.url).hostname + "\n");
console.log(JSON.stringify({ outputDirectory: SITE.outputDirectory, basePath: BASE || "/", rewrittenFiles: changed }));
