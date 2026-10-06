import { describe, expect, it } from "vitest";
import { defaultWriteupSlug, slugify } from "@/lib/slug";

describe("slug", () => {
  it("slugifies", () => {
    expect(slugify("  MATH6025 - Discrete Mathematics ")).toBe("math6025-discrete-mathematics");
    expect(slugify("Sudah lamá!!")).toBe("sudah-lama");
    expect(slugify("x".repeat(200))).toHaveLength(80);
    expect(slugify("!!!")).toBe("");
  });
  it("matches the legacy category-title pattern", () => {
    expect(defaultWriteupSlug("Pwn", "Truman")).toBe("pwn-truman");
    expect(defaultWriteupSlug(null, "Truman")).toBe("truman");
  });
});
