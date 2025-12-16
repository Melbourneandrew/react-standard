import { expect, test } from "../fixtures";

const SHOW_CURSOR = process.env.SHOW_CURSOR === "true";

test.describe("Item View", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/collections/coll-1");
    await expect(page.locator(".animate-spin")).not.toBeVisible({
      timeout: 10000,
    });
  });

  test("should open view dialog when clicking eye button", async ({ page }) => {
    const firstItem = page.locator(".rounded-lg.border").first();
    const viewButton = firstItem.locator("button:has(svg.lucide-eye)");

    if (SHOW_CURSOR) {
      await page.cursor.clickElement(viewButton);
    } else {
      await viewButton.click();
    }

    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("should display item details in view dialog", async ({ page }) => {
    const firstItem = page.locator(".rounded-lg.border").first();
    const viewButton = firstItem.locator("button:has(svg.lucide-eye)");

    if (SHOW_CURSOR) {
      await page.cursor.clickElement(viewButton);
    } else {
      await viewButton.click();
    }

    await expect(page.getByRole("dialog")).toBeVisible();

    // Wait for item to load (title should not be "Loading..." or "Error")
    const dialogTitle = page.getByRole("dialog").locator("h2");
    await expect(dialogTitle).not.toHaveText("Loading...", { timeout: 5000 });
    await expect(dialogTitle).not.toHaveText("Error");

    // Verify the dialog content
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Created")).toBeVisible();
    await expect(dialog.getByText("Last Updated")).toBeVisible();
  });

  test("should close view dialog", async ({ page }) => {
    const firstItem = page.locator(".rounded-lg.border").first();
    const viewButton = firstItem.locator("button:has(svg.lucide-eye)");

    if (SHOW_CURSOR) {
      await page.cursor.clickElement(viewButton);
    } else {
      await viewButton.click();
    }
    await expect(page.getByRole("dialog")).toBeVisible();

    // Close with Escape key
    await page.keyboard.press("Escape");

    await expect(page.getByRole("dialog")).not.toBeVisible();
  });
});
