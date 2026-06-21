import { describe, expect, it } from "vitest";
import type { ParkingRecord } from "@mathfamily/data";
import { DURATION_SLUGS, buildParkingFaqs, coveredParkingDurations, durationFromSlug, parkingCtaModel, parkingPageModel } from "../lib/parking-content";

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

describe("coveredParkingDurations → page entries clamp", () => {
  it("page-level defaultDays clamp: prefers 7 when covered", () => {
    const covered = coveredParkingDurations(record);
    const defaultDays = covered.includes(7) ? 7 : (covered[0] ?? 7);
    expect(defaultDays).toBe(7);
  });

  it("page-level defaultDays clamp: falls back to first when 7 is absent", () => {
    const partial: ParkingRecord = {
      ...record,
      products: record.products.map((p) => ({
        ...p,
        prices: p.prices.filter((pr) => pr.days !== 7),
      })),
    };
    const covered = coveredParkingDurations(partial);
    const defaultDays = covered.includes(7) ? 7 : (covered[0] ?? 7);
    expect(defaultDays).toBe(3); // first covered duration
    expect(covered).not.toContain(7);
  });
});

describe("buildParkingFaqs", () => {
  it("includes cheapest + gate-vs-prebook questions", () => {
    const faqs = buildParkingFaqs(record, "Manchester", 7);
    expect(faqs[0]?.question).toContain("cheapest");
    expect(faqs.some((f) => f.question.includes("pre-book"))).toBe(true);
  });
});

// The Stansted shape that the diagnostic flagged: gate covers 3/7/14, the only pre-book snapshot
// is at a DIFFERENT duration (8 days), so for 7 days the gate is the only option — the CTA must NOT
// dress the gate price up as a discounted "from" pre-book figure, and must claim no saving.
const stanstedLike: ParkingRecord = {
  airportSlug: "stansted",
  products: [
    {
      productType: "gate",
      name: "Mid Stay — Turn Up & Park (drive-up)",
      prices: [
        { days: 3, totalPence: 14400 },
        { days: 7, totalPence: 33600 },
        { days: 14, totalPence: 67200 }
      ],
      snapshotDate: null,
      notes: null
    },
    {
      productType: "prebook",
      name: "Long Stay (pre-book) — published 'from' price",
      prices: [{ days: 8, totalPence: 7199 }],
      snapshotDate: "2026-06-10",
      notes: null
    }
  ],
  sourceUrl: "https://www.stanstedairport.com/parking/long-stay/",
  verifiedAt: "2026-06-10"
};

// The Glasgow shape: a real 7-day pre-book that genuinely beats the 7-day drive-up gate price.
const glasgowLike: ParkingRecord = {
  airportSlug: "glasgow",
  products: [
    {
      productType: "gate",
      name: "Long Stay — turn-up (drive-up)",
      prices: [
        { days: 3, totalPence: 8000 },
        { days: 7, totalPence: 14000 },
        { days: 14, totalPence: 24500 }
      ],
      snapshotDate: null,
      notes: null
    },
    {
      productType: "prebook",
      name: "Long Stay (pre-book) — published 'from' price",
      prices: [{ days: 7, totalPence: 4999 }],
      snapshotDate: "2026-06-10",
      notes: null
    }
  ],
  sourceUrl: "https://www.glasgowairport.com/parking/",
  verifiedAt: "2026-06-10"
};

describe("parkingCtaModel", () => {
  it("surfaces a real saving when a same-duration pre-book beats the gate (Glasgow 7d)", () => {
    const cta = parkingCtaModel(glasgowLike, 7);
    expect(cta.state).toBe("saving");
    expect(cta.pricePence).toBe(4999);
    expect(cta.gatePence).toBe(14000);
    expect(cta.savingVsGatePence).toBe(14000 - 4999); // 9001 — exact gate − prebook
  });

  it("suppresses price + saving when the only 7-day option is the drive-up gate (Stansted fix)", () => {
    const cta = parkingCtaModel(stanstedLike, 7);
    expect(cta.state).toBe("gate-only");
    // Critical: never present the gate price as a discounted "from" pre-book figure.
    expect(cta.pricePence).toBeNull();
    expect(cta.savingVsGatePence).toBeNull();
    expect(cta.gatePence).toBe(33600);
  });

  it("never invents a saving for the full-gate parking dataset (no same-duration prebook → no claim)", () => {
    // record (Manchester-like) here DOES have a cheaper prebook at 7d, so it's a saving — sanity check
    // the inverse: a record whose prebook is dearer than gate must not claim a saving.
    const dearPrebook: ParkingRecord = {
      ...glasgowLike,
      products: [
        glasgowLike.products[0]!,
        { productType: "prebook", name: "Pricey pre-book", prices: [{ days: 7, totalPence: 20000 }], snapshotDate: "2026-06-10", notes: null }
      ]
    };
    const cta = parkingCtaModel(dearPrebook, 7);
    // gate (14000) is cheapest → gate-only, no saving claim, no fabricated price.
    expect(cta.state).toBe("gate-only");
    expect(cta.savingVsGatePence).toBeNull();
  });

  it("a real cheaper pre-book always produces a positive integer-pence saving", () => {
    const cta = parkingCtaModel(record, 7); // Manchester-like: prebook 4200 vs gate 31500
    expect(cta.state).toBe("saving");
    expect(cta.savingVsGatePence).toBe(31500 - 4200);
    expect(Number.isInteger(cta.savingVsGatePence)).toBe(true);
    expect(cta.savingVsGatePence!).toBeGreaterThan(0);
  });
});
