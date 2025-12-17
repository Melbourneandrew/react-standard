# Playwright Testing

This directory contains the end-to-end testing infrastructure. Tests are **generated from feature files**, not manually written.

## Philosophy

**Features are the source of truth.** The `features/` directory contains Gherkin files that describe user stories. Tests in `tests/` are derived artifacts that can be regenerated at any time.

If a test is broken but the feature should work:
1. Check if the app behavior changed → update the feature file
2. Check if there's a timing/selector quirk → document it in `context.md`
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
├── artifacts/          # Generated outputs (gitignored)
│   ├── report/         # HTML test report
│   ├── test-results/   # Traces, screenshots, videos
│   └── recordings/     # Screen recordings from test:record
├── context.md          # AI generation context: patterns, quirks, timing
├── fixtures.ts         # Test infrastructure (cursor animations)
├── macos-record.sh     # Screen recording (macOS only, AVFoundation)
├── ffmpeg-record.sh    # Screen recording (macOS/Linux, x11grab)
├── issues.md           # Known issues and bugs to fix
└── README.md           # This file
```

**Note:** The main Playwright configuration lives at `playwright.config.ts` in the project root. It defines:
- Test directory location (`./playwright/tests`)
- Output directories (`./playwright/artifacts/...`)
- Browser settings, timeouts, and retry behavior
- Debug mode settings (`DEBUG_VISUAL`, `RECORD_VIDEO` env vars)

### Generated Artifacts (gitignored)

The `artifacts/` directory contains all generated outputs that don't need to be committed:

- **`report/`** — HTML test report. Open with `npx playwright show-report playwright/artifacts/report`.
- **`test-results/`** — Playwright traces, screenshots, and videos. When a test fails and retries, Playwright saves a trace file here. Open traces with `npx playwright show-trace <path-to-trace.zip>`.
- **`recordings/`** — Screen recordings from `pnpm test:record:first` and `pnpm test:record`. Each session creates a timestamped subfolder (e.g., `recordings/20251216_140455/video.mp4`).

The entire `artifacts/` directory is gitignored and can be safely deleted. It regenerates automatically when you run tests.

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
2. Use the feature file + `context.md` to generate new tests
3. Run `pnpm test` to verify

The combination of:
- Feature file (what to test)
- `context.md` (how to test, quirks, selectors)

...should be sufficient to regenerate any test file.

## Context Files

### `context.md`

Human-readable documentation for AI-assisted test generation:
- Import patterns and test setup
- Selector strategies and why they're used
- Known quirks (timing issues, browser behavior)
- Timing recommendations for waits

**When to update:** Add quirks here when you discover timing issues, selector changes, or browser-specific behavior that affects test reliability.

### `fixtures.ts`

Test infrastructure code:
- Custom `cursor.*` API for animated interactions
- Cursor injection for visual debugging
- Test extensions and setup

**When to update:** When adding new interaction patterns or debugging capabilities.

### `macos-record.sh`

macOS-specific screen recording using ffmpeg with AVFoundation. Requires ffmpeg via Homebrew.

**Troubleshooting:** If ffmpeg hangs, reset screen recording permissions in System Settings > Privacy & Security > Screen & System Audio Recording.

### `ffmpeg-record.sh`

Cross-platform screen recording using ffmpeg.

| Platform | Capture Method | Requirements |
|----------|----------------|--------------|
| macOS | AVFoundation | ffmpeg (via Homebrew) |
| Linux | x11grab | ffmpeg, X11 display |
| Windows | Not supported | Use WSL or `RECORD_VIDEO=true` |

**Note:** On Linux, requires X11. Wayland users may need XWayland or use Playwright's built-in video.

## Running Tests

```bash
# Run all tests (headless)
pnpm test

# Run tests with browser visible
pnpm test:headed

# Run tests with visual debugging (cursor animations)
pnpm test:headed:debug

# Record tests to video
pnpm test:record:macos        # macOS native (AVFoundation)
pnpm test:record:macos:first
pnpm test:record:ffmpeg       # Cross-platform (x11grab on Linux)
pnpm test:record:ffmpeg:first

# Clean up generated artifacts
pnpm test:clean
```

### What each command does

| Command | Description |
|---------|-------------|
| `pnpm test` | Run all tests headless |
| `pnpm test:headed` | Run tests with browser visible |
| `pnpm test:headed:debug` | Run with cursor animations (`DEBUG_VISUAL=true`) |
| `pnpm test:record:macos` | Record with macOS native capture (60fps) |
| `pnpm test:record:macos:first` | Record first test only (macOS) |
| `pnpm test:record:ffmpeg` | Record with ffmpeg (macOS/Linux, 60fps) |
| `pnpm test:record:ffmpeg:first` | Record first test only (ffmpeg) |
| `pnpm test:clean` | Delete `artifacts/` directory |

## Visual Debugging

When running with `DEBUG_VISUAL=true`:
- Animated cursor shows where clicks happen
- Ripple effect on click
- Human-like typing in input fields
- Slower execution for observation

Videos are saved to `playwright/artifacts/recordings/<timestamp>/video.mp4` at 60fps.

## Troubleshooting

### Test is flaky
1. Check `context.md` for known timing issues
2. Add appropriate waits (`networkidle`, `waitForResponse`)
3. Document the fix in `context.md` for future regeneration

### Test fails but feature should work
1. Run with `pnpm test:headed:debug` to observe
2. Check if selectors changed → update `context.md`
3. Check if behavior changed → update feature file
4. Regenerate the test

### Selector not found
1. Run `pnpm test:headed:debug` to observe the test
2. Use browser DevTools to inspect elements
3. Update `context.md` with the correct selector
4. Regenerate affected tests
