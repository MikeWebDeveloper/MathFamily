import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BookingOptions } from "../components/booking-options";
import type { ParkingCtaModel } from "../lib/parking-content";

// Gatwick is covered by ALL joined merchants (APH, Airparks, Holiday Extras, Park BCP, Purple Parking).
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

// Belfast International is an HE-only airport (no APH/Purple/Airparks/Park BCP verified per-airport
// page) — so it must show exactly ONE merchant option (Holiday Extras) and never a broken link.
const heOnlyHtml = renderToStaticMarkup(
  <BookingOptions airportName="Belfast International" airportSlug="belfast-international" officialUrl="https://www.belfastairport.com/parking" />
);

// Heathrow carries a Mike-directed primary override (2026-07-11): Heathrow Airport Parking (the
// official Heathrow-operated merchant, mid 2365) is pinned first; every other covered merchant still
// appears, ordered alphabetically after it.
const heathrowHtml = renderToStaticMarkup(
  <BookingOptions airportName="Heathrow" airportSlug="heathrow" officialUrl="https://www.heathrow.com/booking/parking" />
);

/** All "Book parking with X" merchant labels, in DOM order. */
function merchantOrder(markup: string): string[] {
  const out: string[] = [];
  const re = /Book parking with ([A-Za-z ]+?) ↗/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markup)) !== null) out.push(m[1]!.trim());
  return out;
}

describe("BookingOptions — multi-option, commission-blind presentation", () => {
  it("renders the official route as a non-sponsored equal-weight button", () => {
    expect(html).toContain("Book direct with the airport");
    expect(html).toContain("Go to airport site");
    expect(html).toContain('href="https://www.gatwickairport.com/parking"');
    expect(html).not.toContain('href="https://www.gatwickairport.com/parking" rel="sponsored');
  });

  it("an airport served by N merchants emits N tracked 'Book parking with <merchant>' options", () => {
    // Gatwick → all joined merchants, each its own option (Park BCP joined 2026-06-26).
    const order = merchantOrder(html);
    expect(order).toEqual(["Airparks", "APH", "Holiday Extras", "Park BCP", "Purple Parking"]);
  });

  it("each merchant option is a separate first-party /go redirect (per-merchant, surface-tagged)", () => {
    // NOT bare awin1.com links — the /go route rebuilds the exact AWIN deep link server-side, then 302s.
    expect(html).not.toContain("https://www.awin1.com/cread.php?");
    // Per-merchant target form parking:<partnerId>, url-encoded (":" → %3A), carrying the surface.
    expect(html).toContain('href="/go/gatwick/parking%3Aaph?s=parking"');
    expect(html).toContain('href="/go/gatwick/parking%3Aairparks?s=parking"');
    expect(html).toContain('href="/go/gatwick/parking%3Aholiday-extras?s=parking"');
    expect(html).toContain('href="/go/gatwick/parking%3Apurple-parking?s=parking"');
    expect(html).toContain('rel="sponsored noopener noreferrer"');
  });

  it("ORDERING is commission-blind: options are alphabetical by merchant name", () => {
    const order = merchantOrder(html);
    const sorted = [...order].sort((a, b) => a.localeCompare(b));
    expect(order).toEqual(sorted);
  });

  it("omits any merchant that does NOT genuinely serve the airport (no broken/misleading link)", () => {
    // Belfast International is HE-only: exactly one option, and only Holiday Extras.
    const order = merchantOrder(heOnlyHtml);
    expect(order).toEqual(["Holiday Extras"]);
    expect(heOnlyHtml).not.toContain("parking%3Aaph");
    expect(heOnlyHtml).not.toContain("parking%3Apurple-parking");
    expect(heOnlyHtml).not.toContain("parking%3Aairparks");
    expect(heOnlyHtml).not.toContain("parking%3Apark-bcp");
    expect(heOnlyHtml).toContain('href="/go/belfast-international/parking%3Aholiday-extras?s=parking"');
  });

  it("never fabricates the Holiday-Extras-only discount promo for another merchant", () => {
    // The "up to 25% at Gatwick" line is an HE offer — it must appear at most once (HE's row), never
    // attached to APH/Airparks/Purple Parking.
    const occurrences = html.split("up to 25% at Gatwick").length - 1;
    expect(occurrences).toBe(1);
  });

  it("carries the affiliate disclosure + commission-blind ordering note before the options", () => {
    expect(html).toContain("We earn a commission if you book through these links");
    expect(html).toContain("ordered alphabetically");
    expect(html).toContain("never changes our ranking");
    const disclosureIdx = html.indexOf("We earn a commission if you book through these links");
    const firstOptionIdx = html.indexOf("Book parking with");
    expect(disclosureIdx).toBeGreaterThan(-1);
    expect(firstOptionIdx).toBeGreaterThan(-1);
    expect(disclosureIdx).toBeLessThan(firstOptionIdx);
  });

  it("Ad label appears before the affiliate options (disclosure-before-CTA ordering)", () => {
    const adIdx = html.indexOf(">Ad<");
    const ctaIdx = html.indexOf("Book parking with");
    expect(adIdx).toBeGreaterThan(-1);
    expect(ctaIdx).toBeGreaterThan(-1);
    expect(adIdx).toBeLessThan(ctaIdx);
  });

  it("affiliate options appear before the official site block (affiliate first/primary)", () => {
    const affiliateIdx = html.indexOf("Book parking with");
    const officialIdx = html.indexOf("Go to airport site");
    expect(affiliateIdx).toBeGreaterThan(-1);
    expect(officialIdx).toBeGreaterThan(-1);
    expect(affiliateIdx).toBeLessThan(officialIdx);
  });

  it("keeps the ranking commission-blind and avoids non-compliant copy", () => {
    expect(html).toContain("never changes our ranking");
    expect(html).not.toContain(">Up to 25% off<");
    expect(html).not.toContain("may earn");
    expect(html).not.toContain("up to 75%");
  });

  it("shows the cheapest guide price once when price and days props are provided", () => {
    expect(htmlWithPrice).toContain("from £42.00 for 7 days");
  });

  it("does not show a guide price string when price/days are omitted", () => {
    expect(html).not.toContain("from £");
  });

  it("shows the honest saving line when the cta model is in the 'saving' state", () => {
    const savingCta: ParkingCtaModel = { state: "saving", pricePence: 4200, gatePence: 31500, savingVsGatePence: 27300, days: 7 };
    const out = renderToStaticMarkup(
      <BookingOptions airportName="Manchester" airportSlug="manchester" officialUrl="https://x" cta={savingCta} />
    );
    expect(out).toContain("from £42.00 for 7 days");
    expect(out).toContain("Save £273.00 vs the £315.00 drive-up gate price");
    // Manchester is a multi-merchant airport — still multi-option even with a cta model (incl. Park BCP).
    expect(merchantOrder(out)).toEqual(["Airparks", "APH", "Holiday Extras", "Park BCP", "Purple Parking"]);
  });

  it("Heathrow's primary override pins Heathrow Airport Parking first; the rest stay alphabetical (Mike-directed, 2026-07-11)", () => {
    expect(merchantOrder(heathrowHtml)).toEqual([
      "Heathrow Airport Parking",
      "Airparks",
      "APH",
      "Holiday Extras",
      "Park BCP",
      "Purple Parking",
    ]);
  });

  it("Heathrow's disclosure honestly names the pinned primary instead of falsely claiming pure alphabetical order", () => {
    expect(heathrowHtml).toContain("Heathrow Airport Parking is shown first");
    expect(heathrowHtml).not.toContain("We show every partner that serves Heathrow, ordered alphabetically");
  });

  it("every other airport's disclosure is untouched — still claims pure alphabetical order, no primary pin", () => {
    expect(html).toContain("ordered alphabetically");
    expect(html).not.toContain("is shown first");
  });

  it("gate-only cta (Stansted case): suppresses the price AND makes no saving claim", () => {
    const gateOnlyCta: ParkingCtaModel = { state: "gate-only", pricePence: null, gatePence: 33600, savingVsGatePence: null, days: 7 };
    const out = renderToStaticMarkup(
      <BookingOptions airportName="Stansted" airportSlug="stansted" officialUrl="https://x" cta={gateOnlyCta} />
    );
    expect(out).not.toContain("from £");
    expect(out).not.toContain("£336.00");
    expect(out).not.toContain("Save £");
    // The options still render (just without a fabricated price).
    expect(out).toContain("Book parking with");
  });
});
