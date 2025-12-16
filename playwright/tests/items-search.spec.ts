import { expect, test } from "../fixtures";

const SHOW_CURSOR = process.env.SHOW_CURSOR === "true";

test.describe("Items Search", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/collections/coll-1");
    await expect(page.locator(".animate-spin")).not.toBeVisible({
      timeout: 10000,
    });
  });

  test("should filter items when searching", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search...");

    if (SHOW_CURSOR) {
      await page.cursor.clickElement(searchInput);
    }
    await searchInput.fill("Phoenix");

    // Wait for debounce and URL update
    await expect(page).toHaveURL(/query=Phoenix/, { timeout: 5000 });

    // Items should be filtered
    await expect(page.getByText(/\d+ items?/)).toBeVisible();
  });

  test("should update URL with search query", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search...");

    if (SHOW_CURSOR) {
      await page.cursor.clickElement(searchInput);
    }
    await searchInput.fill("Dragon");

    await expect(page).toHaveURL(/query=Dragon/, { timeout: 5000 });
  });

  test("should clear search and show all items", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search...");

    // First search for something
    if (SHOW_CURSOR) {
      await page.cursor.clickElement(searchInput);
    }
    await searchInput.fill("Phoenix");
    await expect(page).toHaveURL(/query=Phoenix/, { timeout: 5000 });

    // Clear the search
    await searchInput.clear();

    // URL should not have query param
    await expect(page).not.toHaveURL(/query=/, { timeout: 5000 });
  });

  test("should show 'No items found' for non-matching search", async ({
    page,
  }) => {
    const searchInput = page.getByPlaceholder("Search...");

    if (SHOW_CURSOR) {
      await page.cursor.clickElement(searchInput);
    }
    await searchInput.fill("xyznonexistent123");

    await expect(page).toHaveURL(/query=xyznonexistent123/, { timeout: 5000 });

    await expect(page.getByText("No items found")).toBeVisible();
  });

  test("should persist search on page refresh", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search...");

    if (SHOW_CURSOR) {
      await page.cursor.clickElement(searchInput);
    }
    await searchInput.fill("Phoenix");
    await expect(page).toHaveURL(/query=Phoenix/, { timeout: 5000 });

    // Refresh the page
    await page.reload();

    // Search input should still have the query
    await expect(searchInput).toHaveValue("Phoenix");
  });
});
