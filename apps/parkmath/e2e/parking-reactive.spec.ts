import { expect, test } from "@playwright/test";

/**
 * Proves that the parking duration SegmentedControl (3 / 7 / 14 days)
 * causes the `data-testid="parking-result"` region to re-render with
 * new content. A regression to the old "frozen hero" bug (where the
 * hero answer didn't update on duration change) would cause this test
 * to fail.
 */
test("parking duration toggle updates the result region", async ({ page }) => {
  // Manchester has data for all three durations and is used throughout the e2e suite.
  await page.goto("/airport-parking/manchester");

  const result = page.getByTestId("parking-result");
  await expect(result).toBeVisible();

  // Capture the default (7-day) answer text.
  const sevenDayText = await result.textContent();
  expect(sevenDayText).toBeTruthy();

  // Switch to 14 days. The SegmentedControl renders role="radio" per the
  // component spec; fall back to role="button" which p2.spec.ts also uses.
  const fourteenBtn =
    page.getByRole("radio", { name: "14 days" }).first().or(
      page.getByRole("button", { name: "14 days" }).first(),
    );
  await fourteenBtn.click();

  // The result region must show different content for 14 days.
  await expect(result).not.toHaveText(sevenDayText ?? "");

  // The 14-day context should appear somewhere in the result block
  // (either in the verdict text or an option row) without hard-coding
  // a specific £ price that would make the test data-fragile.
  await expect(result).toContainText("14");

  // Affiliate / pre-book CTA must remain present after the toggle.
  await expect(result.getByRole("link").first()).toBeVisible();
});

test("switching from 14 days back to 7 days restores the original answer", async ({ page }) => {
  await page.goto("/airport-parking/manchester");

  const result = page.getByTestId("parking-result");
  await expect(result).toBeVisible();

  const sevenDayText = await result.textContent();

  const fourteenBtn =
    page.getByRole("radio", { name: "14 days" }).first().or(
      page.getByRole("button", { name: "14 days" }).first(),
    );
  await fourteenBtn.click();
  await expect(result).not.toHaveText(sevenDayText ?? "");

  const sevenBtn =
    page.getByRole("radio", { name: "7 days" }).first().or(
      page.getByRole("button", { name: "7 days" }).first(),
    );
  await sevenBtn.click();

  // After toggling back, the content must match the original 7-day text.
  await expect(result).toHaveText(sevenDayText ?? "");
});
