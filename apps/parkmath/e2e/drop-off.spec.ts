import { expect, test } from "@playwright/test";

test("airport page shows the fee, source and freshness without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/drop-off-charges/gatwick");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Gatwick");
  await expect(page.getByText(/Verified|Last verified/)).toBeVisible();
  await expect(page.getByRole("link", { name: /Official/ })).toBeVisible();
  await context.close();
});

test("calculator island updates the quote", async ({ page }) => {
  await page.goto("/drop-off-charges/gatwick");
  const result = page.getByTestId("calculator-result");
  await expect(result).not.toBeEmpty();
  const before = await result.textContent();
  await page.getByRole("slider").fill("85");
  await expect(result).not.toHaveText(before ?? "");
});

test("master table lists every airport and links through", async ({ page }) => {
  await page.goto("/drop-off-charges");
  await expect(page.getByRole("table")).toBeVisible();
  await page.getByRole("link", { name: "London Heathrow" }).click();
  await expect(page).toHaveURL(/\/drop-off-charges\/heathrow$/);
});

test("home search filters airports", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("searchbox").fill("LGW");
  await expect(page.getByRole("link", { name: "London Gatwick" })).toBeVisible();
  await expect(page.getByRole("link", { name: "London Heathrow" })).toHaveCount(0);
});
