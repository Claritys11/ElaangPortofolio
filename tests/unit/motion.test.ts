import { describe, expect, it } from "vitest";
import { toHexProgress } from "@/lib/motion";

describe("toHexProgress", () => {
  it("maps 0..1 to 0x0000..0xFFFF and clamps", () => {
    expect(toHexProgress(0)).toBe("0x0000");
    expect(toHexProgress(1)).toBe("0xFFFF");
    expect(toHexProgress(0.5)).toBe("0x8000");
    expect(toHexProgress(-3)).toBe("0x0000");
    expect(toHexProgress(Number.NaN)).toBe("0x0000");
  });
});
