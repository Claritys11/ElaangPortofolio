import { describe, expect, it } from "vitest";
import { firstImageSrc, normalizeCategory, sortSkillsPwnFirst, toAchievement, toProfile, toWriteupDetail, toWriteupSummary } from "@/lib/data/mappers";

const baseWriteup = {
  id: "076c1db0-0000-4000-8000-000000000001",
  slug: "pwn-truman",
  title: "Truman",
  competition: "SCTF 2026",
  category: "Pwn",
  difficulty: "Medium",
  date: new Date("2026-08-22T00:00:00Z"),
  summary: "UAF to ret2libc",
  content: '<p><img src="/api/public/uploads/a.png"></p><h2>Recon</h2>',
  flag: "SCTF{x}",
  tagsJson: ["PWN", "heap"],
  attachmentsJson: [{ url: "/api/public/uploads/x", name: "x", contentType: "application/octet-stream" }, { nope: 1 }],
  createdAt: new Date("2026-08-22T00:00:00Z"),
  updatedAt: new Date("2026-08-22T00:00:00Z"),
};

describe("writeup mappers", () => {
  it("maps a full row", () => {
    const s = toWriteupSummary(baseWriteup);
    expect(s).toMatchObject({ href: "/writeups/pwn-truman", title: "Truman", category: "Pwn", date: "2026-08-22T00:00:00.000Z", tags: ["PWN", "heap"], cover: "/api/public/uploads/a.png" });
  });
  it("falls back for sparse legacy rows", () => {
    const s = toWriteupSummary({ ...baseWriteup, slug: null, title: null, category: null, competition: null, date: null, summary: null, content: null, tagsJson: {} });
    expect(s).toMatchObject({ href: `/writeups/${baseWriteup.id}`, title: "Untitled", category: "Misc", competition: "", date: null, summary: "", tags: [], cover: null });
  });
  it("keeps only valid attachments", () => {
    expect(toWriteupDetail(baseWriteup).attachments).toHaveLength(1);
  });
});

describe("helpers", () => {
  it("firstImageSrc finds the first img src", () => {
    expect(firstImageSrc('<p>x</p><img alt="a" src="/u/1.png"><img src="/u/2.png">')).toBe("/u/1.png");
    expect(firstImageSrc("<p>none</p>")).toBeNull();
  });
  it("normalizeCategory title-cases known categories", () => {
    expect(normalizeCategory("pwn")).toBe("Pwn");
    expect(normalizeCategory("  reverse ")).toBe("Reverse");
    expect(normalizeCategory("")).toBe("Misc");
  });
  it("sortSkillsPwnFirst pins binary exploitation then sorts by level", () => {
    const out = sortSkillsPwnFirst([
      { name: "Digital Forensic", level: 80 },
      { name: "Binary Exploitation", level: 70 },
      { name: "Programming", level: 67 },
    ]);
    expect(out.map((s) => s.name)).toEqual(["Binary Exploitation", "Digital Forensic", "Programming"]);
  });
});

describe("achievement + profile", () => {
  it("computes year and proof score fallback", () => {
    const a = toAchievement({ id: "a", title: "Top 20", issuer: "DCSC", platform: null, description: null, imageUrl: "/x.png", date: new Date("2026-05-01"), proofScore: null, createdAt: new Date(), updatedAt: new Date() });
    expect(a.year).toBe(2026);
    expect(a.proofScore).toBeGreaterThan(0);
  });
  it("returns defaults when the profile row is missing", () => {
    const p = toProfile(null);
    expect(p.displayName).toBe("Elang Dimas Syadewa");
    expect(p.alias).toBe("Claritys");
    expect(p.skills[0].name).toMatch(/pwn|binary/i);
  });
});
