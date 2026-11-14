import { describe, expect, it } from "vitest";
import { easeBackOut, easeOutExpo, heatmapStaggerDelay } from "@/lib/activity-motion";

describe("heatmapStaggerDelay", () => {
  it("starts at zero and ends at the full cascade duration", () => {
    expect(heatmapStaggerDelay(0, 371)).toBe(0);
    expect(heatmapStaggerDelay(370, 371)).toBe(1100);
  });

  it("spreads the middle cells across the sequence", () => {
    expect(heatmapStaggerDelay(185, 371)).toBe(550);
  });

  it("handles a single cell and clamps out-of-range indexes", () => {
    expect(heatmapStaggerDelay(0, 1)).toBe(0);
    expect(heatmapStaggerDelay(-1, 371)).toBe(0);
    expect(heatmapStaggerDelay(999, 371)).toBe(1100);
  });
});

describe("easeOutExpo", () => {
  it("starts at zero, accelerates quickly, and ends exactly at one", () => {
    expect(easeOutExpo(0)).toBe(0);
    expect(easeOutExpo(0.5)).toBeGreaterThan(0.95);
    expect(easeOutExpo(1)).toBe(1);
  });

  it("clamps progress to the unit interval", () => {
    expect(easeOutExpo(-1)).toBe(0);
    expect(easeOutExpo(2)).toBe(1);
  });
});

describe("easeBackOut", () => {
  it("matches the original back.out(2) endpoints and spring overshoot", () => {
    expect(easeBackOut(0)).toBe(0);
    expect(easeBackOut(0.75)).toBeGreaterThan(1);
    expect(easeBackOut(1)).toBe(1);
  });

  it("clamps progress outside the animation interval", () => {
    expect(easeBackOut(-1)).toBe(0);
    expect(easeBackOut(2)).toBe(1);
  });
});
