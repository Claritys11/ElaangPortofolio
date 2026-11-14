import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const SITE = JSON.parse(readFileSync("content/site.json", "utf8")) as { basePath?: string };
const PROFILE = JSON.parse(readFileSync("content/profile.json", "utf8")) as { displayName: string; heroNameLines?: string[] };
const BASE_PATH = SITE.basePath === "/" || !SITE.basePath ? "" : `/${SITE.basePath.split("/").filter(Boolean).join("/")}`;
const sitePath = (path = "") => `${BASE_PATH}/${path}`;

async function clickPrimaryNav(page: import("@playwright/test").Page, mobile: boolean, label: string) {
  if (mobile) await page.getByRole("button", { name: "Open navigation menu" }).click();
  const menu = mobile ? page.locator("#mobile-menu") : page.locator("nav");
  await menu.getByRole("link", { name: label, exact: true }).click();
}

async function deferredOrLoadedSource(image: import("@playwright/test").Locator) {
  return (await image.getAttribute("src")) || (await image.getAttribute("data-deferred-src"));
}

test("home renders real content without horizontal overflow", async ({ page }) => {
  await page.goto(sitePath());
  await expect(page.getByRole("heading", { level: 1 })).toContainText("ELANG");
  await expect(page.getByText("pwn · rev · web exploit")).toBeVisible();
  await expect(page.locator(`main ol a[href^='${BASE_PATH}/writeups/']`).first()).toBeAttached();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("hero name follows configured line groups and never splits a word", async ({ page }, info) => {
  test.skip(info.project.name === "reduced-motion", "SplitText word wrappers are disabled when motion is reduced");
  await page.addInitScript(() => sessionStorage.setItem("intro-seen", "1"));
  await page.goto(sitePath());
  await page.evaluate(() => document.fonts.ready);

  const lines = page.locator("main h1 .hero-name-line");
  const expectedLines = (PROFILE.heroNameLines?.length
    ? PROFILE.heroNameLines
    : [PROFILE.displayName.trim().split(/\s+/)[0], PROFILE.displayName.trim().split(/\s+/).slice(1).join(" ")].filter(Boolean)
  ).map((line) => line.toUpperCase());
  await expect(lines).toHaveCount(expectedLines.length);
  expect(await lines.evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim()))).toEqual(expectedLines);

  await expect.poll(() => lines.first().evaluate((node) => node.querySelectorAll('[style*="white-space: nowrap"]').length)).toBeGreaterThan(0);
  const renderedWords = await lines.evaluateAll((nodes) => nodes.map((line) =>
    Array.from(line.querySelectorAll('[style*="white-space: nowrap"]')).map((word) => word.textContent?.trim()),
  ));
  expect(renderedWords).toEqual(expectedLines.map((line) => line.split(/\s+/)));
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
});

test("writeup titles wrap only between words and the mobile menu trigger stays in view", async ({ page }, info) => {
  test.skip(info.project.name === "reduced-motion", "SplitText word wrappers are disabled when motion is reduced");
  const mobile = info.project.name === "mobile";
  await page.setViewportSize({ width: mobile ? 370 : 1440, height: 897 });
  await page.addInitScript(() => sessionStorage.setItem("intro-seen", "1"));
  await page.goto(sitePath("writeups/web-fushigi-crawler"));
  await page.evaluate(() => document.fonts.ready);

  const title = page.locator("main h1");
  const words = title.locator('[style*="white-space: nowrap"]');
  await expect.poll(() => words.count()).toBe(2);
  const wordRects = await words.evaluateAll((nodes) => nodes.map((node) => ({
    text: node.textContent?.trim(),
    top: node.getBoundingClientRect().top,
    bottom: node.getBoundingClientRect().bottom,
  })));
  expect(wordRects.map((word) => word.text)).toEqual(["Fushigi", "Crawler"]);
  expect(wordRects[0].top === wordRects[1].top).toBe(!mobile);
  if (mobile) expect(wordRects[1].top - wordRects[0].bottom).toBeGreaterThan(0);

  if (mobile) {
    const trigger = page.getByRole("button", { name: "Open navigation menu" });
    const bounds = await trigger.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(358);
    expect(await trigger.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  }
});

test("split headings preserve descenders and project actions have horizontal spacing", async ({ page }, info) => {
  test.skip(info.project.name === "reduced-motion", "SplitText masks are disabled when motion is reduced");
  const mobile = info.project.name === "mobile";
  await page.setViewportSize({ width: mobile ? 370 : 1440, height: 900 });
  await page.addInitScript(() => sessionStorage.setItem("intro-seen", "1"));

  for (const sample of [
    { route: "about", glyphs: ["a", "y", "s"] },
    { route: "projects", glyphs: ["j"] },
    { route: "writeups", glyphs: ["p", "s"] },
    { route: "writeups/web-fushigi-crawler", glyphs: ["g", "a", "s"] },
  ]) {
    await page.goto(sitePath(sample.route));
    const heading = page.locator("main h1.split-heading");
    await expect(heading).toBeVisible();
    const masks = heading.locator(".split-heading-char-mask");
    await expect.poll(() => masks.count()).toBeGreaterThan(0);
    const dimensions = await masks.evaluateAll((elements) => elements.map((element) => {
      const style = getComputedStyle(element);
      return {
        paddingBottom: Number.parseFloat(style.paddingBottom),
        marginBottom: Number.parseFloat(style.marginBottom),
        overflowX: style.overflowX,
        overflowY: style.overflowY,
      };
    }));
    expect(dimensions.every((item) => item.overflowX === "visible" && item.overflowY === "clip")).toBe(true);
    expect(dimensions.every((item) => item.paddingBottom > 0 && item.marginBottom === 0)).toBe(true);

    for (const glyph of sample.glyphs) {
      const mask = masks.filter({ hasText: new RegExp(`^${glyph}$`, "i") });
      await expect.poll(() => mask.count()).toBeGreaterThan(0);
      await expect(mask.first()).toBeVisible();
    }
  }

  await page.goto(sitePath("projects"));
  const actions = page.locator("[data-project-actions]").filter({ has: page.locator('a[target="_blank"]') }).first();
  await expect(actions).toBeVisible();
  const gap = await actions.evaluate((element) => Number.parseFloat(getComputedStyle(element).columnGap));
  expect(gap).toBeGreaterThanOrEqual(16);
  const details = await actions.getByRole("link", { name: /project details/i }).boundingBox();
  const visit = await actions.locator('a[target="_blank"]').boundingBox();
  expect(details).not.toBeNull();
  expect(visit).not.toBeNull();
  expect(visit!.x - (details!.x + details!.width)).toBeGreaterThanOrEqual(16);
});

test("home follows the original Writeups → Projects → Record → Activity → Quote order", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("intro-seen", "1"));
  await page.goto(sitePath());

  // ActivitySection streams through Suspense; wait for its siblings before asserting the final DOM order.
  const activitySection = page.locator("main > section:has(.hm-card)");
  const closingQuote = page.locator("main > blockquote");
  await expect(activitySection).toHaveCount(1, { timeout: 10000 });
  await expect(closingQuote).toHaveCount(1, { timeout: 10000 });

  const sectionOrder = await page.locator("main").evaluate((main) => {
    const sections = Array.from(main.querySelectorAll(":scope > section"));
    const order = ["writeups", "projects", "record", "activity"].map((label) =>
      sections.findIndex((section) => section.querySelector(":scope > div .meta")?.textContent?.toLowerCase().includes(label)),
    );
    const children = Array.from(main.children);
    const activity = sections.find((section) => section.querySelector(".hm-card"));
    const quote = main.querySelector(":scope > blockquote");
    return { order, activityBeforeQuote: Boolean(activity && quote && children.indexOf(activity) < children.indexOf(quote)) };
  });
  expect(sectionOrder.order.every((position) => position >= 0)).toBe(true);
  expect(sectionOrder.order).toEqual([...sectionOrder.order].sort((a, b) => a - b));
  expect(sectionOrder.activityBeforeQuote).toBe(true);

  const tabs = page.getByRole("tablist", { name: "Activity source" });
  const githubTab = tabs.getByRole("tab", { name: "GitHub", exact: true });
  await expect(tabs.getByRole("tab", { name: "CTF", exact: true })).toBeVisible();
  await expect(githubTab).toBeVisible();
  await githubTab.click();
  await expect(githubTab).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(".hm-card").getByRole("link", { name: /@Claritys11/ })).toHaveAttribute("href", "https://github.com/Claritys11");
  await expect(page.locator(".hm-total")).not.toHaveText("0");
});

test("primary navigation transitions to projects and achievements", async ({ page }, info) => {
  const failures: string[] = [];
  page.on("pageerror", (error) => failures.push(error.message));
  page.on("requestfailed", (request) => {
    if (request.method() !== "HEAD" && request.url().startsWith("http://127.0.0.1:3100")) {
      failures.push(`${request.method()} ${request.url()}`);
    }
  });
  await page.addInitScript(() => sessionStorage.setItem("intro-seen", "1"));
  await page.goto(sitePath());

  const nav = page.locator("nav");
  const menu = info.project.name === "mobile" ? page.locator("#mobile-menu") : nav;
  const openMobileMenu = async () => {
    if (info.project.name === "mobile") await page.getByRole("button", { name: "Open navigation menu" }).click();
  };

  await openMobileMenu();
  await menu.getByRole("link", { name: "Projects", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${BASE_PATH}/projects/$`));
  await expect(page.locator("main h1")).toContainText("Projects");

  await openMobileMenu();
  await menu.getByRole("link", { name: "Record", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${BASE_PATH}/achievements/$`));
  await expect(page.locator("main h1")).toContainText("Record");
  expect(failures).toEqual([]);
});

test("mobile navigation is an opaque full-screen overlay and closes with Escape", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "mobile menu only exists below the desktop breakpoint");
  await page.addInitScript(() => sessionStorage.setItem("intro-seen", "1"));
  await page.goto(sitePath());

  const trigger = page.getByRole("button", { name: "Open navigation menu" });
  await trigger.click();
  const menu = page.getByRole("navigation", { name: "Mobile navigation" });
  const header = page.locator("header").first();
  await expect(menu).toBeVisible();
  await expect(page.getByRole("button", { name: "Close navigation menu" })).toHaveAttribute("aria-expanded", "true");
  await expect.poll(() => header.evaluate((node) => node.getBoundingClientRect().height)).toBeGreaterThanOrEqual(await page.evaluate(() => innerHeight) - 1);

  const overlay = await header.evaluate((header) => ({
    height: header.getBoundingClientRect().height,
    viewportHeight: window.innerHeight,
    background: getComputedStyle(header).backgroundColor,
    blend: getComputedStyle(header).mixBlendMode,
    scrollLock: document.documentElement.style.overflow,
    transitionDuration: getComputedStyle(header).transitionDuration,
    menuTransitionDuration: getComputedStyle(document.querySelector("#mobile-menu")!).transitionDuration,
  }));
  expect(overlay.height).toBeGreaterThanOrEqual(overlay.viewportHeight - 1);
  expect(overlay.background).not.toBe("rgba(0, 0, 0, 0)");
  expect(overlay.blend).toBe("normal");
  expect(overlay.scrollLock).toBe("hidden");
  expect(Number.parseFloat(overlay.transitionDuration)).toBeGreaterThan(0);
  expect(Number.parseFloat(overlay.menuTransitionDuration)).toBeGreaterThan(0);

  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open navigation menu" })).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#mobile-menu")).toHaveAttribute("aria-hidden", "true");
  await expect(header).toHaveAttribute("data-nav-state", "closed");
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("");
});

test("mobile menu finishes its close animation before navigating to another page", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "mobile menu only exists below the desktop breakpoint");
  await page.addInitScript(() => sessionStorage.setItem("intro-seen", "1"));
  await page.goto(sitePath());

  await page.getByRole("button", { name: "Open navigation menu" }).click();
  const header = page.locator("header").first();
  const menu = page.getByRole("navigation", { name: "Mobile navigation" });
  await expect(menu).toBeVisible();
  const currentUrl = page.url();

  await menu.getByRole("link", { name: "Projects", exact: true }).click();
  await expect(header).toHaveAttribute("data-nav-state", "closing");
  expect(page.url()).toBe(currentUrl);
  await expect(page).toHaveURL(new RegExp(`${BASE_PATH}/projects/$`));
  await expect(header).toHaveAttribute("data-nav-state", "closed");
});

test("mobile menu navigation respects reduced-motion preferences", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "mobile menu only exists below the desktop breakpoint");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => sessionStorage.setItem("intro-seen", "1"));
  await page.goto(sitePath());

  await page.getByRole("button", { name: "Open navigation menu" }).click();
  const header = page.locator("header").first();
  await page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "Projects", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${BASE_PATH}/projects/$`));
  await expect(header).toHaveAttribute("data-nav-state", "closed");
});

test("project images keep their project-site base path after client navigation", async ({ page }, info) => {
  const imageFailures: string[] = [];
  page.on("response", (response) => {
    if (response.url().includes("/assets/uploads/") && response.status() >= 400) imageFailures.push(`${response.status()} ${response.url()}`);
  });
  await page.addInitScript(() => sessionStorage.setItem("intro-seen", "1"));
  await page.goto(sitePath());
  await clickPrimaryNav(page, info.project.name === "mobile", "Projects");

  const images = page.locator("main article img");
  await expect(images).toHaveCount(12);
  const imageSources: string[] = [];
  for (let index = 0; index < await images.count(); index += 1) {
    const image = images.nth(index);
    await expect.poll(() => deferredOrLoadedSource(image)).toMatch(new RegExp(`^${BASE_PATH}/assets/uploads/`));
    const source = await deferredOrLoadedSource(image);
    imageSources.push(source!);
    await image.scrollIntoViewIfNeeded();
    await expect(image).toHaveAttribute("src", source!);
    await expect.poll(() => image.evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }
  const assetStatuses = await Promise.all(imageSources.map(async (src) => (await page.request.get(new URL(src, page.url()).toString())).status()));
  expect(assetStatuses).toEqual(Array(12).fill(200));
  expect(imageFailures).toEqual([]);
});

test("project cards link to generated individual project pages", async ({ page }) => {
  await page.goto(sitePath("projects"));
  const firstProject = page.locator("main article h2 a").first();
  await expect(firstProject).toBeVisible();
  const href = await firstProject.getAttribute("href");
  expect(href).toMatch(new RegExp(`^${BASE_PATH}/projects/[a-z0-9-]+/?$`));
  await firstProject.click();
  await expect(page.locator("main h1")).toBeVisible();
  await expect(page.getByRole("link", { name: /all projects/i })).toBeVisible();
});

test("home preloads project screenshots before they enter the viewport", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => sessionStorage.setItem("intro-seen", "1"));
  await page.goto(sitePath());
  const images = page.locator(".stack-card img");
  await expect(images).toHaveCount(6);
  const first = images.first();
  const absoluteTop = await first.evaluate((node) => node.getBoundingClientRect().top + window.scrollY);
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), Math.max(0, absoluteTop - viewportHeight - 300));

  const beforeViewport = await first.evaluate((node) => ({ top: node.getBoundingClientRect().top, viewportHeight: window.innerHeight }));
  expect(beforeViewport.top).toBeGreaterThan(beforeViewport.viewportHeight);
  await expect.poll(() => first.getAttribute("src")).toMatch(new RegExp(`^${BASE_PATH}/assets/uploads/`));
  await expect.poll(() => first.evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  const afterLoad = await first.evaluate((node) => ({ top: node.getBoundingClientRect().top, viewportHeight: window.innerHeight }));
  expect(afterLoad.top).toBeGreaterThan(afterLoad.viewportHeight);
});

test("home preloads the about portrait before its section enters the viewport", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => sessionStorage.setItem("intro-seen", "1"));
  await page.goto(sitePath());
  const image = page.locator(".about-photo img");
  await expect(image).toHaveCount(1);
  const absoluteTop = await image.evaluate((node) => node.getBoundingClientRect().top + window.scrollY);
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), Math.max(0, absoluteTop - viewportHeight - 250));
  const beforeViewport = await image.evaluate((node) => ({ top: node.getBoundingClientRect().top, viewportHeight: window.innerHeight }));
  expect(beforeViewport.top).toBeGreaterThan(beforeViewport.viewportHeight);
  await expect(image).toHaveAttribute("src", `${BASE_PATH}/profile.jpg`);
  await expect.poll(() => image.evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  const afterLoad = await image.evaluate((node) => ({ top: node.getBoundingClientRect().top, viewportHeight: window.innerHeight }));
  expect(afterLoad.top).toBeGreaterThan(afterLoad.viewportHeight);
});

test("achievement thumbnails keep their project-site base path after client navigation", async ({ page }, info) => {
  const imageFailures: string[] = [];
  page.on("response", (response) => {
    if (response.url().includes("/assets/uploads/") && response.status() >= 400) imageFailures.push(`${response.status()} ${response.url()}`);
  });
  await page.addInitScript(() => sessionStorage.setItem("intro-seen", "1"));
  await page.goto(sitePath());
  await clickPrimaryNav(page, info.project.name === "mobile", "Record");

  const images = page.locator(".achievement-gallery img");
  await expect.poll(() => images.count()).toBeGreaterThan(0);
  const count = await images.count();
  expect(count).toBeGreaterThan(0);
  const sources: string[] = [];
  for (let index = 0; index < Math.min(count, 6); index += 1) {
    const image = images.nth(index);
    await expect.poll(() => deferredOrLoadedSource(image)).toMatch(new RegExp(`^${BASE_PATH}/assets/uploads/`));
    const source = await deferredOrLoadedSource(image);
    sources.push(source!);
    await image.scrollIntoViewIfNeeded();
    await expect(image).toHaveAttribute("src", source!);
    await expect.poll(() => image.evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }
  const statuses = await Promise.all(sources.map(async (src) => (await page.request.get(src)).status()));
  expect(statuses).toEqual(Array(sources.length).fill(200));
  expect(imageFailures).toEqual([]);
});

test("writeup body images and attachments keep their project-site base path after navigation", async ({ page }, info) => {
  const failedAssets: string[] = [];
  page.on("response", (response) => {
    if ((response.url().includes("/assets/uploads/") || response.url().includes("/assets/exports/")) && response.status() >= 400) {
      failedAssets.push(`${response.status()} ${response.url()}`);
    }
  });
  await page.addInitScript(() => sessionStorage.setItem("intro-seen", "1"));
  await page.goto(sitePath());
  await clickPrimaryNav(page, info.project.name === "mobile", "Writeups");
  await page.locator(`main ol a[href^="${BASE_PATH}/writeups/pwn-abbys"]`).click();
  await expect(page.locator("main h1")).toBeVisible();

  const articleImages = page.locator("article.writeup-prose img");
  const count = await articleImages.count();
  expect(count).toBeGreaterThan(0);
  for (let index = 0; index < Math.min(count, 4); index += 1) {
    const image = articleImages.nth(index);
    await expect(image).toHaveAttribute("src", new RegExp(`^${BASE_PATH}/assets/uploads/`));
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }
  await page.goto(sitePath("writeups"));
  await page.locator(`main ol a[href^="${BASE_PATH}/writeups/pwn-abbys"]`).click();
  await expect(page.locator("main h1")).toContainText(/Abbys/i);
  const attachment = page.locator(`#attachments a[href^="${BASE_PATH}/assets/uploads/"]`).first();
  await expect(attachment).toBeVisible();
  const attachmentUrl = await attachment.getAttribute("href");
  expect(attachmentUrl).toMatch(new RegExp(`^${BASE_PATH}/assets/uploads/`));
  expect((await page.request.get(new URL(attachmentUrl!, page.url()).toString())).status()).toBe(200);
  expect(failedAssets).toEqual([]);
});

test("related writeup cover images wait until the related section is visible", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("intro-seen", "1"));
  await page.goto(sitePath("writeups/pwn-abbys"));
  const section = page.locator('section[aria-labelledby="related-heading"]');
  const images = section.locator("img");
  await expect(images).toHaveCount(3);
  const sources: string[] = [];
  for (let index = 0; index < await images.count(); index += 1) {
    const image = images.nth(index);
    await expect(image).not.toHaveAttribute("src", /.+/);
    const source = await image.getAttribute("data-deferred-src");
    expect(source).toMatch(new RegExp(`^(?:${BASE_PATH}/assets/uploads/|https?://)`));
    sources.push(source!);
  }
  await section.scrollIntoViewIfNeeded();
  for (let index = 0; index < await images.count(); index += 1) {
    const image = images.nth(index);
    await image.scrollIntoViewIfNeeded();
    await expect(image).toHaveAttribute("src", sources[index]);
    if (sources[index].startsWith(`${BASE_PATH}/`)) {
      await expect.poll(() => image.evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    }
  }
});

test("first visit to home opens behind the preloader, which then lifts", async ({ page }, info) => {
  test.skip(info.project.name === "reduced-motion", "no preloader when motion is reduced");
  await page.goto(sitePath());
  const loader = page.getByRole("status", { name: "Loading" });
  await expect(loader).toBeVisible();
  await expect(loader).toHaveCount(0, { timeout: 8000 });
  expect(await page.evaluate(() => sessionStorage.getItem("intro-seen"))).toBe("1");
  await page.reload();
  await expect(page.getByRole("status", { name: "Loading" })).toBeHidden();
});

test("large hero headings schedule their SplitText work during browser idle after a refresh", async ({ page }, info) => {
  test.skip(info.project.name === "reduced-motion", "SplitText is disabled when reduced motion is requested");
  await page.addInitScript(() => {
    sessionStorage.setItem("intro-seen", "1");
    const idleWindow = window as Window & {
      __idleSchedules?: number;
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
    };
    idleWindow.__idleSchedules = 0;
    const native = idleWindow.requestIdleCallback?.bind(window);
    if (native) {
      idleWindow.requestIdleCallback = (callback, options) => {
        idleWindow.__idleSchedules = (idleWindow.__idleSchedules ?? 0) + 1;
        return native(callback, options);
      };
    }
  });
  await page.goto(sitePath());
  await page.evaluate(() => document.fonts.ready);
  // Each configured name line must be deferred; other headings may schedule their own idle work too.
  await expect.poll(() => page.evaluate(() => (window as Window & { __idleSchedules?: number }).__idleSchedules ?? 0)).toBeGreaterThanOrEqual(2);
  const nameLines = page.locator("main h1 .hero-name-line");
  await expect(nameLines).toHaveCount(PROFILE.heroNameLines?.length ?? 2);
  expect(await nameLines.evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim()))).toEqual(
    (PROFILE.heroNameLines?.length ? PROFILE.heroNameLines : [PROFILE.displayName.trim().split(/\s+/)[0], PROFILE.displayName.trim().split(/\s+/).slice(1).join(" ")]).map((line) => line.toUpperCase()),
  );
  const images = await page.locator("main img").evaluateAll((nodes) => nodes.map((node) => ({
    loading: (node as HTMLImageElement).loading,
    fetchPriority: (node as HTMLImageElement).fetchPriority,
  })));
  expect(images.every((image) => (image.loading === "lazy" || image.loading === "eager") && (image.fetchPriority === "low" || image.fetchPriority === "high"))).toBe(true);
});

test("activity heatmap restores the original spring-pop cascade without per-cell JavaScript", async ({ page }, info) => {
  test.skip(info.project.name === "reduced-motion", "cell motion is disabled when reduced motion is requested");
  await page.addInitScript(() => sessionStorage.setItem("intro-seen", "1"));
  await page.goto(sitePath());
  const card = page.locator(".hm-card");
  await card.scrollIntoViewIfNeeded();
  await expect(card).toBeVisible();
  await expect(card).toHaveClass(/is-visible/);
  const cells = page.locator(".hm-cell");
  expect(await cells.count()).toBeGreaterThan(350);
  await expect.poll(() => page.locator(".hm-grid-visual").evaluate((node) => getComputedStyle(node).opacity)).toBe("1");
  const canvas = card.locator(".hm-canvas");
  await expect(canvas).toHaveAttribute("data-cell-count", String(await cells.count()));
  await expect(canvas).toHaveAttribute("data-stagger-ms", "1100");
  await expect(canvas).toHaveAttribute("data-duration-ms", "400");
  await expect(canvas).toHaveAttribute("data-motion-state", "animating");
  const paintedPixels = () => canvas.evaluate((node) => {
    const element = node as HTMLCanvasElement;
    const pixels = element.getContext("2d")!.getImageData(0, 0, element.width, element.height).data;
    let count = 0;
    for (let index = 3; index < pixels.length; index += 4) if (pixels[index] > 0) count += 1;
    return count;
  });
  await expect.poll(paintedPixels).toBeGreaterThan(0);
  await expect(canvas).toHaveAttribute("data-motion-state", "complete", { timeout: 4000 });
  await expect(card).toHaveClass(/is-complete/);
  await expect.poll(() => cells.first().evaluate((node) => getComputedStyle(node).visibility)).toBe("visible");
  await expect.poll(() => canvas.evaluate((node) => getComputedStyle(node).visibility)).toBe("hidden");
  await expect(card.locator(".hm-total")).not.toHaveText("0");
});

test("activity heatmap stays static when reduced motion is requested", async ({ page }, info) => {
  test.skip(info.project.name !== "reduced-motion", "only applies to reduced-motion project");
  await page.addInitScript(() => sessionStorage.setItem("intro-seen", "1"));
  await page.goto(sitePath());
  const card = page.locator(".hm-card");
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveClass(/is-complete/);
  await expect(card.locator(".hm-canvas")).toHaveAttribute("data-motion-state", "reduced");
  await expect.poll(() => card.locator(".hm-cell").first().evaluate((node) => getComputedStyle(node).visibility)).toBe("visible");
});

test("all sections become visible after scrolling (nothing stuck at opacity 0)", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("intro-seen", "1"));
  await page.goto(sitePath());
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

test("writeup article loads static uploads and reveals flag", async ({ page }) => {
  const statuses: number[] = [];
  page.on("response", (r) => {
    if (r.url().includes("/assets/uploads/")) statuses.push(r.status());
  });
  await page.goto(sitePath("writeups/pwn-truman"));
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

test("legacy /ctf URL is served as a static alias to the canonical writeup", async ({ request }) => {
  const response = await request.get(sitePath("ctf/pwn-truman"));
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('http-equiv="refresh"');
  expect(html).toContain(`${BASE_PATH}/writeups/pwn-truman`);
});

test("writeups filter narrows to pwn", async ({ page }) => {
  await page.goto(sitePath("writeups"));
  const resultCount = page.getByText(/^\d+ results$/);
  const allCount = Number((await resultCount.textContent())?.match(/^\d+/)?.[0] ?? 0);
  await page.getByRole("button", { name: "Pwn", exact: true }).click();
  await expect(resultCount).toBeVisible();
  const pwnCount = Number((await resultCount.textContent())?.match(/^\d+/)?.[0] ?? 0);
  expect(pwnCount).toBeGreaterThan(0);
  expect(pwnCount).toBeLessThan(allCount);
  await expect(page.getByRole("button", { name: "Pwn", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("main ol li")).toHaveCount(pwnCount);
});

test("about strip opens on cybersecurity and follows the pointer", async ({ page }, info) => {
  test.skip(info.project.name === "mobile", "hover");
  await page.addInitScript(() => sessionStorage.setItem("intro-seen", "1"));
  await page.goto(sitePath());
  const strip = page.getByRole("list", { name: "Focus areas" });
  await strip.scrollIntoViewIfNeeded();
  const cell = (name: string) => strip.locator("li").filter({ hasText: name });
  await expect(cell("Cybersecurity")).toHaveAttribute("data-on", "true");
  await cell("Web Development").hover();
  await expect(cell("Web Development")).toHaveAttribute("data-on", "true");
  await expect(cell("Cybersecurity")).not.toHaveAttribute("data-on");
});

test("contact opens a mail draft and explains the visitor must send it", async ({ page }) => {
  await page.goto(sitePath("about"));
  await page.locator("#contact").scrollIntoViewIfNeeded();
  const emailLink = page.locator('#contact a[href^="mailto:"]');
  await expect(emailLink).toBeVisible();
  await expect(emailLink).toHaveAttribute("href", /subject=Portfolio%20Inquiry/);
  await expect(page.getByText("Your email app will open with a draft. Review it and press Send there.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy email address" })).toBeVisible();
});

test("404 page", async ({ page }) => {
  const res = await page.goto(sitePath("writeups/nope-nope"));
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
});

test("footer shows ELANG and contact links", async ({ page }) => {
  await page.goto(sitePath("about"));
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1500);
  await expect(page.locator("footer").getByText("ELANG").first()).toBeAttached();
  await expect(page.locator("footer").getByRole("link", { name: /GitHub/ })).toBeVisible();
});

test("writeup code blocks show a language and copy their contents", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(sitePath("writeups/pwn-truman"));
  const block = page.locator("figure.code-block").filter({ has: page.locator(".code-lang", { hasText: /^c$/ }) }).first();
  await block.scrollIntoViewIfNeeded();
  await block.getByRole("button", { name: "copy" }).click();
  await expect(block.getByRole("button", { name: "copied ✓" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("#include");
});

test("writeup export downloads static HTML and Markdown and can print", async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { printed: number }).printed = 0;
    window.print = () => void (window as unknown as { printed: number }).printed++;
  });
  await page.goto(sitePath("writeups/pwn-truman"));
  const htmlLink = page.locator(`a[href="${sitePath("assets/exports/pwn-truman.html")}"]`);
  const markdownLink = page.locator(`a[href="${sitePath("assets/exports/pwn-truman.md")}"]`);
  await expect(htmlLink).toBeVisible();
  await expect(markdownLink).toBeVisible();
  const htmlResponse = await page.request.get(new URL(sitePath("assets/exports/pwn-truman.html"), page.url()).toString());
  const markdownResponse = await page.request.get(new URL(sitePath("assets/exports/pwn-truman.md"), page.url()).toString());
  expect(htmlResponse.status()).toBe(200);
  expect(markdownResponse.status()).toBe(200);
  await page.getByRole("button", { name: "PDF" }).click();
  expect(await page.evaluate(() => (window as unknown as { printed: number }).printed)).toBe(1);
});

test("achievement title opens the certificate preview in place", async ({ page }) => {
  const imageFailures: string[] = [];
  page.on("response", (response) => {
    if (response.url().includes("/assets/uploads/") && response.status() >= 400) imageFailures.push(`${response.status()} ${response.url()}`);
  });
  await page.goto(sitePath("achievements"));
  await page.getByRole("button", { name: /^View certificate:/ }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const certificate = dialog.locator("img");
  await expect(certificate).toHaveAttribute("src", new RegExp(`^${BASE_PATH}/assets/uploads/`));
  await expect.poll(() => certificate.evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  expect(imageFailures).toEqual([]);
  await expect(page).toHaveURL(/\/achievements$/);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("vertical scrolling over achievement certificates never reorders them", async ({ page }, info) => {
  await page.addInitScript(() => sessionStorage.setItem("intro-seen", "1"));
  await page.goto(sitePath("achievements"));
  const gallery = page.locator(".achievement-gallery");
  await expect(gallery).toBeVisible();
  const cards = gallery.locator(":scope > div");
  await expect(cards.first()).toBeAttached();
  const orderBefore = await cards.locator("h3").allTextContents();
  expect(orderBefore.length).toBeGreaterThan(1);

  const firstCard = cards.first();
  await firstCard.scrollIntoViewIfNeeded();
  const bounds = await firstCard.boundingBox();
  expect(bounds).not.toBeNull();
  const start = { x: bounds!.x + bounds!.width / 2, y: bounds!.y + bounds!.height / 2 };
  const initialScroll = await page.evaluate(() => window.scrollY);

  if (info.project.name === "mobile") {
    const client = await page.context().newCDPSession(page);
    await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: start.x, y: start.y, id: 1 }] });
    for (let step = 1; step <= 6; step += 1) {
      await client.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: start.x, y: start.y - step * 24, id: 1 }],
      });
    }
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await client.detach();
  } else {
    await page.mouse.move(start.x, start.y);
    await page.mouse.wheel(0, 360);
  }

  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(initialScroll + 40);
  await expect.poll(() => cards.locator("h3").allTextContents()).toEqual(orderBefore);
  if (info.project.name === "mobile") {
    await expect(firstCard).toHaveCSS("touch-action", "pan-y");
  }

  if (info.project.name !== "reduced-motion") {
    const dragBounds = await firstCard.boundingBox();
    expect(dragBounds).not.toBeNull();
    const dragStart = { x: dragBounds!.x + dragBounds!.width / 2, y: dragBounds!.y + dragBounds!.height / 2 };
    if (info.project.name === "mobile") {
      const client = await page.context().newCDPSession(page);
      await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: dragStart.x, y: dragStart.y, id: 1 }] });
      await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: dragStart.x + 120, y: dragStart.y, id: 1 }] });
      await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await client.detach();
    } else {
      await page.mouse.move(dragStart.x, dragStart.y);
      await page.mouse.down();
      await page.mouse.move(dragStart.x + 120, dragStart.y, { steps: 6 });
      await page.mouse.up();
    }
    await expect.poll(() => cards.locator("h3").allTextContents()).not.toEqual(orderBefore);
  }
});
