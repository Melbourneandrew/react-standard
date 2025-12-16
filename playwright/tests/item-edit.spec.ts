import { expect, test } from "../fixtures";

const SHOW_CURSOR = process.env.SHOW_CURSOR === "true";

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

    if (SHOW_CURSOR) {
      await page.cursor.clickElement(editButton);
    } else {
      await editButton.click();
    }

    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("should pre-fill form with item data", async ({ page }) => {
    const firstItem = page.locator(".rounded-lg.border").first();
    const itemName = await firstItem.locator("h3").textContent();

    const editButton = firstItem.locator("button:has(svg.lucide-pencil)");
    if (SHOW_CURSOR) {
      await page.cursor.clickElement(editButton);
    } else {
      await editButton.click();
    }
    await expect(page.getByRole("dialog")).toBeVisible();

    // Name field should be pre-filled
    await expect(page.getByLabel("Name")).toHaveValue(itemName!);
  });

  test("should update item successfully", async ({ page }) => {
    const firstItem = page.locator(".rounded-lg.border").first();
    const editButton = firstItem.locator("button:has(svg.lucide-pencil)");

    if (SHOW_CURSOR) {
      await page.cursor.clickElement(editButton);
    } else {
      await editButton.click();
    }
    await expect(page.getByRole("dialog")).toBeVisible();

    // Change the name
    const uniqueName = `Updated ${Date.now()}`;
    const nameInput = page.getByLabel("Name");
    if (SHOW_CURSOR) {
      await page.cursor.clickElement(nameInput);
    }
    await nameInput.clear();
    await nameInput.fill(uniqueName);

    // Save
    const saveBtn = page.getByRole("button", { name: /save/i });
    if (SHOW_CURSOR) {
      await page.cursor.clickElement(saveBtn);
    } else {
      await saveBtn.click();
    }

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
    if (SHOW_CURSOR) {
      await page.cursor.clickElement(editButton);
    } else {
      await editButton.click();
    }
    await expect(page.getByRole("dialog")).toBeVisible();

    // Change the name
    const nameInput = page.getByLabel("Name");
    if (SHOW_CURSOR) {
      await page.cursor.clickElement(nameInput);
    }
    await nameInput.clear();
    await nameInput.fill("Should Not Be Saved");

    // Cancel
    const cancelBtn = page.getByRole("button", { name: /cancel/i });
    if (SHOW_CURSOR) {
      await page.cursor.clickElement(cancelBtn);
    } else {
      await cancelBtn.click();
    }

    // Dialog should close
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Item should still have original name
    await expect(firstItem.locator("h3")).toHaveText(originalName!);
  });
});
