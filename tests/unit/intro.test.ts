import { describe, expect, it } from "vitest";
import { createIntroScript, introProgress } from "@/lib/intro";

describe("introProgress", () => {
  const minMs = 1800;
  const maxMs = 4000;

  it("keeps a minimum time-based reveal even when resources load immediately", () => {
    expect(introProgress(900, 1, 1, minMs, maxMs)).toBe(0.5);
  });

  it("holds at 90 percent after the minimum duration while a resource is pending", () => {
    expect(introProgress(1800, 0, 1, minMs, maxMs)).toBe(0.9);
  });

  it("uses the actual settled-resource ratio when it is ahead of the time ramp", () => {
    expect(introProgress(900, 1, 2, minMs, maxMs)).toBe(0.5);
  });

  it("finishes at the maximum wait instead of holding the visitor indefinitely", () => {
    expect(introProgress(maxMs, 0, 1, minMs, maxMs)).toBe(1);
  });

  it("clamps negative time and over-reported resource counts", () => {
    expect(introProgress(-100, 0, 1, minMs, maxMs)).toBe(0);
    expect(introProgress(900, 4, 1, minMs, maxMs)).toBe(0.5);
  });
});

describe("createIntroScript", () => {
  it("recognizes the root path for a root-domain site", () => {
    expect(createIntroScript()).toContain('p==="/"');
  });

  it("recognizes the project-site homepage after trimming its trailing slash", () => {
    const script = createIntroScript("/RevisionedPortfolio");
    expect(script).toContain('p==="/RevisionedPortfolio"');
    expect(script).toContain("location.pathname.replace");
  });
});
