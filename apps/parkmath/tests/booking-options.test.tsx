import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BookingOptions } from "../components/booking-options";

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

describe("BookingOptions", () => {
  it("renders the official route as a non-sponsored equal-weight button", () => {
    expect(html).toContain("Book direct with the airport");
    expect(html).toContain("Go to airport site");
    expect(html).toContain('href="https://www.gatwickairport.com/parking"');
    expect(html).not.toContain('href="https://www.gatwickairport.com/parking" rel="sponsored');
  });

  it("renders the Holiday Extras route with Ad, benefits, compliant discount + deep link", () => {
    expect(html).toContain(">Ad<");
    expect(html).toContain("Free cancellation (cancel to arrival)");
    expect(html).toContain("up to 25% at Gatwick");
    expect(html).toContain("Discount applied automatically");
    expect(html).toContain("https://www.awin1.com/cread.php?");
    expect(html).toContain("awinmid=3496");
    expect(html).toContain("clickref=parkmath-gatwick");
    expect(html).toContain("ued=https%3A%2F%2Fwww.holidayextras.com%2Fgatwick-airport-parking.html");
    expect(html).toContain("Book my parking");
    expect(html).toContain('rel="sponsored noopener noreferrer"');
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
});
