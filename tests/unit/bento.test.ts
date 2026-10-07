import { describe, expect, it } from "vitest";
import { bentoSpan, toMediaItems } from "@/lib/bento";

describe("bento layout", () => {
  it("cycles a fixed span pattern so any number of items tiles the grid", () => {
    expect(bentoSpan(0)).toBe(bentoSpan(7));
    expect(new Set(Array.from({ length: 7 }, (_, i) => bentoSpan(i))).size).toBeGreaterThan(1);
  });
  it("maps achievements with images to gallery items, skipping ones without", () => {
    const items = toMediaItems([
      { id: "a", title: "Top 20", issuer: "DCSC", platform: null, description: "", imageUrl: "/x.png", date: "2026-05-01T00:00:00.000Z", year: 2026, proofScore: 1, weight: 1, documentUrl: null },
      { id: "b", title: "No image", issuer: null, platform: null, description: "", imageUrl: null, date: null, year: null, proofScore: 1, weight: 1, documentUrl: null },
    ]);
    expect(items).toEqual([{ id: "a", type: "image", title: "Top 20", desc: "DCSC · May 2026", url: "/x.png", span: bentoSpan(0) }]);
  });
});
