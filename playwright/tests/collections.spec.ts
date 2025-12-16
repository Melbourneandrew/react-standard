import { test, expect } from "@playwright/test";

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

    // Should see collection dropdown
    await expect(page.getByRole("combobox")).toBeVisible();
  });

  test("should show list of available collections when dropdown is clicked", async ({
    page,
  }) => {
    await page.goto("/");

    // Click the dropdown
    await page.getByRole("combobox").click();

    // Should see collection options (collections have random names from the word bank)
    // We just verify the listbox appears with options
    await expect(page.getByRole("listbox")).toBeVisible();
    await expect(page.getByRole("option").first()).toBeVisible();
  });

  test("should navigate to collection page when a collection is selected", async ({
    page,
  }) => {
    await page.goto("/");

    // Click the dropdown
    await page.getByRole("combobox").click();

    // Select the first collection
    await page.getByRole("option").first().click();

    // Should navigate to collection page
    await expect(page).toHaveURL(/\/collections\/coll-\d+/);

    // Should see items heading
    await expect(page.getByText("Items")).toBeVisible();
  });

  test("should be able to switch between collections from navbar", async ({
    page,
  }) => {
    // Start on a collection page
    await page.goto("/collections/coll-1");

    // Wait for items to load
    await expect(page.getByText("Items")).toBeVisible();

    // Find and click the navbar dropdown
    const navbarDropdown = page.locator("header").getByRole("combobox");
    await navbarDropdown.click();

    // Select a different collection (second option)
    await page.getByRole("option").nth(1).click();

    // Should navigate to different collection
    await expect(page).toHaveURL(/\/collections\/coll-\d+/);
  });
});
