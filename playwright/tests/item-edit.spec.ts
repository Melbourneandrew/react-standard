import { cursor, expect, story, test } from "../fixtures";

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
    await cursor.click(page, firstItem.locator("button:has(svg.lucide-pencil)"));
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("should pre-fill form with item data", async ({ page }) => {
    const firstItem = page.locator(".rounded-lg.border").first();
    const itemName = await firstItem.locator("h3").textContent();

    await cursor.click(page, firstItem.locator("button:has(svg.lucide-pencil)"));
    await expect(page.getByRole("dialog")).toBeVisible();

    // Name field should be pre-filled
    await expect(page.getByLabel("Name")).toHaveValue(itemName!);
  });

  test("should update item successfully @demo", async ({ page }) => {
    // Set up the Gherkin story
    await story.setup(page, "Item Edit", "Update item successfully", [
      { keyword: "Given", text: "I am viewing items in a collection" },
      { keyword: "When", text: "I click the edit button on an item" },
      { keyword: "And", text: "I change the item name" },
      { keyword: "And", text: "I click save" },
      { keyword: "Then", text: "the item should be updated" },
    ]);

    await story.step(page); // Given - already on collection page

    const firstItem = page.locator(".rounded-lg.border").first();

    await story.step(page); // When - click edit
    await cursor.click(page, firstItem.locator("button:has(svg.lucide-pencil)"));
    await expect(page.getByRole("dialog")).toBeVisible();

    await story.step(page); // And - change name
    const uniqueName = `Updated ${Date.now()}`;
    await cursor.fill(page, page.getByLabel("Name"), uniqueName);

    await story.step(page); // And - save
    await cursor.click(page, page.getByRole("button", { name: /save/i }));
    await page.waitForLoadState("networkidle");

    await story.step(page); // Then - verify
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 15000 });
    await expect(firstItem.locator("h3")).toHaveText(uniqueName, {
      timeout: 10000,
    });
  });

  test("should cancel edit without saving", async ({ page }) => {
    const firstItem = page.locator(".rounded-lg.border").first();
    const originalName = await firstItem.locator("h3").textContent();

    await cursor.click(page, firstItem.locator("button:has(svg.lucide-pencil)"));
    await expect(page.getByRole("dialog")).toBeVisible();

    // Change the name
    await cursor.fill(page, page.getByLabel("Name"), "Should Not Be Saved");

    // Cancel
    await cursor.click(page, page.getByRole("button", { name: /cancel/i }));

    // Dialog should close
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Item should still have original name
    await expect(firstItem.locator("h3")).toHaveText(originalName!);
  });
});
