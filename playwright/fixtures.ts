import { test as base, expect, Locator, Page } from "@playwright/test";

const DEBUG_VISUAL = process.env.DEBUG_VISUAL === "true";
const GRID_MODE = parseInt(process.env.GRID_WORKERS || "0", 10) > 1;
const SLOW_MO = parseInt(process.env.SLOW_MO || "0", 10);
const FAST_MODE = process.env.FAST_MODE === "true";

// In grid mode, hide the story and action panels (too much visual noise)
const SHOW_PANELS = DEBUG_VISUAL && !GRID_MODE;

// Timing multiplier: FAST_MODE=0.3x, SLOW_MO=3x, normal=1x
const TIMING_MULTIPLIER = FAST_MODE ? 0.3 : SLOW_MO > 0 ? Math.max(1, SLOW_MO / 200) : 1;

// Focus toggle only in slow mode - dims page when reading story, hides story when acting
const FOCUS_TOGGLE = SLOW_MO > 0 && SHOW_PANELS;

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
  /* Hide Next.js dev mode indicator */
  [data-nextjs-dialog-overlay],
  [data-nextjs-dialog],
  nextjs-portal,
  #__next-build-indicator,
  [data-nextjs-toast],
  [class*="nextjs-toast"] {
    display: none !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }

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

  /*
   * Highlight styles applied to page elements - kept minimal to avoid interference.
   * Only uses box-shadow which is purely visual and doesn't affect layout.
   * No z-index changes, no outline changes, no position changes.
   */
  .pw-highlight {
    box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.7), 0 0 20px rgba(6, 182, 212, 0.4) !important;
  }

  /* Action banner - hidden, actions now nested in story panel */
  .pw-action-banner {
    display: none !important;
  }

  @keyframes pw-dot-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(0.8); }
  }

  /* Test result overlay - fades out page content */
  .pw-result-overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999990; /* Backdrop layer - below story panel */
    pointer-events: none;
    opacity: 0;
    background: rgba(0, 0, 0, 0);
    transition: opacity 0.4s ease, background 0.4s ease;
  }

  .pw-result-overlay.visible {
    opacity: 1;
    background: rgba(0, 0, 0, 0.7);
  }

  .pw-result-icon {
    position: relative;
    z-index: 9999999;
    width: 100px;
    height: 100px;
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
    width: 50px;
    height: 50px;
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

  /* Unified Story Panel - shows BDD context with nested actions (bottom-left) */
  .pw-story-panel {
    position: fixed;
    bottom: 16px;
    left: 16px;
    width: 440px;
    max-height: 50vh;
    overflow-y: auto;
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.97) 0%, rgba(30, 41, 59, 0.97) 100%);
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 12px;
    padding: 20px 24px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 15px;
    color: #e2e8f0;
    z-index: 9999998;
    pointer-events: none;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    opacity: 0;
    transform: scale(0.98);
    transition: opacity 0.4s ease, transform 0.4s ease;
  }

  .pw-story-panel.visible {
    opacity: 1;
    transform: scale(1);
  }

  .pw-story-feature {
    font-size: 12px;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.15);
  }

  .pw-story-scenario {
    font-size: 16px;
    font-weight: 600;
    color: #f8fafc;
    margin-bottom: 14px;
  }

  .pw-story-step {
    padding: 6px 0;
    opacity: 0.35;
    transition: opacity 0.25s ease;
  }

  .pw-story-step.active {
    opacity: 1;
    font-weight: 600;
  }

  .pw-story-step.completed {
    opacity: 0.6;
  }

  .pw-step-header {
    display: flex;
    gap: 8px;
    align-items: flex-start;
  }

  .pw-story-step.completed .pw-step-keyword {
    color: #22c55e;
  }

  /* Fixed-width indicator column prevents layout shift */
  .pw-step-indicator-col {
    width: 10px;
    flex-shrink: 0;
    display: flex;
    align-items: flex-start;
    padding-top: 5px;
  }

  .pw-step-indicator {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #06b6d4;
    box-shadow: 0 0 8px rgba(6, 182, 212, 0.6);
  }

  .pw-step-keyword {
    font-weight: 600;
    width: 55px;
    flex-shrink: 0;
  }

  .pw-step-keyword.given { color: #a78bfa; }
  .pw-step-keyword.when { color: #fbbf24; }
  .pw-step-keyword.then { color: #22d3ee; }
  .pw-step-keyword.and { color: #94a3b8; }

  .pw-step-text {
    color: #cbd5e1;
  }

  /* Sub-items removed - cleaner display with just Gherkin steps */

  /* Focus toggle for slow mode */
  .pw-dim-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 9999985; /* Below story panel and cursor */
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.4s ease;
  }

  .pw-dim-overlay.visible {
    opacity: 1;
  }

  .pw-story-panel.focus-hidden {
    opacity: 0 !important;
    transform: scale(0.98) !important;
  }
`;

const DEMO_INIT_SCRIPT = `
(() => {
  if (window.__pwDemo) return;

  // Create dim overlay for slow mode focus toggle
  const dimOverlay = document.createElement('div');
  dimOverlay.className = 'pw-dim-overlay';
  dimOverlay.id = 'pw-dim-overlay';
  dimOverlay.setAttribute('aria-hidden', 'true');
  dimOverlay.setAttribute('inert', '');
  dimOverlay.setAttribute('data-pw-internal', 'true');
  document.body.appendChild(dimOverlay);

  // Create result overlay - fully inert to avoid interfering with tests
  const overlay = document.createElement('div');
  overlay.className = 'pw-result-overlay';
  overlay.id = 'pw-result-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.setAttribute('inert', '');
  overlay.setAttribute('data-pw-internal', 'true');
  document.body.appendChild(overlay);

  // Create unified story panel - shows Gherkin context with nested actions
  const storyPanel = document.createElement('div');
  storyPanel.className = 'pw-story-panel';
  storyPanel.id = 'pw-story-panel';
  storyPanel.setAttribute('aria-hidden', 'true');
  storyPanel.setAttribute('inert', '');
  storyPanel.setAttribute('data-pw-internal', 'true');
  document.body.appendChild(storyPanel);

  // Story state
  let storyFeature = '';
  let storyScenario = '';
  let storySteps = []; // Each step has: { keyword, text, actions: [{icon, text, completed}] }
  let currentStepIndex = -1;
  let currentAction = null; // { icon, text }

  // Render unified story panel with nested actions
  function renderStory() {
    let html = '';
    if (storyFeature) {
      html += '<div class="pw-story-feature">' + storyFeature + '</div>';
    }
    if (storyScenario) {
      html += '<div class="pw-story-scenario">' + storyScenario + '</div>';
    }
    for (let i = 0; i < storySteps.length; i++) {
      const step = storySteps[i];
      const isActive = i === currentStepIndex;
      const isCompleted = i < currentStepIndex;
      const stepClass = isActive ? 'active' : (isCompleted ? 'completed' : '');
      const keywordClass = step.keyword.toLowerCase();

      html += '<div class="pw-story-step ' + stepClass + '">';
      html += '<div class="pw-step-header">';
      // Fixed-width indicator column prevents layout shift
      html += '<div class="pw-step-indicator-col">';
      if (isActive) {
        html += '<div class="pw-step-indicator"></div>';
      }
      html += '</div>';
      html += '<span class="pw-step-keyword ' + keywordClass + '">' + step.keyword + '</span>';
      html += '<span class="pw-step-text">' + step.text + '</span>';
      html += '</div>';

      // Sub-items removed for cleaner display - just show Gherkin steps

      html += '</div>';
    }
    storyPanel.innerHTML = html;
  }

  window.__pwDemo = {
    showAction: (icon, text) => {
      // Add action to current step
      if (currentStepIndex >= 0 && currentStepIndex < storySteps.length) {
        if (!storySteps[currentStepIndex].actions) {
          storySteps[currentStepIndex].actions = [];
        }
        currentAction = { icon, text, completed: false };
        storySteps[currentStepIndex].actions.push(currentAction);
        renderStory();
      }
    },
    completeAction: (text) => {
      // Mark current action as completed
      if (currentAction && currentAction.text === text) {
        currentAction.completed = true;
        renderStory();
      }
    },
    hideAction: () => {
      // No-op, actions stay visible under their step
    },
    clearHistory: () => {
      // Clear actions from all steps
      for (const step of storySteps) {
        step.actions = [];
      }
      renderStory();
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
    },
    showResult: (passed) => {
      // Keep story panel visible - don't hide it

      // Checkmark SVG for pass, X for fail
      const checkSvg = '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      const xSvg = '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

      overlay.innerHTML = '<div class="pw-result-icon ' + (passed ? 'pass' : 'fail') + '">' + (passed ? checkSvg : xSvg) + '</div>';
      overlay.classList.add('visible');
    },
    hideResult: () => {
      overlay.classList.remove('visible');
    },
    // Story panel methods for Gherkin display
    setStory: (feature, scenario, steps, startHidden) => {
      storyFeature = feature || '';
      storyScenario = scenario || '';
      storySteps = (steps || []).map(s => ({ ...s, actions: [] }));
      currentStepIndex = -1;
      currentAction = null;
      renderStory();
      storyPanel.classList.add('visible');
      // In slow mode, start hidden - focusStory will reveal it with the backdrop
      if (startHidden) {
        storyPanel.classList.add('focus-hidden');
      }
    },
    advanceStep: () => {
      currentStepIndex++;
      currentAction = null;
      renderStory();
    },
    getCurrentStepIndex: () => currentStepIndex,
    hideStory: () => {
      storyPanel.classList.remove('visible');
      storySteps = [];
      storyFeature = '';
      storyScenario = '';
      currentStepIndex = -1;
      currentAction = null;
    },
    // Focus toggle for slow mode
    focusStory: () => {
      // Dim page content, ensure story is visible
      dimOverlay.classList.add('visible');
      storyPanel.classList.remove('focus-hidden');
    },
    focusPage: () => {
      // Restore page, hide story
      dimOverlay.classList.remove('visible');
      storyPanel.classList.add('focus-hidden');
    },
    focusReset: () => {
      // Reset to normal state
      dimOverlay.classList.remove('visible');
      storyPanel.classList.remove('focus-hidden');
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
    // First scroll element into view and wait for scroll to settle
    await locator.scrollIntoViewIfNeeded({ timeout: DEMO_TIMEOUT });
    if (!FAST_MODE) await page.waitForTimeout(80); // Quick settle for scroll

    const box = await locator.boundingBox({ timeout: DEMO_TIMEOUT });
    if (box) {
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      const moveDuration = Math.round(200 * TIMING_MULTIPLIER);
      await Promise.race([
        page.evaluate(
          async ([cx, cy, ms]: [number, number, number]) => {
            await (window as any).__cursor?.move(cx, cy, ms);
          },
          [x, y, moveDuration] as [number, number, number]
        ),
        new Promise((resolve) => setTimeout(resolve, DEMO_TIMEOUT + moveDuration)),
      ]);
      if (!FAST_MODE) await page.waitForTimeout(50); // Quick settle after cursor moves
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
    if (!FAST_MODE) await page.waitForTimeout(50);
  } catch {}
}

// Use Playwright's built-in delay - scales with SLOW_MO for narrated demos
const TYPE_DELAY = Math.round(10 * TIMING_MULTIPLIER); // ms per character

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
  if (!SHOW_PANELS || FAST_MODE) return; // Skip in grid mode and fast mode
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
  if (!SHOW_PANELS || FAST_MODE) return; // Skip in grid mode and fast mode
  try {
    await withTimeout(
      page.evaluate((text: string) => (window as any).__pwDemo?.completeAction(text), actionText),
      DEMO_TIMEOUT
    );
  } catch {}
}

// Hide action banner
async function hideAction(page: Page) {
  if (!SHOW_PANELS || FAST_MODE) return; // Skip in grid mode and fast mode
  try {
    await withTimeout(
      page.evaluate(() => (window as any).__pwDemo?.hideAction()),
      DEMO_TIMEOUT
    );
  } catch {}
}

// Focus toggle helpers (slow mode only)
async function focusStory(page: Page) {
  if (!FOCUS_TOGGLE) return;
  try {
    await withTimeout(
      page.evaluate(() => (window as any).__pwDemo?.focusStory()),
      DEMO_TIMEOUT
    );
  } catch {}
}

async function focusPage(page: Page) {
  if (!FOCUS_TOGGLE) return;
  try {
    await withTimeout(
      page.evaluate(() => (window as any).__pwDemo?.focusPage()),
      DEMO_TIMEOUT
    );
  } catch {}
}

async function focusReset(page: Page) {
  if (!FOCUS_TOGGLE) return;
  try {
    await withTimeout(
      page.evaluate(() => (window as any).__pwDemo?.focusReset()),
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
    // In slow mode, switch focus from story to page
    if (FOCUS_TOGGLE) {
      await focusPage(page);
      await page.waitForTimeout(400);
    }

    let actionText = "";
    if (!FAST_MODE) {
      const label = await getElementLabel(locator);
      actionText = `by clicking "${label}"`;
      await showAction(page, "👆", actionText);
    }
    await animateCursorTo(page, locator);
    await highlightElement(page, locator); // Highlight after cursor arrives
    await animateClick(page);
    await locator.click();
    await successElement(page, locator);
    if (!FAST_MODE) {
      await completeAction(page, actionText);
    }
  },

  /**
   * Fill input with optional cursor animation, highlighting, and human-like typing
   */
  fill: async (page: Page, locator: Locator, value: string) => {
    if (!DEBUG_VISUAL) {
      await locator.fill(value);
      return;
    }
    // In slow mode, switch focus from story to page
    if (FOCUS_TOGGLE) {
      await focusPage(page);
      await page.waitForTimeout(400);
    }

    let actionText = "";
    if (!FAST_MODE) {
      const label = await getElementLabel(locator);
      const displayValue = value.length > 25 ? value.slice(0, 25) + "…" : value;
      actionText = `by typing "${displayValue}"`;
      await showAction(page, "⌨️", actionText);
    }
    await animateCursorTo(page, locator);
    await highlightElement(page, locator); // Highlight after cursor arrives
    await animateClick(page);
    await locator.click();
    await page.keyboard.press("Meta+A");
    await page.keyboard.press("Backspace");
    // In fast mode, use fill() for instant typing; otherwise type character by character
    if (FAST_MODE) {
      await locator.fill(value);
    } else {
      await locator.pressSequentially(value, { delay: TYPE_DELAY });
    }
    await successElement(page, locator);
    if (!FAST_MODE) {
      await completeAction(page, actionText);
    }
  },

  /**
   * Hover with optional cursor animation
   */
  hover: async (page: Page, locator: Locator) => {
    if (!DEBUG_VISUAL) {
      await locator.hover();
      return;
    }
    // In slow mode, switch focus from story to page
    if (FOCUS_TOGGLE) {
      await focusPage(page);
      await page.waitForTimeout(400);
    }

    let actionText = "";
    if (!FAST_MODE) {
      const label = await getElementLabel(locator);
      actionText = `by hovering over "${label}"`;
      await showAction(page, "👀", actionText);
    }
    await animateCursorTo(page, locator);
    await highlightElement(page, locator); // Highlight after cursor arrives
    await locator.hover();
    if (!FAST_MODE) await page.waitForTimeout(Math.round(200 * TIMING_MULTIPLIER));
    await successElement(page, locator);
    if (!FAST_MODE) {
      await completeAction(page, actionText);
      await hideAction(page);
    }
  },
};

// Show test result overlay
async function showTestResult(page: Page, passed: boolean) {
  if (!DEBUG_VISUAL) return;
  try {
    // Pause before showing result - let user appreciate the final state
    await page.waitForTimeout(FAST_MODE ? 200 : 800);

    await withTimeout(
      page.evaluate((p: boolean) => (window as any).__pwDemo?.showResult(p), passed),
      DEMO_TIMEOUT
    );

    // Hold the result on screen
    await page.waitForTimeout(FAST_MODE ? 600 : passed ? 1800 : 2500);
  } catch {}
}

/**
 * Story helper for displaying Gherkin-style BDD context.
 * Shows the feature, scenario, and current step in a side panel.
 * NOTE: Call setup() AFTER page.goto() so the demo scripts are injected.
 * Only shown in demo1 (single window), hidden in grid mode (demo2).
 */
export const story = {
  /**
   * Set up the story panel with feature, scenario, and steps
   */
  setup: async (
    page: Page,
    feature: string,
    scenario: string,
    steps: Array<{ keyword: string; text: string }>
  ) => {
    if (!SHOW_PANELS) return; // Hide in grid mode
    try {
      await withTimeout(
        page.evaluate(
          ({ f, s, st, h }) => (window as any).__pwDemo?.setStory(f, s, st, h),
          { f: feature, s: scenario, st: steps, h: FOCUS_TOGGLE }
        ),
        DEMO_TIMEOUT
      );
    } catch {}
  },

  /**
   * Advance to the next step (call before each Given/When/Then action)
   */
  step: async (page: Page) => {
    if (!SHOW_PANELS) return; // Hide in grid mode
    try {
      // Check if this is the first step (Given) - no animation needed
      const isFirstStep = await page.evaluate(
        () => (window as any).__pwDemo?.getCurrentStepIndex?.() === -1
      );

      if (isFirstStep) {
        // First step (Given): show story + backdrop together, then advance
        await focusStory(page);
        await withTimeout(
          page.evaluate(() => (window as any).__pwDemo?.advanceStep()),
          DEMO_TIMEOUT
        );
        // In fast mode, minimal pause; otherwise scale with timing
        if (!FAST_MODE) {
          await page.waitForTimeout(Math.round(500 * TIMING_MULTIPLIER));
        }
      } else {
        // Subsequent steps: do focus toggle for narrative effect (slow mode only)
        await focusStory(page);
        if (FOCUS_TOGGLE) await page.waitForTimeout(400);
        if (FOCUS_TOGGLE) await page.waitForTimeout(300);

        // Advance to next step
        await withTimeout(
          page.evaluate(() => (window as any).__pwDemo?.advanceStep()),
          DEMO_TIMEOUT
        );

        // In fast mode, no pause - step updates and action starts together
        if (!FAST_MODE) {
          await page.waitForTimeout(Math.round(500 * TIMING_MULTIPLIER));
        }
      }

      // Note: focusPage() is called by cursor actions, not here
    } catch {}
  },

  /**
   * Hide the story panel
   */
  hide: async (page: Page) => {
    if (!SHOW_PANELS) return; // Hide in grid mode
    try {
      await withTimeout(
        page.evaluate(() => (window as any).__pwDemo?.hideStory()),
        DEMO_TIMEOUT
      );
    } catch {}
  },
};

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
      // In slow mode, hide the story panel entirely at the end
      if (FOCUS_TOGGLE) {
        await story.hide(page);
      }
      await focusReset(page);
      const passed = testInfo.status === "passed" || testInfo.status === "skipped";
      await showTestResult(page, passed);
    }

    // Capture low-quality thumbnail for dashboard (after result overlay shown)
    if (process.env.RECORD_VIDEO === "true" && testInfo.outputDir) {
      try {
        await page.screenshot({
          path: `${testInfo.outputDir}/thumbnail.jpg`,
          type: "jpeg",
          quality: 30, // Low quality for fast loading
        });
      } catch {
        // Screenshot may fail if page closed early
      }
    }
  },
});

export { expect };
