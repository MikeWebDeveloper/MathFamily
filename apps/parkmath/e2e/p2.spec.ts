import { expect, test } from "@playwright/test";

test("parking hub renders comparison and updates on duration change", async ({ page }) => {
  await page.goto("/airport-parking/manchester");
  const result = page.getByTestId("parking-result");
  await expect(result).toBeVisible();
  const before = await result.textContent();
  await page.getByRole("button", { name: "3 days" }).click();
  await expect(result).not.toHaveText(before ?? "");
});

test("duration page shows answer-first lead without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/airport-parking/manchester/7-days");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("7-day parking");
  await expect(page.locator("article > div").first()).toContainText(/£/);
  await context.close();
});

test("lounge page break-even verdict reacts to slider", async ({ page }) => {
  await page.goto("/airport-lounges/manchester");
  const result = page.getByTestId("lounge-result");
  await expect(result).toBeVisible();
  await page.getByRole("slider").fill("18");
  await expect(result).toContainText(/wins/);
});

test("affiliate block falls back to official link with no sponsored rel", async ({ page }) => {
  await page.goto("/airport-parking/manchester");
  const link = page.getByRole("link", { name: /official site/ });
  await expect(link).toBeVisible();
  await expect(link).not.toHaveAttribute("rel", /sponsored/);
});

test("cross-link from drop-off page to parking hub", async ({ page }) => {
  await page.goto("/drop-off-charges/manchester");
  await page.getByRole("link", { name: /Parking at Manchester|parking compared/i }).click();
  await expect(page).toHaveURL(/airport-parking\/manchester$/);
});
