/**
 * Cursor API for visual testing.
 *
 * Provides animated cursor interactions that show where clicks, fills, and hovers occur.
 */

import type { Page, Locator } from "@playwright/test";
import { DEBUG_VISUAL } from "./env";
import {
  animateCursorTo,
  highlightElement,
  animateClick,
  typeWithEffect,
  safeWait,
} from "./helpers";

/**
 * Cursor interaction methods for visual testing.
 *
 * When DEBUG_VISUAL is enabled, these methods animate the cursor and highlight elements.
 * When disabled, they pass through directly to Playwright's native methods.
 */
export const cursor = {
  /**
   * Click an element with visual cursor animation.
   *
   * @example
   * ```typescript
   * await cursor.click(page, page.getByRole('button', { name: 'Submit' }));
   * ```
   */
  click: async (page: Page, locator: Locator): Promise<void> => {
    if (!DEBUG_VISUAL) {
      await locator.click();
      return;
    }

    await animateCursorTo(page, locator);
    await highlightElement(page, locator);
    await animateClick(page);
    await locator.click();
    await safeWait(100);
  },

  /**
   * Fill an input with visual cursor animation and human-like typing.
   *
   * @example
   * ```typescript
   * await cursor.fill(page, page.getByLabel('Email'), 'test@example.com');
   * ```
   */
  fill: async (page: Page, locator: Locator, value: string): Promise<void> => {
    if (!DEBUG_VISUAL) {
      await locator.fill(value);
      return;
    }

    await animateCursorTo(page, locator);
    await highlightElement(page, locator);
    await typeWithEffect(page, locator, value);
    await safeWait(100);
  },

  /**
   * Hover over an element with visual cursor animation.
   *
   * @example
   * ```typescript
   * await cursor.hover(page, page.getByRole('menuitem', { name: 'Settings' }));
   * ```
   */
  hover: async (page: Page, locator: Locator): Promise<void> => {
    if (!DEBUG_VISUAL) {
      await locator.hover();
      return;
    }

    await animateCursorTo(page, locator);
    await highlightElement(page, locator);
    await locator.hover();
    await safeWait(100);
  },

  /**
   * Double-click an element with visual cursor animation.
   *
   * @example
   * ```typescript
   * await cursor.dblclick(page, page.getByText('Edit me'));
   * ```
   */
  dblclick: async (page: Page, locator: Locator): Promise<void> => {
    if (!DEBUG_VISUAL) {
      await locator.dblclick();
      return;
    }

    await animateCursorTo(page, locator);
    await highlightElement(page, locator);
    await animateClick(page);
    await safeWait(150);
    await animateClick(page);
    await locator.dblclick();
    await safeWait(100);
  },

  /**
   * Right-click an element with visual cursor animation.
   *
   * @example
   * ```typescript
   * await cursor.rightClick(page, page.getByText('File'));
   * ```
   */
  rightClick: async (page: Page, locator: Locator): Promise<void> => {
    if (!DEBUG_VISUAL) {
      await locator.click({ button: "right" });
      return;
    }

    await animateCursorTo(page, locator);
    await highlightElement(page, locator);
    await animateClick(page);
    await locator.click({ button: "right" });
    await safeWait(100);
  },
};



