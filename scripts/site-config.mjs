import { readFileSync } from "node:fs";
import path from "node:path";

export function normalizeBasePath(value = "/") {
  const input = typeof value === "string" && value.trim() ? value.trim() : "/";
  if (input === "/") return "";
  const segments = input.split("/").filter(Boolean);
  if (!segments.length || segments.some((segment) => segment === "." || segment === ".." || !/^[A-Za-z0-9._~-]+$/.test(segment))) {
    throw new Error("basePath must be `/` or a URL-safe path such as `/portfolio`.");
  }
  return "/" + segments.join("/");
}

export function readSiteConfig(root) {
  const site = JSON.parse(readFileSync(path.join(root, "content", "site.json"), "utf8"));
  const parsed = new URL(site.url);
  const basePath = normalizeBasePath(site.basePath ?? parsed.pathname);
  const outputDirectory = site.outputDirectory ?? "dist";
  if (outputDirectory !== "dist") throw new Error("The static export output directory must be `dist`.");
  return { ...site, origin: parsed.origin, basePath, outputDirectory, baseUrl: parsed.origin + basePath };
}
