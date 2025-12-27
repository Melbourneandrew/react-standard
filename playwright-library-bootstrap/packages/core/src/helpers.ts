/**
 * Helper functions for cursor animation and visual effects.
 */

import type { Page, Locator } from "@playwright/test";
import { DEBUG_VISUAL, TIMING_MULTIPLIER, DEMO_TIMEOUT } from "./env";

/**
 * Wait with a timeout that won't fail the test if it exceeds.
 * Used for visual effects that shouldn't break tests.
 */
export async function safeWait(ms: number): Promise<void> {
  const adjusted = Math.round(ms * TIMING_MULTIPLIER);
  await new Promise((resolve) => setTimeout(resolve, adjusted));
}

/**
 * Get the center point of a locator element.
 */
export async function getElementCenter(
  locator: Locator
): Promise<{ x: number; y: number } | null> {
  try {
    const box = await locator.boundingBox({ timeout: DEMO_TIMEOUT });
    if (!box) return null;
    return {
      x: box.x + box.width / 2,
      y: box.y + box.height / 2,
    };
  } catch {
    return null;
  }
}

/**
 * Animate cursor movement from current position to target element.
 * Uses a quadratic bezier curve for natural-looking movement.
 */
export async function animateCursorTo(
  page: Page,
  locator: Locator
): Promise<void> {
  if (!DEBUG_VISUAL) return;

  const target = await getElementCenter(locator);
  if (!target) return;

  try {
    // Get current cursor position
    const current = await page.evaluate(() => {
      const cursor = document.getElementById("playwright-visual-cursor");
      if (!cursor) return { x: 0, y: 0 };
      return {
        x: parseFloat(cursor.style.left) || 0,
        y: parseFloat(cursor.style.top) || 0,
      };
    });

    // Animate along bezier curve
    const steps = Math.round(20 * TIMING_MULTIPLIER);
    const controlX = (current.x + target.x) / 2;
    const controlY = Math.min(current.y, target.y) - 50; // Arc upward

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Quadratic bezier
      const x =
        (1 - t) * (1 - t) * current.x +
        2 * (1 - t) * t * controlX +
        t * t * target.x;
      const y =
        (1 - t) * (1 - t) * current.y +
        2 * (1 - t) * t * controlY +
        t * t * target.y;

      await page.evaluate(
        ([px, py]) => {
          window.__playwrightMoveCursor?.(px, py);
        },
        [x, y]
      );

      await new Promise((resolve) => setTimeout(resolve, 8));
    }
  } catch {
    // Ignore animation errors - they shouldn't fail tests
  }
}

/**
 * Highlight an element with a glow effect.
 */
export async function highlightElement(
  page: Page,
  locator: Locator
): Promise<void> {
  if (!DEBUG_VISUAL) return;

  try {
    await locator.evaluate((el) => {
      el.classList.add("playwright-visual-highlight");
    });

    await safeWait(200);

    await locator.evaluate((el) => {
      el.classList.remove("playwright-visual-highlight");
    });
  } catch {
    // Ignore highlight errors
  }
}

/**
 * Show click ripple effect at cursor position.
 */
export async function animateClick(page: Page): Promise<void> {
  if (!DEBUG_VISUAL) return;

  try {
    await page.evaluate(() => {
      const cursor = document.getElementById("playwright-visual-cursor");
      if (!cursor) return;

      cursor.classList.add("clicking");

      const ripple = document.createElement("div");
      ripple.className = "playwright-visual-ripple";
      ripple.style.left = cursor.style.left;
      ripple.style.top = cursor.style.top;
      document.body.appendChild(ripple);

      setTimeout(() => {
        cursor.classList.remove("clicking");
        ripple.remove();
      }, 600);
    });

    await safeWait(100);
  } catch {
    // Ignore click animation errors
  }
}

/**
 * Show test result overlay (pass/fail).
 */
export async function showTestResult(
  page: Page,
  passed: boolean
): Promise<void> {
  if (!DEBUG_VISUAL) return;

  try {
    await page.evaluate((p) => {
      window.__playwrightShowResult?.(p);
    }, passed);

    await safeWait(1500);
  } catch {
    // Ignore result overlay errors
  }
}

/**
 * Type text character by character for human-like effect.
 */
export async function typeWithEffect(
  page: Page,
  locator: Locator,
  text: string
): Promise<void> {
  if (!DEBUG_VISUAL) {
    await locator.fill(text);
    return;
  }

  try {
    await locator.focus();

    // Clear existing content
    await locator.fill("");

    // Type each character
    for (const char of text) {
      await locator.pressSequentially(char, { delay: 30 * TIMING_MULTIPLIER });
    }
  } catch {
    // Fallback to regular fill
    await locator.fill(text);
  }
}

// Declare global window extensions
declare global {
  interface Window {
    __playwrightVisualInitialized?: boolean;
    __playwrightVisualCursor?: HTMLElement;
    __playwrightStory?: {
      feature: string;
      scenario: string;
      steps: Array<{ keyword: string; text: string }>;
      currentStep: number;
    };
    __playwrightMoveCursor?: (x: number, y: number) => void;
    __playwrightCreateStoryPanel?: (
      feature: string,
      scenario: string,
      steps: Array<{ keyword: string; text: string }>
    ) => void;
    __playwrightAdvanceStep?: () => void;
    __playwrightHideStory?: () => void;
    __playwrightShowResult?: (passed: boolean) => void;
    __playwrightHighlight?: (selector: string) => void;
    __playwrightClearHighlight?: () => void;
  }
}



