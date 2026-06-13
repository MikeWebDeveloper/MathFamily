import { describe, expect, it } from "vitest";
import type { ParkingRecord } from "@mathfamily/data";
import { DURATION_SLUGS, buildParkingFaqs, coveredParkingDurations, durationFromSlug, parkingPageModel } from "../lib/parking-content";

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

describe("durationFromSlug", () => {
  it("parses valid slugs and rejects others", () => {
    expect(durationFromSlug("7-days")).toBe(7);
    expect(durationFromSlug("2-weeks")).toBeNull();
  });
});

describe("parkingPageModel", () => {
  it("produces a cheapest verdict for the duration", () => {
    const m = parkingPageModel(record, 7);
    expect(m.cheapest?.name).toBe("JetParks 1 (pre-book)");
    expect(m.savingsVsGatePence).toBe(27300);
    expect(m.answer).toContain("£42");
  });
  it("produces materially different models per duration (anti-thin-content guard)", () => {
    const bodies = DURATION_SLUGS.map((slug) => JSON.stringify(parkingPageModel(record, durationFromSlug(slug)!)));
    expect(new Set(bodies).size).toBe(DURATION_SLUGS.length);
  });
});

describe("coveredParkingDurations", () => {
  it("returns [3, 7, 14] when all durations are present", () => {
    expect(coveredParkingDurations(record)).toEqual([3, 7, 14]);
  });

  it("excludes durations not present in any product's prices", () => {
    const partial: ParkingRecord = {
      ...record,
      products: record.products.map((p) => ({
        ...p,
        prices: p.prices.filter((pr) => pr.days !== 14)
      }))
    };
    expect(coveredParkingDurations(partial)).toEqual([3, 7]);
    expect(coveredParkingDurations(partial)).not.toContain(14);
  });

  it("maps each covered duration to a model with options (no 'DURATION_NOT_COVERED')", () => {
    const durations = coveredParkingDurations(record);
    for (const days of durations) {
      const m = parkingPageModel(record, days);
      expect(m.options.length).toBeGreaterThan(0);
      expect(m.warnings.map((w) => w.code)).not.toContain("DURATION_NOT_COVERED");
    }
  });

  it("produces models with distinct answers for each covered duration", () => {
    const durations = coveredParkingDurations(record);
    const answers = durations.map((days) => parkingPageModel(record, days).answer);
    expect(new Set(answers).size).toBe(durations.length);
  });
});

describe("buildParkingFaqs", () => {
  it("includes cheapest + gate-vs-prebook questions", () => {
    const faqs = buildParkingFaqs(record, "Manchester", 7);
    expect(faqs[0]?.question).toContain("cheapest");
    expect(faqs.some((f) => f.question.includes("pre-book"))).toBe(true);
  });
});
