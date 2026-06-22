import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BookingOptions } from "../components/booking-options";
import type { ParkingCtaModel } from "../lib/parking-content";

const html = renderToStaticMarkup(
  <BookingOptions airportName="Gatwick" airportSlug="gatwick" officialUrl="https://www.gatwickairport.com/parking" />
);

const htmlWithPrice = renderToStaticMarkup(
  <BookingOptions
    airportName="Gatwick"
    airportSlug="gatwick"
    officialUrl="https://www.gatwickairport.com/parking"
    price={4200}
    days={7}
  />
);

// A non-override airport still serves Holiday Extras (diversification must not break existing HE links).
const heHtml = renderToStaticMarkup(
  <BookingOptions airportName="Newcastle" airportSlug="newcastle" officialUrl="https://www.newcastleairport.com/parking" />
);

describe("BookingOptions", () => {
  it("renders the official route as a non-sponsored equal-weight button", () => {
    expect(html).toContain("Book direct with the airport");
    expect(html).toContain("Go to airport site");
    expect(html).toContain('href="https://www.gatwickairport.com/parking"');
    expect(html).not.toContain('href="https://www.gatwickairport.com/parking" rel="sponsored');
  });

  it("Gatwick is an APH override airport: renders the APH route with Ad + first-party deep link", () => {
    // Gatwick now serves APH (diversification), so the merchant name is APH and no HE-specific
    // discount claim appears (no fabricated promo for a merchant that didn't offer it).
    expect(html).toContain(">Ad<");
    expect(html).toContain("Pre-book &amp; save with APH");
    expect(html).toContain("Free cancellation (cancel to arrival)");
    expect(html).not.toContain("up to 25% at Gatwick"); // HE-only promo — must not be claimed for APH
    // Click measurement: the CTA links to the first-party /go redirect, NOT a bare awin1.com link.
    // The route rebuilds the exact AWIN deep link (awinmid/clickref/ued) server-side before the 302.
    expect(html).not.toContain("https://www.awin1.com/cread.php?");
    expect(html).toContain('href="/go/gatwick/parking-prebook"');
    expect(html).toContain("Book my parking");
    expect(html).toContain('rel="sponsored noopener noreferrer"');
  });

  it("a non-override airport still renders the Holiday Extras route with its compliant discount copy", () => {
    expect(heHtml).toContain("Pre-book &amp; save with Holiday Extras");
    expect(heHtml).toContain("up to 25% at Gatwick");
    expect(heHtml).toContain("Discount applied automatically");
    expect(heHtml).toContain('href="/go/newcastle/parking-prebook"');
  });

  it("keeps the ranking commission-blind and avoids non-compliant copy", () => {
    expect(html).toContain("never changes our ranking");
    expect(html).not.toContain(">Up to 25% off<");
    expect(html).not.toContain("may earn");
    expect(html).not.toContain("up to 75%");
  });

  // P2 ordering requirements
  it("affiliate block appears before the official site block (affiliate first/primary)", () => {
    const affiliateIdx = html.indexOf("Book my parking");
    const officialIdx = html.indexOf("Go to airport site");
    expect(affiliateIdx).toBeGreaterThan(-1);
    expect(officialIdx).toBeGreaterThan(-1);
    expect(affiliateIdx).toBeLessThan(officialIdx);
  });

  it("disclosure text appears before the affiliate CTA link", () => {
    const disclosureIdx = html.indexOf("never changes our ranking");
    const ctaIdx = html.indexOf("Book my parking");
    expect(disclosureIdx).toBeGreaterThan(-1);
    expect(ctaIdx).toBeGreaterThan(-1);
    expect(disclosureIdx).toBeLessThan(ctaIdx);
  });

  it("Ad label appears before the affiliate CTA (disclosure-before-CTA ordering)", () => {
    const adIdx = html.indexOf(">Ad<");
    const ctaIdx = html.indexOf("Book my parking");
    expect(adIdx).toBeGreaterThan(-1);
    expect(ctaIdx).toBeGreaterThan(-1);
    expect(adIdx).toBeLessThan(ctaIdx);
  });

  it("shows price and days in the CTA when price and days props provided", () => {
    expect(htmlWithPrice).toContain("from £42.00 for 7 days");
  });

  it("does not show price string when price/days are omitted", () => {
    // baseline html without price should not include "from £"
    expect(html).not.toContain("from £");
  });

  it("shows the honest saving line when the cta model is in the 'saving' state", () => {
    const savingCta: ParkingCtaModel = { state: "saving", pricePence: 4200, gatePence: 31500, savingVsGatePence: 27300, days: 7 };
    const out = renderToStaticMarkup(
      <BookingOptions airportName="Manchester" airportSlug="manchester" officialUrl="https://x" cta={savingCta} />
    );
    expect(out).toContain("from £42.00 for 7 days");
    expect(out).toContain("Save £273.00 vs the £315.00 drive-up gate price");
  });

  it("gate-only cta (Stansted case): suppresses the price AND makes no saving claim", () => {
    // Only the drive-up gate price exists for this duration — never present it as a 'from' pre-book
    // figure, and never imply a saving that doesn't exist.
    const gateOnlyCta: ParkingCtaModel = { state: "gate-only", pricePence: null, gatePence: 33600, savingVsGatePence: null, days: 7 };
    const out = renderToStaticMarkup(
      <BookingOptions airportName="Stansted" airportSlug="stansted" officialUrl="https://x" cta={gateOnlyCta} />
    );
    expect(out).not.toContain("from £");
    expect(out).not.toContain("£336.00");
    expect(out).not.toContain("Save £");
    // The CTA still renders (just without a fabricated price).
    expect(out).toContain("Book my parking");
  });
});
