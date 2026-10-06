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
