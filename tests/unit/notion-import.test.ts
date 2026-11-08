import { describe, expect, it } from "vitest";
import { prepareNotionMarkdown, readProperty } from "@/lib/notion-import";

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

const notionId = `# Shirogane

Dibuat: November 8, 2026 3:11 PM
Kategori: web
Kompetisi: PlayITPlus (https://app.notion.com/p/PlayITPlus-411d29486a2c80b288c9fba96f9697ee?pvs=21)
Status: Solved

## TL;DR

A whiteboxed web exploit challenge. But there’s two steps:

1. \`SQL Injection\` to get \`Admin\`
2. \`Zip Slip\` to get \`RCE\`

## Challenge

- **Poin / solves:** **460 / 15**

\`\`\`python
# flag: not-this{one}
print("flag: not-this{either}")
\`\`\`

## Lessons learned

- 

## Referensi

-

### Catatan

Masih ada isi.

- Flag
    
    \`PLAYITPLUS{904af8d2}\`
`;

describe("prepareNotionMarkdown with the Indonesian Notion template", () => {
  const r = prepareNotionMarkdown(notionId, "Shirogane 412d.md");
  it("autofills date, category and competition, and strips the Notion link", () => {
    expect(r).toMatchObject({ title: "Shirogane", date: "2026-11-08", category: "Web", competition: "PlayITPlus" });
  });
  it("keeps parentheses that belong to the competition name", () => {
    expect(prepareNotionMarkdown("# X\n\nKompetisi: Cylab (PicoCTF) (https://app.notion.com/p/abc?pvs=21)\n\nBody", "x.md").competition).toBe("Cylab (PicoCTF)");
  });
  it("removes every property, including Status, from the body", () => {
    expect(r.body).not.toMatch(/Dibuat:|Kategori:|Kompetisi:|Status:/);
    expect(r.body.startsWith("## TL;DR")).toBe(true);
  });
  it("uses the TL;DR section for the summary", () => {
    expect(r.summary).toBe("A whiteboxed web exploit challenge. But there’s two steps: 1. SQL Injection to get Admin 2. Zip Slip to get RCE");
  });
  it("doesn't let a TL;DR with no heading after it swallow the article", () => {
    expect(prepareNotionMarkdown("# X\n\n## TL;DR\n\nShort.\n\nThe rest.\n\nMore.", "x.md").summary).toBe("Short.");
  });
  it("moves the flag toggle into the flag field, leaving code blocks alone", () => {
    expect(r.flag).toBe("PLAYITPLUS{904af8d2}");
    expect(r.body).not.toContain("PLAYITPLUS");
    expect(r.body).not.toMatch(/^- Flag/m);
    expect(r.body).toContain('print("flag: not-this{either}")');
  });
  it("drops template sections left empty, but not a parent of filled subsections", () => {
    expect(r.body).not.toContain("Lessons learned");
    expect(r.body).toContain("## Referensi");
    expect(r.body).toContain("### Catatan");
    expect(prepareNotionMarkdown("# X\n\n## Referensi\n\n-", "x.md").body).toBe("");
  });
  it("reads other date shapes, and ignores ones it can't", () => {
    const date = (v: string) => prepareNotionMarkdown(`# X\n\nDibuat: ${v}\n\nBody`, "x.md").date;
    expect(date("2026-08-22")).toBe("2026-08-22");
    expect(date("8 Agustus 2026 15:11")).toBe("2026-08-08");
    expect(date("kemarin")).toBeUndefined();
  });
  it("maps category shorthands onto the site's categories", () => {
    const cat = (v: string) => prepareNotionMarkdown(`# X\n\nKategori: ${v}\n\nBody`, "x.md").category;
    expect([cat("pwn"), cat("rev"), cat("forensic"), cat("Hardware")]).toEqual(["Pwn", "Reverse", "Forensics", "Hardware"]);
  });
});

describe("Notion's default code label", () => {
  const fence = (lang: string, code: string) => `# X\n\n\`\`\`${lang}\n${code}\n\`\`\`\n`;
  it("replaces jsx with the language the code actually looks like", () => {
    expect(prepareNotionMarkdown(fence("jsx", "<?php\necho 1;"), "x.md").body).toContain("```php\n");
    expect(prepareNotionMarkdown(fence("jsx", "~/ctf\n❯ tree"), "x.md").body).toContain("```bash\n");
  });
  it("leaves it unlabelled when it can't tell, and never touches a chosen language", () => {
    expect(prepareNotionMarkdown(fence("jsx", "some output"), "x.md").body).toMatch(/^```\nsome output/);
    expect(prepareNotionMarkdown(fence("python", "print(1)"), "x.md").body).toContain("```python\n");
  });
});

describe("readProperty", () => {
  it("reads a Notion PDF's colon-less rows only for the Indonesian labels", () => {
    expect(readProperty("Kategori pwn", { colonOptional: true })).toEqual({ field: "category", value: "Pwn" });
    expect(readProperty("Dibuat October 22, 2026 8:49 AM", { colonOptional: true })).toEqual({ field: "date", value: "2026-10-22" });
    expect(readProperty("Status Belum solved", { colonOptional: true })).toEqual({ field: "ignored", value: "Belum solved" });
    expect(readProperty("Date of the event", { colonOptional: true })).toBeNull();
    expect(readProperty("Kategori pwn")).toBeNull();
  });
});
