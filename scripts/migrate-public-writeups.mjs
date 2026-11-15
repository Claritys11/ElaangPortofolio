#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const SOURCE = process.env.PUBLIC_WRITEUP_SOURCE ?? "https://claritys.web.id";
const ROOT = process.cwd();
const WRITEUPS_DIR = path.join(ROOT, "content", "writeups");
const UPLOADS_DIR = path.join(ROOT, "public", "assets", "uploads");
const MANIFEST_PATH = path.join(ROOT, "migration", "public-writeups-manifest.json");
const APPLY = process.argv.includes("--apply");
const MAX_ASSET_BYTES = Number(process.env.PUBLIC_WRITEUP_MAX_ASSET_BYTES ?? 100 * 1024 * 1024);
const PAGE_CONCURRENCY = 4;
const ASSET_CONCURRENCY = 6;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function hash(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function isoDay(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function quote(value) {
  return JSON.stringify(value ?? null);
}

function splitExport(markdown) {
  const match = /^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/.exec(markdown);
  assert(match, "Public Markdown export has no frontmatter.");

  const exportBody = match[1].replace(/\r\n/g, "\n").trim();
  const flagMatch = /\n## Flag\s*\n+\x60([^\x60\r\n]+)\x60\s*(?=\n## Attachments\s*\n|$)/.exec(exportBody);
  const attachmentIndex = exportBody.lastIndexOf("\n## Attachments\n");
  const flagIndex = exportBody.lastIndexOf("\n## Flag\n");
  const cutPoints = [flagIndex, attachmentIndex].filter((index) => index >= 0);
  const body = (cutPoints.length ? exportBody.slice(0, Math.min(...cutPoints)) : exportBody).trim();

  const attachments = [];
  if (attachmentIndex >= 0) {
    const section = exportBody.slice(attachmentIndex + "\n## Attachments\n".length);
    for (const line of section.split("\n")) {
      const item = /^[-*]\s+\[([^\]]+)\]\(([^)]+)\)\s*$/.exec(line.trim());
      if (item) attachments.push({ name: item[1].trim(), url: item[2].trim() });
    }
  }

  return { body, flag: flagMatch?.[1] ?? null, attachments };
}

function uploadFilename(value) {
  const url = new URL(value, SOURCE);
  if (url.origin !== SOURCE || !url.pathname.startsWith("/api/public/uploads/")) return null;
  const filename = decodeURIComponent(url.pathname.slice("/api/public/uploads/".length));
  if (!filename || path.basename(filename) !== filename || filename.includes("\\") || filename === "." || filename === "..") {
    throw new Error("Unsafe upload path in source content: " + value);
  }
  return filename;
}

function imageReferences(markdown) {
  return [...new Set([...markdown.matchAll(/!\[[^\]]*]\(([^)\s]+)(?:\s+[^)]*)?\)/g)].map((match) => match[1]))];
}

function externalImages(markdown) {
  return imageReferences(markdown).filter((value) => {
    try {
      const url = new URL(value, SOURCE);
      return url.protocol.startsWith("http") && !uploadFilename(url.href);
    } catch {
      return false;
    }
  });
}

function serializeArticle(article) {
  const lines = [
    "---",
    "slug: " + quote(article.slug),
    "title: " + quote(article.title),
    "competition: " + quote(article.competition),
    "category: " + quote(article.category),
    "difficulty: " + quote(article.difficulty),
    "date: " + quote(article.date),
    "updated: " + quote(article.updated),
    "summary: " + quote(article.summary),
    "tags: " + quote(article.tags),
    'status: "published"',
    "flag: " + quote(article.flag),
    "attachments: " + quote(article.attachments),
    "source: " + quote(article.source),
    "---",
    "",
    article.body.trim(),
    "",
  ];
  return lines.join("\n");
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

async function scrapeArticle(browser, route) {
  const page = await browser.newPage();
  try {
    const response = await page.goto(route, { waitUntil: "domcontentloaded", timeout: 60_000 });
    assert(response?.ok(), "Writeup route failed: " + route + " (" + (response?.status() ?? "no response") + ")");
    await page.locator("main article.writeup-prose").waitFor({ state: "attached", timeout: 30_000 });

    const dom = await page.evaluate(() => {
      const main = document.querySelector("main");
      const header = main?.querySelector("header");
      const article = main?.querySelector("article.writeup-prose");
      const jsonLd = [...document.querySelectorAll('script[type="application/ld+json"]')]
        .flatMap((script) => {
          try {
            const parsed = JSON.parse(script.textContent ?? "null");
            return Array.isArray(parsed?.["@graph"]) ? parsed["@graph"] : [parsed];
          } catch {
            return [];
          }
        });
      const schema = jsonLd.find((item) => item?.["@type"] === "TechArticle") ?? {};
      const meta = header?.querySelector("p.meta")?.innerText ?? "";
      const tags = [...(header?.querySelector("ul")?.querySelectorAll("li") ?? [])]
        .map((item) => item.innerText.trim())
        .filter(Boolean);
      const summary = [...(header?.querySelectorAll("p") ?? [])]
        .find((item) => !item.classList.contains("meta"))?.innerText.trim() ?? "";
      const about = Array.isArray(schema.about) ? schema.about.filter((value) => typeof value === "string") : [];
      const category = typeof schema.articleSection === "string" ? schema.articleSection : "";
      return {
        title: main?.querySelector("h1")?.innerText.trim() ?? "",
        summary,
        tags,
        meta,
        category,
        competition: about.find((value) => value !== category) ?? "",
        difficulty: typeof schema.proficiencyLevel === "string" ? schema.proficiencyLevel : "",
        date: schema.datePublished ?? null,
        updated: schema.dateModified ?? null,
        articleHtmlBytes: article?.innerHTML.length ?? 0,
        imageUrls: [...(article?.querySelectorAll("img[src]") ?? [])].map((image) => image.getAttribute("src")),
      };
    });

    assert(dom.title, "Missing DOM title for " + route);
    assert(dom.articleHtmlBytes > 0, "Article DOM is empty for " + route);

    const exportUrl = route.replace(/\/+$/, "") + "/export?format=md";
    const exportResponse = await fetch(exportUrl, { signal: AbortSignal.timeout(60_000) });
    assert(exportResponse.ok, "Markdown export failed: " + exportUrl + " (" + exportResponse.status + ")");
    const markdown = await exportResponse.text();
    const parsed = splitExport(markdown);
    assert(parsed.body.length > 0, "Markdown export body is empty for " + route);
    assert(parsed.body.startsWith("# "), "Markdown export has no H1 for " + route);

    const exportUploadNames = new Set(
      [...markdown.matchAll(/https:\/\/claritys\.web\.id\/api\/public\/uploads\/([^\s)\]>]+)/g)]
        .map((match) => decodeURIComponent(match[1])),
    );
    const domUploadNames = new Set(
      dom.imageUrls.map((value) => uploadFilename(new URL(value, route).href)).filter(Boolean),
    );
    for (const filename of domUploadNames) {
      assert(exportUploadNames.has(filename), "DOM image is missing from the Markdown export for " + route + ": " + filename);
    }

    const attachments = parsed.attachments.map((attachment) => {
      const filename = uploadFilename(attachment.url);
      assert(filename, "Attachment is not stored in the source upload store: " + attachment.url);
      return { filename, name: attachment.name };
    });

    const slug = new URL(route).pathname.replace(/\/+$/, "").split("/").pop();
    return {
      slug,
      source: route,
      title: dom.title,
      competition: dom.competition,
      category: dom.category || dom.meta.split("·")[0]?.trim() || "Misc",
      difficulty: dom.difficulty || dom.meta.split("·")[1]?.trim() || null,
      date: isoDay(dom.date),
      updated: isoDay(dom.updated),
      summary: dom.summary,
      tags: dom.tags,
      status: response.status(),
      markdownBytes: Buffer.byteLength(markdown),
      body: parsed.body.replace(/https:\/\/claritys\.web\.id\/api\/public\/uploads\/([^\s)\]>]+)/g, (_all, filename) => "/assets/uploads/" + decodeURIComponent(filename)),
      flag: parsed.flag,
      attachments,
      assetNames: [...exportUploadNames],
      domImageNames: [...domUploadNames],
      externalImages: externalImages(parsed.body),
      domArticleHtmlBytes: dom.articleHtmlBytes,
    };
  } finally {
    await page.close();
  }
}

async function main() {
  assert(Number.isFinite(MAX_ASSET_BYTES) && MAX_ASSET_BYTES > 0, "PUBLIC_WRITEUP_MAX_ASSET_BYTES must be positive.");
  const sitemapResponse = await fetch(SOURCE + "/sitemap.xml", { signal: AbortSignal.timeout(30_000) });
  assert(sitemapResponse.ok, "Source sitemap is unavailable: HTTP " + sitemapResponse.status);
  const sitemap = await sitemapResponse.text();
  const routes = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => new URL(match[1]))
    .filter((url) => url.origin === SOURCE && /^\/writeups\/[a-z0-9-]+\/?$/.test(url.pathname))
    .map((url) => SOURCE + url.pathname.replace(/\/+$/, ""))
    .sort();

  assert(routes.length > 0, "No writeup routes found in the source sitemap.");
  assert(new Set(routes).size === routes.length, "Duplicate writeup routes found in the source sitemap.");

  const browser = await chromium.launch({ headless: true });
  let articles;
  try {
    const indexPage = await browser.newPage();
    try {
      const indexResponse = await indexPage.goto(SOURCE + "/writeups", { waitUntil: "domcontentloaded", timeout: 60_000 });
      assert(indexResponse?.ok(), "Public writeup index is unavailable.");
      const indexSlugs = await indexPage.locator('main a[href^="/writeups/"]').evaluateAll((links) =>
        [...new Set(links.map((link) => new URL(link.getAttribute("href"), location.origin).pathname.replace(/\/+$/, "")))]
          .filter((pathname) => /^\/writeups\/[a-z0-9-]+$/.test(pathname))
          .sort(),
      );
      const sitemapSlugs = routes.map((route) => new URL(route).pathname).sort();
      assert(JSON.stringify(indexSlugs) === JSON.stringify(sitemapSlugs), "DOM writeup index and sitemap route inventories differ.");
    } finally {
      await indexPage.close();
    }

    articles = await mapLimit(routes, PAGE_CONCURRENCY, (route) => scrapeArticle(browser, route));
  } finally {
    await browser.close();
  }

  const localNames = new Set((await readdir(WRITEUPS_DIR)).filter((name) => name.endsWith(".md")).map((name) => name.slice(0, -3)));
  const localAssetNames = new Set(await readdir(UPLOADS_DIR));
  const allAssetNames = [...new Set(articles.flatMap((article) => article.assetNames))].sort();
  const attachmentsCount = articles.reduce((sum, article) => sum + article.attachments.length, 0);
  const sourceNewSlugs = articles.filter((article) => !localNames.has(article.slug)).map((article) => article.slug);
  const missingAssets = allAssetNames.filter((filename) => !localAssetNames.has(filename));

  const assetResults = await mapLimit(allAssetNames, ASSET_CONCURRENCY, async (filename) => {
    assert(path.basename(filename) === filename && !filename.includes("\\") && filename !== "." && filename !== "..", "Unsafe upload filename: " + filename);
    const url = SOURCE + "/api/public/uploads/" + encodeURIComponent(filename);
    const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
    assert(response.ok, "Upload download failed: " + filename + " (HTTP " + response.status + ")");
    const contentType = (response.headers.get("content-type") ?? "application/octet-stream").split(";")[0].trim();
    const bytes = new Uint8Array(await response.arrayBuffer());
    assert(bytes.byteLength > 0, "Empty upload from source: " + filename);
    assert(bytes.byteLength <= MAX_ASSET_BYTES, "Upload exceeds maximum allowed size: " + filename + " (" + bytes.byteLength + " bytes)");
    const digest = hash(bytes);
    const target = path.join(UPLOADS_DIR, filename);
    let localDigest = null;
    try {
      const local = await readFile(target);
      localDigest = hash(local);
    } catch {
      // Missing local assets are added only in --apply mode.
    }
    assert(localDigest === null || localDigest === digest, "Existing local upload differs from its source counterpart; refusing to overwrite automatically: " + filename);
    return {
      filename,
      url,
      contentType,
      size: bytes.byteLength,
      sha256: digest,
      localExists: localDigest !== null,
      localMatches: localDigest === digest,
      bytes,
      target,
    };
  });

  const assetMap = new Map(assetResults.map((asset) => [asset.filename, asset]));
  for (const article of articles) {
    article.attachments = article.attachments.map((attachment) => ({
      url: "/assets/uploads/" + attachment.filename,
      name: attachment.name,
      contentType: assetMap.get(attachment.filename)?.contentType ?? "application/octet-stream",
    }));
  }

  const beforeFiles = new Map();
  const afterFiles = new Map();
  for (const article of articles) {
    const currentPath = path.join(WRITEUPS_DIR, article.slug + ".md");
    let current = null;
    try { current = await readFile(currentPath, "utf8"); } catch { /* New article. */ }
    beforeFiles.set(article.slug, current);
    afterFiles.set(article.slug, serializeArticle(article));
  }

  const changedArticles = [...afterFiles.entries()]
    .filter(([slug, content]) => beforeFiles.get(slug) !== content)
    .map(([slug]) => slug);

  const report = {
    source: SOURCE,
    capturedAt: new Date().toISOString(),
    acquisition: "Playwright DOM route inventory + public per-writeup Markdown export",
    sourceWriteups: articles.length,
    localWriteupsBefore: localNames.size,
    newWriteups: sourceNewSlugs,
    updatedWriteups: changedArticles.filter((slug) => localNames.has(slug)),
    unchangedWriteups: articles.length - changedArticles.length,
    uploadObjects: assetResults.length,
    uploadObjectsAlreadyPresentAndHashMatched: assetResults.filter((asset) => asset.localMatches).length,
    uploadObjectsToAdd: assetResults.filter((asset) => !asset.localExists).length,
    missingAssetNames: missingAssets,
    totalUploadBytes: assetResults.reduce((sum, asset) => sum + asset.size, 0),
    attachments: attachmentsCount,
    externalImagesLeftAsExternalReferences: [...new Set(articles.flatMap((article) => article.externalImages))],
    articles: articles.map(({ body, ...item }) => ({
      ...item,
      bodyBytes: Buffer.byteLength(body),
      flagPresent: Boolean(item.flag),
    })),
    assets: assetResults.map((asset) => ({
      filename: asset.filename,
      url: asset.url,
      contentType: asset.contentType,
      size: asset.size,
      sha256: asset.sha256,
      localExists: asset.localExists,
      localMatches: asset.localMatches,
    })),
  };

  console.log(JSON.stringify({
    mode: APPLY ? "apply" : "dry-run",
    sourceWriteups: report.sourceWriteups,
    localWriteupsBefore: report.localWriteupsBefore,
    newWriteups: report.newWriteups,
    updatedWriteups: report.updatedWriteups,
    uploadObjects: report.uploadObjects,
    uploadObjectsAlreadyPresentAndHashMatched: report.uploadObjectsAlreadyPresentAndHashMatched,
    uploadObjectsToAdd: report.uploadObjectsToAdd,
    totalUploadMiB: Number((report.totalUploadBytes / 1024 / 1024).toFixed(2)),
    attachments: report.attachments,
    externalImagesLeftAsExternalReferences: report.externalImagesLeftAsExternalReferences,
  }, null, 2));

  if (!APPLY) {
    console.log("Dry run only. Re-run with --apply to write article files and missing assets.");
    return;
  }

  await mkdir(UPLOADS_DIR, { recursive: true });
  for (const asset of assetResults) {
    if (!asset.localExists) await writeFile(asset.target, asset.bytes, { flag: "wx" });
  }

  await mkdir(WRITEUPS_DIR, { recursive: true });
  for (const [slug, content] of afterFiles) {
    await writeFile(path.join(WRITEUPS_DIR, slug + ".md"), content, "utf8");
  }

  await mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
  await writeFile(MANIFEST_PATH, JSON.stringify(report, null, 2) + "\n", "utf8");

  console.log(JSON.stringify({
    applied: true,
    articlesWritten: afterFiles.size,
    newArticles: sourceNewSlugs.length,
    changedArticles: changedArticles.length,
    assetsAdded: assetResults.filter((asset) => !asset.localExists).length,
    manifest: path.relative(ROOT, MANIFEST_PATH),
  }, null, 2));
}

main().catch((error) => {
  console.error("Public writeup migration failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
