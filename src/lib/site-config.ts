import siteContent from "../../content/site.json";

type SiteConfigInput = {
  schemaVersion: number;
  url: string;
  basePath?: string;
  outputDirectory?: string;
  title: string;
  description: string;
  language: string;
  trailingSlash: boolean;
};

export const SITE_CONFIG = siteContent as SiteConfigInput;

/** Normalize a deployment prefix. `/` means the domain root and becomes an empty Next.js basePath. */
export function normalizeBasePath(value: string | null | undefined): string {
  const input = value?.trim() || "/";
  if (input === "/") return "";
  const segments = input.split("/").filter(Boolean);
  if (!segments.length || segments.some((segment) => segment === "." || segment === ".." || !/^[A-Za-z0-9._~-]+$/.test(segment))) {
    throw new Error("basePath must be `/` or a URL-safe path such as `/portfolio`.");
  }
  return "/" + segments.join("/");
}

const legacyPath = new URL(SITE_CONFIG.url).pathname;
export const BASE_PATH = normalizeBasePath(SITE_CONFIG.basePath ?? legacyPath);
export const OUTPUT_DIRECTORY = SITE_CONFIG.outputDirectory ?? "dist";
export const SITE_ORIGIN = new URL(SITE_CONFIG.url).origin;
export const SITE_BASE_URL = SITE_ORIGIN + BASE_PATH;

/** Prefix local public files for project-site hosting; external and inline URLs stay unchanged. */
export function withBasePath(value: string | null | undefined, basePath = BASE_PATH): string | null {
  if (!value) return null;
  if (/^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(value) || /^(?:data|blob|mailto|tel):/i.test(value) || value.startsWith("#")) return value;
  if (value === "/api" || value.startsWith("/api/")) return value;

  const prefix = normalizeBasePath(basePath);
  const pathname = value.startsWith("/") ? value : `/${value}`;
  if (!prefix) return pathname;
  if (pathname === prefix || pathname.startsWith(`${prefix}/`) || pathname.startsWith(`${prefix}?`) || pathname.startsWith(`${prefix}#`)) return pathname;
  return `${prefix}${pathname}`;
}

export function absoluteSiteUrl(pathname: string): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return SITE_BASE_URL + path;
}
