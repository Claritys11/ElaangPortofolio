import { z } from "zod";

const blankToNull = (v: unknown) => (v === undefined || (typeof v === "string" && v.trim() === "") ? null : v);

export const optText = (max: number) => z.preprocess(blankToNull, z.string().trim().max(max).nullable());

export const mediaUrl = z.preprocess(
  blankToNull,
  z
    .string()
    .trim()
    .max(8_000_000)
    .refine((v) => /^(\/(?!\/)|https?:\/\/|data:image\/)/i.test(v), "Must be a /path, http(s) URL or data:image")
    .nullable(),
);

export const linkUrl = z.preprocess(
  blankToNull,
  z
    .string()
    .trim()
    .max(2000)
    .refine((v) => /^(\/(?!\/)|https?:\/\/)/i.test(v), "Must be a /path or http(s) URL")
    .nullable(),
);

export const tagsField = z.preprocess(
  (v) =>
    typeof v === "string"
      ? v
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : (v ?? []),
  z.array(z.string().max(40)).max(30),
);

export const dateField = z.preprocess(
  blankToNull,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .transform((s, ctx) => {
      const d = new Date(`${s}T00:00:00.000Z`);
      if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) {
        ctx.addIssue({ code: "custom", message: "Invalid date" });
        return z.NEVER;
      }
      return d;
    })
    .nullable(),
);

const id = z.preprocess(blankToNull, z.uuid().nullable()).transform((v) => v ?? undefined);

export const ProjectSchema = z.object({
  id,
  title: z.string().trim().min(1, "Title is required").max(200),
  description: optText(5000),
  imageUrl: mediaUrl,
  projectUrl: linkUrl,
  category: optText(80),
  tags: tagsField,
});

export const AchievementSchema = z.object({
  id,
  title: z.string().trim().min(1, "Title is required").max(300),
  issuer: optText(300),
  platform: optText(120),
  description: optText(5000),
  imageUrl: mediaUrl,
  date: dateField,
  proofScore: z.preprocess(blankToNull, z.coerce.number().int().min(0).max(1000).nullable()),
});

const attachment = z.object({
  url: z.string().regex(/^(\/(?!\/)|https?:\/\/)/),
  name: z.string().max(300),
  contentType: z.string().max(200),
});

export const WriteupSchema = z.object({
  id,
  title: z.string().trim().min(1, "Title is required").max(300),
  slug: z.preprocess(
    blankToNull,
    z
      .string()
      .trim()
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "lowercase-with-dashes only")
      .nullable(),
  ),
  competition: optText(200),
  category: optText(60),
  difficulty: optText(40),
  date: dateField,
  summary: optText(1000),
  content: z.preprocess((v) => v ?? "", z.string().max(5_000_000)),
  flag: optText(300),
  tags: tagsField,
  attachments: z.preprocess((v) => {
    if (v === undefined || (typeof v === "string" && v.trim() === "")) return [];
    if (typeof v !== "string") return v;
    try {
      return JSON.parse(v);
    } catch {
      return "__invalid__";
    }
  }, z.array(attachment).max(50)),
});

const jsonField = <T extends z.ZodType>(inner: T, empty: unknown) =>
  z.preprocess((v) => {
    if (v === undefined || (typeof v === "string" && v.trim() === "")) return empty;
    if (typeof v !== "string") return v;
    try {
      return JSON.parse(v);
    } catch {
      return "__invalid__";
    }
  }, inner);

export const ProfileSchema = z.object({
  displayName: optText(120),
  alias: optText(60),
  navbarBrandMode: z.preprocess((v) => v ?? "default", z.enum(["default", "custom"])),
  navbarBrandName: optText(60),
  email: z.preprocess(blankToNull, z.email().nullable()),
  websiteUrl: linkUrl,
  githubUrl: linkUrl,
  instagramUrl: linkUrl,
  profileImageUrl: mediaUrl,
  aboutText: optText(5000),
  philosophyText: optText(500),
  technicalArsenal: jsonField(z.array(z.object({ name: z.string().trim().min(1).max(80), level: z.coerce.number().int().min(0).max(100) })).max(40), []),
  professionalJourney: jsonField(
    z.array(z.object({ role: z.string().max(120), company: z.string().max(120), period: z.string().max(60), desc: z.string().max(1000) })).max(40),
    [],
  ),
  educationHistory: jsonField(z.array(z.object({ level: z.string().max(80), school: z.string().max(160), period: z.string().max(60) })).max(20), []),
  // Loose: legacy rows carry extra keys (siteName, canonicalUrl, heroAnimatedTitles, …) that must survive a save.
  seo: jsonField(
    z.looseObject({
      jobTitle: z.string().max(120).optional(),
      locale: z.string().max(20).optional(),
      description: z.string().max(1000).optional(),
      keywords: z.array(z.string().max(60)).max(60).default([]),
      sameAs: z.array(z.url()).max(20).default([]),
    }),
    {},
  ),
});
