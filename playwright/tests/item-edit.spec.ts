import { expect, test } from "../fixtures";

test.describe("Item Edit", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/collections/coll-1");
    await expect(page.locator(".animate-spin")).not.toBeVisible({
      timeout: 10000,
    });
  });

  test("should open edit dialog when clicking pencil button", async ({
    page,
  }) => {
    const firstItem = page.locator(".rounded-lg.border").first();
    const editButton = firstItem.locator("button:has(svg.lucide-pencil)");
    await editButton.click();

    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("should pre-fill form with item data", async ({ page }) => {
    const firstItem = page.locator(".rounded-lg.border").first();
    const itemName = await firstItem.locator("h3").textContent();

    const editButton = firstItem.locator("button:has(svg.lucide-pencil)");
    await editButton.click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Name field should be pre-filled
    await expect(page.getByLabel("Name")).toHaveValue(itemName!);
  });

  test("should update item successfully", async ({ page }) => {
    const firstItem = page.locator(".rounded-lg.border").first();
    const editButton = firstItem.locator("button:has(svg.lucide-pencil)");
    await editButton.click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Change the name
    const uniqueName = `Updated ${Date.now()}`;
    await page.getByLabel("Name").clear();
    await page.getByLabel("Name").fill(uniqueName);

    // Save
    await page.getByRole("button", { name: /save/i }).click();

    // Dialog should close
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 15000 });

    // Item should have updated name
    await expect(firstItem.locator("h3")).toHaveText(uniqueName, {
      timeout: 10000,
    });
  });

  test("should cancel edit without saving", async ({ page }) => {
    const firstItem = page.locator(".rounded-lg.border").first();
    const originalName = await firstItem.locator("h3").textContent();

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
