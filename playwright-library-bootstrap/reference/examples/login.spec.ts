/**
 * EXAMPLE SPEC FILE
 *
 * This demonstrates the patterns for consuming fixtures.
 * Copy and adapt this for your own features.
 *
 * Key patterns:
 * 1. Import from "../fixtures" (not "@playwright/test")
 * 2. Use cursor.click(), cursor.fill() for interactions
 * 3. Add @demo tag and story.setup/step for visual demos
 * 4. Use context.md selectors rather than hardcoding
 */

import { test, expect, cursor, story } from "../fixtures";

test.describe("User Login", () => {
  test("should show login form when clicking login link", async ({ page }) => {
    await page.goto("/");

    // Use cursor.click for animated interactions
    await cursor.click(page, page.getByRole("link", { name: /login/i }));

    // Assertions
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  /**
   * DEMO TEST
   *
   * Add @demo tag to include in visual demo runs.
   * Use story.setup() and story.step() to show Gherkin in the story panel.
   */
  test("should login successfully with valid credentials @demo", async ({
    page,
  }) => {
    await page.goto("/login");

    // Set up the story panel (AFTER page.goto, so scripts are injected)
    await story.setup(page, "User Login", "Successful login", [
      { keyword: "Given", text: "I am on the login page" },
      { keyword: "When", text: "I enter valid credentials" },
      { keyword: "And", text: "I click the login button" },
      { keyword: "Then", text: "I should see the dashboard" },
    ]);

    // Given - already on login page
    await story.step(page);
    await expect(page.getByLabel("Email")).toBeVisible();

    // When - enter credentials
    await story.step(page);
    await cursor.fill(page, page.getByLabel("Email"), "test@example.com");
    await cursor.fill(page, page.getByLabel("Password"), "password123");

    // And - click login
    await story.step(page);
    await cursor.click(page, page.getByRole("button", { name: /sign in/i }));

    // Then - verify dashboard
    await story.step(page);
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByText("Welcome")).toBeVisible();
  });

  test("should show error with invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await cursor.fill(page, page.getByLabel("Email"), "wrong@example.com");
    await cursor.fill(page, page.getByLabel("Password"), "wrongpassword");
    await cursor.click(page, page.getByRole("button", { name: /sign in/i }));

    // Should show error and stay on login page
    await expect(page.getByText(/invalid|error/i)).toBeVisible({
      timeout: 5000,
    });
    await expect(page).toHaveURL(/login/);
  });

  test("should logout successfully", async ({ page }) => {
    // Assume we have a way to start logged in (e.g., API login, storage state)
    await page.goto("/dashboard");

    await cursor.click(page, page.getByRole("button", { name: /logout/i }));

    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("button", { name: /logout/i })
    ).not.toBeVisible();
  });
});

/**
 * TESTS WITH API MOCKING
 *
 * For edge cases, set up routes BEFORE navigation.
 * Use a separate describe block without beforeEach.
 */
test.describe("Login Edge Cases", () => {
  test("should handle server error gracefully", async ({ page }) => {
    // Set up mock BEFORE navigation
    await page.route("**/api/auth/login", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal Server Error" }),
      });
    });

    await page.goto("/login");

    await cursor.fill(page, page.getByLabel("Email"), "test@example.com");
    await cursor.fill(page, page.getByLabel("Password"), "password123");
    await cursor.click(page, page.getByRole("button", { name: /sign in/i }));

    // Should show error message
    await expect(page.getByText(/error|failed|try again/i)).toBeVisible({
      timeout: 5000,
    });
  });
});
