/**
 * JavaScript to inject into the page for cursor tracking and demo effects.
 *
 * This script runs in the browser context, not in Node.js.
 */

/** Script that creates and manages the visual cursor element */
export const CURSOR_SCRIPT = `
(function() {
  // Prevent double initialization
  if (window.__playwrightVisualInitialized) return;
  window.__playwrightVisualInitialized = true;

  // Create cursor element
  let cursor = document.getElementById('playwright-visual-cursor');
  if (!cursor) {
    cursor = document.createElement('div');
    cursor.id = 'playwright-visual-cursor';
    document.body.appendChild(cursor);
  }

  // Track mouse movement
  document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  });

  // Detect input fields for cursor type switching
  document.addEventListener('mouseover', (e) => {
    const target = e.target;
    const isTextInput = (
      target.tagName === 'INPUT' &&
      ['text', 'email', 'password', 'search', 'tel', 'url', 'number'].includes(target.type)
    ) || target.tagName === 'TEXTAREA' || target.isContentEditable;

    cursor.classList.toggle('text', isTextInput);
  });

  // Click animation
  document.addEventListener('mousedown', (e) => {
    cursor.classList.add('clicking');

    // Create ripple
    const ripple = document.createElement('div');
    ripple.className = 'playwright-visual-ripple';
    ripple.style.left = e.clientX + 'px';
    ripple.style.top = e.clientY + 'px';
    document.body.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  });

  document.addEventListener('mouseup', () => {
    cursor.classList.remove('clicking');
  });

  // Expose for programmatic control
  window.__playwrightVisualCursor = cursor;
})();
`;

/** Script that initializes demo mode and exposes control functions */
export const DEMO_INIT_SCRIPT = `
(function() {
  // Story panel state
  window.__playwrightStory = {
    feature: '',
    scenario: '',
    steps: [],
    currentStep: -1,
  };

  // Create story panel
  window.__playwrightCreateStoryPanel = function(feature, scenario, steps) {
    let panel = document.getElementById('playwright-visual-story');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'playwright-visual-story';
      document.body.appendChild(panel);
    }

    window.__playwrightStory = { feature, scenario, steps, currentStep: -1 };

    const stepsHtml = steps.map((step, i) =>
      '<div class="step" data-step="' + i + '">' +
        '<div class="indicator"></div>' +
        '<span class="keyword">' + step.keyword + '</span>' +
        '<span class="text">' + step.text + '</span>' +
      '</div>'
    ).join('');

    panel.innerHTML =
      '<div class="feature">' + feature + '</div>' +
      '<div class="scenario">' + scenario + '</div>' +
      '<div class="steps">' + stepsHtml + '</div>';
  };

  // Advance to next step
  window.__playwrightAdvanceStep = function() {
    const story = window.__playwrightStory;
    story.currentStep++;

    const steps = document.querySelectorAll('#playwright-visual-story .step');
    steps.forEach((step, i) => {
      step.classList.remove('active', 'completed');
      if (i < story.currentStep) {
        step.classList.add('completed');
      } else if (i === story.currentStep) {
        step.classList.add('active');
      }
    });
  };

  // Hide story panel
  window.__playwrightHideStory = function() {
    const panel = document.getElementById('playwright-visual-story');
    if (panel) panel.style.display = 'none';
  };

  // Show result overlay
  window.__playwrightShowResult = function(passed) {
    const overlay = document.createElement('div');
    overlay.id = 'playwright-visual-result';
    overlay.className = passed ? 'pass' : 'fail';
    overlay.innerHTML = '<div class="icon">' + (passed ? '✓' : '✗') + '</div>';
    document.body.appendChild(overlay);
  };

  // Highlight element
  window.__playwrightHighlight = function(selector) {
    document.querySelectorAll('.playwright-visual-highlight').forEach(el => {
      el.classList.remove('playwright-visual-highlight');
    });

    const element = document.querySelector(selector);
    if (element) {
      element.classList.add('playwright-visual-highlight');
    }
  };

  // Clear highlight
  window.__playwrightClearHighlight = function() {
    document.querySelectorAll('.playwright-visual-highlight').forEach(el => {
      el.classList.remove('playwright-visual-highlight');
    });
  };

  // Move cursor programmatically (for animation)
  window.__playwrightMoveCursor = function(x, y) {
    const cursor = document.getElementById('playwright-visual-cursor');
    if (cursor) {
      cursor.style.left = x + 'px';
      cursor.style.top = y + 'px';
    }
  };
})();
`;

/** Combined initialization script */
export const INIT_SCRIPTS = CURSOR_SCRIPT + DEMO_INIT_SCRIPT;



