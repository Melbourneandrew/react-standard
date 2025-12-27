/**
 * @8090-inc/playwright-visual
 *
 * Visual testing infrastructure for Playwright with animated cursors,
 * BDD story panels, and video recording.
 *
 * @example
 * ```typescript
 * // Zero-config usage
 * import { test, expect, cursor, story } from '@8090-inc/playwright-visual';
 *
 * test('my test @demo', async ({ page }) => {
 *   await page.goto('/');
 *
 *   await story.setup(page, 'Feature', 'Scenario', [
 *     { keyword: 'Given', text: 'I am on the home page' },
 *     { keyword: 'When', text: 'I click the button' },
 *     { keyword: 'Then', text: 'I see the result' },
 *   ]);
 *
 *   await story.step(page);
 *   await cursor.click(page, page.getByRole('button'));
 *
 *   await story.step(page);
 *   await expect(page.getByText('Result')).toBeVisible();
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Custom configuration
 * import { createVisualFixtures, cursor, story } from '@8090-inc/playwright-visual';
 *
 * export const test = createVisualFixtures({
 *   cursor: { color: '#3b82f6' },
 *   story: { position: 'bottom-right' },
 * });
 *
 * export { expect } from '@playwright/test';
 * ```
 */

// Core fixture factory and pre-configured exports
export { createVisualFixtures, test, expect } from "./fixtures";

// Visual interaction APIs
export { cursor } from "./cursor";
export { story } from "./story";

// Types
export type {
  VisualFixtureConfig,
  CursorOptions,
  StoryOptions,
  ResultOptions,
  StoryStep,
} from "./types";

// Environment detection (for advanced usage)
export {
  DEBUG_VISUAL,
  RECORD_VIDEO,
  SLOW_MO,
  FAST_MODE,
  GRID_MODE,
  GRID_WORKERS,
  SHOW_PANELS,
  TIMING_MULTIPLIER,
} from "./env";
