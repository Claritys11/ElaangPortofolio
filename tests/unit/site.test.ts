import { afterEach, describe, expect, it } from "vitest";
import { siteUrl } from "@/lib/site";

afterEach(() => {
  delete process.env.SITE_URL;
});

describe("siteUrl", () => {
  it("defaults to the production domain", () => {
    expect(siteUrl()).toBe("https://claritys.web.id");
  });
  it("reads SITE_URL at runtime and drops a trailing slash", () => {
    process.env.SITE_URL = "http://localhost:3007/";
    expect(siteUrl()).toBe("http://localhost:3007");
  });
});
