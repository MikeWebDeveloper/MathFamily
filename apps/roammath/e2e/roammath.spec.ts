import { expect, test } from "@playwright/test";

test("country hub renders the full answer without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/roaming/spain");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Spain");
  await expect(page.locator("article > div").first()).toContainText(/£|included|no extra/);
  await context.close();
});

test("trip calculator updates on slider change", async ({ page }) => {
  await page.goto("/roaming/spain");
  const result = page.getByTestId("roaming-result");
  await expect(result).toBeVisible();
  const before = await result.textContent();
  await page.getByRole("slider").first().fill("21");
  await expect(result).not.toHaveText(before ?? "");
});

test("network page links back to its hub", async ({ page }) => {
  await page.goto("/roaming/spain/three");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Three/);
  await page.getByRole("link", { name: /all networks|Spain roaming/i }).first().click();
  await expect(page).toHaveURL(/\/roaming\/spain$/);
});

test("baggage page renders official ranges", async ({ page }) => {
  await page.goto("/baggage-fees/ryanair");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Ryanair");
  await expect(page.getByRole("table")).toBeVisible();
});

test("master grid lists destinations and links through", async ({ page }) => {
  await page.goto("/roaming");
  await page.getByRole("link", { name: "Spain" }).first().click();
  await expect(page).toHaveURL(/\/roaming\/spain$/);
});
