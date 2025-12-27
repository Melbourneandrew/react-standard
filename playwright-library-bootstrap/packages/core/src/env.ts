/**
 * Environment variable detection for visual testing mode.
 *
 * These environment variables control the behavior of the visual testing infrastructure.
 */

/** Enable visual effects (animated cursor, story panels, result overlays) */
export const DEBUG_VISUAL = process.env.DEBUG_VISUAL === "true";

/** Enable video recording of tests */
export const RECORD_VIDEO = process.env.RECORD_VIDEO === "true";

/** Slow motion delay between actions (milliseconds) */
export const SLOW_MO = parseInt(process.env.SLOW_MO || "0", 10);

/** Speed up animations (0.3x timing) for faster demo playback */
export const FAST_MODE = process.env.FAST_MODE === "true";

/** Number of parallel browser windows for grid mode */
export const GRID_WORKERS = parseInt(process.env.GRID_WORKERS || "0", 10);

/** Whether grid mode is enabled (multiple parallel windows) */
export const GRID_MODE = GRID_WORKERS > 1;

/** Whether to show UI panels (disabled in grid mode to save space) */
export const SHOW_PANELS = DEBUG_VISUAL && !GRID_MODE;

/** Timing multiplier for animations based on mode */
export const TIMING_MULTIPLIER = FAST_MODE
  ? 0.3
  : SLOW_MO > 0
    ? Math.max(1, SLOW_MO / 200)
    : 1.5;

/** Whether to use focus toggle effect (dim page, highlight story) */
export const FOCUS_TOGGLE = SLOW_MO > 0 && SHOW_PANELS;

/** Demo timeout - how long to wait for effects before giving up */
export const DEMO_TIMEOUT = 500;

/** Epoch timestamp for organizing video recordings */
export const RUN_EPOCH = process.env.RUN_EPOCH || Date.now().toString();



