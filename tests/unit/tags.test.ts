import { describe, expect, it } from "vitest";
import { buildTagIndex, isGenericTag, suggestTags } from "@/lib/tags";
import { relatedWriteups } from "@/lib/related";
import type { WriteupSummary } from "@/lib/types";

const rows = [
  { category: "Pwn", tags: ["PWN", "heap", "ret2libc"] },
  { category: "Pwn", tags: ["pwn", "Heap", "tcache"] },
  { category: "Pwn", tags: ["ROP", "ret2libc"] },
  { category: "Forensics", tags: ["PCAP", "USB"] },
];

describe("tag index", () => {
  it("merges case variants under the most common spelling and counts per category", () => {
    const idx = buildTagIndex(rows);
    const heap = idx.find((t) => t.tag.toLowerCase() === "heap")!;
    expect(heap.count).toBe(2);
    expect(heap.byCategory).toEqual({ Pwn: 2 });
    expect(idx.find((t) => t.tag.toLowerCase() === "ret2libc")!.count).toBe(2);
  });
  it("flags generic labels", () => {
    expect(isGenericTag("PWN")).toBe(true);
    expect(isGenericTag("Medium")).toBe(true);
    expect(isGenericTag("heap")).toBe(false);
  });
});

describe("suggestTags", () => {
  const idx = buildTagIndex(rows);
  it("with an empty query, suggests what is popular in the chosen category, skipping selected tags", () => {
    const s = suggestTags(idx, { query: "", category: "Pwn", selected: ["heap"], limit: 3 }).map((t) => t.tag.toLowerCase());
    expect(s).not.toContain("heap");
    expect(s[0]).toBe("ret2libc");
    expect(s).not.toContain("pcap");
  });
  it("matches prefix before substring, case-insensitively", () => {
    const s = suggestTags(idx, { query: "re", category: null, selected: [], limit: 5 }).map((t) => t.tag.toLowerCase());
    expect(s[0]).toBe("ret2libc");
  });
});

const w = (id: string, category: string, tags: string[], competition = "", date = "2026-01-01T00:00:00.000Z"): WriteupSummary => ({
  id, href: `/writeups/${id}`, slug: id, title: id, competition, category, difficulty: null, date, summary: "", tags, cover: null,
});

describe("relatedWriteups", () => {
  const cur = w("truman", "Pwn", ["PWN", "heap", "ret2libc", "UAF"], "BeeCTF");
  const all = [
    cur,
    w("heapy", "Pwn", ["pwn", "Heap", "tcache"], "", "2026-02-01T00:00:00.000Z"),
    w("rop1", "Pwn", ["PWN", "ret2libc", "UAF"], "BeeCTF", "2026-01-15T00:00:00.000Z"),
    w("plain-pwn", "Pwn", ["PWN"], "", "2026-03-01T00:00:00.000Z"),
    w("forensic", "Forensics", ["heap"], "BeeCTF"),
  ];
  it("ranks same category + shared technique tags, excludes itself, ignores generic tags", () => {
    expect(relatedWriteups(cur, all, 3).map((x) => x.id)).toEqual(["rop1", "heapy", "plain-pwn"]);
  });
  it("returns shared tags for display", () => {
    expect(relatedWriteups(cur, all, 1)[0].shared).toEqual(["ret2libc", "UAF"]);
  });
});
