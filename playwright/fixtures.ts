import { test as base, expect, Locator, Page } from "@playwright/test";

const SHOW_CURSOR = process.env.SHOW_CURSOR === "true";

// Very fast typing (avg ~8ms per char = 125 chars/sec)
function charDelay(): number {
  return 5 + Math.floor(Math.random() * 6); // 5-10ms
}

// Cursor injection with arc movement and prominent ripple
const CURSOR_SCRIPT = `
(() => {
  if (window.__cursor) return;

  const cursor = document.createElement('div');
  cursor.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.85a.5.5 0 0 0-.85.36Z" fill="#000" stroke="#fff" stroke-width="1.5"/></svg>';
  cursor.style.cssText = 'position:fixed;top:0;left:0;width:24px;height:24px;pointer-events:none;z-index:999999;filter:drop-shadow(2px 2px 4px rgba(0,0,0,0.4));';
  document.body.appendChild(cursor);

  // Bigger, more visible ripple
  const ripple = document.createElement('div');
  ripple.style.cssText = 'position:fixed;width:60px;height:60px;border-radius:50%;background:radial-gradient(circle,rgba(59,130,246,0.6) 0%,rgba(59,130,246,0) 70%);pointer-events:none;z-index:999998;transform:scale(0);opacity:0;';
  document.body.appendChild(ripple);

  let x = -100, y = -100;
  cursor.style.transform = 'translate(' + x + 'px,' + y + 'px)';

  window.__cursor = {
    // Arc movement - curves slightly perpendicular to travel direction
    move: (tx, ty, ms) => {
      return new Promise(resolve => {
        const sx = x, sy = y;
        const dx = tx - sx, dy = ty - sy;
        const dist = Math.sqrt(dx*dx + dy*dy);

        // Arc height proportional to distance (max 20px)
        const arcHeight = Math.min(dist * 0.08, 20);
        // Perpendicular direction for arc
        const perpX = dist > 0 ? -dy / dist : 0;
        const perpY = dist > 0 ? dx / dist : 0;

        const start = performance.now();

        function animate() {
          const elapsed = performance.now() - start;
          const p = Math.min(elapsed / ms, 1);

          // Ease out cubic
          const ease = 1 - Math.pow(1 - p, 3);

          // Arc offset peaks at middle of animation
          const arcOffset = Math.sin(p * Math.PI) * arcHeight;

          x = sx + dx * ease + perpX * arcOffset;
          y = sy + dy * ease + perpY * arcOffset;

          cursor.style.transform = 'translate(' + x + 'px,' + y + 'px)';

          if (p < 1) {
            requestAnimationFrame(animate);
          } else {
            x = tx; y = ty;
            cursor.style.transform = 'translate(' + tx + 'px,' + ty + 'px)';
            resolve();
          }
        }
        requestAnimationFrame(animate);
      });
    },

    // Click ripple with cursor bounce
    click: () => {
      // Position ripple
      ripple.style.left = (x - 30) + 'px';
      ripple.style.top = (y - 30) + 'px';
      ripple.style.transform = 'scale(0)';
      ripple.style.opacity = '1';
      ripple.style.transition = 'none';

      // Animate ripple
      requestAnimationFrame(() => {
        ripple.style.transition = 'transform 0.35s ease-out, opacity 0.35s ease-out';
        ripple.style.transform = 'scale(2)';
        ripple.style.opacity = '0';
      });

      // Cursor bounce effect
      const startY = y;
      const bounceStart = performance.now();
      function bounce() {
        const elapsed = performance.now() - bounceStart;
        const p = Math.min(elapsed / 150, 1);
        const offset = Math.sin(p * Math.PI) * 4;
        cursor.style.transform = 'translate(' + x + 'px,' + (startY + offset) + 'px)';
        if (p < 1) requestAnimationFrame(bounce);
      }
      requestAnimationFrame(bounce);
    }
  };
})();
`;

async function injectCursor(page: Page) {
  try {
    await page.evaluate(CURSOR_SCRIPT);
  } catch {}
}

async function moveCursor(page: Page, x: number, y: number, duration = 200) {
  try {
    await page.evaluate(
      async ([x, y, ms]) => {
        await (window as any).__cursor?.move(x, y, ms);
      },
      [x, y, duration] as const
    );
    await page.waitForTimeout(duration + 30);
  } catch {}
}

async function clickEffect(page: Page) {
  try {
    await page.evaluate(() => (window as any).__cursor?.click());
    await page.waitForTimeout(50);
  } catch {}
}

async function humanType(page: Page, text: string) {
  for (const char of text) {
    await page.keyboard.type(char, { delay: 0 });
    await page.waitForTimeout(charDelay());
  }
}

// Track wrapped locators
const wrappedLocators = new WeakSet<Locator>();

function wrapLocator(page: Page, locator: Locator): Locator {
  if (wrappedLocators.has(locator)) return locator;
  wrappedLocators.add(locator);

  const origClick = locator.click.bind(locator);
  const origFill = locator.fill.bind(locator);
  const origFirst = locator.first.bind(locator);
  const origLast = locator.last.bind(locator);
  const origNth = locator.nth.bind(locator);
  const origLocator = locator.locator.bind(locator);

  // Wrap click with cursor animation
  locator.click = async (options?) => {
    try {
      const box = await locator.boundingBox({ timeout: 5000 });
      if (box) {
        await moveCursor(page, box.x + box.width / 2, box.y + box.height / 2);
        await clickEffect(page);
      }
    } catch {}
    return origClick(options);
  };

  // Wrap fill with cursor animation + human typing
  locator.fill = async (value: string, options?) => {
    try {
      const box = await locator.boundingBox({ timeout: 5000 });
      if (box) {
        await moveCursor(page, box.x + box.width / 2, box.y + box.height / 2);
        await clickEffect(page);
      }
    } catch {}
    await origClick();
    await page.keyboard.press("Meta+A");
    await page.keyboard.press("Backspace");
    await humanType(page, value);
  };

  // Wrap chained locator methods so they return wrapped locators
  locator.first = () => wrapLocator(page, origFirst());
  locator.last = () => wrapLocator(page, origLast());
  locator.nth = (index: number) => wrapLocator(page, origNth(index));
  locator.locator = (selector: string) => wrapLocator(page, origLocator(selector));

  return locator;
}

const wrappedPages = new WeakSet<Page>();

function wrapPageLocators(page: Page) {
  if (wrappedPages.has(page)) return;
  wrappedPages.add(page);

  const wrap = (fn: (...args: any[]) => Locator) => {
    return (...args: any[]) => wrapLocator(page, fn(...args));
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
