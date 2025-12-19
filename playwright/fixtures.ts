import { test as base, expect, Locator, Page } from "@playwright/test";

const DEBUG_VISUAL = process.env.DEBUG_VISUAL === "true";

// Timeout wrapper to prevent demo effects from hanging tests
const DEMO_TIMEOUT = 500;
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | undefined> {
  return Promise.race([
    promise,
    new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), ms)),
  ]);
}

// Enhanced visual styles for demo mode
const DEMO_STYLES = `
  @keyframes pw-glow {
    0%, 100% {
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.7),
                  0 0 25px rgba(99, 102, 241, 0.5),
                  0 0 50px rgba(99, 102, 241, 0.2);
    }
    50% {
      box-shadow: 0 0 0 5px rgba(99, 102, 241, 0.9),
                  0 0 35px rgba(99, 102, 241, 0.6),
                  0 0 70px rgba(99, 102, 241, 0.3);
    }
  }

  @keyframes pw-success {
    0% { box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.8), 0 0 30px rgba(34, 197, 94, 0.6); }
    100% { box-shadow: 0 0 0 0 transparent, 0 0 0 transparent; }
  }

  .pw-highlight {
    position: relative;
    z-index: 10000;
    outline: none !important;
    animation: pw-glow 0.8s ease-in-out infinite !important;
    border-radius: 6px !important;
  }

  .pw-success {
    animation: pw-success 0.5s ease-out forwards !important;
  }

  .pw-action-banner {
    position: fixed;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: #f1f5f9;
    padding: 10px 20px;
    border-radius: 10px;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
    font-size: 13px;
    font-weight: 500;
    z-index: 999998;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4),
                0 0 0 1px rgba(255, 255, 255, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    gap: 10px;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .pw-action-banner.visible {
    opacity: 1;
  }

  .pw-action-banner::before {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 8px rgba(34, 197, 94, 0.8);
    animation: pw-pulse 1s ease-in-out infinite;
  }

  @keyframes pw-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .pw-action-icon {
    font-size: 14px;
  }
`;

const DEMO_INIT_SCRIPT = `
(() => {
  if (window.__pwDemo) return;

  // Create action banner
  const banner = document.createElement('div');
  banner.className = 'pw-action-banner';
  banner.id = 'pw-action-banner';
  document.body.appendChild(banner);

  window.__pwDemo = {
    showAction: (icon, text) => {
      banner.innerHTML = '<span class="pw-action-icon">' + icon + '</span>' + text;
      banner.classList.add('visible');
    },
    hideAction: () => {
      banner.classList.remove('visible');
    },
    highlight: (el) => {
      el.classList.add('pw-highlight');
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    },
    unhighlight: (el) => {
      el.classList.remove('pw-highlight');
    },
    success: (el) => {
      el.classList.remove('pw-highlight');
      el.classList.add('pw-success');
      setTimeout(() => el.classList.remove('pw-success'), 500);
    }
  };
})();
`;

// Cursor injection script
const CURSOR_SCRIPT = `
(() => {
  if (window.__cursor) return;

  const cursor = document.createElement('div');
  cursor.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.85a.5.5 0 0 0-.85.36Z" fill="#000" stroke="#fff" stroke-width="1.5"/></svg>';
  cursor.style.cssText = 'position:fixed;top:0;left:0;width:24px;height:24px;pointer-events:none;z-index:999999;filter:drop-shadow(2px 2px 4px rgba(0,0,0,0.4));';
  document.body.appendChild(cursor);

  const ripple = document.createElement('div');
  ripple.style.cssText = 'position:fixed;width:60px;height:60px;border-radius:50%;background:radial-gradient(circle,rgba(59,130,246,0.6) 0%,rgba(59,130,246,0) 70%);pointer-events:none;z-index:2147483647;transform:scale(0.01);opacity:0;';
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
      // Ripple effect - use scale(0.01) not scale(0) for proper CSS transition
      ripple.style.left = (x - 30) + 'px';
      ripple.style.top = (y - 30) + 'px';
      ripple.style.transition = 'none';
      ripple.style.transform = 'scale(0.01)';
      ripple.style.opacity = '1';
      // Force reflow to ensure transition works
      ripple.offsetWidth;
      ripple.style.transition = 'transform 0.4s ease-out, opacity 0.4s ease-out';
      ripple.style.transform = 'scale(2.5)';
      ripple.style.opacity = '0';

      // Cursor bounce/squeeze effect
      const bounceStart = performance.now();
      function bounce() {
        const elapsed = performance.now() - bounceStart;
        const p = Math.min(elapsed / 150, 1);
        // Squeeze down then spring back
        const scaleX = 1 + Math.sin(p * Math.PI) * 0.15;
        const scaleY = 1 - Math.sin(p * Math.PI) * 0.2;
        const offsetY = Math.sin(p * Math.PI) * 3;
        cursor.style.transform = 'translate(' + x + 'px,' + (y + offsetY) + 'px) scale(' + scaleX + ',' + scaleY + ')';
        if (p < 1) requestAnimationFrame(bounce);
        else cursor.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      }
      requestAnimationFrame(bounce);
    }
  };
})();
`;

async function injectCursor(page: Page) {
  if (!DEBUG_VISUAL) return;
  try {
    await withTimeout(page.addStyleTag({ content: DEMO_STYLES }), DEMO_TIMEOUT);
    await withTimeout(page.evaluate(CURSOR_SCRIPT), DEMO_TIMEOUT);
    await withTimeout(page.evaluate(DEMO_INIT_SCRIPT), DEMO_TIMEOUT);
  } catch {}
}

async function animateCursorTo(page: Page, locator: Locator) {
  if (!DEBUG_VISUAL) return;
  try {
    const box = await locator.boundingBox({ timeout: DEMO_TIMEOUT });
    if (box) {
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      await Promise.race([
        page.evaluate(
          async (coords: [number, number]) => {
            await (window as any).__cursor?.move(coords[0], coords[1], 200);
          },
          [x, y] as [number, number]
        ),
        new Promise((resolve) => setTimeout(resolve, DEMO_TIMEOUT)),
      ]);
      await page.waitForTimeout(220);
    }
  } catch {}
}

async function animateClick(page: Page) {
  if (!DEBUG_VISUAL) return;
  try {
    await withTimeout(
      page.evaluate(() => (window as any).__cursor?.click()),
      DEMO_TIMEOUT
    );
    await page.waitForTimeout(50);
  } catch {}
}

// Use Playwright's built-in delay - much more efficient than manual loops
const TYPE_DELAY = 10; // ms per character when DEBUG_VISUAL is on

// Helper to get a readable label for an element
async function getElementLabel(locator: Locator): Promise<string> {
  try {
    const text = await withTimeout(
      locator.evaluate((el: Element) => {
        // Try various ways to get a meaningful label
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          return el.placeholder || el.name || el.id || el.type || "input";
        }
        if (el instanceof HTMLButtonElement) {
          return el.textContent?.trim().slice(0, 30) || "button";
        }
        const ariaLabel = el.getAttribute("aria-label");
        if (ariaLabel) return ariaLabel.slice(0, 30);
        const text = el.textContent?.trim();
        if (text) return text.slice(0, 30);
        return el.tagName.toLowerCase();
      }),
      DEMO_TIMEOUT
    );
    return typeof text === "string" ? text : "element";
  } catch {
    return "element";
  }
}

// Show action banner
async function showAction(page: Page, icon: string, text: string) {
  if (!DEBUG_VISUAL) return;
  try {
    await withTimeout(
      page.evaluate(
        ([i, t]: [string, string]) => (window as any).__pwDemo?.showAction(i, t),
        [icon, text] as [string, string]
      ),
      DEMO_TIMEOUT
    );
  } catch {}
}

// Hide action banner
async function hideAction(page: Page) {
  if (!DEBUG_VISUAL) return;
  try {
    await withTimeout(
      page.evaluate(() => (window as any).__pwDemo?.hideAction()),
      DEMO_TIMEOUT
    );
  } catch {}
}

// Highlight element
async function highlightElement(page: Page, locator: Locator) {
  if (!DEBUG_VISUAL) return;
  try {
    await withTimeout(
      locator.evaluate((el: Element) => (window as any).__pwDemo?.highlight(el)),
      DEMO_TIMEOUT
    );
  } catch {}
}

// Success flash on element
async function successElement(page: Page, locator: Locator) {
  if (!DEBUG_VISUAL) return;
  try {
    await withTimeout(
      locator.evaluate((el: Element) => (window as any).__pwDemo?.success(el)),
      DEMO_TIMEOUT
    );
  } catch {}
}

/**
 * Cursor interaction helpers.
 * When DEBUG_VISUAL=true: animates cursor before action with visual feedback
 * When DEBUG_VISUAL=false: just performs the action directly
 */
export const cursor = {
  /**
   * Click with optional cursor animation and element highlighting
   */
  click: async (page: Page, locator: Locator) => {
    if (!DEBUG_VISUAL) {
      await locator.click();
      return;
    }
    const label = await getElementLabel(locator);
    await showAction(page, "👆", `Click "${label}"`);
    await highlightElement(page, locator);
    await animateCursorTo(page, locator);
    await animateClick(page);
    await locator.click();
    await successElement(page, locator);
    await page.waitForTimeout(100);
    await hideAction(page);
  },

  /**
   * Fill input with optional cursor animation, highlighting, and human-like typing
   */
  fill: async (page: Page, locator: Locator, value: string) => {
    if (!DEBUG_VISUAL) {
      await locator.fill(value);
      return;
    }
    const label = await getElementLabel(locator);
    const displayValue = value.length > 25 ? value.slice(0, 25) + "…" : value;
    await showAction(page, "⌨️", `Type in ${label}: "${displayValue}"`);
    await highlightElement(page, locator);
    await animateCursorTo(page, locator);
    await animateClick(page);
    await locator.click();
    await page.keyboard.press("Meta+A");
    await page.keyboard.press("Backspace");
    // Use Playwright's built-in delay - no loop overhead
    await locator.pressSequentially(value, { delay: TYPE_DELAY });
    await successElement(page, locator);
    await page.waitForTimeout(100);
    await hideAction(page);
  },

  /**
   * Hover with optional cursor animation
   */
  hover: async (page: Page, locator: Locator) => {
    if (!DEBUG_VISUAL) {
      await locator.hover();
      return;
    }
    const label = await getElementLabel(locator);
    await showAction(page, "👀", `Hover "${label}"`);
    await highlightElement(page, locator);
    await animateCursorTo(page, locator);
    await locator.hover();
    await page.waitForTimeout(200);
    await successElement(page, locator);
    await hideAction(page);
  },
};

// Test fixture - just handles cursor injection on navigation
export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    if (DEBUG_VISUAL) {
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
