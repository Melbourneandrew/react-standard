/**
 * Story API for BDD-style visual testing.
 *
 * Displays Gherkin-style steps in a panel during test execution.
 */

import type { Page } from "@playwright/test";
import { DEBUG_VISUAL, SHOW_PANELS, FOCUS_TOGGLE } from "./env";
import { safeWait } from "./helpers";
import type { StoryStep } from "./types";

/**
 * Story panel methods for BDD-style test narration.
 *
 * When DEBUG_VISUAL is enabled, these methods display a panel showing
 * the current feature, scenario, and step progression.
 */
export const story = {
  /**
   * Set up the story panel with feature, scenario, and steps.
   *
   * @example
   * ```typescript
   * await story.setup(page, 'User Authentication', 'Successful login', [
   *   { keyword: 'Given', text: 'I am on the login page' },
   *   { keyword: 'When', text: 'I enter valid credentials' },
   *   { keyword: 'Then', text: 'I should be logged in' },
   * ]);
   * ```
   */
  setup: async (
    page: Page,
    feature: string,
    scenario: string,
    steps: StoryStep[]
  ): Promise<void> => {
    if (!DEBUG_VISUAL || !SHOW_PANELS) return;

    try {
      await page.evaluate(
        ([f, s, st]) => {
          window.__playwrightCreateStoryPanel?.(f, s, st);
        },
        [feature, scenario, steps] as const
      );

      await safeWait(300);
    } catch {
      // Ignore story panel errors
    }
  },

  /**
   * Advance to the next step in the story.
   *
   * Call this before each major action in your test.
   *
   * @example
   * ```typescript
   * await story.step(page);
   * await cursor.click(page, page.getByRole('button'));
   * ```
   */
  step: async (page: Page): Promise<void> => {
    if (!DEBUG_VISUAL || !SHOW_PANELS) return;

    try {
      await page.evaluate(() => {
        window.__playwrightAdvanceStep?.();
      });

      // Apply focus effect if enabled
      if (FOCUS_TOGGLE) {
        await page.evaluate(() => {
          document.body.classList.add("playwright-visual-focus-active");
        });
        await safeWait(400);
        await page.evaluate(() => {
          document.body.classList.remove("playwright-visual-focus-active");
        });
      }

      await safeWait(200);
    } catch {
      // Ignore step errors
    }
  },

  /**
   * Hide the story panel.
   *
   * Useful when you want to take a clean screenshot.
   *
   * @example
   * ```typescript
   * await story.hide(page);
   * await page.screenshot({ path: 'clean.png' });
   * ```
   */
  hide: async (page: Page): Promise<void> => {
    if (!DEBUG_VISUAL || !SHOW_PANELS) return;

    try {
      await page.evaluate(() => {
        window.__playwrightHideStory?.();
      });
    } catch {
      // Ignore hide errors
    }
  },

  /**
   * Show focus effect (dims page, highlights story panel).
   *
   * @example
   * ```typescript
   * await story.focus(page);
   * // ... important action ...
   * await story.unfocus(page);
   * ```
   */
  focus: async (page: Page): Promise<void> => {
    if (!DEBUG_VISUAL || !SHOW_PANELS) return;

    try {
      await page.evaluate(() => {
        document.body.classList.add("playwright-visual-focus-active");
      });
    } catch {
      // Ignore focus errors
    }
  },

  /**
   * Remove focus effect.
   */
  unfocus: async (page: Page): Promise<void> => {
    if (!DEBUG_VISUAL || !SHOW_PANELS) return;

    try {
      await page.evaluate(() => {
        document.body.classList.remove("playwright-visual-focus-active");
      });
    } catch {
      // Ignore unfocus errors
    }
  },
};



