import { describe, expect, it } from "vitest";
import { readingMinutes } from "@/lib/format";

describe("readingMinutes", () => {
  it("counts words outside tags at ~200 wpm, minimum 1", () => {
    expect(readingMinutes("")).toBe(1);
    expect(readingMinutes(`<p>${"word ".repeat(450)}</p>`)).toBe(3);
    expect(readingMinutes('<img src="/a.png"><pre><code>x = 1</code></pre>')).toBe(1);
  });
});
