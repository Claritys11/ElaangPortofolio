import { describe, expect, it } from "vitest";
import { fitScaleX, nextGlitchDelay, sliceInset } from "@/lib/glitch";

describe("glitch helpers", () => {
  it("fitScaleX shrinks the wider secret to the primary width, never enlarges", () => {
    expect(fitScaleX(500, 800)).toBeCloseTo(0.625);
    expect(fitScaleX(800, 500)).toBe(1);
    expect(fitScaleX(0, 500)).toBe(1);
    expect(fitScaleX(500, 0)).toBe(1);
  });
  it("nextGlitchDelay stays within [min, max]", () => {
    expect(nextGlitchDelay(7000, 12000, () => 0)).toBe(7000);
    expect(nextGlitchDelay(7000, 12000, () => 0.999999)).toBeLessThanOrEqual(12000);
    expect(nextGlitchDelay(7000, 12000, () => 0.5)).toBe(9500);
  });
  it("sliceInset yields a visible band of at least 10%", () => {
    for (const r of [0, 0.3, 0.7, 0.99]) {
      const m = /^inset\((\d+)% 0 (\d+)% 0\)$/.exec(sliceInset(() => r))!;
      expect(100 - Number(m[1]) - Number(m[2])).toBeGreaterThanOrEqual(10);
    }
  });
});
