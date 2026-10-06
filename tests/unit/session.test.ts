import { beforeEach, describe, expect, it } from "vitest";
import { checkCredentials, createSessionToken, SESSION_TTL_MS, verifySessionToken } from "@/lib/session";

beforeEach(() => {
  process.env.ADMIN_SESSION_SECRET = "x".repeat(40);
  process.env.ADMIN_USERNAME = "admin";
  process.env.ADMIN_PASSWORD = "pw";
});

describe("session tokens", () => {
  it("round-trips", () => {
    const t = createSessionToken("admin", 1000);
    expect(verifySessionToken(t, 2000)).toEqual({ username: "admin", exp: 1000 + SESSION_TTL_MS });
  });
  it("rejects expired, tampered, foreign-user and empty tokens", () => {
    const t = createSessionToken("admin", 0);
    expect(verifySessionToken(t, SESSION_TTL_MS + 1)).toBeNull();
    expect(verifySessionToken(t.slice(0, -2) + "xx", 1)).toBeNull();
    expect(verifySessionToken(createSessionToken("mallory", 0), 1)).toBeNull();
    expect(verifySessionToken(undefined)).toBeNull();
    expect(verifySessionToken("garbage")).toBeNull();
  });
  it("throws when the secret is too short", () => {
    process.env.ADMIN_SESSION_SECRET = "short";
    expect(() => createSessionToken("admin")).toThrow(/ADMIN_SESSION_SECRET/);
  });
});

describe("checkCredentials", () => {
  it("accepts exact match only", () => {
    expect(checkCredentials("admin", "pw")).toBe(true);
    expect(checkCredentials("admin", "pw ")).toBe(false);
    expect(checkCredentials("Admin", "pw")).toBe(false);
  });
});
