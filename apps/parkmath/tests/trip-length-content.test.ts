import { describe, expect, it } from "vitest";
import { formatPence } from "@mathfamily/engine";
import type { ParkingRecord } from "@mathfamily/data";
import { TRIP_LENGTH_DAYS, tripLengthModel } from "../lib/trip-length-content";

// Flat £48/24h gate rate at 3/7/14 days, no pre-book product at all.
const flatNoPrebook: ParkingRecord = {
  airportSlug: "flat-only",
  products: [
    {
      productType: "gate",
      name: "Turn Up & Park (drive-up)",
      prices: [
        { days: 3, totalPence: 14400 },
        { days: 7, totalPence: 33600 },
        { days: 14, totalPence: 67200 }
      ],
      snapshotDate: null,
      notes: null
    }
  ],
  sourceUrl: "https://example.com/parking",
  verifiedAt: "2026-06-10"
};

// Gate £48/24h (flat) + a pre-book snapshot that lands exactly on day 7 and beats the gate.
const withPrebookOnGrid: ParkingRecord = {
  airportSlug: "glasgow-like",
  products: [
    {
      productType: "gate",
      name: "Turn Up & Park (drive-up)",
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
      name: "Pre-book (7 days)",
      prices: [{ days: 7, totalPence: 25000 }],
      snapshotDate: "2026-06-12",
      notes: null
    }
  ],
  sourceUrl: "https://example.com/parking",
  verifiedAt: "2026-06-12"
};

// Pre-book snapshot at day 8 (off the 3/7/14 grid) — must NEVER be interpolated onto day 7.
const withPrebookOffGrid: ParkingRecord = {
  airportSlug: "stansted-like",
  products: [
    {
      productType: "gate",
      name: "Turn Up & Park (drive-up)",
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
      name: "Pre-book (8 days)",
      prices: [{ days: 8, totalPence: 7199 }],
      snapshotDate: "2026-06-10",
      notes: null
    }
  ],
  sourceUrl: "https://example.com/parking",
  verifiedAt: "2026-06-10"
};

const noGateAtAll: ParkingRecord = {
  airportSlug: "no-gate",
  products: [
    {
      productType: "prebook",
      name: "Pre-book only",
      prices: [{ days: 5, totalPence: 5000 }],
      snapshotDate: "2026-06-01",
      notes: null
    }
  ],
  sourceUrl: "https://example.com/parking",
  verifiedAt: "2026-06-01"
};

describe("tripLengthModel", () => {
  it("returns null when there is no gate price at any of the 3/7/14 reference durations", () => {
    expect(tripLengthModel(noGateAtAll, "Nowhere")).toBeNull();
  });

  it("builds a flat-rate verdict + all 3 rows, with no fabricated pre-book figures", () => {
    const m = tripLengthModel(flatNoPrebook, "Flatville");
    expect(m).not.toBeNull();
    expect(m!.rows).toHaveLength(TRIP_LENGTH_DAYS.length);
    expect(m!.flatGateRate).toBe(true);
    expect(m!.hasAnyPrebook).toBe(false);
    for (const row of m!.rows) {
      expect(row.prebookPence).toBeNull();
      expect(row.prebookPerDayPence).toBeNull();
      expect(row.cheaperOption).toBeNull();
      expect(row.gatePerDayPence).toBe(4800); // £48/day at every duration — genuinely flat
    }
    expect(m!.verdict).toContain("Flatville");
    expect(m!.verdict).toContain(formatPence(4800));
    expect(m!.verdict).toContain("no verified pre-book price");
  });

  it("surfaces a same-duration pre-book win with an exact saving, and never touches off-grid durations", () => {
    const m = tripLengthModel(withPrebookOnGrid, "Prebookington");
    expect(m).not.toBeNull();
    const day7 = m!.rows.find((r) => r.days === 7)!;
    expect(day7.prebookPence).toBe(25000);
    expect(day7.cheaperOption).toBe("prebook");
    expect(day7.savingPence).toBe(33600 - 25000);
    // 3 and 14 days have no pre-book snapshot in this fixture — must stay null, not interpolated.
    const day3 = m!.rows.find((r) => r.days === 3)!;
    const day14 = m!.rows.find((r) => r.days === 14)!;
    expect(day3.prebookPence).toBeNull();
    expect(day14.prebookPence).toBeNull();
    expect(m!.hasAnyPrebook).toBe(true);
    expect(m!.verdict).toContain("Prebookington");
    expect(m!.verdict).toContain(formatPence(33600 - 25000));
  });

  it("never interpolates an off-grid pre-book snapshot onto a 3/7/14 row (day-8 snapshot stays absent everywhere)", () => {
    const m = tripLengthModel(withPrebookOffGrid, "Offgridton");
    expect(m).not.toBeNull();
    expect(m!.hasAnyPrebook).toBe(false);
    for (const row of m!.rows) {
      expect(row.prebookPence).toBeNull();
    }
    expect(m!.flatGateRate).toBe(true);
    expect(m!.verdict).toContain("no verified pre-book price");
  });
});
