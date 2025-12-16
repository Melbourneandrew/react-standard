import { test, expect } from "../fixtures";

test.describe("Item Creation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/collections/coll-1");
    await expect(page.locator(".animate-spin")).not.toBeVisible({
      timeout: 10000,
    });
  });

  test("should open create dialog when clicking + button", async ({ page }) => {
    const createButton = page.locator("button:has(svg.lucide-plus)");
    await createButton.click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("should create item successfully", async ({ page }) => {
    // Open create dialog
    await page.locator("button:has(svg.lucide-plus)").click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Fill in the form
    const uniqueName = `Test Item ${Date.now()}`;
    await page.getByLabel("Name").fill(uniqueName);
    await page.getByLabel("Description").fill("Test description for new item");

    // Submit
    await page.getByRole("button", { name: /create/i }).click();

    // Dialog should close
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10000 });

    // New item should appear in the list
    await page.getByPlaceholder("Search...").fill(uniqueName);
    await expect(page).toHaveURL(/query=/, { timeout: 5000 });
    await page.waitForTimeout(1000);
    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 10000 });
  });

  test("should create item with required fields only (name, no description)", async ({
    page,
  }) => {
    // Open create dialog
    await page.locator("button:has(svg.lucide-plus)").click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Fill in only the name
    const uniqueName = `NameOnly ${Date.now()}`;
    await page.getByLabel("Name").fill(uniqueName);

    // Submit
    await page.getByRole("button", { name: /create/i }).click();

    // Dialog should close
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10000 });
  });

  test("should cancel item creation", async ({ page }) => {
    // Open create dialog
    await page.locator("button:has(svg.lucide-plus)").click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Fill in some data
    await page.getByLabel("Name").fill("Should Not Exist");

    // Cancel
    await page.getByRole("button", { name: /cancel/i }).click();

    // Dialog should close
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });
});
