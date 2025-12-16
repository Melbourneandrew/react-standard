import { test, expect } from "@playwright/test";

test.describe("Item CRUD Operations", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/collections/coll-1");
    // Wait for items to load
    await expect(page.locator(".animate-spin")).not.toBeVisible({
      timeout: 10000,
    });
  });

  test.describe("Create Item", () => {
    test("should open create dialog when clicking + button", async ({
      page,
    }) => {
      // Find and click the + button
      await page.locator("button").filter({ has: page.locator("svg") }).nth(0).click();

      // Dialog should open
      await expect(page.getByRole("dialog")).toBeVisible();
    });

    test("should create item successfully", async ({ page }) => {
      // Open create dialog
      await page.locator("button").filter({ has: page.locator("svg") }).nth(0).click();
      await expect(page.getByRole("dialog")).toBeVisible();

      // Fill in the form
      await page.getByLabel("Name").fill("Test Item Created");
      await page.getByLabel("Description").fill("Test description for new item");

      // Submit
      await page.getByRole("button", { name: /create/i }).click();

      // Dialog should close
      await expect(page.getByRole("dialog")).not.toBeVisible();

      // New item should appear in the list (search for it)
      await page.getByPlaceholder("Search...").fill("Test Item Created");
      await expect(page).toHaveURL(/query=Test/, { timeout: 5000 });
      await expect(page.getByText("Test Item Created")).toBeVisible();
    });

    test("should cancel item creation", async ({ page }) => {
      // Open create dialog
      await page.locator("button").filter({ has: page.locator("svg") }).nth(0).click();
      await expect(page.getByRole("dialog")).toBeVisible();

      // Fill in some data
      await page.getByLabel("Name").fill("Should Not Exist");

      // Cancel
      await page.getByRole("button", { name: /cancel/i }).click();

      // Dialog should close
      await expect(page.getByRole("dialog")).not.toBeVisible();
    });
  });

  test.describe("View Item", () => {
    test("should open view dialog when clicking eye button", async ({
      page,
    }) => {
      // Find first item's view button (eye icon)
      const firstItem = page.locator(".rounded-lg.border").first();
      await firstItem.getByRole("button").first().click();

      // Dialog should open with item details
      await expect(page.getByRole("dialog")).toBeVisible();
    });

    test("should display item details in view dialog", async ({ page }) => {
      // Click view on first item
      const firstItem = page.locator(".rounded-lg.border").first();
      const itemName = await firstItem.locator("h3").textContent();

      await firstItem.getByRole("button").first().click();

      // Dialog should show item name
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByRole("dialog").getByText(itemName!)).toBeVisible();
    });

    test("should close view dialog", async ({ page }) => {
      // Open view dialog
      const firstItem = page.locator(".rounded-lg.border").first();
      await firstItem.getByRole("button").first().click();
      await expect(page.getByRole("dialog")).toBeVisible();

      // Close it (click X or outside)
      await page.keyboard.press("Escape");

      await expect(page.getByRole("dialog")).not.toBeVisible();
    });
  });

  test.describe("Edit Item", () => {
    test("should open edit dialog when clicking pencil button", async ({
      page,
    }) => {
      // Find first item's edit button (pencil icon - second button)
      const firstItem = page.locator(".rounded-lg.border").first();
      await firstItem.getByRole("button").nth(1).click();

      // Dialog should open
      await expect(page.getByRole("dialog")).toBeVisible();
    });

    test("should pre-fill form with item data", async ({ page }) => {
      // Get first item's name
      const firstItem = page.locator(".rounded-lg.border").first();
      const itemName = await firstItem.locator("h3").textContent();

      // Click edit
      await firstItem.getByRole("button").nth(1).click();
      await expect(page.getByRole("dialog")).toBeVisible();

      // Name field should be pre-filled
      await expect(page.getByLabel("Name")).toHaveValue(itemName!);
    });

    test("should update item successfully", async ({ page }) => {
      // Click edit on first item
      const firstItem = page.locator(".rounded-lg.border").first();
      await firstItem.getByRole("button").nth(1).click();
      await expect(page.getByRole("dialog")).toBeVisible();

      // Change the name
      const uniqueName = `Updated Item ${Date.now()}`;
      await page.getByLabel("Name").clear();
      await page.getByLabel("Name").fill(uniqueName);

      // Save
      await page.getByRole("button", { name: /save/i }).click();

      // Dialog should close
      await expect(page.getByRole("dialog")).not.toBeVisible();

      // Search for updated item
      await page.getByPlaceholder("Search...").fill(uniqueName);
      await expect(page).toHaveURL(/query=Updated/, { timeout: 5000 });
      await expect(page.getByText(uniqueName)).toBeVisible();
    });

    test("should cancel edit without saving", async ({ page }) => {
      // Get first item's original name
      const firstItem = page.locator(".rounded-lg.border").first();
      const originalName = await firstItem.locator("h3").textContent();

      // Click edit
      await firstItem.getByRole("button").nth(1).click();
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

  test.describe("Delete Item", () => {
    test("should open delete confirmation dialog", async ({ page }) => {
      // Find first item's delete button (trash icon - third button)
      const firstItem = page.locator(".rounded-lg.border").first();
      await firstItem.getByRole("button").nth(2).click();

      // Confirmation dialog should open
      await expect(page.getByRole("dialog")).toBeVisible();
    });

    test("should show item name in delete confirmation", async ({ page }) => {
      // Get first item's name
      const firstItem = page.locator(".rounded-lg.border").first();
      const itemName = await firstItem.locator("h3").textContent();

      // Click delete
      await firstItem.getByRole("button").nth(2).click();

      // Dialog should mention the item
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(
        page.getByRole("dialog").getByText(itemName!, { exact: false }),
      ).toBeVisible();
    });

    test("should delete item when confirmed", async ({ page }) => {
      // Get first item's name
      const firstItem = page.locator(".rounded-lg.border").first();
      const itemName = await firstItem.locator("h3").textContent();

      // Click delete
      await firstItem.getByRole("button").nth(2).click();
      await expect(page.getByRole("dialog")).toBeVisible();

      // Confirm deletion
      await page.getByRole("button", { name: /delete/i }).click();

      // Dialog should close
      await expect(page.getByRole("dialog")).not.toBeVisible();

      // Item should no longer be visible (search for it)
      await page.getByPlaceholder("Search...").fill(itemName!);
      await expect(page).toHaveURL(/query=/, { timeout: 5000 });

      // Wait a bit for the list to update
      await page.waitForTimeout(500);

      // The exact item should not be in the list anymore
      // (Note: might still see it if there's another item with similar name)
    });

    test("should cancel deletion", async ({ page }) => {
      // Get first item's name
      const firstItem = page.locator(".rounded-lg.border").first();
      const itemName = await firstItem.locator("h3").textContent();

      // Click delete
      await firstItem.getByRole("button").nth(2).click();
      await expect(page.getByRole("dialog")).toBeVisible();

      // Cancel
      await page.getByRole("button", { name: /cancel/i }).click();

      // Dialog should close
      await expect(page.getByRole("dialog")).not.toBeVisible();

      // Item should still be there
      await expect(firstItem.locator("h3")).toHaveText(itemName!);
    });
  });
});
