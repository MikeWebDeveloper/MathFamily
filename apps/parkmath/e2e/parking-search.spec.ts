import { expect, test } from "@playwright/test";

test("home parking search turns into a tracked affiliate link once an airport is chosen", async ({ page }) => {
  await page.goto("/");

  const search = page.getByRole("region", { name: "Find airport parking" });
  await expect(search).toBeVisible();

  const cta = search.getByRole("link", { name: /Search parking/ });
  await expect(cta).toHaveAttribute("href", "/airport-parking");

  // IATA match is name-independent and reliable.
  await search.getByLabel("Airport").fill("LGW");

  await expect(cta).toHaveAttribute("href", /awin1\.com\/cread\.php/);
  await expect(cta).toHaveAttribute("href", /clickref=parkmath-gatwick-search/);
  await expect(cta).toHaveAttribute("href", /gatwick-airport-parking\.html/);
  await expect(cta).toHaveAttribute("rel", /sponsored/);
});

test("airport-page booking card deep-links to the airport-specific HE page", async ({ page }) => {
  await page.goto("/airport-parking/manchester");

  const result = page.getByTestId("parking-result");
  const book = result.getByRole("link", { name: /Book my parking/ });
  await expect(book).toBeVisible();
  await expect(book).toHaveAttribute("href", /awin1\.com\/cread\.php/);
  await expect(book).toHaveAttribute("href", /manchester-airport-parking\.html/);
  await expect(book).toHaveAttribute("href", /clickref=parkmath-manchester-search/);

  // BookingOptions uses implicit label (label wraps input, no aria-label attribute).
  // The label text is "Drop-off" and "Return" (not "Drop-off date" / "Return date").
  await expect(result.getByLabel("Drop-off")).toBeVisible();
  await expect(result.getByLabel("Return")).toBeVisible();
});
