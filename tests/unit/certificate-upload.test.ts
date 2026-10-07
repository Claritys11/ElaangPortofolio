import { mkdtemp, readdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

let mod: typeof import("@/lib/certificate-upload");
let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "cert-"));
  process.env.UPLOADS_DIR = dir;
  mod = await import("@/lib/certificate-upload");
});

describe("storeCertificate", () => {
  it("stores a PDF plus a rendered PNG preview, returning both URLs", async () => {
    const pdf = new File([await readFile("tests/fixtures/certificate.pdf")], "JCC Finalist.pdf", { type: "application/pdf" });
    const r = await mod.storeCertificate(pdf);
    expect(r.documentUrl).toMatch(/^\/api\/public\/uploads\/[0-9a-f-]{36}-JCC-Finalist\.pdf$/);
    expect(r.imageUrl).toMatch(/-JCC-Finalist-preview\.png$/);
    const files = await readdir(dir);
    expect(files.some((f) => f.endsWith(".pdf"))).toBe(true);
    expect(files.some((f) => f.endsWith("-preview.png"))).toBe(true);
  }, 30000);
  it("passes images straight through with no document", async () => {
    const png = new File([new Uint8Array([137, 80, 78, 71])], "cert.png", { type: "image/png" });
    const r = await mod.storeCertificate(png);
    expect(r.documentUrl).toBeNull();
    expect(r.imageUrl).toMatch(/-cert\.png$/);
  });
});
