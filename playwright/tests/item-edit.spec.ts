import { expect, test } from "@playwright/test";

test.describe("Item Edit", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/collections/coll-1");
    // Wait for items to load
    await expect(page.locator(".animate-spin")).not.toBeVisible({
      timeout: 10000,
    });
  });

  test("should open edit dialog when clicking pencil button", async ({
    page,
  }) => {
    // Find first item's edit button (pencil icon)
    const firstItem = page.locator(".rounded-lg.border").first();
    const editButton = firstItem.locator("button:has(svg.lucide-pencil)");
    await editButton.click();

    // Dialog should open
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("should pre-fill form with item data", async ({ page }) => {
    // Get first item's name
    const firstItem = page.locator(".rounded-lg.border").first();
    const itemName = await firstItem.locator("h3").textContent();

    // Click edit
    const editButton = firstItem.locator("button:has(svg.lucide-pencil)");
    await editButton.click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Name field should be pre-filled
    await expect(page.getByLabel("Name")).toHaveValue(itemName!);
  });

  test("should update item successfully", async ({ page }) => {
    // Click edit on first item
    const firstItem = page.locator(".rounded-lg.border").first();
    const editButton = firstItem.locator("button:has(svg.lucide-pencil)");
    await editButton.click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Change the name to something unique
    const uniqueName = `Updated ${Date.now()}`;
    await page.getByLabel("Name").clear();
    await page.getByLabel("Name").fill(uniqueName);

    // Save and wait for dialog to close
    const saveButton = page.getByRole("button", { name: /save/i });
    await saveButton.click();

    // Wait for dialog to close (increased timeout for slower CI environments)
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 15000 });

    // The first item should now have the updated name (optimistic update)
    await expect(firstItem.locator("h3")).toHaveText(uniqueName, {
      timeout: 10000,
    });
  });

  test("should cancel edit without saving", async ({ page }) => {
    // Get first item's original name
    const firstItem = page.locator(".rounded-lg.border").first();
    const originalName = await firstItem.locator("h3").textContent();

    // Click edit
    const editButton = firstItem.locator("button:has(svg.lucide-pencil)");
    await editButton.click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Change the name
    await page.getByLabel("Name").clear();
    await page.getByLabel("Name").fill("Should Not Be Saved");

    // Cancel
    await page.getByRole("button", { name: /cancel/i }).click();

    // Dialog should close
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Item should still have original name
    await expect(firstItem.locator("h3")).toHaveText(originalName!);
  });
});
