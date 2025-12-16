import { test, expect } from "../fixtures";

const SHOW_CURSOR = process.env.SHOW_CURSOR === "true";

test.describe("Item Creation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/collections/coll-1");
    await expect(page.locator(".animate-spin")).not.toBeVisible({
      timeout: 10000,
    });
  });

  test("should open create dialog when clicking + button", async ({ page }) => {
    const createButton = page.locator("button:has(svg.lucide-plus)");

    if (SHOW_CURSOR) {
      await page.cursor.clickElement(createButton);
    } else {
      await createButton.click();
    }

    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("should create item successfully", async ({ page }) => {
    const createButton = page.locator("button:has(svg.lucide-plus)");
    const nameInput = page.getByLabel("Name");
    const descInput = page.getByLabel("Description");
    const submitBtn = page.getByRole("button", { name: /create/i });

    // Open create dialog
    if (SHOW_CURSOR) {
      await page.cursor.clickElement(createButton);
    } else {
      await createButton.click();
    }
    await expect(page.getByRole("dialog")).toBeVisible();

    // Fill in the form
    const uniqueName = `Test Item ${Date.now()}`;
    if (SHOW_CURSOR) {
      await page.cursor.clickElement(nameInput);
    }
    await nameInput.fill(uniqueName);

    if (SHOW_CURSOR) {
      await page.cursor.clickElement(descInput);
    }
    await descInput.fill("Test description for new item");

    // Submit
    if (SHOW_CURSOR) {
      await page.cursor.clickElement(submitBtn);
    } else {
      await submitBtn.click();
    }

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
    const createButton = page.locator("button:has(svg.lucide-plus)");
    const nameInput = page.getByLabel("Name");
    const submitBtn = page.getByRole("button", { name: /create/i });

    // Open create dialog
    if (SHOW_CURSOR) {
      await page.cursor.clickElement(createButton);
    } else {
      await createButton.click();
    }
    await expect(page.getByRole("dialog")).toBeVisible();

    // Fill in only the name
    const uniqueName = `NameOnly ${Date.now()}`;
    if (SHOW_CURSOR) {
      await page.cursor.clickElement(nameInput);
    }
    await nameInput.fill(uniqueName);

    // Submit
    if (SHOW_CURSOR) {
      await page.cursor.clickElement(submitBtn);
    } else {
      await submitBtn.click();
    }

    // Dialog should close
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10000 });
  });

  test("should cancel item creation", async ({ page }) => {
    const createButton = page.locator("button:has(svg.lucide-plus)");
    const nameInput = page.getByLabel("Name");
    const cancelBtn = page.getByRole("button", { name: /cancel/i });

    // Open create dialog
    if (SHOW_CURSOR) {
      await page.cursor.clickElement(createButton);
    } else {
      await createButton.click();
    }
    await expect(page.getByRole("dialog")).toBeVisible();

    // Fill in some data
    if (SHOW_CURSOR) {
      await page.cursor.clickElement(nameInput);
    }
    await nameInput.fill("Should Not Exist");

    // Cancel
    if (SHOW_CURSOR) {
      await page.cursor.clickElement(cancelBtn);
    } else {
      await cancelBtn.click();
    }

    // Dialog should close
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });
});
