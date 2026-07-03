import { describe, expect, it } from "vitest";
import { loadAirports, loadParkingDataset, freshnessReport } from "../src/index";

describe("parking dataset", () => {
  it("covers the verified parking airports with no duplicates", () => {
    // The verified parking roster, kept in sync with the dataset. newcastle/leeds-bradford/
    // liverpool/teesside were added once official dated quotes were obtained — see
    // docs/verification/2026-06-parking-research-notes.md. prestwick/aberdeen/belfast-international/
    // exeter added 2026-07-03 (tranche 3, regional-first) — see the Batch 3 section of the same file.
    // inverness and belfast-city were researched the same day but SKIPPED (fail-closed): neither
    // publishes a usable drive-up tariff (Inverness Long Stay has no 1-3 day band and no backward-
    // applicable per-day rate; Belfast City's gate rate is stated to be shown only on physical
    // drive-up boards, never published online).
    const expected = [
      "heathrow", "gatwick", "manchester", "stansted", "luton", "edinburgh",
      "birmingham", "glasgow", "bristol", "newcastle", "leeds-bradford", "liverpool", "teesside",
      "prestwick", "aberdeen", "belfast-international", "exeter"
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
