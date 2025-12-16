import { expect, test } from "@playwright/test";

test.describe("Items Pagination", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/collections/coll-1");
    // Wait for items to load
    await expect(page.locator(".animate-spin")).not.toBeVisible({
      timeout: 10000,
    });
  });

  test("should show pagination controls when there are multiple pages", async ({
    page,
  }) => {
    // Collection has 100 items, so pagination should be visible
    await expect(
      page.getByRole("button", { name: "Previous" }),
    ).toBeVisible();
    // Use exact: true to avoid matching Next.js dev tools button
    await expect(
      page.getByRole("button", { name: "Next", exact: true }),
    ).toBeVisible();

    // Should show page info
    await expect(page.getByText(/Page \d+ of \d+/)).toBeVisible();
  });

  test("should disable Previous button on first page", async ({ page }) => {
    const previousButton = page.getByRole("button", { name: "Previous" });

    await expect(previousButton).toBeDisabled();
  });

  test("should navigate to next page", async ({ page }) => {
    // Use exact: true to avoid matching Next.js dev tools button
    const nextButton = page.getByRole("button", { name: "Next", exact: true });

    // Click next
    await nextButton.click();

    // URL should reflect page 2
    await expect(page).toHaveURL(/page=2/);

    // Should show page 2 of X
    await expect(page.getByText(/Page 2 of \d+/)).toBeVisible();
  });

  test("should navigate back to previous page", async ({ page }) => {
    // Go to page 2 first
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page).toHaveURL(/page=2/);

    // Click previous
    await page.getByRole("button", { name: "Previous" }).click();

    // Should be back on page 1 (no page param or page=1)
    await expect(page.getByText(/Page 1 of \d+/)).toBeVisible();
  });

  test("should disable Next button on last page", async ({ page }) => {
    // Navigate to the last page by going through pages
    // First, get the total pages from the text
    const pageInfo = page.getByText(/Page \d+ of (\d+)/);
    const text = await pageInfo.textContent();
    const totalPages = parseInt(text?.match(/of (\d+)/)?.[1] || "1");

    // Navigate to last page
    for (let i = 1; i < totalPages; i++) {
      await page.getByRole("button", { name: "Next", exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`page=${i + 1}`));
    }

    // Next button should be disabled
    await expect(
      page.getByRole("button", { name: "Next", exact: true }),
    ).toBeDisabled();
  });

});

// Separate describe block for tests that need custom route setup
test.describe("Items Pagination - Edge Cases", () => {
  test("should not show pagination controls for small collections", async ({
    page,
  }) => {
    // Set up route interception BEFORE navigating
    await page.route("**/api/collections/*/items*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              id: "item-single",
              name: "Single Item",
              description: "Only one item",
              collection_id: "coll-1",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          total_count: 1,
          page: 1,
          page_size: 10,
          total_pages: 1,
        }),
      });
    });

    // Navigate AFTER setting up the route
    await page.goto("/collections/coll-1");

    // Wait for the mocked item to appear
    await expect(page.getByText("Single Item")).toBeVisible({ timeout: 10000 });

    // Pagination controls should not be visible (only 1 page)
    await expect(page.getByRole("button", { name: "Previous" })).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Next", exact: true }),
    ).not.toBeVisible();
  });
});
