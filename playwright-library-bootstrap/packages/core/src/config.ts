/**
 * Playwright configuration helpers for visual testing.
 *
 * Provides pre-configured settings optimized for visual testing mode.
 */

import type { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";
import {
  DEBUG_VISUAL,
  RECORD_VIDEO,
  GRID_MODE,
  GRID_WORKERS,
  SLOW_MO,
  RUN_EPOCH,
} from "./env";

/** Options for visualConfig helper */
export interface VisualConfigOptions {
  /** Base URL for tests (required) */
  baseURL: string;
  /** Test directory relative to project root */
  testDir?: string;
  /** Web server command to start the dev server */
  webServerCommand?: string;
  /** Web server URL to wait for */
  webServerUrl?: string;
  /** Whether to reuse an existing server */
  reuseExistingServer?: boolean;
}

/**
 * Generate a Playwright configuration optimized for visual testing.
 *
 * This helper applies sensible defaults for visual testing mode,
 * including video recording, timeouts, and grid mode support.
 *
 * @example
 * ```typescript
 * // playwright.config.ts
 * import { defineConfig } from '@playwright/test';
 * import { visualConfig } from '@8090-inc/playwright-visual/config';
 *
 * export default defineConfig(visualConfig({
 *   baseURL: 'http://localhost:3000',
 *   webServerCommand: 'pnpm dev',
 * }));
 * ```
 */
export function visualConfig(
  options: VisualConfigOptions
): PlaywrightTestConfig {
  const {
    baseURL,
    testDir = "./e2e/tests",
    webServerCommand = "npm run dev",
    webServerUrl,
    reuseExistingServer = true,
  } = options;

  // Calculate video output directory
  const videoOutputDir = RECORD_VIDEO
    ? `./playwright/artifacts/runs/${RUN_EPOCH}`
    : "./playwright/artifacts/test-results";

  // Grid mode positioning
  const gridPosition =
    GRID_MODE && GRID_WORKERS > 0
      ? calculateGridPosition(0, GRID_WORKERS)
      : null;

  return {
    testDir,
    outputDir: videoOutputDir,
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 1,
    workers: GRID_MODE ? GRID_WORKERS : 1,
    reporter: [["html", { outputFolder: "./playwright/artifacts/report" }]],
    timeout: DEBUG_VISUAL ? 60000 : 30000,

    use: {
      baseURL,
      trace: "on-first-retry",

      // Video recording
      ...(RECORD_VIDEO && {
        video: {
          mode: "on" as const,
          size: { width: 1280, height: 720 },
        },
      }),
    },

    projects: [
      {
        name: "chromium",
        use: {
          ...devices["Desktop Chrome"],

          // Grid mode viewport and position
          ...(GRID_MODE &&
            gridPosition && {
              viewport: { width: gridPosition.width, height: gridPosition.height },
              launchOptions: {
                args: [
                  `--window-size=${gridPosition.width},${gridPosition.height}`,
                  `--window-position=${gridPosition.x},${gridPosition.y}`,
                ],
              },
            }),

          // Slow motion (only in non-grid mode)
          ...(!GRID_MODE &&
            SLOW_MO > 0 && {
              launchOptions: {
                slowMo: SLOW_MO,
              },
            }),
        },
      },
    ],

    webServer: {
      command: webServerCommand,
      url: webServerUrl || baseURL,
      reuseExistingServer,
    },
  };
}

/**
 * Calculate window position for grid mode.
 *
 * @internal
 */
function calculateGridPosition(
  workerIndex: number,
  totalWorkers: number
): { x: number; y: number; width: number; height: number } {
  // Assume a 2560x1440 screen (common for development)
  const screenWidth = 2560;
  const screenHeight = 1440;

  // Calculate grid dimensions
  const cols = Math.ceil(Math.sqrt(totalWorkers));
  const rows = Math.ceil(totalWorkers / cols);

  const width = Math.floor(screenWidth / cols);
  const height = Math.floor(screenHeight / rows);

  const col = workerIndex % cols;
  const row = Math.floor(workerIndex / cols);

  return {
    x: col * width,
    y: row * height,
    width,
    height,
  };
}

// Re-export for convenience
export { DEBUG_VISUAL, RECORD_VIDEO, SLOW_MO, GRID_MODE } from "./env";
