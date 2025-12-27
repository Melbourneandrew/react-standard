# App Testing Context

<!--
LLM INSTRUCTION: Fill out this template by asking the user about their app.
This file documents app-specific selectors, timing quirks, and patterns.
Tests should reference this file rather than hardcoding selectors.
-->

## Application Basics

- **App name**: _______________
- **Base URL (local)**: http://localhost:____
- **Base URL (staging)**: _______________
- **Framework**: _______________ (e.g., Next.js, React, Vue)

## Routes

| Route | Description |
|-------|-------------|
| `/` | |
| `/login` | |
| `/dashboard` | |
| | |

## Authentication (if applicable)

- **Login page route**: _______________
- **Username/email field**: `_______________` (selector)
- **Password field**: `_______________` (selector)
- **Submit button**: `_______________` (selector)
- **Success indicator**: _______________ (what proves login worked?)
- **Test credentials**: _______________

## Common Selectors

<!-- Document key interactive elements in your app -->

| Element | Selector | Notes |
|---------|----------|-------|
| Primary navigation | | |
| Main content area | | |
| Loading spinner | | |
| Modal dialogs | | |
| Toast notifications | | |
| Create/Add button | | |
| Submit button | | |
| Cancel button | | |

## Timing & Loading

### Characteristics

- [ ] Single-page app (SPA) with client-side routing
- [ ] Server-side rendering (SSR)
- [ ] Heavy animations that need waits
- [ ] Lazy-loaded content
- [ ] Real-time/WebSocket updates
- [ ] Debounced search inputs

### Recommended Timeouts

| Operation | Timeout | Notes |
|-----------|---------|-------|
| Page load | ms | |
| API responses | ms | |
| Modal animations | ms | |
| Search debounce | ms | |

### Specific Waits

```typescript
// Examples of waits needed for this app:
// await page.waitForSelector('.dashboard-loaded');
// await expect(page.locator('.loading')).not.toBeVisible({ timeout: 10000 });
// await page.waitForLoadState('networkidle');
```

## Known Quirks

<!-- Things that will trip up generated tests -->

1. _______________
2. _______________
3. _______________

## API Mocking Patterns

<!-- If tests need to mock API responses -->

```typescript
// Example: Mock empty state
await page.route("**/api/items*", (route) => {
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ items: [], total: 0 }),
  });
});
```

## Test Data

- **Test user credentials**: _______________
- **Resettable test data?**: Yes / No
- **Data cleanup strategy**: _______________
- **Unique data pattern**: `Test Item ${Date.now()}` (prevents conflicts)

## Common Test Patterns

### Navigation

```typescript
// Standard navigation + wait pattern
await page.goto("/your-route");
await expect(page.locator("YOUR_LOADING_SELECTOR")).not.toBeVisible({ timeout: 10000 });
```

### Form Submission

```typescript
// Standard form pattern
await cursor.fill(page, page.getByLabel("Field Name"), "value");
await cursor.click(page, page.getByRole("button", { name: /submit/i }));
await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10000 });
```

### CRUD Operations

```typescript
// Create
await cursor.click(page, page.locator("CREATE_BUTTON_SELECTOR"));
await expect(page.getByRole("dialog")).toBeVisible();

// Read/View
await cursor.click(page, page.locator("VIEW_BUTTON_SELECTOR"));

// Update/Edit
await cursor.click(page, page.locator("EDIT_BUTTON_SELECTOR"));

// Delete
await cursor.click(page, page.locator("DELETE_BUTTON_SELECTOR"));
await cursor.click(page, page.getByRole("button", { name: /confirm|delete/i }));
```
