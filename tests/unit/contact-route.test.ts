import { beforeEach, describe, expect, it, vi } from "vitest";

const create = vi.fn().mockResolvedValue({ id: "1" });
vi.mock("@/lib/db", () => ({ prisma: { secureMessage: { create } } }));

const post = async (body: unknown, ip = "9.9.9.9") => {
  const { POST } = await import("@/app/api/contact/route");
  return POST(
    new Request("http://x/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
};
const valid = { name: "Rin", contact: "rin@x.dev", message: "Let's team up for SCTF" };

beforeEach(() => create.mockClear());

describe("POST /api/contact", () => {
  it("stores a valid message", async () => {
    expect((await post(valid, "1.1.1.1")).status).toBe(201);
    expect(create).toHaveBeenCalledWith({ data: expect.objectContaining({ source: "contact-form", username: "Rin" }) });
  });
  it("pretends success but stores nothing when the honeypot is filled", async () => {
    expect((await post({ ...valid, website: "http://spam" }, "2.2.2.2")).status).toBe(201);
    expect(create).not.toHaveBeenCalled();
  });
  it("422 on invalid, 400 on garbage", async () => {
    expect((await post({ ...valid, message: "hi" }, "3.3.3.3")).status).toBe(422);
    expect((await post("{not json", "4.4.4.4")).status).toBe(400);
  });
  it("429 on the 4th message within the window", async () => {
    const codes = [];
    for (let i = 0; i < 4; i++) codes.push((await post(valid, "5.5.5.5")).status);
    expect(codes).toEqual([201, 201, 201, 429]);
  });
});
