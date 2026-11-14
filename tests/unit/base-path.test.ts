import { describe, expect, it } from "vitest";
import { BASE_PATH, normalizeBasePath, withBasePath } from "@/lib/base-path";

describe("withBasePath", () => {
  it("uses the domain root by default", () => {
    expect(BASE_PATH).toBe("");
    expect(withBasePath("/assets/uploads/image.jpg")).toBe("/assets/uploads/image.jpg");
    expect(withBasePath("/profile.jpg")).toBe("/profile.jpg");
  });

  it("supports an optional project-site base path without duplicating it", () => {
    expect(normalizeBasePath("/RevisionedPortfolio/")).toBe("/RevisionedPortfolio");
    expect(withBasePath("/assets/uploads/image.jpg", "/RevisionedPortfolio")).toBe("/RevisionedPortfolio/assets/uploads/image.jpg");
    expect(withBasePath("/RevisionedPortfolio/assets/uploads/image.jpg", "/RevisionedPortfolio")).toBe("/RevisionedPortfolio/assets/uploads/image.jpg");
    expect(withBasePath("/RevisionedPortfolio", "/RevisionedPortfolio")).toBe("/RevisionedPortfolio");
  });

  it("leaves external, inline, anchor and mail URLs unchanged", () => {
    for (const url of [
      "https://cdn.example/image.jpg",
      "//cdn.example/image.jpg",
      "data:image/png;base64,AAAA",
      "blob:https://example.test/id",
      "#evidence",
      "mailto:hello@example.test",
      "/api/public/uploads/legacy.png",
    ]) {
      expect(withBasePath(url)).toBe(url);
    }
  });

  it("preserves a null source", () => {
    expect(withBasePath(null)).toBeNull();
  });

  it("rejects unsafe base paths", () => {
    expect(() => normalizeBasePath("/../private")).toThrow();
    expect(() => normalizeBasePath("/bad path")).toThrow();
  });
});
