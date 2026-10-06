import type { Achievement, ProfileSettings, Project, Writeup } from "@/generated/prisma/client";
import { normalizeMediaUrl, parseObjectArray, parseRecord, parseStringArray } from "@/lib/json";
import type { AchievementItem, Attachment, EducationItem, JourneyItem, Profile, ProjectItem, Skill, WriteupDetail, WriteupSummary } from "@/lib/types";

const KNOWN_CATEGORIES = ["Pwn", "Reverse", "Forensics", "Crypto", "Web", "Misc", "OSINT"];

export function normalizeCategory(c: string | null): string {
  const v = (c ?? "").trim();
  if (!v) return "Misc";
  const hit = KNOWN_CATEGORIES.find((k) => k.toLowerCase() === v.toLowerCase());
  return hit ?? v;
}

export function firstImageSrc(html: string): string | null {
  const m = /<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']/i.exec(html);
  return m ? m[1] : null;
}

const iso = (d: Date | null) => (d ? d.toISOString() : null);

export function toWriteupSummary(row: Writeup): WriteupSummary {
  const content = row.content ?? "";
  return {
    id: row.id,
    slug: row.slug,
    href: `/writeups/${encodeURIComponent(row.slug || row.id)}`,
    title: row.title?.trim() || "Untitled",
    competition: row.competition?.trim() ?? "",
    category: normalizeCategory(row.category),
    difficulty: row.difficulty?.trim() || null,
    date: iso(row.date),
    summary: row.summary?.trim() ?? "",
    tags: parseStringArray(row.tagsJson),
    cover: firstImageSrc(content),
  };
}

export function toWriteupDetail(row: Writeup): WriteupDetail {
  const attachments = parseObjectArray<Attachment>(row.attachmentsJson, (x) =>
    typeof x.url === "string"
      ? {
          url: x.url,
          name: typeof x.name === "string" ? x.name : (x.url.split("/").pop() ?? "file"),
          contentType: typeof x.contentType === "string" ? x.contentType : "application/octet-stream",
        }
      : null,
  );
  return { ...toWriteupSummary(row), content: row.content ?? "", flag: row.flag?.trim() || null, attachments };
}

export function toProject(row: Project): ProjectItem {
  return {
    id: row.id,
    title: row.title?.trim() || "Untitled project",
    description: row.description?.trim() ?? "",
    imageUrl: normalizeMediaUrl(row.imageUrl),
    projectUrl: row.projectUrl?.trim() || null,
    category: row.category?.trim() || "Project",
    tags: parseStringArray(row.tagsJson),
  };
}

// Ported from .legacy/src/lib/achievement-utils.ts getAchievementProofScore
function fallbackProofScore(row: Achievement): number {
  const signal = [row.title, row.issuer, row.platform, row.description].filter(Boolean).join(" ").toLowerCase();
  const category =
    row.imageUrl && row.issuer
      ? "certification"
      : row.platform || /\b(ctf|competition|rank|place|winner|final|qual|tournament)\b/.test(signal)
        ? "competition"
        : "milestone";
  const base = category === "certification" ? 40 : category === "competition" ? 34 : 24;
  return base + (row.imageUrl ? 24 : 0) + (row.issuer ? 10 : 0) + (row.platform ? 8 : 0) + (row.description ? 4 : 0);
}

export function toAchievement(row: Achievement): AchievementItem {
  return {
    id: row.id,
    title: row.title?.trim() || "Untitled",
    issuer: row.issuer?.trim() || null,
    platform: row.platform?.trim() || null,
    description: row.description?.trim() ?? "",
    imageUrl: normalizeMediaUrl(row.imageUrl),
    date: iso(row.date),
    year: row.date ? row.date.getUTCFullYear() : null,
    proofScore: typeof row.proofScore === "number" ? row.proofScore : fallbackProofScore(row),
  };
}

const PWN = /pwn|binary exploitation/i;

export function sortSkillsPwnFirst(skills: Skill[]): Skill[] {
  return [...skills].sort((a, b) => Number(PWN.test(b.name)) - Number(PWN.test(a.name)) || b.level - a.level);
}

const DEFAULT_PROFILE: Profile = {
  displayName: "Elang Dimas Syadewa",
  alias: "Claritys",
  brand: "Claritys",
  email: null,
  websiteUrl: "https://claritys.web.id",
  githubUrl: "https://github.com/Claritys11",
  instagramUrl: null,
  profileImageUrl: "/profile.jpg",
  aboutText: "",
  philosophyText: "",
  skills: [{ name: "Binary Exploitation", level: 70 }],
  journey: [],
  education: [],
  seo: { keywords: [], sameAs: [] },
};

export function toProfile(row: ProfileSettings | null): Profile {
  if (!row) return DEFAULT_PROFILE;
  const seo = parseRecord(row.seoSettingsJson);
  const alias = row.alias?.trim() || DEFAULT_PROFILE.alias;
  return {
    displayName: row.displayName?.trim() || DEFAULT_PROFILE.displayName,
    alias,
    brand: row.navbarBrandMode === "custom" && row.navbarBrandName?.trim() ? row.navbarBrandName.trim() : alias,
    email: row.email?.trim() || null,
    websiteUrl: row.websiteUrl?.trim() || null,
    githubUrl: row.githubUrl?.trim() || null,
    instagramUrl: row.instagramUrl?.trim() || null,
    profileImageUrl: normalizeMediaUrl(row.profileImageUrl) ?? DEFAULT_PROFILE.profileImageUrl,
    aboutText: row.aboutText?.trim() ?? "",
    philosophyText: row.philosophyText?.trim() ?? "",
    skills: sortSkillsPwnFirst(
      parseObjectArray<Skill>(row.technicalArsenalJson, (x) =>
        typeof x.name === "string" ? { name: x.name, level: typeof x.level === "number" ? Math.max(0, Math.min(100, x.level)) : 0 } : null,
      ),
    ),
    journey: parseObjectArray<JourneyItem>(row.professionalJourneyJson, (x) =>
      typeof x.role === "string" ? { role: x.role, company: String(x.company ?? ""), period: String(x.period ?? ""), desc: String(x.desc ?? "") } : null,
    ),
    education: parseObjectArray<EducationItem>(row.educationHistoryJson, (x) =>
      typeof x.school === "string" ? { school: x.school, level: String(x.level ?? ""), period: String(x.period ?? "") } : null,
    ),
    seo: {
      jobTitle: typeof seo.jobTitle === "string" ? seo.jobTitle : undefined,
      locale: typeof seo.locale === "string" ? seo.locale : undefined,
      description: typeof seo.description === "string" ? seo.description : undefined,
      keywords: parseStringArray(seo.keywords),
      sameAs: parseStringArray(seo.sameAs),
    },
  };
}
