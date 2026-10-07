import { describe, expect, it } from "vitest";
import { prepareNotionMarkdown } from "@/lib/notion-import";

const md = `# Heap Notes Baby

Category: Pwn
Competition: SCTF 2026
Difficulty: Medium
Date: August 22, 2026
Tags: heap, UAF

Challenge ini tentang **use-after-free** di glibc 2.35.

## Recon

Cek proteksi dulu dengan \`checksec\`.
`;

describe("prepareNotionMarkdown", () => {
  it("takes the title and property lines out of the body into fields", () => {
    const r = prepareNotionMarkdown(md, "fallback.md");
    expect(r).toMatchObject({ title: "Heap Notes Baby", category: "Pwn", competition: "SCTF 2026", difficulty: "Medium", date: "2026-08-22", tags: ["heap", "UAF"] });
    expect(r.body).not.toMatch(/^# Heap Notes Baby|Category:|Competition:/m);
    expect(r.body.startsWith("Challenge ini tentang")).toBe(true);
  });
  it("uses the first paragraph, as plain text, for the summary", () => {
    expect(prepareNotionMarkdown(md, "x.md").summary).toBe("Challenge ini tentang use-after-free di glibc 2.35.");
  });
  it("falls back to the file name when there is no title heading", () => {
    expect(prepareNotionMarkdown("Just text.", "My Writeup 3f2a1b.md").title).toBe("My Writeup");
  });
});
