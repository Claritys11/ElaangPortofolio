import { expect, test } from "@playwright/test";

test("home renders real content without horizontal overflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("ELANG");
  await expect(page.getByText("pwn · rev · forensics")).toBeVisible();
  await expect(page.locator(`a[href="/writeups/pwn-truman"]`).first()).toBeAttached();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("all sections become visible after scrolling (nothing stuck at opacity 0)", async ({ page }) => {
  await page.goto("/");
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 700) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(1500);
  const hidden = await page.$$eval("main li, main h2, main p", (els) =>
    els
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.height > 0 && getComputedStyle(e).opacity === "0" && !e.closest("[aria-hidden]");
      })
      .map((e) => e.textContent?.slice(0, 40)),
  );
  expect(hidden).toEqual([]);
});

test("writeup article loads uploads images and reveals flag", async ({ page }) => {
  const statuses: number[] = [];
  page.on("response", (r) => {
    if (r.url().includes("/api/public/uploads/")) statuses.push(r.status());
  });
  await page.goto("/writeups/pwn-truman");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Truman");
  await page.locator("article img").first().scrollIntoViewIfNeeded();
  await expect.poll(() => statuses.length).toBeGreaterThan(0);
  expect(statuses.every((s) => s === 200)).toBe(true);
  const reveal = page.getByRole("button", { name: "Reveal flag" });
  if (await reveal.count()) {
    await reveal.click();
    await expect(page.locator("code.text-primary", { hasText: /\{.*\}/ })).toBeVisible();
  }
});

test("legacy /ctf URL redirects permanently", async ({ request }) => {
  const res = await request.get("/ctf/pwn-truman", { maxRedirects: 0 });
  expect(res.status()).toBe(308);
  expect(res.headers()["location"]).toContain("/writeups/pwn-truman");
});

test("writeups filter narrows to pwn", async ({ page }) => {
  await page.goto("/writeups");
  await page.getByRole("button", { name: "Pwn", exact: true }).click();
  await expect(page.getByText(/^23 results$/)).toBeVisible();
});

test("contact honeypot is accepted but silent", async ({ request }) => {
  const res = await request.post("/api/contact", {
    data: { name: "bot", contact: "bot@x", message: "buy cheap stuff now", website: "http://spam" },
    headers: { "x-forwarded-for": "203.0.113.9" },
  });
  expect(res.status()).toBe(201);
});

test("404 page", async ({ page }) => {
  const res = await page.goto("/writeups/nope-nope");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
});

test("footer shows ELANG and contact links", async ({ page }) => {
  await page.goto("/about");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1500);
  await expect(page.locator("footer").getByText("ELANG").first()).toBeAttached();
  await expect(page.locator("footer").getByRole("link", { name: /GitHub/ })).toBeVisible();
});

test("writeup code blocks show a language and copy their contents", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/writeups/pwn-truman");
  const block = page.locator("figure.code-block").filter({ has: page.locator(".code-lang", { hasText: /^c$/ }) }).first();
  await block.scrollIntoViewIfNeeded();
  await block.getByRole("button", { name: "copy" }).click();
  await expect(block.getByRole("button", { name: "copied ✓" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("#include");
});

test("achievement title opens the certificate preview in place", async ({ page }) => {
  await page.goto("/achievements");
  await page.getByRole("button", { name: /^View certificate:/ }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(/\/achievements$/);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});
