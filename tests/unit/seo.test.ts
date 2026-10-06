import { describe, expect, it } from "vitest";
import { breadcrumbJsonLd, detectLang, truncate, writeupSeoDescription, writeupSeoTitle } from "@/lib/seo";
import { renderWriteupHtml } from "@/lib/html";

const w = { title: "Truman", competition: "BeeCTF 2026", category: "Pwn", difficulty: "Medium", summary: "I've always thought I have been in control of my whole world, but it's all a lie." };

describe("writeup SEO text", () => {
  it("titles carry CTF + category + 'Writeup' so search understands the page", () => {
    expect(writeupSeoTitle(w)).toBe("Truman — BeeCTF 2026 Pwn Writeup");
    expect(writeupSeoTitle({ ...w, competition: "" })).toBe("Truman — Pwn Writeup");
  });
  it("descriptions lead with what the page is, then the summary, within ~158 chars", () => {
    const d = writeupSeoDescription(w, "");
    expect(d.startsWith("Pwn CTF writeup from BeeCTF 2026 (Medium): I've always thought")).toBe(true);
    expect(d.length).toBeLessThanOrEqual(158);
  });
  it("falls back to the article text when there is no summary", () => {
    const d = writeupSeoDescription({ ...w, summary: "", competition: "", difficulty: null }, "<p>Kita diberi beberapa file:</p><pre>x</pre>");
    expect(d).toBe("Pwn CTF writeup: Kita diberi beberapa file:");
  });
});

describe("helpers", () => {
  it("truncate cuts at a word boundary with an ellipsis", () => {
    expect(truncate("one two three four", 12)).toBe("one two…");
    expect(truncate("short", 12)).toBe("short");
  });
  it("detectLang tells Indonesian from English prose", () => {
    expect(detectLang("Kita diberi beberapa file dan ini adalah challenge yang tidak mudah untuk dikerjakan")).toBe("id");
    expect(detectLang("We are given a binary and the goal is to leak libc with the format string")).toBe("en");
  });
  it("breadcrumb list is positioned and absolute", () => {
    expect(breadcrumbJsonLd("https://x.dev", [{ name: "Home", path: "/" }, { name: "Writeups", path: "/writeups" }])).toEqual({
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://x.dev/" },
        { "@type": "ListItem", position: 2, name: "Writeups", item: "https://x.dev/writeups" },
      ],
    });
  });
});

describe("article image alt text", () => {
  it("fills empty alts with the article title and figure number, keeps real ones", async () => {
    const { html } = await renderWriteupHtml('<img src="/a.png"><img src="/b.png" alt="leak">', { altPrefix: "Truman" });
    expect(html).toContain('alt="Truman — figure 1"');
    expect(html).toContain('alt="leak"');
  });
});
