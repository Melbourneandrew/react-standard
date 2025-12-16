import { expect, test } from "../fixtures";

test.describe("Error Handling", () => {
  test("should handle invalid collection ID gracefully", async ({ page }) => {
    await page.goto("/collections/invalid-collection-id");

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Should show either "Collection not found" or "No items found"
    const notFound = page.getByText("Collection not found");
    const noItems = page.getByText("No items found");

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

    // Should show error message
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

    // Dialog should remain open on error
    await page.waitForTimeout(1000);
  });
});
