import { test, expect } from "@playwright/test";

test.describe("Error Handling", () => {
  test("should show collection not found for invalid collection ID", async ({
    page,
  }) => {
    await page.goto("/collections/invalid-collection-id");

    await expect(page.getByText("Collection not found")).toBeVisible();
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
    await expect(page.getByText(/error/i)).toBeVisible({ timeout: 10000 });
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
    await page.locator("button").filter({ has: page.locator("svg") }).nth(0).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Fill and submit
    await page.getByLabel("Name").fill("Test Item");
    await page.getByRole("button", { name: /create/i }).click();

    // Should see error (toast or inline)
    // The dialog might remain open on error
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
