import { test as base, expect, Locator, Page } from "@playwright/test";

const SHOW_CURSOR = process.env.SHOW_CURSOR === "true";

// Cursor injection script
const CURSOR_SCRIPT = `
(() => {
  if (window.__cursor) return;

  const cursor = document.createElement('div');
  cursor.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.85a.5.5 0 0 0-.85.36Z" fill="#000" stroke="#fff" stroke-width="1.5"/></svg>';
  cursor.style.cssText = 'position:fixed;top:0;left:0;width:24px;height:24px;pointer-events:none;z-index:999999;filter:drop-shadow(2px 2px 4px rgba(0,0,0,0.4));';
  document.body.appendChild(cursor);

  const ripple = document.createElement('div');
  ripple.style.cssText = 'position:fixed;width:60px;height:60px;border-radius:50%;background:radial-gradient(circle,rgba(59,130,246,0.6) 0%,rgba(59,130,246,0) 70%);pointer-events:none;z-index:999998;transform:scale(0);opacity:0;';
  document.body.appendChild(ripple);

  let x = -100, y = -100;
  cursor.style.transform = 'translate(' + x + 'px,' + y + 'px)';

  window.__cursor = {
    move: (tx, ty, ms) => {
      return new Promise(resolve => {
        const sx = x, sy = y;
        const dx = tx - sx, dy = ty - sy;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const arcHeight = Math.min(dist * 0.08, 20);
        const perpX = dist > 0 ? -dy / dist : 0;
        const perpY = dist > 0 ? dx / dist : 0;
        const start = performance.now();
        function animate() {
          const p = Math.min((performance.now() - start) / ms, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          const arc = Math.sin(p * Math.PI) * arcHeight;
          x = sx + dx * ease + perpX * arc;
          y = sy + dy * ease + perpY * arc;
          cursor.style.transform = 'translate(' + x + 'px,' + y + 'px)';
          if (p < 1) requestAnimationFrame(animate);
          else { x = tx; y = ty; resolve(); }
        }
        requestAnimationFrame(animate);
      });
    },
    click: () => {
      ripple.style.left = (x - 30) + 'px';
      ripple.style.top = (y - 30) + 'px';
      ripple.style.transform = 'scale(0)';
      ripple.style.opacity = '1';
      ripple.style.transition = 'none';
      requestAnimationFrame(() => {
        ripple.style.transition = 'transform 0.35s ease-out, opacity 0.35s ease-out';
        ripple.style.transform = 'scale(2)';
        ripple.style.opacity = '0';
      });
    }
  };
})();
`;

async function injectCursor(page: Page) {
  if (!SHOW_CURSOR) return;
  try {
    await page.evaluate(CURSOR_SCRIPT);
  } catch {}
}

async function animateCursorTo(page: Page, locator: Locator) {
  if (!SHOW_CURSOR) return;
  try {
    const box = await locator.boundingBox({ timeout: 3000 });
    if (box) {
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      await page.evaluate(async ([x, y]) => {
        await (window as any).__cursor?.move(x, y, 200);
      }, [x, y] as const);
      await page.waitForTimeout(220);
    }
  } catch {}
}

async function animateClick(page: Page) {
  if (!SHOW_CURSOR) return;
  try {
    await page.evaluate(() => (window as any).__cursor?.click());
    await page.waitForTimeout(50);
  } catch {}
}

// Use Playwright's built-in delay - much more efficient than manual loops
const TYPE_DELAY = 10; // ms per character when SHOW_CURSOR is on

/**
 * Cursor interaction helpers.
 * When SHOW_CURSOR=true: animates cursor before action
 * When SHOW_CURSOR=false: just performs the action directly
 */
export const cursor = {
  /**
   * Click with optional cursor animation
   */
  click: async (page: Page, locator: Locator) => {
    if (!SHOW_CURSOR) {
      await locator.click();
      return;
    }
    await animateCursorTo(page, locator);
    await animateClick(page);
    await locator.click();
  },

  /**
   * Fill input with optional cursor animation and human-like typing
   */
  fill: async (page: Page, locator: Locator, value: string) => {
    if (!SHOW_CURSOR) {
      await locator.fill(value);
      return;
    }
    await animateCursorTo(page, locator);
    await animateClick(page);
    await locator.click();
    await page.keyboard.press("Meta+A");
    await page.keyboard.press("Backspace");
    // Use Playwright's built-in delay - no loop overhead
    await locator.pressSequentially(value, { delay: TYPE_DELAY });
  },

  /**
   * Hover with optional cursor animation
   */
  hover: async (page: Page, locator: Locator) => {
    if (!SHOW_CURSOR) {
      await locator.hover();
      return;
    }
    await animateCursorTo(page, locator);
    await locator.hover();
  },
};

// Test fixture - just handles cursor injection on navigation
export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    if (SHOW_CURSOR) {
      page.on("load", () => injectCursor(page));
      const origGoto = page.goto.bind(page);
      page.goto = async (url, opts) => {
        const r = await origGoto(url, opts);
        await injectCursor(page);
        return r;
      };
    }
    await use(page);
  },
});

export { expect };
