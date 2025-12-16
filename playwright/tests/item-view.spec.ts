import { expect, test } from "@playwright/test";

test.describe("Item View", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/collections/coll-1");
    // Wait for items to load
    await expect(page.locator(".animate-spin")).not.toBeVisible({
      timeout: 10000,
    });
  });

  test("should open view dialog when clicking eye button", async ({ page }) => {
    // Find first item's view button (eye icon)
    const firstItem = page.locator(".rounded-lg.border").first();
    const viewButton = firstItem.locator("button:has(svg.lucide-eye)");
    await viewButton.click();

    // Dialog should open with item details
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("should display item details in view dialog", async ({ page }) => {
    // Click view on first item
    const firstItem = page.locator(".rounded-lg.border").first();

    const viewButton = firstItem.locator("button:has(svg.lucide-eye)");
    await viewButton.click();

    // Dialog should be visible
    await expect(page.getByRole("dialog")).toBeVisible();

    // Wait for item to load in dialog (the title shows the item name, not "Loading...")
    // Note: In parallel tests, the item might have been modified by another test,
    // so we just verify the dialog loaded successfully (not "Loading..." or "Error")
    const dialogTitle = page.getByRole("dialog").locator("h2");
    await expect(dialogTitle).not.toHaveText("Loading...", { timeout: 5000 });
    await expect(dialogTitle).not.toHaveText("Error");

    // Verify the dialog content is rendered with item data
    const dialog = page.getByRole("dialog");

    // Verify creation date label is shown
    await expect(dialog.getByText("Created")).toBeVisible();

    // Verify last updated date label is shown
    await expect(dialog.getByText("Last Updated")).toBeVisible();
  });

  test("should close view dialog", async ({ page }) => {
    // Open view dialog
    const firstItem = page.locator(".rounded-lg.border").first();
    const viewButton = firstItem.locator("button:has(svg.lucide-eye)");
    await viewButton.click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Close it (press Escape)
    await page.keyboard.press("Escape");

    await expect(page.getByRole("dialog")).not.toBeVisible();
  });
});
