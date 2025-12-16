import { test as base, expect, Locator, Page } from "@playwright/test";

const SHOW_CURSOR = process.env.SHOW_CURSOR === "true";

// Cursor injection script
const CURSOR_SCRIPT = `
(() => {
  if (window.__cursor) return;

  const svg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.85a.5.5 0 0 0-.85.36Z" fill="#000" stroke="#fff" stroke-width="1.5"/></svg>';

  const cursor = document.createElement('div');
  cursor.innerHTML = svg;
  cursor.style.cssText = 'position:fixed;top:0;left:0;width:24px;height:24px;pointer-events:none;z-index:999999;filter:drop-shadow(1px 1px 2px rgba(0,0,0,0.3));transform:translate(-100px,-100px);';
  document.body.appendChild(cursor);

  const ripple = document.createElement('div');
  ripple.style.cssText = 'position:fixed;width:40px;height:40px;border-radius:50%;background:rgba(59,130,246,0.4);pointer-events:none;z-index:999998;transform:scale(0);opacity:0;';
  document.body.appendChild(ripple);

  let x = -100, y = -100;

  window.__cursor = {
    move: async (tx, ty, ms) => {
      const sx = x, sy = y;
      const start = performance.now();
      return new Promise(r => {
        const animate = () => {
          const p = Math.min((performance.now() - start) / ms, 1);
          const e = 1 - Math.pow(1 - p, 3);
          x = sx + (tx - sx) * e;
          y = sy + (ty - sy) * e;
          cursor.style.transform = 'translate(' + x + 'px,' + y + 'px)';
          if (p < 1) requestAnimationFrame(animate);
          else { x = tx; y = ty; r(); }
        };
        animate();
      });
    },
    click: () => {
      ripple.style.left = (x - 20) + 'px';
      ripple.style.top = (y - 20) + 'px';
      ripple.style.transform = 'scale(0)';
      ripple.style.opacity = '1';
      ripple.style.transition = 'none';
      requestAnimationFrame(() => {
        ripple.style.transition = 'transform 0.25s ease-out, opacity 0.25s ease-out';
        ripple.style.transform = 'scale(1.2)';
        ripple.style.opacity = '0';
      });
    }
  };
})();
`;

async function injectCursor(page: Page) {
  try { await page.evaluate(CURSOR_SCRIPT); } catch {}
}

async function moveCursor(page: Page, x: number, y: number) {
  try {
    await page.evaluate(async ([x, y]) => {
      await (window as any).__cursor?.move(x, y, 250);
    }, [x, y] as const);
    await page.waitForTimeout(280);
  } catch {}
}

async function clickEffect(page: Page) {
  try {
    await page.evaluate(() => (window as any).__cursor?.click());
  } catch {}
}

// Store original click per locator instance
const origClicks = new WeakMap<Locator, Locator["click"]>();

function wrapLocatorClick(page: Page, locator: Locator): Locator {
  // Only wrap once
  if (origClicks.has(locator)) return locator;

  const originalClick = locator.click.bind(locator);
  origClicks.set(locator, originalClick);

  locator.click = async (options?) => {
    try {
      const box = await locator.boundingBox({ timeout: 5000 });
      if (box) {
        await moveCursor(page, box.x + box.width / 2, box.y + box.height / 2);
        await clickEffect(page);
      }
    } catch {}
    return originalClick(options);
  };

  return locator;
}

const wrappedPages = new WeakSet<Page>();

function wrapPageLocators(page: Page) {
  if (wrappedPages.has(page)) return;
  wrappedPages.add(page);

  const wrap = (fn: (...args: any[]) => Locator) => {
    return (...args: any[]) => wrapLocatorClick(page, fn(...args));
  };

  page.locator = wrap(page.locator.bind(page));
  page.getByRole = wrap(page.getByRole.bind(page));
  page.getByText = wrap(page.getByText.bind(page));
  page.getByLabel = wrap(page.getByLabel.bind(page));
  page.getByPlaceholder = wrap(page.getByPlaceholder.bind(page));
  page.getByTestId = wrap(page.getByTestId.bind(page));
}

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

      wrapPageLocators(page);
    }
    await use(page);
  },
});

export { expect };
