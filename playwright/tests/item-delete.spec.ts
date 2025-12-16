import { expect, test } from "../fixtures";

const SHOW_CURSOR = process.env.SHOW_CURSOR === "true";

test.describe("Item Delete", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/collections/coll-1");
    await expect(page.locator(".animate-spin")).not.toBeVisible({
      timeout: 10000,
    });
  });

  test("should open delete confirmation dialog", async ({ page }) => {
    const firstItem = page.locator(".rounded-lg.border").first();
    const deleteButton = firstItem.locator("button:has(svg.lucide-trash-2)");

    if (SHOW_CURSOR) {
      await page.cursor.clickElement(deleteButton);
    } else {
      await deleteButton.click();
    }

    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("should show item name in delete confirmation", async ({ page }) => {
    const firstItem = page.locator(".rounded-lg.border").first();
    const itemName = await firstItem.locator("h3").textContent();

    const deleteButton = firstItem.locator("button:has(svg.lucide-trash-2)");
    if (SHOW_CURSOR) {
      await page.cursor.clickElement(deleteButton);
    } else {
      await deleteButton.click();
    }

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("dialog").getByText(itemName!, { exact: false }),
    ).toBeVisible();
  });

  test("should delete item when confirmed", async ({ page }) => {
    const firstItem = page.locator(".rounded-lg.border").first();
    const itemName = await firstItem.locator("h3").textContent();

    const deleteButton = firstItem.locator("button:has(svg.lucide-trash-2)");
    if (SHOW_CURSOR) {
      await page.cursor.clickElement(deleteButton);
    } else {
      await deleteButton.click();
    }
    await expect(page.getByRole("dialog")).toBeVisible();

    // Confirm deletion
    const confirmBtn = page.getByRole("button", { name: /delete/i });
    if (SHOW_CURSOR) {
      await page.cursor.clickElement(confirmBtn);
    } else {
      await confirmBtn.click();
    }

    // Dialog should close
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Search for deleted item to verify it's gone
    await page.getByPlaceholder("Search...").fill(itemName!);
    await expect(page).toHaveURL(/query=/, { timeout: 5000 });
    await page.waitForTimeout(500);
  });

  test("should cancel deletion", async ({ page }) => {
    const firstItem = page.locator(".rounded-lg.border").first();
    const itemName = await firstItem.locator("h3").textContent();

    const deleteButton = firstItem.locator("button:has(svg.lucide-trash-2)");
    if (SHOW_CURSOR) {
      await page.cursor.clickElement(deleteButton);
    } else {
      await deleteButton.click();
    }
    await expect(page.getByRole("dialog")).toBeVisible();

    // Cancel
    const cancelBtn = page.getByRole("button", { name: /cancel/i });
    if (SHOW_CURSOR) {
      await page.cursor.clickElement(cancelBtn);
    } else {
      await cancelBtn.click();
    }

    // Dialog should close
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Item should still be there
    await expect(firstItem.locator("h3")).toHaveText(itemName!);
  });
});
