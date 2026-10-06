import { mkdtemp, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

let mod: typeof import("@/lib/uploads");
let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "uploads-"));
  process.env.UPLOADS_DIR = dir;
  await writeFile(path.join(dir, "abc-shot.png"), Buffer.from([1, 2, 3]));
  mod = await import("@/lib/uploads");
});

describe("isValidAssetName", () => {
  it.each(["../etc/passwd", "a/b", "a\\b", "", "x\u0000y", ".", "..", "a".repeat(256)])("rejects %j", (n) => {
    expect(mod.isValidAssetName(n)).toBe(false);
  });
  it("accepts legacy names", () => {
    expect(mod.isValidAssetName("0e44ad9a-7c85-4961-92d9-92611c0cf7ba-cmsms.pcapng")).toBe(true);
    expect(mod.isValidAssetName("6e464511-a13e-42da-bdc6-e683285a461d-koperasi")).toBe(true);
  });
});

describe("toStoredName / mimeFor", () => {
  it("prefixes uuid and sanitizes", () => {
    expect(mod.toStoredName("My Shot (1).PNG")).toMatch(/^[0-9a-f-]{36}-My-Shot-1-\.PNG$/);
  });
  it("maps extensions case-insensitively, defaults to octet-stream", () => {
    expect(mod.mimeFor("a.PNG")).toBe("image/png");
    expect(mod.mimeFor("a.pcapng")).toBe("application/octet-stream");
  });
});

describe("read / delete", () => {
  it("reads an existing file", async () => {
    const r = await mod.readUpload("abc-shot.png");
    expect("stream" in r && r.size).toBe(3);
  });
  it("400 on traversal, 404 when missing", async () => {
    expect(await mod.readUpload("../secret")).toEqual({ error: 400 });
    expect(await mod.readUpload("missing.png")).toEqual({ error: 404 });
  });
  it("writes then deletes", async () => {
    const saved = await mod.writeUpload(new File([new Uint8Array([9])], "note.txt", { type: "text/plain" }));
    expect(saved.url).toBe(`/api/public/uploads/${encodeURIComponent(saved.name)}`);
    expect(await readdir(dir)).toContain(saved.name);
    expect(await mod.deleteUpload(saved.name)).toBe(200);
    expect(await mod.deleteUpload(saved.name)).toBe(404);
  });
  it("writeUploadBuffer stores import assets with sanitized names", async () => {
    const saved = await mod.writeUploadBuffer("../../evil name.png", Buffer.from([1]));
    expect(saved.name).toMatch(/^[0-9a-f-]{36}-evil-name\.png$/);
    expect(saved.contentType).toBe("image/png");
    expect(await mod.deleteUpload(saved.name)).toBe(200);
  });
});
