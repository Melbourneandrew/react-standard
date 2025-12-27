/**
 * Example fixtures file for a consuming project.
 *
 * This demonstrates how to customize the visual testing package
 * for your specific application.
 */

import { createVisualFixtures } from "@8090-inc/playwright-visual";

/**
 * Custom test fixture with project-specific configuration.
 *
 * Customize cursor colors, story panel position, etc. here.
 */
export const test = createVisualFixtures({
  // Customize cursor appearance
  cursor: {
    color: "#3b82f6", // Blue cursor
    highlightColor: "#8b5cf6", // Purple highlight
  },

  // Customize story panel
  story: {
    position: "bottom-left",
    accentColor: "#10b981", // Emerald accent
  },
});

// Re-export for convenience
export { expect, cursor, story } from "@8090-inc/playwright-visual";
