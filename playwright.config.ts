import { defineConfig, devices } from "@playwright/test";

const showCursor = process.env.SHOW_CURSOR === "true";

export default defineConfig({
  testDir: "./playwright/tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Retries help with flakiness from parallel data mutations
  retries: process.env.CI ? 2 : 1,
  // Sequential execution prevents data contention between tests
  workers: 1,
  reporter: "html",
  // Increase timeout for debug mode (cursor animations add overhead)
  timeout: showCursor ? 60000 : 30000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    // Slow down operations when showing cursor
    ...(showCursor && {
      launchOptions: { slowMo: 100 },
    }),
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
