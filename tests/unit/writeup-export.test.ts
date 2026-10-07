import { describe, expect, it } from "vitest";
import { buildExportHtml, toMarkdown } from "@/lib/writeup-export";

const w = {
  title: "Truman",
  href: "/writeups/pwn-truman",
  competition: "BeeCTF 2026",
  category: "Pwn",
  difficulty: "Medium",
  date: "2026-08-22T00:00:00.000Z",
  summary: "UAF to ret2libc",
  tags: ["heap", "ret2libc"],
  flag: "BeeCTF{x}",
  attachments: [{ url: "/api/public/uploads/6e464511-a13e-42da-bdc6-e683285a461d-chall.zip", name: "6e464511-a13e-42da-bdc6-e683285a461d-chall.zip", contentType: "application/zip" }],
};
const content = '<h2>Recon</h2><p>Run <code>checksec</code>:</p><pre><code class="language-bash">checksec ./truman\n</code></pre><p><img src="/api/public/uploads/x.png" alt="leak"></p><table><tbody><tr><th>Step</th><th>Primitive</th></tr><tr><td>1</td><td>UAF</td></tr></tbody></table>';

describe("toMarkdown", () => {
  const md = toMarkdown(w, content, "https://claritys.web.id");
  it("starts with front matter carrying the metadata", () => {
    expect(md.startsWith("---\ntitle: \"Truman\"\n")).toBe(true);
    expect(md).toContain('ctf: "BeeCTF 2026"');
    expect(md).toContain("tags: [heap, ret2libc]");
    expect(md).toContain("source: https://claritys.web.id/writeups/pwn-truman");
  });
  it("converts headings, inline code, fenced code with language, absolute images, tables", () => {
    expect(md).toContain("## Recon");
    expect(md).toContain("Run `checksec`:");
    expect(md).toContain("```bash\nchecksec ./truman\n```");
    expect(md).toContain("![leak](https://claritys.web.id/api/public/uploads/x.png)");
    expect(md).toMatch(/\| Step \| Primitive \|/);
  });
  it("ends with flag and attachments", () => {
    expect(md).toContain("## Flag\n\n`BeeCTF{x}`");
    expect(md).toContain("- [chall.zip](https://claritys.web.id/api/public/uploads/6e464511-a13e-42da-bdc6-e683285a461d-chall.zip)");
  });
});

describe("buildExportHtml", () => {
  it("is a standalone document with metadata, content and embedded images", async () => {
    const html = await buildExportHtml(w, content, async (src) => (src.endsWith("x.png") ? "data:image/png;base64,AAAA" : null), "https://claritys.web.id");
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain("<title>Truman — BeeCTF 2026 Pwn Writeup</title>");
    expect(html).toContain('src="data:image/png;base64,AAAA"');
    expect(html).not.toContain('src="/api/public/uploads/x.png"');
    expect(html).toContain("BeeCTF{x}");
    expect(html).toContain('href="https://claritys.web.id/api/public/uploads/6e464511-a13e-42da-bdc6-e683285a461d-chall.zip"');
  });
});

describe("dead relative links (Notion leftovers)", () => {
  const notion = '<p><a href="image%209.png"><img src="/api/public/uploads/y.png" alt=""></a> see <a href="#recon">recon</a> and <a href="https://ctf.example">ctf</a></p>';
  it("Markdown keeps the image but drops the dead link", () => {
    const md = toMarkdown(w, notion, "https://claritys.web.id");
    expect(md).toContain("![](https://claritys.web.id/api/public/uploads/y.png)");
    expect(md).not.toContain("image%209.png");
    expect(md).toContain("[recon](#recon)");
    expect(md).toContain("[ctf](https://ctf.example)");
  });
  it("HTML drops the dead link too", async () => {
    const doc = await buildExportHtml(w, notion, async () => null, "https://claritys.web.id");
    expect(doc).not.toContain("image%209.png");
    expect(doc).toContain('href="#recon"');
  });
});
