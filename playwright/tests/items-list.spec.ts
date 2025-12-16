import { expect, test } from "../fixtures";

test.describe("Items List", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/collections/coll-1");
  });

  test("should display items in the collection", async ({ page }) => {
    // Wait for items to load
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
    await expect(page.locator(".animate-spin")).not.toBeVisible({
      timeout: 10000,
    });

    // First item should have a name (h3 element)
    const firstItem = page.locator(".rounded-lg.border").first();
    await expect(firstItem.locator("h3")).toBeVisible();

    // Verify we can read the item name
    const itemName = await firstItem.locator("h3").textContent();
    expect(itemName).toBeTruthy();
  });

  test("should show action buttons for each item", async ({ page }) => {
    await expect(page.locator(".animate-spin")).not.toBeVisible({
      timeout: 10000,
    });

    const firstItem = page.locator(".rounded-lg.border").first();

    // Should have 3 action buttons (view, edit, delete)
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

  test("should show 'No items found' for empty collection", async ({ page }) => {
    // Intercept API to return empty items list
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

    await expect(page.getByText("No items found")).toBeVisible({
      timeout: 10000,
    });
  });
});
