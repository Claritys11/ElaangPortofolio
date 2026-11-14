import "server-only";

import { cache } from "react";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { achievementWeight } from "@/lib/achievements";
import { normalizeCategory, sortSkillsPwnFirst } from "@/lib/data/mappers";
import { isHeroNameLineGroupingValid, resolveHeroNameLines } from "@/lib/hero-name";
import { normalizeBasePath } from "@/lib/site-config";
import type { AchievementItem, Attachment, Profile, ProjectItem, WriteupDetail, WriteupSummary } from "@/lib/types";

const CONTENT_ROOT = path.join(process.cwd(), "content");
const WRITEUPS_ROOT = path.join(CONTENT_ROOT, "writeups");

const attachmentSchema = z.object({
  url: z.string().min(1),
  name: z.string().min(1),
  contentType: z.string().default("application/octet-stream"),
});

const articleMetadataSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1).max(300),
  competition: z.string().default(""),
  category: z.string().default("Misc"),
  difficulty: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  updated: z.string().nullable().optional(),
  summary: z.string().default(""),
  tags: z.array(z.string()).default([]),
  status: z.enum(["draft", "published"]).default("draft"),
  flag: z.string().nullable().optional(),
  attachments: z.array(attachmentSchema).default([]),
  source: z.string().url().optional(),
});

const projectSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(""),
  imageUrl: z.string().nullable().default(null),
  projectUrl: z.string().url().nullable().default(null),
  category: z.string().default("Project"),
  tags: z.array(z.string()).default([]),
});

const achievementSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  issuer: z.string().nullable().default(null),
  platform: z.string().nullable().default(null),
  description: z.string().default(""),
  imageUrl: z.string().nullable().default(null),
  date: z.string().nullable().default(null),
  proofScore: z.number().int().min(0).max(10).nullable().default(null),
  documentUrl: z.string().nullable().default(null),
});

const profileSchema = z.object({
  displayName: z.string().min(1),
  alias: z.string().min(1),
  brand: z.string().min(1),
  email: z.string().email().nullable().optional(),
  websiteUrl: z.string().url().nullable().optional(),
  githubUrl: z.string().url().nullable().optional(),
  githubActivityUsername: z.string().trim().max(39).regex(/^(?=.{1,39}$)[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/).nullable().optional(),
  heroNameLines: z.array(z.string().trim().min(1).max(80)).min(1).max(6).nullable().optional(),
  instagramUrl: z.string().url().nullable().optional(),
  profileImageUrl: z.string().min(1),
  aboutText: z.string().default(""),
  philosophyText: z.string().default(""),
  skills: z.array(z.object({ name: z.string(), level: z.number().min(0).max(100) })).default([]),
  journey: z.array(z.object({ role: z.string(), company: z.string(), period: z.string(), desc: z.string() })).default([]),
  education: z.array(z.object({ level: z.string(), school: z.string(), period: z.string() })).default([]),
  seo: z.object({
    jobTitle: z.string().optional(),
    description: z.string().optional(),
    siteName: z.string().optional(),
    defaultTitle: z.string().optional(),
    titleTemplate: z.string().optional(),
    keywords: z.array(z.string()).default([]),
    sameAs: z.array(z.string().url()).default([]),
    locale: z.string().optional(),
  }).optional(),
}).superRefine((profile, ctx) => {
  if (profile.heroNameLines && !isHeroNameLineGroupingValid(profile.displayName, profile.heroNameLines)) {
    ctx.addIssue({ code: "custom", path: ["heroNameLines"], message: "Hero name lines must contain the full display name in its original word order." });
  }
});

const siteSchema = z.object({
  schemaVersion: z.literal(2),
  url: z.url().refine((value) => {
    const parsed = new URL(value);
    return ["https:", "http:"].includes(parsed.protocol) && parsed.pathname === "/" && !parsed.search && !parsed.hash;
  }, "url must contain only the canonical HTTP(S) origin"),
  basePath: z.string().default("/").refine((value) => {
    try { return (normalizeBasePath(value) || "/") === value; } catch { return false; }
  }, "basePath must be `/` or a normalized URL-safe path"),
  outputDirectory: z.literal("dist").default("dist"),
  title: z.string().min(1),
  description: z.string().default(""),
  language: z.string().default("en"),
  trailingSlash: z.boolean().default(true),
});

const appearancePaletteSchema = z.object({
  background: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  foreground: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  card: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  muted: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  mutedForeground: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

const appearanceSchema = z.object({
  defaultTheme: z.enum(["dark", "light"]).default("dark"),
  typography: z.object({
    display: z.literal("Archivo"),
    body: z.literal("Inter Tight"),
    mono: z.literal("Geist Mono"),
  }),
  radius: z.number().int().min(2).max(24).default(6),
  colors: z.object({ light: appearancePaletteSchema, dark: appearancePaletteSchema }),
});

export type ArticleMetadata = z.infer<typeof articleMetadataSchema>;
export type SiteConfig = z.infer<typeof siteSchema>;
export type AppearanceConfig = z.infer<typeof appearanceSchema>;

export const getAppearance = cache(() => readJson("appearance.json", appearanceSchema));

export function appearanceCssVariables(appearance: AppearanceConfig): string {
  const declarations = (palette: AppearanceConfig["colors"]["light"]) => [
    "--background:" + palette.background,
    "--foreground:" + palette.foreground,
    "--card:" + palette.card,
    "--popover:" + palette.card,
    "--popover-foreground:" + palette.foreground,
    "--primary:" + palette.primary,
    "--secondary:" + palette.secondary,
    "--muted:" + palette.muted,
    "--muted-foreground:" + palette.mutedForeground,
    "--accent:" + palette.secondary,
    "--accent-foreground:" + palette.foreground,
    "--ring:" + palette.primary,
    "--border:color-mix(in srgb, " + palette.foreground + " 12%, transparent)",
    "--input:color-mix(in srgb, " + palette.foreground + " 18%, transparent)",
    "--radius:" + appearance.radius + "px",
  ].join(";");
  return ":root{" + declarations(appearance.colors.light) + "}.dark{" + declarations(appearance.colors.dark) + "}";
}

function readJson<T>(filename: string, schema: z.ZodType<T>): T {
  const file = path.join(CONTENT_ROOT, filename);
  const raw = JSON.parse(readFileSync(file, "utf8")) as unknown;
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new Error("Invalid content file " + filename + ": " + z.prettifyError(result.error));
  }
  return result.data;
}

function parseFrontmatter(raw: string, filename: string): { metadata: ArticleMetadata; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!match) throw new Error("Missing frontmatter in " + filename);
  const values: Record<string, unknown> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const property = /^([a-zA-Z][\w-]*):\s*(.*)$/.exec(line);
    if (!property) continue;
    try {
      values[property[1]] = JSON.parse(property[2]);
    } catch {
      values[property[1]] = property[2];
    }
  }
  const parsed = articleMetadataSchema.safeParse(values);
  if (!parsed.success) {
    throw new Error("Invalid metadata in " + filename + ": " + z.prettifyError(parsed.error));
  }
  return { metadata: parsed.data, body: match[2].trim() };
}

function articleFiles(): string[] {
  return readdirSync(WRITEUPS_ROOT).filter((filename) => filename.endsWith(".md")).sort();
}

type LoadedArticle = { metadata: ArticleMetadata; body: string };

const loadAllArticles = cache((): LoadedArticle[] => {
  return articleFiles().map((filename) => {
    const raw = readFileSync(path.join(WRITEUPS_ROOT, filename), "utf8");
    const { metadata, body } = parseFrontmatter(raw, filename);
    if (metadata.slug + ".md" !== filename) {
      throw new Error("Article filename/slug mismatch: " + filename + " has slug " + metadata.slug);
    }
    return { metadata, body };
  });
});

function firstImage(body: string): string | null {
  const markdown = /!\[[^\]]*]\(([^)\s]+)(?:\s+[^)]*)?\)/.exec(body)?.[1];
  const html = /<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']/i.exec(body)?.[1];
  return markdown ?? html ?? null;
}

function toSummary(article: LoadedArticle): WriteupSummary {
  const item = article.metadata;
  const date = item.date ? new Date(item.date.slice(0, 10) + "T00:00:00.000Z").toISOString() : null;
  const updatedInput = item.updated ?? item.date ?? "1970-01-01";
  const updated = new Date(updatedInput.slice(0, 10) + "T00:00:00.000Z").toISOString();
  return {
    id: item.slug,
    href: "/writeups/" + encodeURIComponent(item.slug),
    slug: item.slug,
    title: item.title,
    competition: item.competition,
    category: normalizeCategory(item.category),
    difficulty: item.difficulty?.trim() || null,
    date,
    updated,
    summary: item.summary,
    tags: item.tags,
    cover: firstImage(article.body),
  };
}

export const listAllWriteups = cache(async (): Promise<WriteupDetail[]> => {
  return loadAllArticles().map((article) => ({
    ...toSummary(article),
    content: article.body,
    flag: article.metadata.flag?.trim() || null,
    attachments: article.metadata.attachments as Attachment[],
  }));
});

export const listWriteups = cache(async (): Promise<WriteupSummary[]> => {
  return loadAllArticles()
    .filter((article) => article.metadata.status === "published")
    .map(toSummary)
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "") || b.updated.localeCompare(a.updated));
});

export const getWriteup = cache(async (slug: string): Promise<WriteupDetail | null> => {
  const key = decodeURIComponent(slug);
  const article = loadAllArticles().find((item) => item.metadata.slug === key && item.metadata.status === "published");
  if (!article) return null;
  return {
    ...toSummary(article),
    content: article.body,
    flag: article.metadata.flag?.trim() || null,
    attachments: article.metadata.attachments as Attachment[],
  };
});

export async function getAdjacentWriteups(writeup: WriteupSummary) {
  const sameCategory = (await listWriteups()).filter((item) => item.category === writeup.category);
  const index = sameCategory.findIndex((item) => item.slug === writeup.slug);
  return {
    prev: index > 0 ? sameCategory[index - 1] : null,
    next: index >= 0 && index < sameCategory.length - 1 ? sameCategory[index + 1] : null,
  };
}

export const getCategoryStats = cache(async () => {
  const counts = new Map<string, number>();
  for (const item of await listWriteups()) counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => Number(b.category === "Pwn") - Number(a.category === "Pwn") || b.count - a.count);
});

export const getCompetitions = cache(async () => {
  const counts = new Map<string, number>();
  for (const item of await listWriteups()) {
    if (item.competition) counts.set(item.competition, (counts.get(item.competition) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([competition]) => competition);
});

export const listProjects = cache(async (): Promise<ProjectItem[]> => readJson("projects.json", z.array(projectSchema)));

export const listAchievements = cache(async (): Promise<AchievementItem[]> => {
  const records = readJson("achievements.json", z.array(achievementSchema));
  return records.map((item) => ({
    id: item.id,
    title: item.title,
    issuer: item.issuer ?? null,
    platform: item.platform ?? null,
    description: item.description,
    imageUrl: item.imageUrl ?? null,
    date: item.date ? new Date(item.date.slice(0, 10) + "T00:00:00.000Z").toISOString() : null,
    year: item.date ? Number(item.date.slice(0, 4)) : null,
    proofScore: item.proofScore ?? null,
    weight: achievementWeight({ title: item.title, proofScore: item.proofScore ?? null }),
    documentUrl: item.documentUrl ?? null,
  }));
});

export const getProfile = cache(async (): Promise<Profile> => {
  const profile = readJson("profile.json", profileSchema);
  return {
    ...profile,
    skills: sortSkillsPwnFirst(profile.skills),
    email: profile.email ?? null,
    websiteUrl: profile.websiteUrl ?? null,
    githubUrl: profile.githubUrl ?? null,
    githubActivityUsername: profile.githubActivityUsername ?? null,
    heroNameLines: resolveHeroNameLines(profile.displayName, profile.heroNameLines),
    instagramUrl: profile.instagramUrl ?? null,
    seo: profile.seo ?? { keywords: [], sameAs: [] },
  };
});

export const getSiteConfig = cache(async (): Promise<SiteConfig> => readJson("site.json", siteSchema));

export function publishedSlugs(): string[] {
  return loadAllArticles().filter((item) => item.metadata.status === "published").map((item) => item.metadata.slug);
}
