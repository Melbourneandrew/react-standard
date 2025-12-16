import { expect, test } from "@playwright/test";

test.describe("Collection Selection", () => {
  test("should show welcome page with collection dropdown", async ({
    page,
  }) => {
    await page.goto("/");

    // Should see welcome card
    await expect(page.getByText("Welcome")).toBeVisible();
    await expect(
      page.getByText("Please select a collection from the dropdown"),
    ).toBeVisible();

    // Should see collection dropdown (at least one exists)
    await expect(page.getByRole("combobox").first()).toBeVisible();
  });

  test("should show list of available collections when dropdown is clicked", async ({
    page,
  }) => {
    await page.goto("/");

    // Click the card's dropdown (second combobox, the one in the welcome card)
    const cardDropdown = page.getByRole("combobox").nth(1);
    await cardDropdown.click();

    // Wait for collections to load and listbox to appear
    await expect(page.getByRole("listbox")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("option").first()).toBeVisible();
  });

  test("should navigate to collection page when a collection is selected", async ({
    page,
  }) => {
    await page.goto("/");

    // Click the card's dropdown
    const cardDropdown = page.getByRole("combobox").nth(1);
    await cardDropdown.click();

    // Wait for options to load
    await expect(page.getByRole("listbox")).toBeVisible({ timeout: 10000 });

    // Select the first collection
    await page.getByRole("option").first().click();

    // Should navigate to collection page
    await expect(page).toHaveURL(/\/collections\/coll-\d+/);

    // Should see items heading
    await expect(page.getByText("Items")).toBeVisible();
  });

  test("should be able to switch between collections", async ({ page }) => {
    // Start on a collection page
    await page.goto("/collections/coll-1");

    // Wait for page to load
    await expect(page.getByText("Items")).toBeVisible();

    // Wait for items to load
    await expect(page.locator(".animate-spin")).not.toBeVisible({
      timeout: 10000,
    });

    // Find and click the navbar dropdown (first combobox)
    const navDropdown = page.getByRole("combobox").first();
    await navDropdown.click();

    // Wait for options to load
    await expect(page.getByRole("listbox")).toBeVisible({ timeout: 10000 });

    // Select a different collection (second option)
    await page.getByRole("option").nth(1).click();

    // Should navigate to different collection
    await expect(page).toHaveURL(/\/collections\/coll-\d+/);
  });
});
