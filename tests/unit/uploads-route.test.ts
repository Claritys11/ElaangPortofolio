import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

let GET: typeof import("@/app/api/public/uploads/[name]/route").GET;

const get = (name: string) => GET(new Request(`http://x/api/public/uploads/${name}`), { params: Promise.resolve({ name }) });

beforeAll(async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "uploads-route-"));
  process.env.UPLOADS_DIR = dir;
  await writeFile(path.join(dir, "evil.svg"), '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(document.cookie)</script></svg>');
  await writeFile(path.join(dir, "shot.png"), Buffer.from([137, 80, 78, 71]));
  await writeFile(path.join(dir, "cert.pdf"), Buffer.from("%PDF-1.4"));
  ({ GET } = await import("@/app/api/public/uploads/[name]/route"));
});

describe("GET /api/public/uploads/[name]", () => {
  it("sandboxes every upload so scripts in served files cannot run on our origin", async () => {
    for (const name of ["evil.svg", "shot.png", "cert.pdf"]) {
      const csp = (await get(name)).headers.get("content-security-policy") ?? "";
      expect(csp).toContain("default-src 'none'");
      if (!name.endsWith(".pdf")) expect(csp).toContain("sandbox");
    }
  });
  it("forces SVG to download instead of rendering inline", async () => {
    expect((await get("evil.svg")).headers.get("content-disposition")).toMatch(/^attachment/);
  });
  it("keeps raster images inline for <img> use", async () => {
    const res = await get("shot.png");
    expect(res.headers.get("content-disposition")).toMatch(/^inline/);
    expect(res.headers.get("content-type")).toBe("image/png");
  });
  it("serves PDFs inline without the CSP sandbox (it blanks Chrome's PDF viewer)", async () => {
    const res = await get("cert.pdf");
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toMatch(/^inline/);
    expect(res.headers.get("content-security-policy")).not.toContain("sandbox");
  });
});
