import { expect, test } from "@playwright/test";

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
