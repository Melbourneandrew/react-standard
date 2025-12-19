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

// Enhanced visual styles for demo mode - cohesive blue/cyan theme
const DEMO_STYLES = `
  /* Highlight glow - cyan/teal theme */
  @keyframes pw-glow {
    0%, 100% {
      box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.7),
                  0 0 20px rgba(6, 182, 212, 0.4),
                  0 0 40px rgba(6, 182, 212, 0.2);
    }
    50% {
      box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.9),
                  0 0 30px rgba(6, 182, 212, 0.5),
                  0 0 60px rgba(6, 182, 212, 0.3);
    }
  }

  /* Action complete flash - green */
  @keyframes pw-complete {
    0% { box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.9), 0 0 25px rgba(34, 197, 94, 0.6); }
    100% { box-shadow: 0 0 0 0 transparent, 0 0 0 transparent; }
  }

  /*
   * Highlight styles applied to page elements - kept minimal to avoid interference.
   * Only uses box-shadow which is purely visual and doesn't affect layout.
   * No z-index changes, no outline changes, no position changes.
   */
  .pw-highlight {
    box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.7), 0 0 20px rgba(6, 182, 212, 0.4) !important;
  }

  .pw-success {
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.8), 0 0 15px rgba(34, 197, 94, 0.5) !important;
  }

  /* Action banner - karaoke style with history */
  .pw-action-banner {
    position: fixed;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: #e2e8f0;
    padding: 14px 20px;
    border-radius: 12px;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
    font-size: 13px;
    font-weight: 500;
    z-index: 999998;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5),
                0 0 0 1px rgba(6, 182, 212, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(16px);
    display: flex;
    flex-direction: column;
    gap: 6px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease;
    width: 320px;
  }

  .pw-action-banner.visible {
    opacity: 1;
  }

  /* Completed action row */
  .pw-action-row {
    display: flex;
    align-items: center;
    gap: 10px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .pw-action-row.completed {
    opacity: 0.5;
    font-size: 12px;
  }

  .pw-action-row.current {
    opacity: 1;
    color: #22d3ee;
  }

  /* Status indicators */
  .pw-action-status {
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .pw-action-status.done {
    color: #22c55e;
  }

  .pw-action-status.active {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #06b6d4;
    box-shadow: 0 0 10px rgba(6, 182, 212, 0.8);
    animation: pw-dot-pulse 1s ease-in-out infinite;
    margin: 0 4px;
  }

  @keyframes pw-dot-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(0.8); }
  }

  .pw-action-text {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Test result overlay - subtle and professional */
  .pw-result-overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999999;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.25s ease;
  }

  .pw-result-overlay.visible {
    opacity: 1;
  }

  .pw-result-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: pw-result-fade 0.3s ease-out forwards;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }

  .pw-result-icon.pass {
    background: #22c55e;
    box-shadow: 0 8px 32px rgba(34, 197, 94, 0.35);
  }

  .pw-result-icon.fail {
    background: #ef4444;
    box-shadow: 0 8px 32px rgba(239, 68, 68, 0.35);
  }

  .pw-result-icon svg {
    width: 40px;
    height: 40px;
    stroke: white;
    stroke-width: 3;
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .pw-result-icon.pass svg {
    stroke-dasharray: 100;
    stroke-dashoffset: 100;
    animation: pw-checkmark 0.35s ease-out 0.1s forwards;
  }

  .pw-result-icon.fail svg {
    stroke-dasharray: 100;
    stroke-dashoffset: 100;
    animation: pw-xmark 0.25s ease-out 0.1s forwards;
  }

  @keyframes pw-result-fade {
    0% { transform: scale(0.8); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }

  @keyframes pw-checkmark {
    to { stroke-dashoffset: 0; }
  }

  @keyframes pw-xmark {
    to { stroke-dashoffset: 0; }
  }
`;

const DEMO_INIT_SCRIPT = `
(() => {
  if (window.__pwDemo) return;

  // Track action history for karaoke display
  const actionHistory = [];
  const MAX_HISTORY = 3;

  // Create action banner - fully inert to avoid interfering with tests
  const banner = document.createElement('div');
  banner.className = 'pw-action-banner';
  banner.id = 'pw-action-banner';
  banner.setAttribute('aria-hidden', 'true');
  banner.setAttribute('inert', '');
  banner.setAttribute('data-pw-internal', 'true');
  document.body.appendChild(banner);

  // Create result overlay - fully inert to avoid interfering with tests
  const overlay = document.createElement('div');
  overlay.className = 'pw-result-overlay';
  overlay.id = 'pw-result-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.setAttribute('inert', '');
  overlay.setAttribute('data-pw-internal', 'true');
  document.body.appendChild(overlay);

  // Render the action list
  function renderActions(currentIcon, currentText) {
    let html = '';

    // Show completed actions (last few)
    const historyToShow = actionHistory.slice(-MAX_HISTORY);
    for (const action of historyToShow) {
      html += '<div class="pw-action-row completed">' +
        '<span class="pw-action-status done">✓</span>' +
        '<span class="pw-action-text">' + action + '</span>' +
      '</div>';
    }

    // Show current action
    if (currentText) {
      html += '<div class="pw-action-row current">' +
        '<span class="pw-action-status active"></span>' +
        '<span class="pw-action-text">' + currentIcon + ' ' + currentText + '</span>' +
      '</div>';
    }

    banner.innerHTML = html;
  }

  window.__pwDemo = {
    showAction: (icon, text) => {
      renderActions(icon, text);
      banner.classList.add('visible');
    },
    completeAction: (text) => {
      // Add to history when action completes
      actionHistory.push(text);
      // Keep history bounded
      if (actionHistory.length > MAX_HISTORY + 2) {
        actionHistory.shift();
      }
    },
    hideAction: () => {
      banner.classList.remove('visible');
    },
    clearHistory: () => {
      actionHistory.length = 0;
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
    },
    showResult: (passed) => {
      // Hide action banner
      banner.classList.remove('visible');

      // Checkmark SVG for pass, X for fail
      const checkSvg = '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      const xSvg = '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

      overlay.innerHTML = '<div class="pw-result-icon ' + (passed ? 'pass' : 'fail') + '">' + (passed ? checkSvg : xSvg) + '</div>';
      overlay.classList.add('visible');
    },
    hideResult: () => {
      overlay.classList.remove('visible');
    }
  };
})();
`;

// Cursor injection script
const CURSOR_SCRIPT = `
(() => {
  if (window.__cursor) return;

  // Cursor element - fully inert to avoid interfering with tests
  const cursor = document.createElement('div');
  cursor.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.85a.5.5 0 0 0-.85.36Z" fill="#000" stroke="#fff" stroke-width="1.5"/></svg>';
  cursor.style.cssText = 'position:fixed;top:0;left:0;width:24px;height:24px;pointer-events:none;z-index:999999;filter:drop-shadow(2px 2px 4px rgba(0,0,0,0.4));';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.setAttribute('inert', '');
  cursor.setAttribute('data-pw-internal', 'true');
  document.body.appendChild(cursor);

  const ripple = document.createElement('div');
  ripple.style.cssText = 'position:fixed;width:60px;height:60px;border-radius:50%;background:radial-gradient(circle,rgba(6,182,212,0.7) 0%,rgba(6,182,212,0) 70%);pointer-events:none;z-index:2147483647;transform:scale(0.01);opacity:0;';
  ripple.setAttribute('aria-hidden', 'true');
  ripple.setAttribute('inert', '');
  ripple.setAttribute('data-pw-internal', 'true');
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

// Complete and hide action banner (adds to history)
async function completeAction(page: Page, actionText: string) {
  if (!DEBUG_VISUAL) return;
  try {
    await withTimeout(
      page.evaluate((text: string) => (window as any).__pwDemo?.completeAction(text), actionText),
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
    const actionText = `Click "${label}"`;
    await showAction(page, "👆", actionText);
    await highlightElement(page, locator);
    await animateCursorTo(page, locator);
    await animateClick(page);
    await locator.click();
    await successElement(page, locator);
    await completeAction(page, actionText);
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
    const actionText = `Type "${displayValue}"`;
    await showAction(page, "⌨️", actionText);
    await highlightElement(page, locator);
    await animateCursorTo(page, locator);
    await animateClick(page);
    await locator.click();
    await page.keyboard.press("Meta+A");
    await page.keyboard.press("Backspace");
    // Use Playwright's built-in delay - no loop overhead
    await locator.pressSequentially(value, { delay: TYPE_DELAY });
    await successElement(page, locator);
    await completeAction(page, actionText);
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
    const actionText = `Hover "${label}"`;
    await showAction(page, "👀", actionText);
    await highlightElement(page, locator);
    await animateCursorTo(page, locator);
    await locator.hover();
    await page.waitForTimeout(200);
    await successElement(page, locator);
    await completeAction(page, actionText);
    await hideAction(page);
  },
};

// Show test result overlay
async function showTestResult(page: Page, passed: boolean) {
  if (!DEBUG_VISUAL) return;
  try {
    await withTimeout(
      page.evaluate((p: boolean) => (window as any).__pwDemo?.showResult(p), passed),
      DEMO_TIMEOUT
    );
    // Hold the result on screen
    await page.waitForTimeout(passed ? 800 : 1200);
  } catch {}
}

// Test fixture - handles cursor injection and result overlay
export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use, testInfo) => {
    if (DEBUG_VISUAL) {
      page.on("load", () => injectCursor(page));
      const origGoto = page.goto.bind(page);
      page.goto = async (url, opts) => {
        const r = await origGoto(url, opts);
        await injectCursor(page);
        return r;
      };
    }

    // Run the test
    await use(page);

    // Show pass/fail result overlay
    if (DEBUG_VISUAL) {
      const passed = testInfo.status === "passed" || testInfo.status === "skipped";
      await showTestResult(page, passed);
    }
  },
});

export { expect };
