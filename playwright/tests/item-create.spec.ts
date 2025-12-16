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

  test("should create item successfully", async ({ page }) => {
    // Open create dialog
    await cursor.click(page, page.locator("button:has(svg.lucide-plus)"));
    await expect(page.getByRole("dialog")).toBeVisible();

    // Fill in the form
    const uniqueName = `Test Item ${Date.now()}`;
    await cursor.fill(page, page.getByLabel("Name"), uniqueName);
    await cursor.fill(page, page.getByLabel("Description"), "Test description for new item");

    // Submit
    await cursor.click(page, page.getByRole("button", { name: /create/i }));

    // Dialog should close
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10000 });

    // New item should appear in the list
    await cursor.fill(page, page.getByPlaceholder("Search..."), uniqueName);
    await expect(page).toHaveURL(/query=/, { timeout: 5000 });
    await page.waitForTimeout(1000);
    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 10000 });
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
