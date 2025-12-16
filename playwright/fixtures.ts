import { test as base, Page } from "@playwright/test";

// Cursor visualization script
const CURSOR_SCRIPT = `
  (function() {
    if (document.getElementById('pw-cursor')) return;

    const cursor = document.createElement('div');
    cursor.id = 'pw-cursor';
    cursor.style.cssText = \`
      position: fixed;
      width: 24px;
      height: 24px;
      background: radial-gradient(circle, rgba(255,50,50,1) 0%, rgba(255,50,50,0.8) 40%, rgba(255,50,50,0) 70%);
      border-radius: 50%;
      pointer-events: none;
      z-index: 2147483647;
      transform: translate(-50%, -50%);
      transition: left 0.15s ease-out, top 0.15s ease-out, transform 0.1s, opacity 0.1s;
      box-shadow: 0 0 0 3px white, 0 0 0 5px rgba(255, 50, 50, 0.5), 0 0 20px rgba(255, 50, 50, 0.5);
      left: -100px;
      top: -100px;
    \`;

    // Add click ripple element
    const ripple = document.createElement('div');
    ripple.id = 'pw-cursor-ripple';
    ripple.style.cssText = \`
      position: fixed;
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255, 50, 50, 0.8);
      border-radius: 50%;
      pointer-events: none;
      z-index: 2147483646;
      transform: translate(-50%, -50%) scale(0);
      opacity: 0;
      left: -100px;
      top: -100px;
    \`;

    document.documentElement.appendChild(cursor);
    document.documentElement.appendChild(ripple);

    // Expose function to move cursor from Playwright
    window.__pwMoveCursor = (x, y) => {
      cursor.style.left = x + 'px';
      cursor.style.top = y + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
    };

    window.__pwClickCursor = (x, y) => {
      cursor.style.left = x + 'px';
      cursor.style.top = y + 'px';
      cursor.style.transform = 'translate(-50%, -50%) scale(0.7)';

      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.style.transform = 'translate(-50%, -50%) scale(0)';
      ripple.style.opacity = '1';

      // Animate ripple
      requestAnimationFrame(() => {
        ripple.style.transition = 'transform 0.4s ease-out, opacity 0.4s ease-out';
        ripple.style.transform = 'translate(-50%, -50%) scale(2)';
        ripple.style.opacity = '0';
      });

      setTimeout(() => {
        cursor.style.transform = 'translate(-50%, -50%) scale(1)';
        ripple.style.transition = 'none';
      }, 150);
    };
  })();
`;

// Wrap page with cursor visualization
function wrapPageWithCursor(page: Page): Page {
  const originalClick = page.click.bind(page);
  const originalFill = page.fill.bind(page);
  const originalHover = page.hover.bind(page);

  // Helper to get element center coordinates
  async function getElementCenter(selector: string) {
    try {
      const box = await page.locator(selector).first().boundingBox();
      if (box) {
        return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      }
    } catch {
      // Ignore errors
    }
    return null;
  }

  // Helper to move cursor with animation
  async function moveCursor(x: number, y: number) {
    await page.evaluate(
      ([x, y]) => {
        if (typeof (window as any).__pwMoveCursor === "function") {
          (window as any).__pwMoveCursor(x, y);
        }
      },
      [x, y],
    );
    await page.waitForTimeout(200); // Let CSS transition animate
  }

  // Helper to show click effect
  async function showClick(x: number, y: number) {
    await page.evaluate(
      ([x, y]) => {
        if (typeof (window as any).__pwClickCursor === "function") {
          (window as any).__pwClickCursor(x, y);
        }
      },
      [x, y],
    );
    await page.waitForTimeout(100);
  }

  // Override click
  page.click = async (selector, options) => {
    const pos = await getElementCenter(selector);
    if (pos) {
      await moveCursor(pos.x, pos.y);
      await showClick(pos.x, pos.y);
    }
    return originalClick(selector, options);
  };

  // Override hover
  page.hover = async (selector, options) => {
    const pos = await getElementCenter(selector);
    if (pos) {
      await moveCursor(pos.x, pos.y);
    }
    return originalHover(selector, options);
  };

  // Override fill (moves to input first)
  page.fill = async (selector, value, options) => {
    const pos = await getElementCenter(selector);
    if (pos) {
      await moveCursor(pos.x, pos.y);
      await showClick(pos.x, pos.y);
    }
    return originalFill(selector, value, options);
  };

  return page;
}

// Extended test fixture with cursor visualization
export const test = base.extend({
  page: async ({ page }, use) => {
    if (process.env.SHOW_CURSOR === "true") {
      // Inject cursor script on every navigation
      await page.addInitScript(CURSOR_SCRIPT);

      // Also inject immediately for current page
      await page.evaluate(CURSOR_SCRIPT).catch(() => {});

      // Wrap page methods to show cursor
      const wrappedPage = wrapPageWithCursor(page);
      await use(wrappedPage);
    } else {
      await use(page);
    }
  },
});

export { expect } from "@playwright/test";
