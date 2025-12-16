import { test as base, Locator, Page } from "@playwright/test";

// Cursor injection script (adapted from e2e/lib/cursor.py)
const CURSOR_INJECTION_SCRIPT = `
(() => {
    if (window.__demoCursor) return;

    // SVG cursors for different contexts
    const CURSOR_SVGS = {
        default: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.85a.5.5 0 0 0-.85.36Z" fill="#000" stroke="#fff" stroke-width="1.5"/></svg>',
        pointer: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 5C11 5 10 6 10 7V15L8 13C7 12 5.5 12.5 5.5 14C5.5 15 7 17 8.5 18.5C10 20 11.5 21 14 21C16.5 21 18.5 19 19 17C19.5 15 19.5 13 19.5 11V8C19.5 7 18.5 6 17.5 6C16.5 6 15.5 7 15.5 8V7C15.5 6 14.5 5 13.5 5C12.5 5 12 5.5 12 6V5Z" fill="#fff" stroke="#000" stroke-width="1.2"/></svg>',
        text: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="10" y="4" width="4" height="16" rx="1" fill="#fff"/><path d="M12 4V20M8 4H16M8 20H16" stroke="#000" stroke-width="2" stroke-linecap="round"/></svg>',
    };

    // Create cursor container
    const cursor = document.createElement('div');
    cursor.id = 'demo-cursor';
    cursor.innerHTML = CURSOR_SVGS.default;
    cursor.style.cssText = \`
        position: fixed;
        top: 0;
        left: 0;
        width: 24px;
        height: 24px;
        pointer-events: none;
        z-index: 999999;
        filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.3));
    \`;
    document.body.appendChild(cursor);

    // Create click ripple element
    const ripple = document.createElement('div');
    ripple.id = 'demo-cursor-ripple';
    ripple.style.cssText = \`
        position: fixed;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(59, 130, 246, 0.4);
        pointer-events: none;
        z-index: 999998;
        transform: scale(0);
        opacity: 0;
    \`;
    document.body.appendChild(ripple);

    // Current cursor state
    let currentX = window.innerWidth + 50;
    let currentY = window.innerHeight + 50;
    let currentType = 'default';
    cursor.style.transform = \`translate(\${currentX}px, \${currentY}px)\`;

    // Helper: detect cursor type for an element
    function getCursorTypeForElement(el) {
        if (!el) return 'default';

        const tag = (el.tagName || '').toLowerCase();
        const role = el.getAttribute && el.getAttribute('role');
        const type = el.getAttribute && el.getAttribute('type');

        // Text input contexts
        if (tag === 'input' && ['text', 'email', 'password', 'search', 'tel', 'url', 'number'].includes(type)) {
            return 'text';
        }
        if (tag === 'textarea') return 'text';
        if (el.contentEditable === 'true' || el.isContentEditable) return 'text';

        // Clickable contexts
        if (tag === 'button' || tag === 'a') return 'pointer';
        if (role === 'button' || role === 'link') return 'pointer';

        // Check computed cursor style
        try {
            if (getComputedStyle(el).cursor === 'pointer') return 'pointer';
        } catch (e) {}

        // Check parent (e.g., span inside button)
        if (el.parentElement) {
            const parentTag = (el.parentElement.tagName || '').toLowerCase();
            if (parentTag === 'button' || parentTag === 'a') return 'pointer';
        }

        return 'default';
    }

    // Helper: set cursor type with bounce animation
    function setCursorType(newType) {
        if (currentType === newType || !CURSOR_SVGS[newType]) return;

        // Bounce: scale up
        cursor.style.transition = 'transform 0.075s ease-out';
        cursor.style.transform = \`translate(\${currentX}px, \${currentY}px) scale(1.3)\`;

        setTimeout(() => {
            // Swap SVG
            cursor.innerHTML = CURSOR_SVGS[newType];
            currentType = newType;

            // Bounce: scale down
            cursor.style.transform = \`translate(\${currentX}px, \${currentY}px) scale(1)\`;

            setTimeout(() => {
                cursor.style.transition = '';
            }, 75);
        }, 75);
    }

    // Store functions globally
    window.__demoCursor = {
        moveTo: (targetX, targetY, duration = 400, autoDetectType = true) => {
            return new Promise(resolve => {
                const startX = currentX;
                const startY = currentY;
                const startTime = performance.now();

                const dx = targetX - startX;
                const dy = targetY - startY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const arcHeight = Math.min(distance * 0.03, 12);
                const perpX = distance > 0 ? -dy / distance : 0;
                const perpY = distance > 0 ? dx / distance : 0;

                function animate(now) {
                    const elapsed = now - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    const arcFactor = Math.sin(progress * Math.PI) * arcHeight;

                    currentX = startX + dx * eased + perpX * arcFactor;
                    currentY = startY + dy * eased + perpY * arcFactor;
                    cursor.style.transform = \`translate(\${currentX}px, \${currentY}px)\`;

                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        currentX = targetX;
                        currentY = targetY;
                        cursor.style.transform = \`translate(\${targetX}px, \${targetY}px)\`;

                        // Auto-detect cursor type
                        if (autoDetectType) {
                            const el = document.elementFromPoint(targetX, targetY);
                            const newType = getCursorTypeForElement(el);
                            setCursorType(newType);
                        }

                        resolve();
                    }
                }
                requestAnimationFrame(animate);
            });
        },

        click: (x, y) => {
            // Ripple
            ripple.style.left = (x - 20) + 'px';
            ripple.style.top = (y - 20) + 'px';
            ripple.style.transform = 'scale(0)';
            ripple.style.opacity = '1';
            ripple.style.transition = 'none';

            requestAnimationFrame(() => {
                ripple.style.transition = 'transform 0.4s ease-out, opacity 0.4s ease-out';
                ripple.style.transform = 'scale(1.5)';
                ripple.style.opacity = '0';
            });

            // Cursor bounce
            const bounceStart = performance.now();
            function bounce(now) {
                const elapsed = now - bounceStart;
                const progress = Math.min(elapsed / 150, 1);
                const offset = Math.sin(progress * Math.PI) * 3;
                cursor.style.transform = \`translate(\${currentX}px, \${currentY + offset}px)\`;
                if (progress < 1) requestAnimationFrame(bounce);
            }
            requestAnimationFrame(bounce);
        },

        setCursorType: setCursorType,
        getCursorType: () => currentType,
        getPosition: () => ({ x: currentX, y: currentY }),
        hide: () => { cursor.style.display = 'none'; ripple.style.display = 'none'; },
        show: () => { cursor.style.display = ''; ripple.style.display = ''; }
    };
})();
`;

// Cursor helper functions
async function injectCursor(page: Page) {
  await page.evaluate(CURSOR_INJECTION_SCRIPT);
}

async function moveCursorTo(
  page: Page,
  x: number,
  y: number,
  duration: number = 300,
) {
  await page.evaluate(
    async ([x, y, duration]) => {
      await (window as any).__demoCursor?.moveTo(x, y, duration, true);
    },
    [x, y, duration] as const,
  );
  await page.waitForTimeout(duration + 50);
}

async function moveCursorToElement(
  page: Page,
  locator: Locator,
  duration: number = 300,
): Promise<{ x: number; y: number } | null> {
  const box = await locator.boundingBox();
  if (box) {
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await moveCursorTo(page, x, y, duration);
    return { x, y };
  }
  return null;
}

async function clickCursor(page: Page, x: number, y: number) {
  await page.evaluate(
    ([x, y]) => {
      (window as any).__demoCursor?.click(x, y);
    },
    [x, y] as const,
  );
}

async function clickAtElement(
  page: Page,
  locator: Locator,
  duration: number = 300,
) {
  const coords = await moveCursorToElement(page, locator, duration);
  if (coords) {
    await clickCursor(page, coords.x, coords.y);
    await page.waitForTimeout(100);
    await locator.click();
  }
}

// Extended page with cursor methods
interface CursorPage extends Page {
  cursor: {
    inject: () => Promise<void>;
    moveTo: (x: number, y: number, duration?: number) => Promise<void>;
    moveToElement: (
      locator: Locator,
      duration?: number,
    ) => Promise<{ x: number; y: number } | null>;
    click: (x: number, y: number) => Promise<void>;
    clickElement: (locator: Locator, duration?: number) => Promise<void>;
  };
}

// Extended test fixture with cursor visualization
export const test = base.extend<{ page: CursorPage }>({
  page: async ({ page }, use) => {
    const showCursor = process.env.SHOW_CURSOR === "true";

    // Add cursor methods to page
    const cursorPage = page as CursorPage;
    cursorPage.cursor = {
      inject: () => injectCursor(page),
      moveTo: (x, y, duration) => moveCursorTo(page, x, y, duration),
      moveToElement: (locator, duration) =>
        moveCursorToElement(page, locator, duration),
      click: (x, y) => clickCursor(page, x, y),
      clickElement: (locator, duration) =>
        clickAtElement(page, locator, duration),
    };

    if (showCursor) {
      // Auto-inject cursor after each navigation
      page.on("load", async () => {
        try {
          await injectCursor(page);
        } catch {
          // Ignore injection errors (e.g., on external pages)
        }
      });

      // Also inject on the first page
      const originalGoto = page.goto.bind(page);
      page.goto = async (url, options) => {
        const result = await originalGoto(url, options);
        await injectCursor(page);
        return result;
      };
    }

    await use(cursorPage);
  },
});

export { expect } from "@playwright/test";

// Export cursor helpers for direct use
export { clickAtElement, injectCursor, moveCursorTo, moveCursorToElement };
