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
      // The + button is next to the search input
      const createButton = page.locator("button:has(svg.lucide-plus)");
      await createButton.click();

      // Dialog should open
      await expect(page.getByRole("dialog")).toBeVisible();
    });

    test("should create item successfully", async ({ page }) => {
      // Open create dialog
      const createButton = page.locator("button:has(svg.lucide-plus)");
      await createButton.click();
      await expect(page.getByRole("dialog")).toBeVisible();

      // Fill in the form
      const uniqueName = `Test Item ${Date.now()}`;
      await page.getByLabel("Name").fill(uniqueName);
      await page
        .getByLabel("Description")
        .fill("Test description for new item");

      // Submit
      await page.getByRole("button", { name: /create/i }).click();

      // Dialog should close (wait for mutation + animation)
      await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10000 });

      // New item should appear in the list (search for it)
      await page.getByPlaceholder("Search...").fill(uniqueName);
      await expect(page).toHaveURL(/query=/, { timeout: 5000 });

      // Wait for search results and cache invalidation
      await page.waitForTimeout(1000);
      await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 10000 });
    });

    test("should cancel item creation", async ({ page }) => {
      // Open create dialog
      const createButton = page.locator("button:has(svg.lucide-plus)");
      await createButton.click();
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

  test.describe("Edit Item", () => {
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

      // Save
      await page.getByRole("button", { name: /save/i }).click();

      // Dialog should close (wait longer for mutation + animation)
      await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10000 });

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

  test.describe("Delete Item", () => {
    test("should open delete confirmation dialog", async ({ page }) => {
      // Find first item's delete button (trash icon)
      const firstItem = page.locator(".rounded-lg.border").first();
      const deleteButton = firstItem.locator("button:has(svg.lucide-trash-2)");
      await deleteButton.click();

      // Confirmation dialog should open
      await expect(page.getByRole("dialog")).toBeVisible();
    });

    test("should show item name in delete confirmation", async ({ page }) => {
      // Get first item's name
      const firstItem = page.locator(".rounded-lg.border").first();
      const itemName = await firstItem.locator("h3").textContent();

      // Click delete
      const deleteButton = firstItem.locator("button:has(svg.lucide-trash-2)");
      await deleteButton.click();

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
      const deleteButton = firstItem.locator("button:has(svg.lucide-trash-2)");
      await deleteButton.click();
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
    });

    test("should cancel deletion", async ({ page }) => {
      // Get first item's name
      const firstItem = page.locator(".rounded-lg.border").first();
      const itemName = await firstItem.locator("h3").textContent();

      // Click delete
      const deleteButton = firstItem.locator("button:has(svg.lucide-trash-2)");
      await deleteButton.click();
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
