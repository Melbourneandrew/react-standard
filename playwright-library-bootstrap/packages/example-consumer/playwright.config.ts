/**
 * Example Playwright configuration consuming the visual testing package.
 *
 * This demonstrates the minimal configuration needed to use the package.
 */

import { defineConfig } from "@playwright/test";
import { visualConfig } from "@8090-inc/playwright-visual/config";

export default defineConfig(
  visualConfig({
    baseURL: "https://example.com",
    testDir: "./e2e/tests",
    // No webServer since we're testing an external site
  })
);
