import { test, expect } from "@playwright/test";

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
    await expect(page.getByRole("button", { name: "Previous" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Next" })).toBeVisible();

    // Should show page info
    await expect(page.getByText(/Page \d+ of \d+/)).toBeVisible();
  });

  test("should disable Previous button on first page", async ({ page }) => {
    const previousButton = page.getByRole("button", { name: "Previous" });

    await expect(previousButton).toBeDisabled();
  });

  test("should navigate to next page", async ({ page }) => {
    const nextButton = page.getByRole("button", { name: "Next" });

    // Click next
    await nextButton.click();

    // URL should reflect page 2
    await expect(page).toHaveURL(/page=2/);

    // Should show page 2 of X
    await expect(page.getByText(/Page 2 of \d+/)).toBeVisible();
  });

  test("should navigate back to previous page", async ({ page }) => {
    // Go to page 2 first
    await page.getByRole("button", { name: "Next" }).click();
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
      await page.getByRole("button", { name: "Next" }).click();
      await expect(page).toHaveURL(new RegExp(`page=${i + 1}`));
    }

    // Next button should be disabled
    await expect(page.getByRole("button", { name: "Next" })).toBeDisabled();
  });
});
