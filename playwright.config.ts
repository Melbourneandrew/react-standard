import { defineConfig, devices } from "@playwright/test";

const debugVisual = process.env.DEBUG_VISUAL === "true";
const recordVideo = process.env.RECORD_VIDEO === "true";

export default defineConfig({
  testDir: "./playwright/tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Retries help with flakiness from parallel data mutations
  retries: process.env.CI ? 2 : 1,
  // Sequential execution prevents data contention between tests
  workers: 1,
  reporter: "html",
  // Increase timeout for visual debug mode (animations add overhead)
  timeout: debugVisual ? 60000 : 30000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    // Record video when RECORD_VIDEO=true
    ...(recordVideo && {
      video: "on",
    }),
    // Slow down operations in visual debug mode
    ...(debugVisual && {
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
