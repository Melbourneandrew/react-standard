<!-- LLM INSTRUCTION BLOCK
When helping bootstrap this framework into a new project:

1. FIRST: Read this entire file to understand the workflow
2. THEN: Help the user fill out templates/context.template.md by asking about their app
3. THEN: Generate feature files by asking what user flows to test
4. FINALLY: Implement specs using the patterns in examples/

Key constraints:
- fixtures.ts is LIBRARY CODE - copy it verbatim except for lines marked // ADAPT:
- Always reference context.md for app-specific selectors rather than hardcoding them in specs
- Tests must import from "../fixtures" (not "@playwright/test")
- Use cursor.click(), cursor.fill(), cursor.hover() for all user interactions
- Add story.setup() and story.step() for tests tagged @demo
-->

# Playwright Visual Testing Bootstrap

A production-ready Playwright testing infrastructure with animated cursor, BDD story panels, and visual debugging. Works silently in CI, visually with `DEBUG_VISUAL=true`.

## What You Get

- **Animated cursor** that follows interactions with click ripples
- **BDD story panel** showing Gherkin steps in real-time
- **Pass/fail overlay** at test completion
- **Video recording** with dashboard for browsing
- **Grid mode** for parallel visual testing

## Step 1: Copy Files

```bash
# Copy to your project
cp templates/fixtures.ts       your-project/playwright/fixtures.ts
cp templates/playwright.config.ts  your-project/playwright.config.ts
cp dashboard.js                your-project/playwright/artifacts/dashboard.js

# Create directories
mkdir -p your-project/playwright/features
mkdir -p your-project/playwright/tests
mkdir -p your-project/playwright/artifacts

# Create your context file (fill in with LLM help)
cp templates/context.template.md  your-project/playwright/context.md
```

## Step 2: Install Dependencies

```bash
npm install -D @playwright/test
npx playwright install chromium
```

## Step 3: Add Scripts to package.json

```json
{
  "scripts": {
    "test": "playwright test",
    "test:demo": "RUN_EPOCH=$(date +%s) DEBUG_VISUAL=true RECORD_VIDEO=true playwright test --headed --workers=1 --grep '@demo'",
    "test:demo:fast": "RUN_EPOCH=$(date +%s) DEBUG_VISUAL=true RECORD_VIDEO=true FAST_MODE=true playwright test --headed --workers=1 --grep '@demo'",
    "test:dashboard": "node playwright/artifacts/dashboard.js"
  }
}
```

## Step 4: Build Your context.md

**Tell the LLM:**
> "Read `templates/context.template.md` and help me fill it out for my app. Here's what my app does: [describe your app, key pages, authentication, etc.]"

## Step 5: Write Your First Feature

**Tell the LLM:**
> "Read `examples/login.feature` for the Gherkin style. Read my `context.md` for app-specific selectors. Write a feature file for [describe user flow]."

## Step 6: Generate the Spec

**Tell the LLM:**
> "Read `examples/login.spec.ts` for implementation patterns. Read `templates/fixtures.ts` to understand the cursor and story APIs. Implement my feature file."

---

## Quick Reference

### Fixture APIs

```typescript
import { test, expect, cursor, story } from "../fixtures";

// Cursor interactions (animated in DEBUG_VISUAL mode)
await cursor.click(page, locator);
await cursor.fill(page, locator, "text");
await cursor.hover(page, locator);

// BDD story panel (for @demo tests)
await story.setup(page, "Feature Name", "Scenario Name", [
  { keyword: "Given", text: "I am on the login page" },
  { keyword: "When", text: "I enter credentials" },
  { keyword: "Then", text: "I should see the dashboard" },
]);
await story.step(page); // Call before each Given/When/Then action
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DEBUG_VISUAL=true` | Enable animated cursor, story panel, effects |
| `RECORD_VIDEO=true` | Record test videos |
| `FAST_MODE=true` | Speed up animations (0.3x timing) |
| `SLOW_MO=600` | Slow down for narrated demos |
| `GRID_WORKERS=8` | Parallel browser windows in grid layout |

### Test Structure

```typescript
test("should do something @demo", async ({ page }) => {
  // Setup story (AFTER page.goto, BEFORE actions)
  await story.setup(page, "Feature", "Scenario", [...steps]);

  await story.step(page); // Given
  // ... setup actions

  await story.step(page); // When
  await cursor.click(page, someButton);

  await story.step(page); // Then
  await expect(something).toBeVisible();
});
```

---

## File Guide

| File | Type | Action |
|------|------|--------|
| `fixtures.ts` | Generic | Copy as-is (see `// ADAPT:` markers for rare tweaks) |
| `playwright.config.ts` | Generic | Copy as-is (adjust `baseURL` and `webServer.command`) |
| `dashboard.js` | Generic | Copy as-is |
| `context.md` | **App-specific** | Fill out with LLM help using the template |
| `features/*.feature` | **App-specific** | Write Gherkin for your user flows |
| `tests/*.spec.ts` | **App-specific** | Generate from features using patterns in examples |
