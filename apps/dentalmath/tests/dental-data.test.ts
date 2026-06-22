import { describe, expect, it } from "vitest";
import { NHS_BAND_CHARGES, NHS_NATIONS, TREATMENTS, bandFor, latestVerifiedAt } from "../lib/dental-data";

describe("NHS band charges", () => {
  it("matches the verified NHS England figures", () => {
    const byBand = Object.fromEntries(NHS_BAND_CHARGES.map((b) => [b.band, b.pricePence]));
    expect(byBand.band1).toBe(2790); // £27.90
    expect(byBand.band2).toBe(7660); // £76.60
    expect(byBand.band3).toBe(33210); // £332.10
    expect(byBand.urgent).toBe(2790); // £27.90
  });
});

describe("dataset integrity", () => {
  it("every treatment maps to a known band and has a sane private range", () => {
    for (const t of TREATMENTS) {
      const band = bandFor(t);
      expect(band).toBeTruthy();
      expect(t.privatePrice.minPence).toBeGreaterThan(0);
      expect(t.privatePrice.maxPence).toBeGreaterThanOrEqual(t.privatePrice.minPence);
    }
  });

  it("every record carries a source URL and an ISO verified date", () => {
    const isoDate = /^\d{4}-\d{2}-\d{2}$/;
    for (const t of TREATMENTS) {
      expect(t.privateSource.sourceUrl).toMatch(/^https?:\/\//);
      expect(t.privateSource.verifiedAt).toMatch(isoDate);
    }
    for (const n of NHS_NATIONS) {
      expect(n.source.sourceUrl).toMatch(/^https?:\/\//);
      expect(n.source.verifiedAt).toMatch(isoDate);
    }
  });

  it("covers all four UK nations", () => {
    const slugs = NHS_NATIONS.map((n) => n.slug).sort();
    expect(slugs).toEqual(["england", "northern-ireland", "scotland", "wales"]);
  });

  it("exposes a latest verified date", () => {
    expect(latestVerifiedAt()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
