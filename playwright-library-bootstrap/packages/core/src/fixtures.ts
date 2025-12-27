/**
 * Playwright fixture extensions for visual testing.
 *
 * This module provides the core fixture factory that injects visual effects
 * into Playwright's page object.
 */

import { test as base, expect } from "@playwright/test";
import type { Page, TestInfo } from "@playwright/test";
import { DEBUG_VISUAL, RECORD_VIDEO, RUN_EPOCH } from "./env";
import { generateStyles } from "./styles";
import { INIT_SCRIPTS } from "./scripts";
import { showTestResult } from "./helpers";
import type { VisualFixtureConfig } from "./types";

/**
 * Inject visual testing styles and scripts into the page.
 */
async function injectVisualElements(
  page: Page,
  config: VisualFixtureConfig
): Promise<void> {
  try {
    // Check if already initialized
    const initialized = await page.evaluate(
      () => !!window.__playwrightVisualInitialized
    );
    if (initialized) return;

    // Inject styles
    const styles = generateStyles(config);
    await page.addStyleTag({ content: styles });

    // Inject scripts
    await page.addScriptTag({ content: INIT_SCRIPTS });
  } catch {
    // Ignore injection errors (page might have navigated)
  }
}

/**
 * Capture a thumbnail for the video dashboard.
 */
async function captureThumbnail(
  page: Page,
  testInfo: TestInfo
): Promise<void> {
  try {
    // Determine output path
    const workerIndex = testInfo.workerIndex;
    const testSlug = testInfo.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const projectName = testInfo.project.name;

    // Use a consistent path structure for the dashboard
    const thumbnailPath = `playwright/artifacts/runs/${RUN_EPOCH}/worker-${workerIndex + 1}/${testSlug}-${projectName}/thumbnail.jpg`;

    await page.screenshot({
      path: thumbnailPath,
      type: "jpeg",
      quality: 30,
    });
  } catch {
    // Ignore thumbnail errors
  }
}

/**
 * Create visual testing fixtures with custom configuration.
 *
 * @example
 * ```typescript
 * // e2e/fixtures.ts
 * import { createVisualFixtures } from '@8090-inc/playwright-visual';
 *
 * export const test = createVisualFixtures({
 *   cursor: { color: '#3b82f6' },
 *   story: { position: 'bottom-right' },
 * });
 *
 * export { expect } from '@playwright/test';
 * ```
 */
export function createVisualFixtures(config: VisualFixtureConfig = {}) {
  return base.extend<{ page: Page }>({
    page: async ({ page }, use, testInfo) => {
      // Setup: Inject visual elements on page load
      if (DEBUG_VISUAL) {
        // Handle initial page load
        page.on("load", () => injectVisualElements(page, config));

        // Handle navigation
        const origGoto = page.goto.bind(page);
        page.goto = async (url, options) => {
          const response = await origGoto(url, options);
          await injectVisualElements(page, config);
          return response;
        };
      }

      // Run the test
      await use(page);

      // Teardown: Show result and capture thumbnail
      if (DEBUG_VISUAL) {
        const passed = testInfo.status === "passed";
        await showTestResult(page, passed);
      }

      if (RECORD_VIDEO) {
        await captureThumbnail(page, testInfo);
      }
    },
  });
}

/**
 * Pre-configured test fixture with default settings.
 *
 * Use this for zero-config visual testing.
 *
 * @example
 * ```typescript
 * import { test, expect } from '@8090-inc/playwright-visual';
 *
 * test('my test', async ({ page }) => {
 *   // ...
 * });
 * ```
 */
export const test = createVisualFixtures();

export { expect };
