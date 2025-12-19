import { defineConfig, devices } from "@playwright/test";

const debugVisual = process.env.DEBUG_VISUAL === "true";
const recordVideo = process.env.RECORD_VIDEO === "true";
// SLOW_MO: milliseconds to wait between actions (default 100 for debug, 0 otherwise)
const slowMo = parseInt(process.env.SLOW_MO || (debugVisual ? "100" : "0"), 10);

// Generate epoch timestamp for video recordings - shared across all workers in a run
// Use RUN_EPOCH env var if set (for consistent naming across workers), otherwise generate
const runEpoch = process.env.RUN_EPOCH || Date.now().toString();
const workerIndex = parseInt(process.env.TEST_PARALLEL_INDEX || "0", 10);

// Grid mode: set GRID_WORKERS to arrange multiple browser windows
const gridWorkers = parseInt(process.env.GRID_WORKERS || "0", 10);
const gridMode = gridWorkers > 1;

// Screen dimensions - override with SCREEN_WIDTH/SCREEN_HEIGHT env vars
// Defaults to common MacBook Pro effective resolution
const SCREEN_WIDTH = parseInt(process.env.SCREEN_WIDTH || "1920", 10);
const SCREEN_HEIGHT = parseInt(process.env.SCREEN_HEIGHT || "1080", 10);
const MENU_BAR_HEIGHT = 50; // macOS menu bar offset

// Calculate optimal grid layout based on worker count
function calculateGridLayout(workers: number) {
  // Find arrangement with cell aspect ratio closest to 4:3 (good for web content)
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

// Video output directory structure: runs/<epoch>/worker-<N>/
const videoOutputDir = recordVideo
  ? `./playwright/artifacts/runs/${runEpoch}/worker-${workerIndex + 1}`
  : "./playwright/artifacts/test-results";

export default defineConfig({
  testDir: "./playwright/tests",
  outputDir: recordVideo ? videoOutputDir : "./playwright/artifacts/test-results",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Retries help with flakiness from parallel data mutations
  retries: process.env.CI ? 2 : 1,
  // Sequential execution prevents data contention between tests
  workers: 1,
  reporter: [["html", { outputFolder: "./playwright/artifacts/report" }]],
  // Increase timeout for visual debug mode (animations add overhead)
  timeout: debugVisual ? 60000 : 30000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    // Record video when RECORD_VIDEO=true
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
        // Grid mode: arrange windows to fill the screen (works with or without DEBUG_VISUAL)
        ...(gridMode && {
          viewport: (() => {
            const { windowWidth, windowHeight } = getGridDimensions();
            return {
              width: windowWidth - 20,
              height: windowHeight - 100, // Account for browser chrome
            };
          })(),
          launchOptions: {
            // Slow down in visual debug mode
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
        // Non-grid visual debug mode: just slow down
        ...(!gridMode && slowMo > 0 && {
          launchOptions: {
            slowMo,
          },
        }),
      },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
