# Playwright Testing

This directory contains the end-to-end testing infrastructure. Tests are **generated from feature files**, not manually written.

## Philosophy

**Features are the source of truth.** The `features/` directory contains Gherkin files that describe user stories. Tests in `tests/` are derived artifacts that can be regenerated at any time.

If a test is broken but the feature should work:
1. Check if the app behavior changed → update the feature file
2. Check if there's a timing/selector quirk → document it in `test-context.md`
3. Regenerate the test

## Directory Structure

```
playwright/
├── features/           # Source of truth - Gherkin feature files
│   ├── collections.feature
│   ├── item-create.feature
│   └── ...
├── tests/              # Generated - 1:1 mapping with features
│   ├── collections.spec.ts
│   ├── item-create.spec.ts
│   └── ...
├── artifacts/          # Generated - screen recordings (gitignored)
├── test-results/       # Generated - Playwright traces/artifacts (gitignored)
├── fixtures.ts         # Test infrastructure (cursor animations, etc.)
├── test-context.md     # Generation context: patterns, quirks, timing
├── selectors.json      # Structured selector mappings
├── record-tests.sh     # Screen recording script (macOS only)
├── .gitignore          # Ignores artifacts/ and test-results/
└── README.md           # This file
```

**Note:** The main Playwright configuration lives at `playwright.config.ts` in the project root. It defines:
- Test directory location (`./playwright/tests`)
- Output directory (`./playwright/test-results`)
- Browser settings, timeouts, and retry behavior
- Debug mode settings (`DEBUG_VISUAL`, `RECORD_VIDEO` env vars)

### Generated Directories (gitignored)

**`artifacts/`** — Screen recordings from `pnpm test:record:first` and `pnpm test:record`. Each recording session creates a timestamped subfolder (e.g., `artifacts/20251216_140455/video.mp4`). Safe to delete anytime.

**`test-results/`** — Playwright's output directory for test artifacts:
- **Traces**: When a test fails and retries, Playwright saves a trace file here. Open with `npx playwright show-trace <path-to-trace.zip>` to see a timeline of what happened.
- **Screenshots/Videos**: If configured, Playwright can save per-test screenshots or videos here.

Both directories are gitignored and can be safely deleted. They regenerate automatically when you run tests.

## Features (`features/`)

Each `.feature` file uses Gherkin syntax to describe a user story:

```gherkin
Feature: Item Creation
  As a user
  I want to create new items
  So that I can add data to my collection

  Scenario: Open create dialog
    Given I am viewing a collection
    When  I click the create button
    Then  I should see the create dialog

  Scenario: Create item successfully
    Given I have opened the create dialog
    When  I fill in the name field
    And   I fill in the description field
    And   I click the create button
    Then  the dialog should close
    And   the new item should appear in the list
```

### Guidelines for Feature Files

- **One feature per file** - maps 1:1 to test files
- **User-focused language** - describe what the user does, not implementation
- **Scenarios are independent** - each can run in isolation
- **Given/When/Then** - setup, action, assertion

## Tests (`tests/`)

Generated `.spec.ts` files that implement the feature scenarios. **Do not manually edit these** unless documenting a quirk that will persist.

### Regenerating Tests

To regenerate tests from features:

1. Delete the test file(s) you want to regenerate
2. Use the feature file + context files to generate new tests
3. Run `pnpm test` to verify

The combination of:
- Feature file (what to test)
- `test-context.md` (how to test, quirks)
- `selectors.json` (element selectors)

...should be sufficient to regenerate any test file.

## Context Files

### `test-context.md`

Human-readable documentation for test generation:
- Import patterns and test setup
- Selector strategies and why they're used
- Known quirks (timing issues, browser behavior)
- Timing recommendations for waits

**When to update:** Add quirks here when you discover timing issues, selector changes, or browser-specific behavior that affects test reliability.

### `selectors.json`

Structured JSON mapping of UI elements to selectors:
- Button selectors
- Dialog selectors
- Form field selectors
- API endpoint patterns

**When to update:** When UI elements change their structure, roles, or identifiers.

### `fixtures.ts`

Test infrastructure code:
- Custom `cursor.*` API for animated interactions
- Cursor injection for visual debugging
- Test extensions and setup

**When to update:** When adding new interaction patterns or debugging capabilities.

## Running Tests

```bash
# Run all tests (headless)
pnpm test

# Run tests with browser visible
pnpm test:headed

# Run tests with visual debugging (cursor animations)
pnpm test:headed:visual

# Record first test to video (macOS only)
pnpm test:record:first

# Record all tests to video (macOS only)
pnpm test:record
```

### What each command does

| Command | Browser | Cursor Animation | Video Recording |
|---------|---------|------------------|-----------------|
| `pnpm test` | Headless | No | No |
| `pnpm test:headed` | Visible | No | No |
| `pnpm test:headed:visual` | Visible | Yes | No |
| `pnpm test:record:first` | Visible | Yes | Yes (first test file) |
| `pnpm test:record` | Visible | Yes | Yes (all tests) |

## Visual Debugging

When running with `DEBUG_VISUAL=true`:
- Animated cursor shows where clicks happen
- Ripple effect on click
- Human-like typing in input fields
- Slower execution for observation

Videos are saved to `playwright/artifacts/<timestamp>/video.mp4`.

## Troubleshooting

### Test is flaky
1. Check `test-context.md` for known timing issues
2. Add appropriate waits (`networkidle`, `waitForResponse`)
3. Document the fix in `test-context.md` for future regeneration

### Test fails but feature should work
1. Run with `pnpm test:headed:visual` to observe
2. Check if selectors changed → update `selectors.json`
3. Check if behavior changed → update feature file
4. Regenerate the test

### Selector not found
1. Run `pnpm test:headed:visual` to observe the test
2. Use browser DevTools to inspect elements
3. Update `selectors.json` with the correct selector
4. Regenerate affected tests
