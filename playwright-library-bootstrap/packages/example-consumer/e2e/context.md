# Example Consumer - Test Context

This is an example context file demonstrating what a real project would document.

## Application Overview

- **App name**: Example.com Demo
- **Base URL**: https://example.com
- **Type**: Static demo site (no auth, no dynamic content)

## Key Selectors

| Element | Selector | Notes |
|---------|----------|-------|
| Main heading | `h1` | "Example Domain" |
| More info link | `a[href*="iana"]` | Links to IANA |
| Body content | `body > div` | Main content wrapper |

## Known Quirks

- None - it's a static page!

## Test Patterns

Since this is a static site, tests are simple navigation and assertion checks.

```typescript
// Navigate to the page
await page.goto('/');

// Verify heading
await expect(page.getByRole('heading')).toContainText('Example Domain');
```



