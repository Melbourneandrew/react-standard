# Playwright Test Context

This document provides context for generating and maintaining Playwright tests from the Gherkin feature files.

## Test Generation Overview

Tests are driven entirely by Gherkin feature files. Each feature file defines user stories that map directly to test scenarios. To regenerate tests:

1. Read the feature file in `features/`
2. Reference this context file for selectors, patterns, and quirks
3. Reference `selectors.json` for structured selector data
4. Generate the corresponding `.spec.ts` file in `tests/`

## Test Framework Setup

### Imports

Tests **must** import from the local fixtures file:

```typescript
import { test, expect, cursor } from "../fixtures";
```

### Cursor API (Explicit Opt-In)

Tests use explicit `cursor.*` functions for user interactions. When `SHOW_CURSOR=true`, these animate the cursor; when disabled, they just perform the action directly.

```typescript
// Click with cursor animation (when SHOW_CURSOR=true)
await cursor.click(page, locator);

// Fill with cursor animation + human-like typing
await cursor.fill(page, locator, "text value");

// Hover with cursor animation
await cursor.hover(page, locator);
```

**Why explicit?** No magic monkey-patching. Clear intent. Easy to debug. The cursor behavior is an opt-in feature, not a hidden side effect.

### Debug Mode Features

When running `pnpm test:debug` (SHOW_CURSOR=true):

- Animated SVG cursor with arc movement
- Click ripple effects + cursor bounce on click
- Fast human-like typing (~100 chars/sec)
- **Test timeout increased to 60s** (cursor animations add ~300ms per interaction)

### Package Scripts

| Script | Command | Description |
| ------ | ------- | ----------- |
| `pnpm test` | `playwright test` | Run all tests headless |
| `pnpm test:headed` | `playwright test --headed` | Run with browser visible |
| `pnpm test:debug` | `SHOW_CURSOR=true playwright test --headed --workers=1` | Debug mode with animated cursor |
| `pnpm test:report` | `playwright show-report` | View HTML test report |

## Test Structure Conventions

### File Mapping

Tests follow a **1:1 mapping** with feature files:

| Feature File | Test File |
| ------------ | --------- |
| `features/collections.feature` | `tests/collections.spec.ts` |
| `features/error-handling.feature` | `tests/error-handling.spec.ts` |
| `features/item-create.feature` | `tests/item-create.spec.ts` |
| `features/item-delete.feature` | `tests/item-delete.spec.ts` |
| `features/item-edit.feature` | `tests/item-edit.spec.ts` |
| `features/item-view.feature` | `tests/item-view.spec.ts` |
| `features/items-list.feature` | `tests/items-list.spec.ts` |
| `features/items-pagination.feature` | `tests/items-pagination.spec.ts` |
| `features/items-search.feature` | `tests/items-search.spec.ts` |

### Test Setup Pattern

Item-related tests (item-create, item-view, item-edit, item-delete) use a shared `beforeEach`:

```typescript
test.beforeEach(async ({ page }) => {
  await page.goto("/collections/coll-1");
  await expect(page.locator(".animate-spin")).not.toBeVisible({
    timeout: 10000,
  });
});
```

Tests that need custom route mocking should use a **separate describe block** without `beforeEach` to set up routes before navigation.

## Application Overview

A collections and items management app built with Next.js 15, React 19, and TanStack Query.

### Routes

| Route | Description |
| ----- | ----------- |
| `/` | Welcome page with collection selector |
| `/collections/:id` | Items list for a specific collection |

### URL Parameters

| Parameter | Example | Description |
| --------- | ------- | ----------- |
| `query` | `?query=foo` | Search filter for items |
| `page` | `?page=2` | Current pagination page |

## API Response Format

### Items List Response

The API uses **snake_case** for field names:

```json
{
  "items": [...],
  "total_count": 100,
  "page": 1,
  "page_size": 10,
  "total_pages": 10
}
```

### Item Object

```json
{
  "id": "1",
  "name": "Azure Phoenix Protocol",
  "description": "Optional description",
  "collection_id": "coll-1",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

### Mock Route Pattern

To intercept API requests:

```typescript
await page.route("**/api/collections/*/items*", (route) => {
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      items: [...],
      total_count: 0,
      page: 1,
      page_size: 10,
      total_pages: 0,
    }),
  });
});
```

## Mock Data

The app uses in-memory mock data generated at runtime.

### Collections

- **Count**: 5 collections
- **IDs**: `coll-1`, `coll-2`, `coll-3`, `coll-4`, `coll-5`
- **Names**: Random single words from a word bank (e.g., "Atlas", "Beacon", "Cosmos")

### Items

- **Count**: 100 items per collection (500 total)
- **Names**: Generated pattern `[Adjective] [Noun] [Descriptor]` (e.g., "Azure Phoenix Protocol")
- **Page size**: 10 items per page (10 pages per collection)

## UI Components

### Collection Dropdown

- **Component**: Radix UI Select
- **Role**: `combobox`
- **Location**: Welcome page card AND navbar (TWO instances on home page)
- **Behavior**: Lazy-loads collections when opened

### Items List

- **Item card selector**: `.rounded-lg.border`
- **Item name**: `h3` element within card
- **Loading indicator**: `.animate-spin` (Loader2 icon)
- **Empty state text**: "No items found"
- **Items count**: Text matching `/\d+ items?/`

### Item Action Buttons

Each item card has 3 action buttons with Lucide icons:

| Action | Icon Class | Selector |
| ------ | ---------- | -------- |
| View | `svg.lucide-eye` | `button:has(svg.lucide-eye)` |
| Edit | `svg.lucide-pencil` | `button:has(svg.lucide-pencil)` |
| Delete | `svg.lucide-trash-2` | `button:has(svg.lucide-trash-2)` |

### Pagination

- **Previous button**: `getByRole("button", { name: "Previous" })`
- **Next button**: `getByRole("button", { name: "Next", exact: true })` ⚠️
- **Page info**: Text matching `/Page \d+ of \d+/`
- **Visibility**: Only shown when `totalPages > 1`

### Create Button

- **Selector**: `button:has(svg.lucide-plus)`
- **Location**: Next to search input

### Dialogs

- **Role**: `dialog`
- **Close methods**: Cancel button, Escape key, or clicking outside
- **Form fields**: Labeled inputs (`getByLabel("Name")`, `getByLabel("Description")`)

#### View Dialog Content

| Label | Description |
| ----- | ----------- |
| Dialog title (`h2`) | Shows item name after loading |
| "Description" | Label for description (only shown if item has description) |
| "Created" | Label for creation date |
| "Last Updated" | Label for last updated date |

#### Dialog Action Buttons

| Dialog | Action | Selector Pattern |
| ------ | ------ | ---------------- |
| Create | Create | `/create/i` |
| Edit | Save | `/save/i` |
| Delete | Delete | `/delete/i` |
| All | Cancel | `/cancel/i` |

## Known Quirks

### Next.js Dev Tools Button Conflict

In development mode, Next.js adds a dev tools button with `aria-label="Open Next.js Dev Tools"`. This button contains "Next" in its accessible name, causing conflicts with the pagination "Next" button.

**Solution**: Always use `{ exact: true }` when selecting the pagination Next button:

```typescript
page.getByRole("button", { name: "Next", exact: true })
```

### Search Debounce

The search input has a 300ms debounce delay before updating the URL and fetching results. Tests should wait for the URL to update:

```typescript
await searchInput.fill("query");
await expect(page).toHaveURL(/query=/, { timeout: 5000 });
```

### Lazy-Loading Collections

The collection dropdown only fetches collections when opened. Tests should wait for the listbox to appear:

```typescript
await page.getByRole("combobox").click();
await expect(page.getByRole("listbox")).toBeVisible({ timeout: 10000 });
```

### Multiple Comboboxes on Home Page

The home page has TWO comboboxes (navbar + welcome card). Use positional selectors:

```typescript
const navDropdown = page.getByRole("combobox").first();
const cardDropdown = page.getByRole("combobox").nth(1);
```

### Optional Description Field

- Description is **not required** when creating/editing items
- Description paragraph only shows in item cards **if the item has a description**
- Description label only shows in view dialog **if the item has a description**

### Mutation Timing

After mutations (create/update/delete), optimistic updates may need time to settle:

```typescript
// Wait for dialog to close after mutation
await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 15000 });
```

## Timing Recommendations

| Operation | Recommended Timeout |
| --------- | ------------------- |
| Items loading | 10000ms |
| Collection dropdown | 10000ms |
| Search URL update | 5000ms |
| Search results | 10000ms |
| Dialog close after mutation | 15000ms |
| Default | 5000ms |

## Test File Template

Use this template when generating new test files:

```typescript
import { test, expect } from "../fixtures";

test.describe("Feature Name", () => {
  // Add beforeEach for item-related tests
  test.beforeEach(async ({ page }) => {
    await page.goto("/collections/coll-1");
    await expect(page.locator(".animate-spin")).not.toBeVisible({
      timeout: 10000,
    });
  });

  test("should [scenario from feature file]", async ({ page }) => {
    // Test implementation
  });
});
```

### Test Patterns by Feature Type

#### CRUD Operations (item-create, item-view, item-edit, item-delete)

```typescript
// Use shared beforeEach
test.beforeEach(async ({ page }) => {
  await page.goto("/collections/coll-1");
  await expect(page.locator(".animate-spin")).not.toBeVisible({ timeout: 10000 });
});

// For create: open dialog, fill form, submit, verify
// For view: click view button, verify dialog content
// For edit: click edit button, modify fields, save, verify
// For delete: click delete button, confirm, verify removal
```

#### List/Search/Pagination

```typescript
// Navigate and wait for content
await page.goto("/collections/coll-1");
await expect(page.locator(".rounded-lg.border").first()).toBeVisible({ timeout: 10000 });

// For search: fill input, wait for URL update
await page.getByPlaceholder("Search...").fill("query");
await expect(page).toHaveURL(/query=/, { timeout: 5000 });

// For pagination: click buttons, verify page info
await page.getByRole("button", { name: "Next", exact: true }).click();
await expect(page.getByText(/Page 2 of/)).toBeVisible();
```

#### API Mocking (for edge cases)

```typescript
test.describe("Edge Cases", () => {
  // NO beforeEach here - route must be set up before navigation

  test("should handle empty state", async ({ page }) => {
    await page.route("**/api/collections/*/items*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [],
          total_count: 0,
          page: 1,
          page_size: 10,
          total_pages: 0,
        }),
      });
    });

    await page.goto("/collections/coll-1");
    await expect(page.getByText("No items found")).toBeVisible({ timeout: 10000 });
  });
});
```

## Cursor Visualization (Debug Mode)

The fixtures system includes an animated cursor for visual debugging. When `SHOW_CURSOR=true`:

- A custom SVG cursor follows interactions
- Click animations show ripple effects
- Movement uses smooth eased animation

This is purely visual and works by **intercepting the `click()` method**. Tests run identically with or without the cursor - no conditional code or custom methods required.

## Regeneration Checklist

When regenerating tests from feature files:

1. ✅ Import from `../fixtures` (not `@playwright/test`)
2. ✅ Use 1:1 file mapping (feature name → test name)
3. ✅ Include `beforeEach` for item CRUD tests
4. ✅ Use separate `describe` blocks for tests needing route mocks
5. ✅ Use `{ exact: true }` for "Next" pagination button
6. ✅ Use appropriate timeouts from recommendations
7. ✅ Handle optional description field conditionally
8. ✅ Use `Date.now()` for unique test data names
9. ✅ Use snake_case for API mock responses
