import { expect, test } from "@playwright/test";

test.describe("Item Creation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/collections/coll-1");
    // Wait for items to load
    await expect(page.locator(".animate-spin")).not.toBeVisible({
      timeout: 10000,
    });
  });

  test("should open create dialog when clicking + button", async ({ page }) => {
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

  test("should create item with required fields only (name, no description)", async ({
    page,
  }) => {
    // Open create dialog
    const createButton = page.locator("button:has(svg.lucide-plus)");
    await createButton.click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Fill in only the name (leave description empty)
    const uniqueName = `NameOnly ${Date.now()}`;
    await page.getByLabel("Name").fill(uniqueName);
    // Don't fill description

    // Submit
    await page.getByRole("button", { name: /create/i }).click();

    // Dialog should close (indicates successful creation)
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10000 });
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
