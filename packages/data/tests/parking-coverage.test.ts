import { describe, expect, it } from "vitest";
import { loadAirports, loadParkingDataset, freshnessReport } from "../src/index";

describe("parking dataset", () => {
  it("covers the verified parking airports with no duplicates", () => {
    // The verified parking roster, kept in sync with the dataset. newcastle/leeds-bradford/
    // liverpool/teesside were added once official dated quotes were obtained — see
    // docs/verification/2026-06-parking-research-notes.md.
    const expected = [
      "heathrow", "gatwick", "manchester", "stansted", "luton", "edinburgh",
      "birmingham", "glasgow", "bristol", "newcastle", "leeds-bradford", "liverpool", "teesside"
    ].sort();
    const slugs = loadParkingDataset().records.map((r) => r.airportSlug).sort();
    expect(slugs).toEqual(expected);
    // No duplicate slugs.
    expect(new Set(slugs).size).toBe(slugs.length);
  });
  it("every slug is a known airport", () => {
    const known = new Set(loadAirports().map((a) => a.slug));
    for (const r of loadParkingDataset().records) expect(known.has(r.airportSlug)).toBe(true);
  });
  it("every record offers the three standard durations on at least one product", () => {
    for (const r of loadParkingDataset().records) {
      for (const days of [3, 7, 14]) {
        expect(
          r.products.some((p) => p.prices.some((x) => x.days === days)),
          `${r.airportSlug} missing ${days}-day price`
        ).toBe(true);
      }
    }
  });
  it("no record breaches the freshness failure threshold", () => {
    const report = freshnessReport(
      loadParkingDataset().records.map((r) => ({ label: `parking:${r.airportSlug}`, verifiedAt: r.verifiedAt })),
      new Date()
    );
    expect(report.errors).toEqual([]);
  });
});
