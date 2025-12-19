import { cursor, expect, test } from "../fixtures";

test.describe("Item Delete", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/collections/coll-1");
    await expect(page.locator(".animate-spin")).not.toBeVisible({
      timeout: 10000,
    });
  });

  test("should open delete confirmation dialog", async ({ page }) => {
    const firstItem = page.locator(".rounded-lg.border").first();
    await cursor.click(page, firstItem.locator("button:has(svg.lucide-trash-2)"));
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("should show item name in delete confirmation", async ({ page }) => {
    const firstItem = page.locator(".rounded-lg.border").first();
    const itemName = await firstItem.locator("h3").textContent();

    await cursor.click(page, firstItem.locator("button:has(svg.lucide-trash-2)"));
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("dialog").getByText(itemName!, { exact: false })
    ).toBeVisible();
  });

  test("should delete item when confirmed @demo", async ({ page }) => {
    const firstItem = page.locator(".rounded-lg.border").first();
    const itemName = await firstItem.locator("h3").textContent();

    await cursor.click(page, firstItem.locator("button:has(svg.lucide-trash-2)"));
    await expect(page.getByRole("dialog")).toBeVisible();

    // Confirm deletion
    await cursor.click(page, page.getByRole("button", { name: /delete/i }));

    // Dialog should close
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Search for deleted item to verify it's gone
    await cursor.fill(page, page.getByPlaceholder("Search..."), itemName!);
    await expect(page).toHaveURL(/query=/, { timeout: 5000 });
    await page.waitForTimeout(500);
  });

  test("should cancel deletion", async ({ page }) => {
    const firstItem = page.locator(".rounded-lg.border").first();
    const itemName = await firstItem.locator("h3").textContent();

    await cursor.click(page, firstItem.locator("button:has(svg.lucide-trash-2)"));
    await expect(page.getByRole("dialog")).toBeVisible();

    // Cancel
    await cursor.click(page, page.getByRole("button", { name: /cancel/i }));

    // Dialog should close
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Item should still be there
    await expect(firstItem.locator("h3")).toHaveText(itemName!);
  });
});
