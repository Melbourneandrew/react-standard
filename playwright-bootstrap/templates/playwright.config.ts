/**
 * PLAYWRIGHT CONFIGURATION
 *
 * This config supports:
 * - Visual demo mode (DEBUG_VISUAL=true)
 * - Video recording (RECORD_VIDEO=true)
 * - Grid mode for parallel visual testing (GRID_WORKERS=N)
 * - Slow motion for narrated demos (SLOW_MO=ms)
 *
 * ADAPT: Change baseURL and webServer.command for your app
 */

import { defineConfig, devices } from "@playwright/test";

const debugVisual = process.env.DEBUG_VISUAL === "true";
const recordVideo = process.env.RECORD_VIDEO === "true";
const slowMo = parseInt(process.env.SLOW_MO || (debugVisual ? "100" : "0"), 10);
const runEpoch = process.env.RUN_EPOCH || Date.now().toString();
const workerIndex = parseInt(process.env.TEST_PARALLEL_INDEX || "0", 10);

// Grid mode for parallel visual testing
const gridWorkers = parseInt(process.env.GRID_WORKERS || "0", 10);
const gridMode = gridWorkers > 1;

// ═══════════════════════════════════════════════════════════════════════════
// ADAPT: Screen dimensions for grid layout
// ═══════════════════════════════════════════════════════════════════════════

const SCREEN_WIDTH = parseInt(process.env.SCREEN_WIDTH || "1920", 10);
const SCREEN_HEIGHT = parseInt(process.env.SCREEN_HEIGHT || "1080", 10);
const MENU_BAR_HEIGHT = 50;

function calculateGridLayout(workers: number) {
  let bestCols = 1;
  let bestRows = workers;
  let bestRatioDiff = Infinity;

  for (let cols = 1; cols <= workers; cols++) {
    const rows = Math.ceil(workers / cols);
    const cellWidth = SCREEN_WIDTH / cols;
    const cellHeight = (SCREEN_HEIGHT - MENU_BAR_HEIGHT) / rows;
    const cellRatio = cellWidth / cellHeight;
    const targetRatio = 4 / 3;
    const ratioDiff = Math.abs(cellRatio - targetRatio);
    if (ratioDiff < bestRatioDiff) {
      bestRatioDiff = ratioDiff;
      bestCols = cols;
      bestRows = rows;
    }
  }

  return { cols: bestCols, rows: bestRows };
}

function getGridDimensions() {
  const { cols, rows } = calculateGridLayout(gridWorkers);
  const windowWidth = Math.floor(SCREEN_WIDTH / cols);
  const windowHeight = Math.floor((SCREEN_HEIGHT - MENU_BAR_HEIGHT) / rows);
  return { cols, rows, windowWidth, windowHeight };
}

function getWindowPosition(workerIndex: number) {
  const { cols, rows, windowWidth, windowHeight } = getGridDimensions();
  const col = workerIndex % cols;
  const row = Math.floor(workerIndex / cols) % rows;
  return {
    x: col * windowWidth,
    y: row * windowHeight + MENU_BAR_HEIGHT,
    width: windowWidth,
    height: windowHeight,
  };
}

const videoOutputDir = recordVideo
  ? `./playwright/artifacts/runs/${runEpoch}/worker-${workerIndex + 1}`
  : "./playwright/artifacts/test-results";

export default defineConfig({
  // ═══════════════════════════════════════════════════════════════════════════
  // ADAPT: Test directory location
  // ═══════════════════════════════════════════════════════════════════════════
  testDir: "./playwright/tests",
  outputDir: recordVideo ? videoOutputDir : "./playwright/artifacts/test-results",

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Sequential by default; use --workers flag to override

  reporter: [["html", { outputFolder: "./playwright/artifacts/report" }]],
  timeout: debugVisual ? 60000 : 30000,

  use: {
    // ═══════════════════════════════════════════════════════════════════════════
    // ADAPT: Your app's base URL
    // ═══════════════════════════════════════════════════════════════════════════
    baseURL: "http://localhost:3000",

    trace: "on-first-retry",
    ...(recordVideo && {
      video: {
        mode: "on",
        size: { width: 1280, height: 720 },
      },
    }),
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(gridMode && {
          viewport: (() => {
            const { windowWidth, windowHeight } = getGridDimensions();
            return {
              width: windowWidth - 20,
              height: windowHeight - 100,
            };
          })(),
          launchOptions: {
            ...(slowMo > 0 && { slowMo }),
            args: (() => {
              const pos = getWindowPosition(workerIndex);
              return [
                `--window-position=${pos.x},${pos.y}`,
                `--window-size=${pos.width},${pos.height}`,
              ];
            })(),
          },
        }),
        ...(!gridMode && slowMo > 0 && {
          launchOptions: { slowMo },
        }),
      },
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // ADAPT: Your dev server command
  // ═══════════════════════════════════════════════════════════════════════════
  webServer: {
    command: "npm run dev", // or: pnpm dev, yarn dev, etc.
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});



