import { expect, test } from "@playwright/test";
import JSZip from "jszip";

test.describe.configure({ mode: "serial" });

test("admin is gated", async ({ page }) => {
  await page.goto("/admin/projects");
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("login, create and delete a project; login is logged", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Username").fill(process.env.ADMIN_USERNAME!);
  await page.getByLabel("Password").fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  const title = `E2E project ${Date.now()}`;
  await page.goto("/admin/projects/new");
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Tags").fill("e2e, test");
  await page.getByRole("button", { name: "Save project" }).click();
  await expect(page.getByRole("link", { name: title })).toBeVisible();

  await page.goto("/projects");
  await expect(page.getByText(title)).toBeVisible();

  await page.goto("/admin/projects");
  const row = page.locator("li", { hasText: title });
  await row.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("link", { name: title })).toHaveCount(0);

  await page.goto("/admin/logs");
  await expect(page.locator("td", { hasText: process.env.ADMIN_USERNAME! }).first()).toBeVisible();
});

test("uploads up to 30MB pass through the proxy, and validation errors keep the writer's input", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Username").fill(process.env.ADMIN_USERNAME!);
  await page.getByLabel("Password").fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  const upload = await page.evaluate(async () => {
    const fd = new FormData();
    fd.append("file", new File([new Uint8Array(15 * 1024 * 1024)], "big.pcap", { type: "application/octet-stream" }));
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const json = await res.json();
    if (res.ok) await fetch(`/api/admin/upload/${encodeURIComponent(json.name)}`, { method: "DELETE" });
    return res.status;
  });
  expect(upload).toBe(201);

  await page.goto("/admin/projects/new");
  await page.getByLabel("Title").fill("Keep me");
  await page.getByLabel("Category").fill("Keep category");
  await page.getByLabel("Project URL").fill("javascript:alert(1)");
  await page.getByRole("button", { name: "Save project" }).click();
  await expect(page.getByText("Must be a /path or http(s) URL")).toBeVisible();
  await expect(page.getByLabel("Title")).toHaveValue("Keep me");
  await expect(page.getByLabel("Category")).toHaveValue("Keep category");
});

test("writeup editor: Notion import autofills, pasted images upload, toolbar stays in reach", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Username").fill(process.env.ADMIN_USERNAME!);
  await page.getByLabel("Password").fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  const filler = Array.from({ length: 60 }, (_, i) => `Paragraph ${i}.`).join("\n\n");
  const md = `# Zip Page\n\nDibuat: November 8, 2026 3:11 PM\nKategori: web\nKompetisi: PlayIT (https://app.notion.com/p/x?pvs=21)\nStatus: Solved\n\n## TL;DR\n\nShort version.\n\n${filler}\n\n- Flag\n    \n    \`CTF{e2e}\`\n`;
  const zip = await new JSZip().file("Zip Page 412d29486a2c804e.md", md).generateAsync({ type: "nodebuffer" });
  await page.goto("/admin/writeups/new");
  await page.locator('input[accept*=".zip"]').setInputFiles({ name: "export.zip", mimeType: "application/zip", buffer: zip });
  await expect(page.getByLabel("Title")).toHaveValue("Zip Page");
  await expect(page.getByLabel("Category")).toHaveValue("Web");
  await expect(page.getByLabel("Competition")).toHaveValue("PlayIT");
  await expect(page.getByLabel("Date")).toHaveValue("2026-11-08");
  await expect(page.getByLabel("Summary")).toHaveValue("Short version.");
  await expect(page.getByLabel("Flag")).toHaveValue("CTF{e2e}");
  const editor = page.locator(".ProseMirror");
  await expect(editor).toContainText("Paragraph 59.");
  await expect(editor).not.toContainText("CTF{e2e}");

  await page.evaluate(() => window.scrollTo(0, 1500));
  await expect.poll(async () => (await page.getByRole("button", { name: "H2", exact: true }).boundingBox())?.y).toBeLessThan(40);

  await editor.click();
  await page.evaluate(async () => {
    const png = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgIApD5fRAAAAABJRU5ErkJggg=="), (c) => c.charCodeAt(0));
    const data = new DataTransfer();
    data.items.add(new File([png], "image.png", { type: "image/png" }));
    document.querySelector(".ProseMirror")!.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
  });
  const uploaded = editor.locator('img[src^="/api/public/uploads/"]');
  await expect(uploaded).toHaveCount(1);
  await expect(editor.locator('img[src^="blob:"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Save writeup" })).toBeEnabled();

  const name = (await uploaded.getAttribute("src"))!.split("/").pop()!;
  expect((await page.request.delete(`/api/admin/upload/${encodeURIComponent(name)}`)).ok()).toBe(true);
});
