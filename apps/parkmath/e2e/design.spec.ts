import { test, expect } from "@playwright/test";

// Airport chosen: heathrow — isFree: false, penaltyPence: 8000 (£80)

test.describe("visual richness behaviours", () => {
  test("header carries the =Math logo lockup", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header");
    await expect(header.locator("svg.mf-logo-tile")).toBeVisible();
    await expect(header.getByText("Park", { exact: true })).toBeVisible();
    await expect(header.getByText("Math", { exact: true })).toBeVisible();
  });

  test("mini answer bar appears only after the answer card scrolls away", async ({ page }) => {
    await page.goto("/drop-off-charges/heathrow");
    const bar = page.getByTestId("mini-answer-bar");
    // Initially hidden — aria-hidden="true"
    await expect(bar).toHaveAttribute("aria-hidden", "true");
    // Scroll to the very bottom so the AnswerCard (#mf-answer-anchor) leaves the viewport
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
    // Wait for IntersectionObserver to fire and React state to update
    await expect(bar).toHaveAttribute("aria-hidden", "false", { timeout: 5000 });
    await expect(bar).toBeInViewport();
  });

  test("caveat chips surface penalty info on charging airports", async ({ page }) => {
    await page.goto("/drop-off-charges/heathrow");
    // Heathrow: penaltyPence 8000 => £80 penalty if unpaid
    await expect(page.getByText(/penalty if unpaid/).first()).toBeVisible();
  });

  test("reduced motion shows content immediately with no looping animations", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    // Home page has a .mf-reveal section (the stat grid)
    await page.goto("/");
    const reveal = page.locator(".mf-reveal").first();
    // Under reduced-motion the CSS sets opacity:1 directly, and ScrollReveal adds .mf-in immediately
    await expect(reveal).toHaveCSS("opacity", "1");
    // Check edge-shine on a drop-off page where AnswerCard exists
    await page.goto("/drop-off-charges/heathrow");
    const shine = page.locator(".mf-edge-shine").first();
    if (await shine.count()) {
      const animName = await shine.evaluate(
        (el) => getComputedStyle(el, "::before").animationName
      );
      expect(animName).toBe("none");
    }
  });

  test("answer is server-rendered before any JS", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto("/drop-off-charges/heathrow");
    await expect(page.locator("#mf-answer-anchor")).toBeVisible();
    await ctx.close();
  });
});
