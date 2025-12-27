/**
 * Example test file demonstrating the visual testing package.
 *
 * Run with:
 *   npm run test:demo
 */

import { test, expect, cursor, story } from "../fixtures";

test.describe("Example.com", () => {
  test("should display the example page @demo", async ({ page }) => {
    // Navigate to the page
    await page.goto("/");

    // Setup the BDD story panel
    await story.setup(page, "Example Domain", "View the example page", [
      { keyword: "Given", text: "I navigate to example.com" },
      { keyword: "Then", text: "I should see the Example Domain heading" },
      { keyword: "And", text: "I should see a link for more information" },
    ]);

    // Step 1: Verify heading
    await story.step(page);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Example Domain"
    );

    // Step 2: Find and hover the "More information" link
    await story.step(page);
    const moreInfoLink = page.getByRole("link", { name: /more information/i });
    await expect(moreInfoLink).toBeVisible();

    // Step 3: Demonstrate cursor hover
    await story.step(page);
    await cursor.hover(page, moreInfoLink);

    // Test passes - the visual overlay will show
  });

  test("should be able to click the link @demo", async ({ page }) => {
    await page.goto("/");

    await story.setup(page, "Example Domain", "Click the more info link", [
      { keyword: "Given", text: "I am on the example page" },
      { keyword: "When", text: "I click the more information link" },
      { keyword: "Then", text: "I should navigate to IANA" },
    ]);

    await story.step(page);
    await expect(page.getByRole("heading")).toBeVisible();

    await story.step(page);
    const link = page.getByRole("link", { name: /more information/i });

    // Use cursor.click for visual effect
    await cursor.click(page, link);

    await story.step(page);
    // After clicking, we'd be on a different domain
    // Just verify the click happened (navigation may be blocked in some modes)
    await expect(page).not.toHaveURL("https://example.com/");
  });
});



