import { describe, expect, it } from "vitest";
import { AchievementSchema, ProjectSchema } from "@/lib/admin/schemas";

describe("ProjectSchema", () => {
  it("normalises empties to null and splits tags", () => {
    const r = ProjectSchema.parse({ title: " DevSecOps ", description: "", imageUrl: "", projectUrl: "https://x.dev", category: "", tags: "Docker, Go, ,Linux" });
    expect(r).toEqual({ title: "DevSecOps", description: null, imageUrl: null, projectUrl: "https://x.dev", category: null, tags: ["Docker", "Go", "Linux"] });
  });
  it("accepts legacy media forms and rejects javascript:", () => {
    expect(ProjectSchema.parse({ title: "a", imageUrl: "data:image/jpeg;base64,AAAA" }).imageUrl).toMatch(/^data:image/);
    expect(ProjectSchema.parse({ title: "a", imageUrl: "/api/public/uploads/x.png" }).imageUrl).toBe("/api/public/uploads/x.png");
    expect(ProjectSchema.safeParse({ title: "a", projectUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(ProjectSchema.safeParse({ title: "" }).success).toBe(false);
  });
});

describe("AchievementSchema", () => {
  it("parses date and proof score", () => {
    const r = AchievementSchema.parse({ title: "Top 20", date: "2026-05-01", proofScore: "88" });
    expect(r.date?.toISOString()).toBe("2026-05-01T00:00:00.000Z");
    expect(r.proofScore).toBe(88);
  });
  it("empty proof score and date become null; bad date fails", () => {
    const r = AchievementSchema.parse({ title: "x", date: "", proofScore: "" });
    expect(r.date).toBeNull();
    expect(r.proofScore).toBeNull();
    expect(AchievementSchema.safeParse({ title: "x", date: "2026-13-45" }).success).toBe(false);
  });
});

import { WriteupSchema } from "@/lib/admin/schemas";

describe("WriteupSchema", () => {
  it("parses attachments JSON and rejects bad slugs", () => {
    const r = WriteupSchema.parse({
      title: "Truman",
      slug: "",
      content: "<p>x</p>",
      attachments: '[{"url":"/api/public/uploads/a","name":"a","contentType":"application/octet-stream"}]',
      tags: "PWN, heap",
    });
    expect(r.slug).toBeNull();
    expect(r.attachments).toHaveLength(1);
    expect(r.tags).toEqual(["PWN", "heap"]);
    expect(WriteupSchema.safeParse({ title: "a", slug: "Bad Slug", content: "" }).success).toBe(false);
    expect(WriteupSchema.safeParse({ title: "a", content: "", attachments: "not json" }).success).toBe(false);
  });
});

import { ProfileSchema } from "@/lib/admin/schemas";

describe("ProfileSchema", () => {
  it("parses JSON list fields", () => {
    const r = ProfileSchema.parse({
      displayName: "Elang Dimas Syadewa",
      alias: "Claritys",
      navbarBrandMode: "custom",
      navbarBrandName: "Claritys",
      technicalArsenal: '[{"name":"Binary Exploitation","level":85}]',
      professionalJourney: "[]",
      educationHistory: '[{"level":"SMK","school":"SMK Telkom Malang","period":"2025 - Now"}]',
      seo: '{"keywords":["CTF"],"sameAs":["https://github.com/Claritys11"],"jobTitle":"Cybersecurity Specialist"}',
    });
    expect(r.technicalArsenal[0]).toEqual({ name: "Binary Exploitation", level: 85 });
    expect(r.seo.keywords).toEqual(["CTF"]);
  });
  it("rejects level > 100 and bad brand mode", () => {
    expect(ProfileSchema.safeParse({ technicalArsenal: '[{"name":"x","level":101}]' }).success).toBe(false);
    expect(ProfileSchema.safeParse({ navbarBrandMode: "weird" }).success).toBe(false);
  });
  it("keeps unknown SEO keys and accepts the real-length description", () => {
    const seo = { keywords: [], sameAs: [], siteName: "Elang", heroAnimatedTitles: ["CTF player"], description: "x".repeat(460) };
    const r = ProfileSchema.parse({ seo: JSON.stringify(seo) });
    expect(r.seo).toMatchObject({ siteName: "Elang", heroAnimatedTitles: ["CTF player"] });
    expect(r.seo.description).toHaveLength(460);
  });
});

import { OrderSchema, sortOrderForNew } from "@/lib/admin/schemas";

describe("achievement ordering", () => {
  const a = "7c905e25-0bb4-48a1-a1a9-7dc8ec40f108";
  const b = "9ec36416-aa99-4f0a-9460-67bbdfc8a93b";
  it("accepts a JSON list of unique uuids", () => {
    expect(OrderSchema.parse({ ids: JSON.stringify([a, b]) }).ids).toEqual([a, b]);
  });
  it("rejects duplicates, non-uuids and empty lists", () => {
    expect(OrderSchema.safeParse({ ids: JSON.stringify([a, a]) }).success).toBe(false);
    expect(OrderSchema.safeParse({ ids: JSON.stringify(["x"]) }).success).toBe(false);
    expect(OrderSchema.safeParse({ ids: "[]" }).success).toBe(false);
  });
  it("puts new achievements on top once a manual order exists, else leaves them unordered", () => {
    expect(sortOrderForNew(null)).toBeNull();
    expect(sortOrderForNew(0)).toBe(-1);
    expect(sortOrderForNew(-3)).toBe(-4);
  });
});
