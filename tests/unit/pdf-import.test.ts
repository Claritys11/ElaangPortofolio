import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { importPdfDocument, type ImportedPdf } from "@/lib/pdf-import";

let doc: ImportedPdf;
beforeAll(async () => {
  doc = await importPdfDocument(await readFile("tests/fixtures/legacy-export.pdf"));
}, 30000);

describe("importPdfDocument (legacy export layout)", () => {
  it("reads the metadata block into fields", () => {
    expect(doc).toMatchObject({ title: "Evaporated", competition: "FGTE", category: "Forensics", difficulty: "Medium", date: "2026-02-09", pageCount: 2 });
    expect(doc.summary).toBe("Challenge ini tentang forensik filesystem NTFS.");
  });
  it("drops browser print headers/footers and section labels from the content", () => {
    expect(doc.html).not.toMatch(/1:48 PM|claritys\.web\.id\/writeups|Competition:|>Overview<|>Documentation</);
  });
  it("rebuilds wrapped paragraphs with inline monospace as <code>", () => {
    expect(doc.html).toContain("<p>Diberikan sebuah file <code>evaporated.zip</code> yang berisi dua file image forensik untuk dianalisis.</p>");
  });
  it("turns monospace runs into a code block, keeping line breaks", () => {
    expect(doc.html).toContain("<pre><code>$ unzip evaporated.zip\ninflating: evaporated.001</code></pre>");
  });
  it("turns larger text into headings and cleans lost-emoji '?' glyphs", () => {
    expect(doc.html).toContain("<h3>Tahap 1 — Identifikasi File</h3>");
  });
  it("turns bullet lines into a list", () => {
    expect(doc.html).toContain("<ul><li>mount image read-only</li><li>cari file yang dihapus</li></ul>");
  });
});

describe("importPdfDocument (older flat export with Summary:/Content: labels)", () => {
  let flat: ImportedPdf;
  beforeAll(async () => {
    flat = await importPdfDocument(await readFile("tests/fixtures/flat-export.pdf"));
  }, 30000);
  it("uses the labels and drops the Updated line", () => {
    expect(flat).toMatchObject({ title: "CMS - Persistence via Custom C2", competition: "FGTE 0", difficulty: "Hard", date: "2026-03-14" });
    expect(flat.summary).toBe("Attacker memakai custom C2 agent berbasis PHP.");
    expect(flat.html).not.toMatch(/Updated:|Summary:|Content:/);
  });
  it("breaks flattened text into paragraphs at lost-emoji section markers", () => {
    expect(flat.html).toBe("<p>Write-Up: C2 Agent Forensics</p>\n<p>Deskripsi Challenge Setelah berhasil mendapatkan akses, attacker deploy agent.</p>");
  });
});

import { cleanCodeLine } from "@/lib/pdf-import";

describe("cleanCodeLine (terminal glyphs lost in PDFs)", () => {
  it("drops powerline separator bars made only of lost glyphs", () => {
    expect(cleanCodeLine("??????????????????????????????")).toBeNull();
  });
  it("strips lost prompt segments before a path and restores the prompt arrow", () => {
    expect(cleanCodeLine("?? ? ? ~/FGTE/foren/evaporated/forWU")).toBe("~/FGTE/foren/evaporated/forWU");
    expect(cleanCodeLine("??? pngcheck -v test.png")).toBe("❯ pngcheck -v test.png");
    expect(cleanCodeLine("? unzip evaporated.zip")).toBe("❯ unzip evaporated.zip");
  });
  it("leaves real code alone", () => {
    expect(cleanCodeLine("if (x == '?') return y ? 1 : 2;")).toBe("if (x == '?') return y ? 1 : 2;");
    expect(cleanCodeLine("    indented line")).toBe("    indented line");
  });
});
