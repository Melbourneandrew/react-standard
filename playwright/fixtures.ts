import { test as base } from "@playwright/test";

// Cursor visualization script for headed mode
const CURSOR_SCRIPT = `
  // Create cursor element
  const cursor = document.createElement('div');
  cursor.id = 'pw-cursor';
  cursor.style.cssText = \`
    position: fixed; width: 20px; height: 20px;
    background: rgba(255, 0, 0, 0.6); border-radius: 50%;
    pointer-events: none; z-index: 999999;
    transform: translate(-50%, -50%);
    transition: left 0.05s, top 0.05s;
    box-shadow: 0 0 0 2px white, 0 0 0 4px rgba(255, 0, 0, 0.4);
  \`;
  document.body.appendChild(cursor);

  // Track mouse position
  document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  }, true);

  // Flash on click
  document.addEventListener('mousedown', () => {
    cursor.style.transform = 'translate(-50%, -50%) scale(0.8)';
    cursor.style.background = 'rgba(255, 255, 0, 0.8)';
  }, true);
  document.addEventListener('mouseup', () => {
    cursor.style.transform = 'translate(-50%, -50%) scale(1)';
    cursor.style.background = 'rgba(255, 0, 0, 0.6)';
  }, true);
`;

// Extended test fixture that optionally shows cursor
export const test = base.extend({
  page: async ({ page }, use) => {
    // Inject cursor script when SHOW_CURSOR=true
    if (process.env.SHOW_CURSOR === "true") {
      await page.addInitScript(CURSOR_SCRIPT);
    }
    await use(page);
  },
});

export { expect } from "@playwright/test";
