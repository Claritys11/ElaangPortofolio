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
