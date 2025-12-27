# Package Architecture

This document explains the design decisions for the `@8090-inc/playwright-visual` package.

---

## Core Principle: Composition Over Configuration

The package provides a **factory function** that users call with their configuration:

```typescript
// User's code
import { createVisualFixtures } from '@8090-inc/playwright-visual';

export const test = createVisualFixtures({
  cursor: { color: '#3b82f6' },
});
```

This pattern allows:
- **Zero-config usage** (defaults work out of the box)
- **Full customization** (users can override anything)
- **Type safety** (TypeScript catches invalid options)

---

## Module Structure

```
packages/core/src/
├── index.ts          # Public exports only
├── types.ts          # TypeScript interfaces
├── fixtures.ts       # createVisualFixtures factory + extended test
├── cursor.ts         # cursor.click(), cursor.fill(), cursor.hover()
├── story.ts          # story.setup(), story.step(), story.hide()
├── styles.ts         # DEMO_STYLES constant (CSS)
├── scripts.ts        # CURSOR_SCRIPT, DEMO_INIT_SCRIPT constants (JS)
├── helpers.ts        # animateCursorTo, highlightElement, etc.
├── config.ts         # visualConfig() helper for playwright.config.ts
└── env.ts            # Environment detection (DEBUG_VISUAL, etc.)
```

---

## Why Split Into Modules?

The `reference/templates/fixtures.ts` is 742 lines in one file. We split it because:

1. **Maintainability**: Easier to find and fix bugs
2. **Testability**: Can unit test each module
3. **Tree-shaking**: Bundlers can exclude unused code
4. **Readability**: Each file has a single responsibility

---

## The Fixture Factory Pattern

### How It Works

```typescript
// packages/core/src/fixtures.ts

import { test as base, expect } from '@playwright/test';
import { cursor } from './cursor';
import { story } from './story';
import { injectVisualScripts } from './helpers';
import { DEBUG_VISUAL, RECORD_VIDEO } from './env';

export interface VisualFixtureConfig {
  cursor?: { color?: string; size?: number };
  story?: { position?: 'top' | 'bottom' | 'left' | 'right' };
}

export function createVisualFixtures(config: VisualFixtureConfig = {}) {
  return base.extend({
    page: async ({ page }, use, testInfo) => {
      // Inject scripts on page load (if DEBUG_VISUAL)
      if (DEBUG_VISUAL) {
        page.on('load', () => injectVisualScripts(page, config));
        const origGoto = page.goto.bind(page);
        page.goto = async (url, opts) => {
          const r = await origGoto(url, opts);
          await injectVisualScripts(page, config);
          return r;
        };
      }

      await use(page);

      // Show result overlay at test end
      if (DEBUG_VISUAL) {
        const passed = testInfo.status === 'passed';
        await showTestResult(page, passed);
      }

      // Capture thumbnail for dashboard
      if (RECORD_VIDEO && testInfo.outputDir) {
        await page.screenshot({
          path: `${testInfo.outputDir}/thumbnail.jpg`,
          type: 'jpeg',
          quality: 30,
        });
      }
    },
  });
}

// Pre-configured export for zero-config usage
export const test = createVisualFixtures();
export { expect };
```

### Why This Pattern?

1. **Users can customize**: `createVisualFixtures({ cursor: { color: 'red' } })`
2. **Or use defaults**: `import { test } from '@8090-inc/playwright-visual'`
3. **Extensible**: Users can further extend: `test.extend({ myFixture: ... })`

---

## Environment Variables

The package respects these environment variables:

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `DEBUG_VISUAL` | boolean | `false` | Enable visual effects |
| `RECORD_VIDEO` | boolean | `false` | Record test videos |
| `SLOW_MO` | number | `0` | Milliseconds between actions |
| `FAST_MODE` | boolean | `false` | Speed up animations (0.3x) |
| `GRID_WORKERS` | number | `0` | Number of parallel browser windows |

```typescript
// packages/core/src/env.ts

export const DEBUG_VISUAL = process.env.DEBUG_VISUAL === 'true';
export const RECORD_VIDEO = process.env.RECORD_VIDEO === 'true';
export const SLOW_MO = parseInt(process.env.SLOW_MO || '0', 10);
export const FAST_MODE = process.env.FAST_MODE === 'true';
export const GRID_WORKERS = parseInt(process.env.GRID_WORKERS || '0', 10);
export const GRID_MODE = GRID_WORKERS > 1;

// Derived values
export const SHOW_PANELS = DEBUG_VISUAL && !GRID_MODE;
export const TIMING_MULTIPLIER = FAST_MODE ? 0.3 : SLOW_MO > 0 ? Math.max(1, SLOW_MO / 200) : 1.5;
export const FOCUS_TOGGLE = SLOW_MO > 0 && SHOW_PANELS;
```

---

## Cursor and Story APIs

These are exported as standalone objects that users import and call:

```typescript
// packages/core/src/cursor.ts

import { Page, Locator } from '@playwright/test';
import { DEBUG_VISUAL, FAST_MODE, TIMING_MULTIPLIER } from './env';
import { animateCursorTo, highlightElement, animateClick } from './helpers';

export const cursor = {
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

  fill: async (page: Page, locator: Locator, value: string) => {
    if (!DEBUG_VISUAL) {
      await locator.fill(value);
      return;
    }
    // ... visual fill implementation
  },

  hover: async (page: Page, locator: Locator) => {
    if (!DEBUG_VISUAL) {
      await locator.hover();
      return;
    }
    // ... visual hover implementation
  },
};
```

---

## Config Helper

For users who want visual-optimized playwright.config.ts:

```typescript
// packages/core/src/config.ts

import { PlaywrightTestConfig } from '@playwright/test';
import { DEBUG_VISUAL, RECORD_VIDEO, GRID_MODE, SLOW_MO } from './env';

export function visualConfig(overrides: Partial<PlaywrightTestConfig> = {}): PlaywrightTestConfig {
  return {
    timeout: DEBUG_VISUAL ? 60000 : 30000,
    retries: 1,
    workers: 1,
    reporter: [['html', { outputFolder: './artifacts/report' }]],
    use: {
      trace: 'on-first-retry',
      ...(RECORD_VIDEO && {
        video: { mode: 'on', size: { width: 1280, height: 720 } },
      }),
      ...overrides.use,
    },
    ...overrides,
  };
}
```

Usage:

```typescript
// User's playwright.config.ts
import { defineConfig } from '@playwright/test';
import { visualConfig } from '@8090-inc/playwright-visual';

export default defineConfig({
  ...visualConfig(),
  use: {
    baseURL: 'http://localhost:3000',
  },
});
```

---

## Build Configuration

### package.json

```json
{
  "name": "@8090-inc/playwright-visual",
  "version": "0.0.0",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./config": {
      "import": "./dist/config.mjs",
      "require": "./dist/config.js",
      "types": "./dist/config.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts src/config.ts --format cjs,esm --dts",
    "dev": "tsup src/index.ts src/config.ts --format cjs,esm --dts --watch"
  },
  "peerDependencies": {
    "@playwright/test": ">=1.40.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "tsup": "^8.0.0",
    "typescript": "^5.0.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src"]
}
```

---

## What NOT to Include in the Package

These are **user-owned** and should NOT be in the package:

- ❌ `context.md` (app-specific selectors)
- ❌ Feature files (app-specific scenarios)
- ❌ Test spec files (app-specific tests)
- ❌ Playwright config `baseURL` (app-specific)
- ❌ Web server command (app-specific)
- ❌ Test data (app-specific)

These should be scaffolded by a CLI or copied from examples.
