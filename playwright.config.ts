import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

export default defineConfig({
  testDir: "e2e",
  timeout: 45_000,
  use: { baseURL: "http://localhost:3100", trace: "retain-on-failure" },
  webServer: { command: "pnpm build && pnpm start -p 3100", url: "http://localhost:3100", timeout: 300_000, reuseExistingServer: true },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testIgnore: /admin\.spec/ },
    { name: "reduced-motion", use: { ...devices["Desktop Chrome"], contextOptions: { reducedMotion: "reduce" } }, testIgnore: /admin\.spec/ },
  ],
});
