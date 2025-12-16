import { expect, test } from "../fixtures";

test.describe("Items Pagination", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/collections/coll-1");
    await expect(page.locator(".animate-spin")).not.toBeVisible({
      timeout: 10000,
    });
  });

  test("should show pagination controls when there are multiple pages", async ({
    page,
  }) => {
    await expect(page.getByRole("button", { name: "Previous" })).toBeVisible();
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
    const nextButton = page.getByRole("button", { name: "Next", exact: true });
    await nextButton.click();

    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByText(/Page 2 of \d+/)).toBeVisible();
  });

  test("should navigate back to previous page", async ({ page }) => {
    // Go to page 2 first
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page).toHaveURL(/page=2/);

    // Click previous
    await page.getByRole("button", { name: "Previous" }).click();

    await expect(page.getByText(/Page 1 of \d+/)).toBeVisible();
  });

  test("should disable Next button on last page", async ({ page }) => {
    // Get total pages
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

// Separate describe block for tests needing custom route setup
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

    await page.goto("/collections/coll-1");

    // Wait for the mocked item to appear
    await expect(page.getByText("Single Item")).toBeVisible({ timeout: 10000 });

    // Pagination controls should not be visible
    await expect(
      page.getByRole("button", { name: "Previous" }),
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Next", exact: true }),
    ).not.toBeVisible();
  });
});
