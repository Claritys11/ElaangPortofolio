import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { renderPdfPreview } from "@/lib/pdf-preview";

describe("renderPdfPreview", () => {
  it("renders page 1 of a PDF to a PNG of the requested width", async () => {
    const png = await renderPdfPreview(await readFile("tests/fixtures/certificate.pdf"), 1200);
    expect([...png.subarray(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
    expect(png.readUInt32BE(16)).toBe(1200); // IHDR width
  }, 30000);
  it("rejects data that isn't a PDF", async () => {
    await expect(renderPdfPreview(Buffer.from("not a pdf"), 800)).rejects.toThrow();
  }, 30000);
});
