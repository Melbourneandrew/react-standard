# Responsibility Split

This document defines what goes in the NPM package vs. what users must implement.

---

## Package Responsibilities (69%)

These are **generic and reusable** across all projects.

### Visual Effects

| Responsibility | Module | Notes |
|----------------|--------|-------|
| Animated cursor following interactions | `cursor.ts` | |
| Cursor movement with eased arc animation | `helpers.ts` | |
| Click ripple effects | `scripts.ts` | Injected JS |
| Cursor type switching (pointer ↔ text) | `scripts.ts` | |
| Element highlighting (glow effect) | `helpers.ts` | |
| BDD story panel rendering | `story.ts` + `styles.ts` | |
| Story step advancement with indicators | `story.ts` | |
| Focus toggle (dim page, highlight story) | `story.ts` | |
| Pass/fail result overlay at test end | `helpers.ts` | |

### Infrastructure

| Responsibility | Module | Notes |
|----------------|--------|-------|
| CSS injection into page | `styles.ts` | |
| DOM element injection | `scripts.ts` | |
| Environment variable detection | `env.ts` | |
| Timing multiplier calculations | `env.ts` | |
| Graceful timeout wrappers | `helpers.ts` | |
| Test fixture extension | `fixtures.ts` | |
| Thumbnail capture for dashboard | `fixtures.ts` | |

### API Surface

| Responsibility | Module | Export |
|----------------|--------|--------|
| cursor.click() | `cursor.ts` | `cursor` |
| cursor.fill() with human-like typing | `cursor.ts` | `cursor` |
| cursor.hover() | `cursor.ts` | `cursor` |
| story.setup() | `story.ts` | `story` |
| story.step() | `story.ts` | `story` |
| story.hide() | `story.ts` | `story` |
| createVisualFixtures() | `fixtures.ts` | `createVisualFixtures` |
| Pre-configured test/expect | `fixtures.ts` | `test`, `expect` |

### Configuration

| Responsibility | Module | Notes |
|----------------|--------|-------|
| Grid mode window positioning | `config.ts` | Optional helper |
| Video recording directory structure | `fixtures.ts` | Uses testInfo.outputDir |
| Theme colors (configurable) | `types.ts` | User can override |
| visualConfig() helper | `config.ts` | Optional |

### Tooling

| Responsibility | Location | Notes |
|----------------|----------|-------|
| Dashboard HTML/CSS | Separate package or bundled | Optional |
| Dashboard filtering/search | Separate package or bundled | Optional |
| Video playback UI | Separate package or bundled | Optional |

---

## User Responsibilities (31%)

These are **inherently app-specific** and cannot be generalized.

### Configuration (User Must Provide)

| Responsibility | File | Why |
|----------------|------|-----|
| Base URL | `playwright.config.ts` | Different per app |
| Web server command | `playwright.config.ts` | `pnpm dev` vs `npm start` |
| Browser-specific flags | `playwright.config.ts` | May need app-specific |
| Test directory structure | `playwright.config.ts` | User preference |

### Documentation (User Must Write)

| Responsibility | File | Why |
|----------------|------|-----|
| App-specific selectors | `context.md` | Only user knows DOM |
| Timing/quirk documentation | `context.md` | Only user knows animations |
| Test data documentation | `context.md` | User's credentials, data |
| Common patterns | `context.md` | User's auth flow, etc. |
| LLM instructions (app context) | `context.md` | User describes their app |

### Test Content (User Must Create)

| Responsibility | Location | Why |
|----------------|----------|-----|
| Feature files (Gherkin) | `e2e/features/` | User's actual user stories |
| Test specs | `e2e/tests/` | User's actual test implementations |
| API mocking patterns | `e2e/tests/` | User's API structure |

### Project Integration (User Must Configure)

| Responsibility | File | Why |
|----------------|------|-----|
| Package.json scripts | `package.json` | User's package manager |
| Fixtures wrapper | `e2e/fixtures.ts` | User's customizations |
| Git ignores | `.gitignore` | User adds `artifacts/` |

---

## The Boundary

```
┌─────────────────────────────────────────────────────────────────┐
│                        NPM PACKAGE                              │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   cursor    │  │    story    │  │  createVisualFixtures   │ │
│  │  .click()   │  │  .setup()   │  │                         │ │
│  │  .fill()    │  │  .step()    │  │  Returns extended test  │ │
│  │  .hover()   │  │  .hide()    │  │  with page overrides    │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  CSS Styles │ JS Scripts │ Helpers │ Env Detection      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               │ npm install
                               │ import { ... }
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      USER'S PROJECT                             │
│                                                                 │
│  e2e/                                                           │
│  ├── fixtures.ts          ← Imports from package, adds config   │
│  ├── context.md           ← User documents their app            │
│  └── tests/                                                     │
│      └── example.spec.ts  ← User writes actual tests            │
│                                                                 │
│  playwright.config.ts     ← User sets baseURL, webServer        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary

| Owner | Count | Percentage | Nature |
|-------|-------|------------|--------|
| Package | 29 | 69% | Generic, reusable, versioned |
| User | 13 | 31% | App-specific, owned forever |

The package handles all the **complexity**. The user handles all the **customization**.
