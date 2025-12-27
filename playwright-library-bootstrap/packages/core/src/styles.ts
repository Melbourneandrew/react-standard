/**
 * CSS styles for visual testing elements.
 *
 * These styles are injected into the page when DEBUG_VISUAL is enabled.
 */

import type { VisualFixtureConfig } from "./types";

/** Default theme colors */
const DEFAULTS = {
  cursor: {
    color: "#ef4444",
    size: 20,
    highlightColor: "#3b82f6",
    rippleColor: "#ef4444",
  },
  story: {
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    textColor: "#ffffff",
    accentColor: "#22c55e",
  },
  result: {
    passColor: "#22c55e",
    failColor: "#ef4444",
  },
};

/** Generate CSS styles with configuration */
export function generateStyles(config: VisualFixtureConfig = {}): string {
  const cursor = { ...DEFAULTS.cursor, ...config.cursor };
  const story = { ...DEFAULTS.story, ...config.story };
  const result = { ...DEFAULTS.result, ...config.result };

  return `
    /* Visual Testing Cursor */
    #playwright-visual-cursor {
      position: fixed;
      width: ${cursor.size}px;
      height: ${cursor.size}px;
      border-radius: 50%;
      background: ${cursor.color};
      pointer-events: none;
      z-index: 999999;
      transform: translate(-50%, -50%);
      transition: width 0.15s, height 0.15s, opacity 0.15s;
      box-shadow: 0 0 10px ${cursor.color}80;
    }

    #playwright-visual-cursor.text {
      width: 3px;
      height: 24px;
      border-radius: 1px;
    }

    #playwright-visual-cursor.clicking {
      transform: translate(-50%, -50%) scale(0.8);
    }

    /* Click Ripple Effect */
    .playwright-visual-ripple {
      position: fixed;
      border-radius: 50%;
      border: 2px solid ${cursor.rippleColor};
      pointer-events: none;
      z-index: 999998;
      animation: playwright-ripple 0.6s ease-out forwards;
    }

    @keyframes playwright-ripple {
      0% {
        width: 0;
        height: 0;
        opacity: 1;
        transform: translate(-50%, -50%);
      }
      100% {
        width: 60px;
        height: 60px;
        opacity: 0;
        transform: translate(-50%, -50%);
      }
    }

    /* Element Highlight */
    .playwright-visual-highlight {
      outline: 3px solid ${cursor.highlightColor} !important;
      outline-offset: 2px;
      box-shadow: 0 0 20px ${cursor.highlightColor}40 !important;
      transition: outline 0.2s, box-shadow 0.2s;
    }

    /* Story Panel */
    #playwright-visual-story {
      position: fixed;
      bottom: 20px;
      left: 20px;
      max-width: 400px;
      background: ${story.backgroundColor};
      border-radius: 12px;
      padding: 16px 20px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13px;
      color: ${story.textColor};
      z-index: 999997;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(8px);
    }

    #playwright-visual-story .feature {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: ${story.accentColor};
      margin-bottom: 4px;
    }

    #playwright-visual-story .scenario {
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 12px;
      color: ${story.textColor};
    }

    #playwright-visual-story .steps {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    #playwright-visual-story .step {
      display: flex;
      gap: 8px;
      opacity: 0.4;
      transition: opacity 0.3s;
    }

    #playwright-visual-story .step.active {
      opacity: 1;
    }

    #playwright-visual-story .step.completed {
      opacity: 0.6;
    }

    #playwright-visual-story .step .keyword {
      color: ${story.accentColor};
      font-weight: 600;
      min-width: 50px;
    }

    #playwright-visual-story .step .indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: ${story.textColor}40;
      margin-top: 5px;
      flex-shrink: 0;
    }

    #playwright-visual-story .step.active .indicator {
      background: ${story.accentColor};
      box-shadow: 0 0 8px ${story.accentColor};
    }

    #playwright-visual-story .step.completed .indicator {
      background: ${story.accentColor}80;
    }

    /* Result Overlay */
    #playwright-visual-result {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      animation: playwright-result-in 0.3s ease-out;
    }

    #playwright-visual-result.pass {
      background: ${result.passColor}20;
    }

    #playwright-visual-result.fail {
      background: ${result.failColor}20;
    }

    #playwright-visual-result .icon {
      font-size: 120px;
      animation: playwright-result-icon 0.5s ease-out;
    }

    #playwright-visual-result.pass .icon {
      color: ${result.passColor};
    }

    #playwright-visual-result.fail .icon {
      color: ${result.failColor};
    }

    @keyframes playwright-result-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes playwright-result-icon {
      0% { transform: scale(0); opacity: 0; }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); opacity: 1; }
    }

    /* Focus Mode (dims page, highlights story) */
    .playwright-visual-focus-active {
      filter: brightness(0.5);
      transition: filter 0.3s;
    }

    .playwright-visual-focus-active #playwright-visual-story,
    .playwright-visual-focus-active #playwright-visual-cursor,
    .playwright-visual-focus-active #playwright-visual-result {
      filter: brightness(2);
    }
  `;
}

/** Pre-generated default styles */
export const DEMO_STYLES = generateStyles();



