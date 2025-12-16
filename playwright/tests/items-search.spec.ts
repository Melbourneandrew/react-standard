import { test, expect, cursor } from "../fixtures";

test.describe("Items Search", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/collections/coll-1");
    await expect(page.locator(".animate-spin")).not.toBeVisible({
      timeout: 10000,
    });
  });

  test("should filter items when searching", async ({ page }) => {
    await cursor.fill(page, page.getByPlaceholder("Search..."), "Phoenix");

    // Wait for debounce and URL update
    await expect(page).toHaveURL(/query=Phoenix/, { timeout: 5000 });

    // Items should be filtered
    await expect(page.getByText(/\d+ items?/)).toBeVisible();
  });

  test("should update URL with search query", async ({ page }) => {
    await cursor.fill(page, page.getByPlaceholder("Search..."), "Dragon");
    await expect(page).toHaveURL(/query=Dragon/, { timeout: 5000 });
  });

  test("should clear search and show all items", async ({ page }) => {
    // First search for something
    await cursor.fill(page, page.getByPlaceholder("Search..."), "Phoenix");
    await expect(page).toHaveURL(/query=Phoenix/, { timeout: 5000 });

    // Clear the search
    await cursor.fill(page, page.getByPlaceholder("Search..."), "");

    // URL should not have query param
    await expect(page).not.toHaveURL(/query=/, { timeout: 5000 });
  });

  test("should show 'No items found' for non-matching search", async ({
    page,
  }) => {
    await cursor.fill(page, page.getByPlaceholder("Search..."), "xyznonexistent123");

    await expect(page).toHaveURL(/query=xyznonexistent123/, { timeout: 5000 });

    await expect(page.getByText("No items found")).toBeVisible();
  });

  test("should persist search on page refresh", async ({ page }) => {
    await cursor.fill(page, page.getByPlaceholder("Search..."), "Phoenix");
    await expect(page).toHaveURL(/query=Phoenix/, { timeout: 5000 });

    // Refresh the page
    await page.reload();

    // Search input should still have the query
    await expect(page.getByPlaceholder("Search...")).toHaveValue("Phoenix");
  });
});
