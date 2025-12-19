import { cursor, expect, story, test } from "../fixtures";

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
    // Set up the Gherkin story
    await story.setup(page, "Item Creation", "Create item successfully", [
      { keyword: "Given", text: "I am viewing items in a collection" },
      { keyword: "When", text: 'I click the "+" button' },
      { keyword: "And", text: "I enter item details" },
      { keyword: "And", text: "I click the create button" },
      { keyword: "Then", text: "the new item should be created" },
    ]);

    await story.step(page); // Given - already on collection page

    await story.step(page); // When - click + button
    await cursor.click(page, page.locator("button:has(svg.lucide-plus)"));
    await expect(page.getByRole("dialog")).toBeVisible();

    await story.step(page); // And - fill form
    const uniqueName = `Test Item ${Date.now()}`;
    await cursor.fill(page, page.getByLabel("Name"), uniqueName);
    await cursor.fill(page, page.getByLabel("Description"), "Test description for new item");

    await story.step(page); // And - submit
    await cursor.click(page, page.getByRole("button", { name: /create/i }));

    await story.step(page); // Then - verify
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10000 });
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
