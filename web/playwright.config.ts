import { defineConfig } from "@playwright/test";
import { E2E_BASE_URL, missingE2eEnv } from "./e2e/env";

// Playwright e2e (architecture spec §10), run with `pnpm test:e2e`; never part
// of `pnpm test`. Mobile first: one 360 px wide project. Without the Clerk and
// Convex env the specs skip, so there is no dev server to start.
const ready = missingE2eEnv().length === 0;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global.setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: "list",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: E2E_BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "mobile-360",
      use: {
        browserName: "chromium",
        viewport: { width: 360, height: 800 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      },
    },
  ],
  webServer: ready
    ? {
        command: "pnpm dev",
        url: E2E_BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      }
    : undefined,
});
