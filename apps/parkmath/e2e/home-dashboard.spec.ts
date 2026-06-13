import { expect, test } from "@playwright/test";

test.describe("home navigation hub", () => {
  test("primary tile routes to airport parking", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /airport parking/i }).first().click();
    await expect(page).toHaveURL(/\/airport-parking$/);
  });

  test("deals strip routes to the parking hub", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /compare parking/i }).click();
    await expect(page).toHaveURL(/\/airport-parking$/);
  });

  test("the find-near-me button is present and focusable", async ({ page }) => {
    await page.goto("/");
    const btn = page.getByRole("button", { name: /find airports near me/i });
    await expect(btn).toBeVisible();
    await btn.focus();
    await expect(btn).toBeFocused();
  });
});
