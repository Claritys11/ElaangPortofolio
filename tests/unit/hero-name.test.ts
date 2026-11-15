import { describe, expect, it } from "vitest";
import { isHeroNameLineGroupingValid, resolveHeroNameLines } from "@/lib/hero-name";

describe("hero name line groups", () => {
  it("preserves the configured two-line name layout", () => {
    expect(resolveHeroNameLines("Elang Dimas Syadewa", ["Elang", "Dimas Syadewa"])).toEqual(["Elang", "Dimas Syadewa"]);
  });

  it("supports an explicit third line without splitting a name token", () => {
    expect(resolveHeroNameLines("Elang Dimas Syadewa", ["Elang", "Dimas", "Syadewa"])).toEqual(["Elang", "Dimas", "Syadewa"]);
  });

  it("rejects incomplete, reordered, or duplicated words and falls back safely", () => {
    expect(isHeroNameLineGroupingValid("Elang Dimas Syadewa", ["Elang", "Dimas Syad"])).toBe(false);
    expect(resolveHeroNameLines("Elang Dimas Syadewa", ["Elang", "Syadewa", "Dimas"])).toEqual(["Elang", "Dimas Syadewa"]);
    expect(resolveHeroNameLines("Elang Dimas Syadewa", ["Elang", "Dimas", "Syadewa", "Syadewa"])).toEqual(["Elang", "Dimas Syadewa"]);
  });
});
