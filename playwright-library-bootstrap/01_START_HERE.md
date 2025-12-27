<!-- LLM INSTRUCTION BLOCK
You are helping build an NPM package that externalizes Playwright visual testing infrastructure.

CONTEXT:
- The `reference/` directory contains a working "copy-paste bootstrap" approach
- This worked, but requires users to copy ~750 lines of fixture code into every project
- The goal is to extract the reusable parts into an NPM package

YOUR TASK:
1. Read `reference/templates/fixtures.ts` to understand the implementation
2. Read `03_ARCHITECTURE.md` to understand the package structure
3. Build the package in `packages/core/`
4. Test it works by consuming it in `packages/example-consumer/`

KEY INSIGHT:
- 69% of the functionality is GENERIC (can be packaged)
- 31% must remain USER-OWNED (selectors, quirks, test files)
- The package exports: cursor, story, createVisualFixtures, expect, test
-->

# Playwright Visual Testing Library Bootstrap

This directory contains everything needed to build an **NPM package** that externalizes the Playwright visual testing infrastructure.

## Background

The `reference/` directory contains a working "copy-paste bootstrap" approach where users copy ~750 lines of fixture code into their project. This works, but has problems:

- No update path (users diverge immediately)
- Code duplication across projects
- Maintenance burden on each consumer

**The solution:** Extract the generic, reusable parts into an NPM package.

---

## Directory Structure

```
playwright-library-bootstrap/
│
├── 01_START_HERE.md           # ← You are here
├── 02_QUICKSTART.md           # TL;DR structure and commands
├── 03_ARCHITECTURE.md         # Package design decisions
├── 04_RESPONSIBILITIES.md     # What goes in package vs. user code
├── 05_PUBLISHING.md           # GitHub Packages publishing guide
│
├── reference/                 # The "before" state (copy-paste approach)
│   ├── START_HERE.md
│   ├── templates/
│   │   ├── fixtures.ts        # ← THE 750 LINES TO EXTRACT
│   │   ├── playwright.config.ts
│   │   └── context.template.md
│   ├── examples/
│   │   ├── login.feature
│   │   └── login.spec.ts
│   └── dashboard.js
│
└── packages/                  # The "after" state (NPM package)
    │
    ├── core/                  # @8090-inc/playwright-visual
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── src/
    │   │   ├── index.ts       # Main exports
    │   │   ├── fixtures.ts    # createVisualFixtures factory
    │   │   ├── cursor.ts      # Cursor API
    │   │   ├── story.ts       # Story API
    │   │   ├── styles.ts      # CSS injection
    │   │   ├── scripts.ts     # JS injection (cursor, demo init)
    │   │   └── config.ts      # Base playwright config helper
    │   └── dist/              # Built output (gitignored)
    │
    └── example-consumer/      # Test project consuming the package
        ├── package.json
        ├── playwright.config.ts
        └── e2e/
            ├── fixtures.ts    # Thin wrapper (~25 lines)
            ├── context.md
            └── tests/
                └── example.spec.ts
```

---

## Quick Start

### Step 1: Build the Package

```bash
cd packages/core
npm install
npm run build
```

### Step 2: Test Consumption

```bash
cd packages/example-consumer
npm install
npm run test:demo
```

### Step 3: Validate It Works

You should see:
- Animated cursor following interactions
- BDD story panel showing Gherkin steps
- Pass/fail overlay at test end
- Video recording in `artifacts/`

---

## What the Package Exports

```typescript
// packages/core/src/index.ts

// The main fixture factory
export { createVisualFixtures } from './fixtures';

// Pre-configured fixtures for zero-config usage
export { test, expect } from './fixtures';

// Individual APIs (for advanced usage)
export { cursor } from './cursor';
export { story } from './story';

// Config helper
export { visualConfig } from './config';

// Types
export type { VisualFixtureConfig, CursorOptions, StoryOptions } from './types';
```

---

## What Users Write (After Package Exists)

### Their `e2e/fixtures.ts` (~25 lines)

```typescript
import { createVisualFixtures } from '@8090-inc/playwright-visual';

export const test = createVisualFixtures({
  cursor: { color: '#3b82f6' },
  story: { position: 'bottom' },
});

export { expect, cursor, story } from '@8090-inc/playwright-visual';
```

### Their `e2e/tests/example.spec.ts`

```typescript
import { test, expect, cursor, story } from '../fixtures';

test('my test @demo', async ({ page }) => {
  await page.goto('/');

  await story.setup(page, 'Feature', 'Scenario', [
    { keyword: 'Given', text: 'I am on the home page' },
    { keyword: 'When', text: 'I click the button' },
    { keyword: 'Then', text: 'I should see the result' },
  ]);

  await story.step(page);
  await cursor.click(page, page.getByRole('button'));

  await story.step(page);
  await expect(page.getByText('Result')).toBeVisible();
});
```

---

## Validation Checklist

Before publishing the package, verify:

- [ ] `npm run build` succeeds in `packages/core/`
- [ ] `example-consumer` can import from the package
- [ ] `DEBUG_VISUAL=true` shows animated cursor
- [ ] `DEBUG_VISUAL=false` (or unset) runs silently with no overhead
- [ ] `RECORD_VIDEO=true` captures videos
- [ ] Story panel displays Gherkin steps correctly
- [ ] Pass/fail overlay appears at test end
- [ ] Thumbnail capture works for dashboard

---

## Next Steps

1. **Read `03_ARCHITECTURE.md`** for package design decisions
2. **Read `04_RESPONSIBILITIES.md`** for what goes where
3. **Build `packages/core/`** by extracting from `reference/templates/fixtures.ts`
4. **Test with `packages/example-consumer/`**
5. **Publish to npm** once validated

---

## Publishing

**Read `05_PUBLISHING.md` for complete instructions.**

This package publishes to **GitHub Packages** (private to `@8090-inc` org members).

Quick version:

```bash
cd packages/core

# Verify auth
npm whoami --registry=https://npm.pkg.github.com

# Dry run first!
npm publish --dry-run

# Publish
npm version 0.1.0
npm publish
```

The package is configured with `"access": "restricted"` so it will be private to org members.
