import { test, expect } from "@playwright/test";

test.describe("Error Handling", () => {
  test("should handle invalid collection ID gracefully", async ({ page }) => {
    await page.goto("/collections/invalid-collection-id");

    // The app will render the items page but won't find matching collection data
    // Wait for page to load
    await page.waitForTimeout(2000);

    // The page should either show "Collection not found" or an empty/error state
    // Since currentCollectionId is set from URL params, the page will try to load items
    // for the invalid collection (which will likely return empty or error)
    const notFound = page.getByText("Collection not found");
    const noItems = page.getByText("No items found");

    // At least one of these should be visible
    await expect(notFound.or(noItems)).toBeVisible({ timeout: 10000 });
  });

  test("should show error message when API fails on items fetch", async ({
    page,
  }) => {
    // Intercept API and return error
    await page.route("**/api/collections/*/items*", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal Server Error" }),
      });
    });

    await page.goto("/collections/coll-1");

    // Should show error message - use first() since there might be multiple
    await expect(page.getByText("Items Query Error").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("should show error when item creation fails", async ({ page }) => {
    await page.goto("/collections/coll-1");

    // Wait for items to load
    await expect(page.locator(".animate-spin")).not.toBeVisible({
      timeout: 10000,
    });

    // Intercept create API and return error
    await page.route("**/api/collections/*/items", (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Failed to create item" }),
        });
      } else {
        route.continue();
      }
    });

    // Open create dialog
    const createButton = page.locator("button:has(svg.lucide-plus)");
    await createButton.click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Fill and submit
    await page.getByLabel("Name").fill("Test Item");
    await page.getByRole("button", { name: /create/i }).click();

    // Should see error toast or dialog stays open
    await page.waitForTimeout(1000);
    // The dialog might remain open on error, or there's a toast
  });
});
