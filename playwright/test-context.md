# Playwright Test Context

This document provides context for generating and maintaining Playwright tests from the Gherkin feature files.

## Application Overview

A collections and items management app built with Next.js 15, React 19, and TanStack Query.

### Routes

| Route                    | Description                    |
| ------------------------ | ------------------------------ |
| `/`                      | Welcome page with collection selector |
| `/collections/:id`       | Items list for a specific collection |

### URL Parameters

| Parameter | Example          | Description                     |
| --------- | ---------------- | ------------------------------- |
| `query`   | `?query=foo`     | Search filter for items         |
| `page`    | `?page=2`        | Current pagination page         |

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
- **Location**: Welcome page card and collection pages
- **Behavior**: Lazy-loads collections when opened

### Items List

- **Item card selector**: `.rounded-lg.border`
- **Loading indicator**: `.animate-spin` (Loader2 icon)
- **Empty state text**: "No items found"

### Item Action Buttons

Each item card has 3 action buttons with Lucide icons:

| Action | Icon Class          | Position |
| ------ | ------------------- | -------- |
| View   | `svg.lucide-eye`    | 1st      |
| Edit   | `svg.lucide-pencil` | 2nd      |
| Delete | `svg.lucide-trash-2`| 3rd      |

### Pagination

- **Previous button**: `getByRole("button", { name: "Previous" })`
- **Next button**: `getByRole("button", { name: "Next", exact: true })` ⚠️
- **Page info**: Text matching `/Page \d+ of \d+/`

### Create Button

- **Selector**: `button:has(svg.lucide-plus)`
- **Location**: Next to search input

### Dialogs

- **Role**: `dialog`
- **Close methods**: Cancel button, Escape key, or clicking outside
- **Form fields**: Labeled inputs (`getByLabel("Name")`, `getByLabel("Description")`)

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

## Timing Recommendations

| Operation              | Recommended Timeout |
| ---------------------- | ------------------- |
| Items loading          | 10000ms             |
| Collection dropdown    | 10000ms             |
| Search URL update      | 5000ms              |
| Dialog animations      | Default (5000ms)    |
