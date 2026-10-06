import { describe, expect, it } from "vitest";
import { renderWriteupHtml } from "@/lib/html";

describe("renderWriteupHtml", () => {
  it("strips scripts and event handlers, keeps uploads images and tables", async () => {
    const { html } = await renderWriteupHtml(
      '<p onclick="x()">hi<script>alert(1)</script></p><img src="/api/public/uploads/a.png" onerror="x()"><table><tbody><tr><td>1</td></tr></tbody></table><a href="javascript:alert(1)">x</a>',
    );
    expect(html).not.toMatch(/script|onclick|onerror|javascript:/);
    expect(html).toContain('src="/api/public/uploads/a.png"');
    expect(html).toContain("<td>1</td>");
  });
  it("adds heading ids and builds a toc", async () => {
    const { html, toc } = await renderWriteupHtml("<h2>Recon</h2><h3>Leak libc</h3><h2>Recon</h2>");
    expect(toc).toEqual([
      { id: "recon", text: "Recon", depth: 2 },
      { id: "leak-libc", text: "Leak libc", depth: 3 },
      { id: "recon-1", text: "Recon", depth: 2 },
    ]);
    expect(html).toContain('<h2 id="recon">');
  });
  it("highlights fenced code with a language class and never emits a live tag from code text", async () => {
    const { html } = await renderWriteupHtml('<pre><code class="language-python">print(1)</code></pre><pre><code>raw &lt;b&gt;</code></pre>');
    expect(html).toContain("shiki");
    expect(html).not.toContain("<b>");
    expect(html).toMatch(/raw (&#x3C;|&lt;)b/);
  });
  it("adds rel+target to external links only", async () => {
    const { html } = await renderWriteupHtml('<a href="https://x.dev">x</a><a href="/writeups">y</a>');
    expect(html).toContain('href="https://x.dev" rel="noopener noreferrer" target="_blank"');
    expect(html).toContain('<a href="/writeups">y</a>');
  });
  it("demotes in-article h1 to h2 so the page keeps one h1 and the TOC sees them", async () => {
    const { html, toc } = await renderWriteupHtml("<h1>Overview</h1><h2>Exploit</h2>");
    expect(html).not.toContain("<h1");
    expect(toc.map((t) => t.text)).toEqual(["Overview", "Exploit"]);
  });
  it("highlights Notion-imported code blocks using data-notion-code-syntax", async () => {
    const { html } = await renderWriteupHtml('<pre data-notion-code-syntax="python"><code>print(1)</code></pre>');
    expect(html).toContain("shiki");
    expect(html).toContain("language-python");
  });
});
