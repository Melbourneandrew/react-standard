/**
 * PLAYWRIGHT VISUAL TESTING FIXTURES
 *
 * This file provides custom test fixtures with:
 * - Animated cursor that follows interactions
 * - BDD story panel showing Gherkin steps
 * - Click ripple effects and element highlighting
 * - Pass/fail overlay at test completion
 *
 * USAGE:
 *   import { test, expect, cursor, story } from "./fixtures";
 *
 * MODES:
 *   - DEBUG_VISUAL=false (default): Silent, fast execution for CI
 *   - DEBUG_VISUAL=true: Visual mode with animations
 *   - FAST_MODE=true: Speed up animations (0.3x)
 *   - SLOW_MO=600: Slow down for narrated demos
 *
 * This file is 95% generic. Look for // ADAPT: comments for rare customizations.
 */

import { test as base, expect, Locator, Page } from "@playwright/test";

// ═══════════════════════════════════════════════════════════════════════════
// ENVIRONMENT DETECTION
// ═══════════════════════════════════════════════════════════════════════════

const DEBUG_VISUAL = process.env.DEBUG_VISUAL === "true";
const GRID_MODE = parseInt(process.env.GRID_WORKERS || "0", 10) > 1;
const SLOW_MO = parseInt(process.env.SLOW_MO || "0", 10);
const FAST_MODE = process.env.FAST_MODE === "true";

// In grid mode, hide panels (too much visual noise with multiple windows)
const SHOW_PANELS = DEBUG_VISUAL && !GRID_MODE;

// ═══════════════════════════════════════════════════════════════════════════
// ADAPT: Timing Configuration
// Adjust these values if animations feel too fast/slow for your app
// ═══════════════════════════════════════════════════════════════════════════

const TIMING_MULTIPLIER = FAST_MODE ? 0.3 : SLOW_MO > 0 ? Math.max(1, SLOW_MO / 200) : 1.5;
const FOCUS_TOGGLE = SLOW_MO > 0 && SHOW_PANELS;
const DEMO_TIMEOUT = 500; // Max time for visual effects before giving up
const TYPE_DELAY = Math.round(10 * TIMING_MULTIPLIER); // ms per character when typing

// Timeout wrapper to prevent demo effects from hanging tests
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | undefined> {
  return Promise.race([
    promise,
    new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), ms)),
  ]);
}

// ═══════════════════════════════════════════════════════════════════════════
// ADAPT: Visual Theme Colors
// Change these to match your app's design system
// ═══════════════════════════════════════════════════════════════════════════

const THEME = {
  // Highlight color for targeted elements (cyan/teal)
  highlight: "rgba(6, 182, 212, 0.7)",
  highlightGlow: "rgba(6, 182, 212, 0.4)",
  // Story panel colors
  panelBg: "rgba(15, 23, 42, 0.97)",
  panelBorder: "rgba(148, 163, 184, 0.2)",
  // Keyword colors in story panel
  givenColor: "#a78bfa", // purple
  whenColor: "#fbbf24",  // yellow
  thenColor: "#22d3ee",  // cyan
  andColor: "#94a3b8",   // gray
  // Result colors
  passColor: "#22c55e",
  failColor: "#ef4444",
};

// ═══════════════════════════════════════════════════════════════════════════
// CSS STYLES (injected into page)
// ═══════════════════════════════════════════════════════════════════════════

const DEMO_STYLES = `
  /* Hide framework dev mode indicators */
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

  /* Highlight glow effect */
  @keyframes pw-glow {
    0%, 100% {
      box-shadow: 0 0 0 3px ${THEME.highlight},
                  0 0 20px ${THEME.highlightGlow};
    }
    50% {
      box-shadow: 0 0 0 4px ${THEME.highlight},
                  0 0 30px ${THEME.highlightGlow};
    }
  }

  .pw-highlight {
    box-shadow: 0 0 0 3px ${THEME.highlight},
                0 0 20px ${THEME.highlightGlow} !important;
  }

  /* Test result overlay */
  .pw-result-overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999990;
    pointer-events: none;
    opacity: 0;
    background: rgba(0, 0, 0, 0.7);
    transition: opacity 0.4s ease;
    transform: translate3d(0, 0, 0);
    backface-visibility: hidden;
  }

  .pw-result-overlay.visible { opacity: 1; }

  .pw-result-icon {
    position: relative;
    z-index: 9999999;
    width: 72px;
    height: 72px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: pw-result-fade 0.3s ease-out forwards;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.3);
    transform: translate3d(0, 0, 0);
  }

  .pw-result-icon.pass {
    background: ${THEME.passColor};
    box-shadow: 0 6px 24px rgba(34, 197, 94, 0.35);
  }

  .pw-result-icon.fail {
    background: ${THEME.failColor};
    box-shadow: 0 6px 24px rgba(239, 68, 68, 0.35);
  }

  .pw-result-icon svg {
    width: 36px;
    height: 36px;
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

  @keyframes pw-checkmark { to { stroke-dashoffset: 0; } }
  @keyframes pw-xmark { to { stroke-dashoffset: 0; } }

  /* Story Panel */
  .pw-story-panel {
    position: fixed;
    bottom: 16px;
    left: 16px;
    width: 440px;
    max-height: 50vh;
    overflow-y: auto;
    background: linear-gradient(135deg, ${THEME.panelBg} 0%, rgba(30, 41, 59, 0.97) 100%);
    border: 1px solid ${THEME.panelBorder};
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

  .pw-story-step.completed { opacity: 0.6; }

  .pw-step-header {
    display: flex;
    gap: 8px;
    align-items: flex-start;
  }

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

  .pw-step-keyword.given { color: ${THEME.givenColor}; }
  .pw-step-keyword.when { color: ${THEME.whenColor}; }
  .pw-step-keyword.then { color: ${THEME.thenColor}; }
  .pw-step-keyword.and { color: ${THEME.andColor}; }

  .pw-step-text { color: #cbd5e1; }

  /* Focus toggle dim overlay */
  .pw-dim-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 9999985;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.4s ease;
  }

  .pw-dim-overlay.visible { opacity: 1; }
  .pw-story-panel.focus-hidden { opacity: 0 !important; transform: scale(0.98) !important; }
`;

// ═══════════════════════════════════════════════════════════════════════════
// DEMO INIT SCRIPT (creates DOM elements)
// ═══════════════════════════════════════════════════════════════════════════

const DEMO_INIT_SCRIPT = `
(() => {
  if (window.__pwDemo) return;

  const dimOverlay = document.createElement('div');
  dimOverlay.className = 'pw-dim-overlay';
  dimOverlay.id = 'pw-dim-overlay';
  dimOverlay.setAttribute('aria-hidden', 'true');
  dimOverlay.setAttribute('inert', '');
  dimOverlay.setAttribute('data-pw-internal', 'true');
  document.body.appendChild(dimOverlay);

  const overlay = document.createElement('div');
  overlay.className = 'pw-result-overlay';
  overlay.id = 'pw-result-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.setAttribute('inert', '');
  overlay.setAttribute('data-pw-internal', 'true');
  document.body.appendChild(overlay);

  const storyPanel = document.createElement('div');
  storyPanel.className = 'pw-story-panel';
  storyPanel.id = 'pw-story-panel';
  storyPanel.setAttribute('aria-hidden', 'true');
  storyPanel.setAttribute('inert', '');
  storyPanel.setAttribute('data-pw-internal', 'true');
  document.body.appendChild(storyPanel);

  let storyFeature = '';
  let storyScenario = '';
  let storySteps = [];
  let currentStepIndex = -1;
  let currentHighlightedElement = null;

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
      html += '<div class="pw-step-indicator-col">';
      if (isActive) html += '<div class="pw-step-indicator"></div>';
      html += '</div>';
      html += '<span class="pw-step-keyword ' + keywordClass + '">' + step.keyword + '</span>';
      html += '<span class="pw-step-text">' + step.text + '</span>';
      html += '</div></div>';
    }
    storyPanel.innerHTML = html;
  }

  window.__pwDemo = {
    highlight: (el) => {
      currentHighlightedElement = el;
      el.classList.add('pw-highlight');
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    },
    unhighlightCurrent: () => {
      if (currentHighlightedElement) {
        currentHighlightedElement.classList.remove('pw-highlight');
        currentHighlightedElement = null;
      }
    },
    showResult: (passed) => {
      const checkSvg = '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      const xSvg = '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
      overlay.innerHTML = '<div class="pw-result-icon ' + (passed ? 'pass' : 'fail') + '">' + (passed ? checkSvg : xSvg) + '</div>';
      overlay.classList.add('visible');
    },
    hideResult: () => overlay.classList.remove('visible'),
    setStory: (feature, scenario, steps, startHidden) => {
      storyFeature = feature || '';
      storyScenario = scenario || '';
      storySteps = (steps || []).map(s => ({ ...s }));
      currentStepIndex = -1;
      renderStory();
      storyPanel.classList.add('visible');
      if (startHidden) storyPanel.classList.add('focus-hidden');
    },
    advanceStep: () => { currentStepIndex++; renderStory(); },
    getCurrentStepIndex: () => currentStepIndex,
    hideStory: () => { storyPanel.classList.remove('visible'); storySteps = []; },
    focusStory: () => { dimOverlay.classList.add('visible'); storyPanel.classList.remove('focus-hidden'); },
    focusPage: () => { dimOverlay.classList.remove('visible'); storyPanel.classList.add('focus-hidden'); },
    focusReset: () => { dimOverlay.classList.remove('visible'); storyPanel.classList.remove('focus-hidden'); }
  };
})();
`;

// ═══════════════════════════════════════════════════════════════════════════
// CURSOR SCRIPT (animated pointer)
// ═══════════════════════════════════════════════════════════════════════════

const CURSOR_SCRIPT = `
(() => {
  if (window.__cursor) return;

  const pointerSvg = '<svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.85a.5.5 0 0 0-.85.36Z" fill="#000" stroke="#fff" stroke-width="1.5"/></svg>';
  const textSvg = '<svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M12 4v16M8 4h8M8 20h8" stroke="#000" stroke-width="3" stroke-linecap="round"/><path d="M12 4v16M8 4h8M8 20h8" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>';

  const cursor = document.createElement('div');
  cursor.innerHTML = pointerSvg;
  cursor.style.cssText = 'position:fixed;top:0;left:0;width:36px;height:36px;pointer-events:none;z-index:999999;filter:drop-shadow(2px 2px 4px rgba(0,0,0,0.4));transform-origin:top left;';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.setAttribute('inert', '');
  cursor.setAttribute('data-pw-internal', 'true');
  document.body.appendChild(cursor);

  let currentCursorType = 'pointer';

  const ripple = document.createElement('div');
  ripple.style.cssText = 'position:fixed;width:60px;height:60px;border-radius:50%;background:radial-gradient(circle,rgba(6,182,212,0.7) 0%,rgba(6,182,212,0) 70%);pointer-events:none;z-index:2147483647;transform:scale(0.01);opacity:0;';
  ripple.setAttribute('aria-hidden', 'true');
  ripple.setAttribute('inert', '');
  ripple.setAttribute('data-pw-internal', 'true');
  document.body.appendChild(ripple);

  let x = -100, y = -100;
  cursor.style.transform = 'translate(' + x + 'px,' + y + 'px)';

  window.__cursor = {
    setCursor: (type, withBounce) => {
      if (type === currentCursorType) return;
      currentCursorType = type;
      cursor.innerHTML = type === 'text' ? textSvg : pointerSvg;
    },
    pendingCursor: null,
    queueCursorChange: (type) => {
      if (type !== currentCursorType) window.__cursor.pendingCursor = type;
    },
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
      ripple.style.transition = 'none';
      ripple.style.transform = 'scale(0.01)';
      ripple.style.opacity = '1';
      ripple.offsetWidth;
      ripple.style.transition = 'transform 0.4s ease-out, opacity 0.4s ease-out';
      ripple.style.transform = 'scale(2.5)';
      ripple.style.opacity = '0';

      const bounceStart = performance.now();
      let swapped = false;
      function bounce() {
        const elapsed = performance.now() - bounceStart;
        const p = Math.min(elapsed / 150, 1);
        const scaleX = 1 + Math.sin(p * Math.PI) * 0.15;
        const scaleY = 1 - Math.sin(p * Math.PI) * 0.2;
        cursor.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + scaleX + ',' + scaleY + ')';
        if (!swapped && p >= 0.5 && window.__cursor.pendingCursor) {
          currentCursorType = window.__cursor.pendingCursor;
          cursor.innerHTML = currentCursorType === 'text' ? textSvg : pointerSvg;
          window.__cursor.pendingCursor = null;
          swapped = true;
        }
        if (p < 1) requestAnimationFrame(bounce);
        else cursor.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      }
      requestAnimationFrame(bounce);
    }
  };
})();
`;

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

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
    await locator.scrollIntoViewIfNeeded({ timeout: DEMO_TIMEOUT });
    if (!FAST_MODE) await page.waitForTimeout(80);

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
      if (!FAST_MODE) await page.waitForTimeout(50);
    }
  } catch {}
}

async function animateClick(page: Page) {
  if (!DEBUG_VISUAL) return;
  try {
    await withTimeout(page.evaluate(() => (window as any).__cursor?.click()), DEMO_TIMEOUT);
    if (!FAST_MODE) await page.waitForTimeout(50);
  } catch {}
}

async function highlightElement(page: Page, locator: Locator) {
  if (!DEBUG_VISUAL) return;
  try {
    await withTimeout(
      locator.evaluate((el: Element) => {
        const demo = (window as any).__pwDemo;
        if (demo) { demo.unhighlightCurrent?.(); demo.highlight(el); }
      }),
      DEMO_TIMEOUT
    );
  } catch {}
}

async function showTestResult(page: Page, passed: boolean) {
  if (!DEBUG_VISUAL) return;
  try {
    await withTimeout(page.evaluate(() => (window as any).__pwDemo?.unhighlightCurrent?.()), DEMO_TIMEOUT);
    await page.waitForTimeout(FAST_MODE ? 150 : 500);
    await withTimeout(page.evaluate((p: boolean) => (window as any).__pwDemo?.showResult(p), passed), DEMO_TIMEOUT);
    await page.waitForTimeout(FAST_MODE ? 400 : passed ? 1200 : 1800);
  } catch {}
}

async function focusStory(page: Page) {
  if (!FOCUS_TOGGLE) return;
  try { await withTimeout(page.evaluate(() => (window as any).__pwDemo?.focusStory()), DEMO_TIMEOUT); } catch {}
}

async function focusPage(page: Page) {
  if (!FOCUS_TOGGLE) return;
  try { await withTimeout(page.evaluate(() => (window as any).__pwDemo?.focusPage()), DEMO_TIMEOUT); } catch {}
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTED: CURSOR API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Cursor interaction helpers.
 * When DEBUG_VISUAL=true: animates cursor before action with visual feedback
 * When DEBUG_VISUAL=false: just performs the action directly (no overhead)
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
    await animateCursorTo(page, locator);
    await highlightElement(page, locator);
    await animateClick(page);
    await locator.click();
  },

  /**
   * Fill input with optional cursor animation and human-like typing
   */
  fill: async (page: Page, locator: Locator, value: string) => {
    if (!DEBUG_VISUAL) {
      await locator.fill(value);
      return;
    }
    await animateCursorTo(page, locator);
    await highlightElement(page, locator);
    await page.evaluate(() => (window as any).__cursor?.queueCursorChange?.('text'));
    await animateClick(page);
    await locator.click();
    await page.keyboard.press("Meta+A");
    await page.keyboard.press("Backspace");
    if (FAST_MODE) {
      await locator.fill(value);
    } else {
      await locator.pressSequentially(value, { delay: TYPE_DELAY });
    }
    await page.evaluate(() => (window as any).__cursor?.setCursor?.('pointer', true));
  },

  /**
   * Hover with optional cursor animation
   */
  hover: async (page: Page, locator: Locator) => {
    if (!DEBUG_VISUAL) {
      await locator.hover();
      return;
    }
    await animateCursorTo(page, locator);
    await highlightElement(page, locator);
    await locator.hover();
    if (!FAST_MODE) await page.waitForTimeout(Math.round(200 * TIMING_MULTIPLIER));
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTED: STORY API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Story helper for displaying Gherkin-style BDD context.
 * Shows the feature, scenario, and current step in a side panel.
 * NOTE: Call setup() AFTER page.goto() so the demo scripts are injected.
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
    if (!SHOW_PANELS) return;
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
    if (!SHOW_PANELS) return;
    try {
      const isFirstStep = await page.evaluate(
        () => (window as any).__pwDemo?.getCurrentStepIndex?.() === -1
      );

      if (isFirstStep) {
        await focusStory(page);
        await withTimeout(page.evaluate(() => (window as any).__pwDemo?.advanceStep()), DEMO_TIMEOUT);
        if (!FAST_MODE) await page.waitForTimeout(Math.round(500 * TIMING_MULTIPLIER));
      } else {
        await focusStory(page);
        if (FOCUS_TOGGLE) await page.waitForTimeout(700);
        await withTimeout(page.evaluate(() => (window as any).__pwDemo?.advanceStep()), DEMO_TIMEOUT);
        if (!FAST_MODE) await page.waitForTimeout(Math.round(500 * TIMING_MULTIPLIER));
        await focusPage(page);
        if (FOCUS_TOGGLE) await page.waitForTimeout(300);
      }
    } catch {}
  },

  /**
   * Hide the story panel
   */
  hide: async (page: Page) => {
    if (!SHOW_PANELS) return;
    try { await withTimeout(page.evaluate(() => (window as any).__pwDemo?.hideStory()), DEMO_TIMEOUT); } catch {}
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTED: TEST FIXTURE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extended test fixture with visual feedback.
 * - Injects cursor on page load
 * - Shows pass/fail overlay at test end
 * - Captures thumbnail for dashboard when recording
 */
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

    await use(page);

    // Show pass/fail result overlay
    if (DEBUG_VISUAL) {
      if (FOCUS_TOGGLE) await story.hide(page);
      await withTimeout(page.evaluate(() => (window as any).__pwDemo?.focusReset?.()), DEMO_TIMEOUT);
      const passed = testInfo.status === "passed" || testInfo.status === "skipped";
      await showTestResult(page, passed);
    }

    // Capture thumbnail for dashboard
    if (process.env.RECORD_VIDEO === "true" && testInfo.outputDir) {
      try {
        await page.screenshot({
          path: `${testInfo.outputDir}/thumbnail.jpg`,
          type: "jpeg",
          quality: 30,
        });
      } catch {}
    }
  },
});

export { expect };
