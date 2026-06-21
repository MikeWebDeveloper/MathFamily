import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ParkingRecord } from "@mathfamily/data";
import { ParkingAnswer } from "../components/parking-answer";
import { coveredParkingDurations, parkingCtaModel, parkingPageModel } from "../lib/parking-content";

const record: ParkingRecord = {
  airportSlug: "manchester",
  products: [
    {
      productType: "gate",
      name: "Multi-Storey (drive-up)",
      prices: [
        { days: 3, totalPence: 13500 },
        { days: 7, totalPence: 31500 },
        { days: 14, totalPence: 63000 }
      ],
      snapshotDate: null,
      notes: null
    },
    {
      productType: "prebook",
      name: "JetParks 1 (pre-book)",
      prices: [
        { days: 3, totalPence: 2400 },
        { days: 7, totalPence: 4200 },
        { days: 14, totalPence: 8000 }
      ],
      snapshotDate: "2026-06-10",
      notes: null
    }
  ],
  sourceUrl: "https://www.manchesterairport.co.uk/parking/",
  verifiedAt: "2026-06-10"
};

const entries = [3, 7, 14].map((days) => ({ days, model: parkingPageModel(record, days), cta: parkingCtaModel(record, days) }));

const html = renderToStaticMarkup(
  <ParkingAnswer
    entries={entries}
    defaultDays={7}
    slug="manchester"
    airportName="Manchester"
    officialUrl="https://www.manchesterairport.co.uk/parking/"
  />
);

// Record that only has 3-day and 14-day prices (no 7-day data).
const recordNo7: ParkingRecord = {
  ...record,
  products: record.products.map((p) => ({
    ...p,
    prices: p.prices.filter((pr) => pr.days !== 7),
  })),
};
const entriesNo7 = coveredParkingDurations(recordNo7).map((days) => ({
  days,
  model: parkingPageModel(recordNo7, days),
  cta: parkingCtaModel(recordNo7, days),
}));

describe("ParkingAnswer clamp: defaultDays=7 but 7 not in entries", () => {
  it("falls back to the first covered duration (3 days) instead of showing stale 7-day data", () => {
    // entriesNo7 covers [3, 14] — requesting defaultDays=7 must clamp to 3.
    const htmlNo7 = renderToStaticMarkup(
      <ParkingAnswer
        entries={entriesNo7}
        defaultDays={7}
        slug="manchester"
        airportName="Manchester"
        officialUrl="https://www.manchesterairport.co.uk/parking/"
      />
    );
    // Should render the 3-day answer (£24.00), not the 7-day one (£42.00).
    expect(htmlNo7).toContain("£24");
    expect(htmlNo7).not.toContain("7-day");
  });

  it("segmented control only shows covered durations when 7 is absent", () => {
    const htmlNo7 = renderToStaticMarkup(
      <ParkingAnswer
        entries={entriesNo7}
        defaultDays={7}
        slug="manchester"
        airportName="Manchester"
        officialUrl="https://www.manchesterairport.co.uk/parking/"
      />
    );
    expect(htmlNo7).toContain("3 days");
    expect(htmlNo7).toContain("14 days");
    // 7 days must NOT appear as a control option since it has no entry.
    expect(htmlNo7).not.toContain("7 days");
  });
});

describe("ParkingAnswer SSR at defaultDays=7", () => {
  it("renders the 7-day hero answer", () => {
    // parkingPageModel at 7 days → cheapest is JetParks 1 at £42.00
    expect(html).toContain("£42");
    expect(html).toContain("7-day");
  });

  it("renders the duration segmented control", () => {
    expect(html).toContain("3 days");
    expect(html).toContain("7 days");
    expect(html).toContain("14 days");
  });

  it("renders the cheapest badge", () => {
    expect(html).toContain("Cheapest");
  });

  it("renders a parking-result aria-live region", () => {
    expect(html).toContain('data-testid="parking-result"');
  });

  it("renders BookingOptions with disclosure text inside the affiliate block", () => {
    // Disclosure must be present
    expect(html).toContain("never changes our ranking");
  });

  it("renders the price in the BookingOptions affiliate CTA", () => {
    // With price=4200 (7-day cheapest) → £42.00
    expect(html).toContain("from £42.00 for 7 days");
  });

  it("surfaces the honest 'save £X vs the £Y drive-up gate price' line (saving state)", () => {
    // 7-day: gate £315.00 − pre-book £42.00 = £273.00 saving vs the £315.00 gate.
    expect(html).toContain("Save £273.00 vs the £315.00 drive-up gate price");
  });

  it("affiliate CTA (Book my parking) appears before the official site link (Go to airport site)", () => {
    const affiliateIdx = html.indexOf("Book my parking");
    const officialIdx = html.indexOf("Go to airport site");
    expect(affiliateIdx).toBeGreaterThan(-1);
    expect(officialIdx).toBeGreaterThan(-1);
    expect(affiliateIdx).toBeLessThan(officialIdx);
  });

  it("disclosure appears before the affiliate CTA", () => {
    const disclosureIdx = html.indexOf("never changes our ranking");
    const ctaIdx = html.indexOf("Book my parking");
    expect(disclosureIdx).toBeGreaterThan(-1);
    expect(ctaIdx).toBeGreaterThan(-1);
    expect(disclosureIdx).toBeLessThan(ctaIdx);
  });
});
