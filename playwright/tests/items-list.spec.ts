import { test, expect } from "@playwright/test";

test.describe("Items List", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a collection with items
    await page.goto("/collections/coll-1");
  });

  test("should display items in the collection", async ({ page }) => {
    // Wait for items to load (loading spinner should disappear)
    await expect(page.locator(".animate-spin")).not.toBeVisible({
      timeout: 10000,
    });

    // Should see items count
    await expect(page.getByText(/\d+ items?/)).toBeVisible();

    // Should see item cards
    const items = page.locator(".rounded-lg.border");
    await expect(items.first()).toBeVisible();
  });

  test("should display item name and description", async ({ page }) => {
    // Wait for items to load
    await expect(page.locator(".animate-spin")).not.toBeVisible({
      timeout: 10000,
    });

    // First item should have a name (h3 element)
    const firstItem = page.locator(".rounded-lg.border").first();
    await expect(firstItem.locator("h3")).toBeVisible();

    // Should have description text
    await expect(
      firstItem.locator("p.text-muted-foreground").first(),
    ).toBeVisible();
  });

  test("should show action buttons for each item", async ({ page }) => {
    // Wait for items to load
    await expect(page.locator(".animate-spin")).not.toBeVisible({
      timeout: 10000,
    });

    const firstItem = page.locator(".rounded-lg.border").first();

    // Should have view, edit, delete buttons
    await expect(firstItem.getByRole("button").first()).toBeVisible();
    expect(await firstItem.getByRole("button").count()).toBe(3);
  });

  test("should show loading spinner while fetching", async ({ page }) => {
    // Intercept API to slow it down
    await page.route("**/api/collections/*/items*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.continue();
    });

    await page.goto("/collections/coll-1");

    // Should briefly show loading spinner
    await expect(page.locator(".animate-spin")).toBeVisible();
  });
});
