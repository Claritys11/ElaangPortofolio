import { afterEach, describe, expect, it } from "vitest";
import { siteUrl } from "@/lib/site";

afterEach(() => {
  delete process.env.SITE_URL;
});

describe("siteUrl", () => {
  it("uses the configured canonical origin and base path", () => {
    expect(siteUrl()).toBe("https://claritys.web.id");
  });
  it("uses the versioned site.json origin instead of a runtime environment override", () => {
    process.env.SITE_URL = "http://localhost:3007/";
    expect(siteUrl()).toBe("https://claritys.web.id");
  });
});
