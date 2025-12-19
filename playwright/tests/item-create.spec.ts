import { cursor, expect, test } from "../fixtures";

test.describe("Item Creation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/collections/coll-1");
    await expect(page.locator(".animate-spin")).not.toBeVisible({
      timeout: 10000,
    });
  });

  test("should open create dialog when clicking + button", async ({ page }) => {
    const createButton = page.locator("button:has(svg.lucide-plus)");
    await cursor.click(page, createButton);
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("should create item successfully @demo", async ({ page }) => {
    // Open create dialog
    await cursor.click(page, page.locator("button:has(svg.lucide-plus)"));
    await expect(page.getByRole("dialog")).toBeVisible();

    // Fill in the form
    const uniqueName = `Test Item ${Date.now()}`;
    await cursor.fill(page, page.getByLabel("Name"), uniqueName);
    await cursor.fill(page, page.getByLabel("Description"), "Test description for new item");

    // Submit
    await cursor.click(page, page.getByRole("button", { name: /create/i }));

    // Dialog should close - this confirms the item was created successfully
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10000 });

    // Wait for any pending mutations to complete
    await page.waitForLoadState("networkidle");
  });

  test("should create item with required fields only (name, no description)", async ({
    page,
  }) => {
    // Open create dialog
    await cursor.click(page, page.locator("button:has(svg.lucide-plus)"));
    await expect(page.getByRole("dialog")).toBeVisible();

    // Fill in only the name
    const uniqueName = `NameOnly ${Date.now()}`;
    await cursor.fill(page, page.getByLabel("Name"), uniqueName);

    // Submit
    await cursor.click(page, page.getByRole("button", { name: /create/i }));

    // Dialog should close
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10000 });
  });

  test("should cancel item creation", async ({ page }) => {
    // Open create dialog
    await cursor.click(page, page.locator("button:has(svg.lucide-plus)"));
    await expect(page.getByRole("dialog")).toBeVisible();

    // Fill in some data
    await cursor.fill(page, page.getByLabel("Name"), "Should Not Exist");

    // Cancel
    await cursor.click(page, page.getByRole("button", { name: /cancel/i }));

    // Dialog should close
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });
});
