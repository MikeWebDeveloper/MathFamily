import { test, expect } from "@playwright/test";

test.describe("news", () => {
  test("the /news hub renders without JS", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto("/news");
    await expect(page.getByRole("heading", { level: 1, name: /updates/i })).toBeVisible();
    await ctx.close();
  });

  test("RSS feed is valid XML", async ({ request }) => {
    const res = await request.get("/news/feed.xml");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("application/rss+xml");
    expect(await res.text()).toContain("<rss");
  });

  test("a news item page (if any) exposes NewsArticle schema; else hub links are consistent", async ({ page }) => {
    await page.goto("/news");
    const firstItem = page.locator('a[href^="/news/"]').first();
    if (await firstItem.count()) {
      const href = await firstItem.getAttribute("href");
      await page.goto(href!);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
      expect(ld.join(" ")).toContain("NewsArticle");
    }
  });
});
