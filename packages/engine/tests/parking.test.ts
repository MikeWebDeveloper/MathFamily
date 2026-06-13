import { describe, expect, it } from "vitest";
import { compareParking, type ParkingTariff } from "../src/parking";

const NOW = new Date("2026-06-10T12:00:00Z");

const manchester: ParkingTariff = {
  products: [
    {
      productType: "gate",
      name: "Multi-Storey (drive-up)",
      prices: [
        { days: 3, totalPence: 13500 },
        { days: 7, totalPence: 31500 },
        { days: 14, totalPence: 63000 }
      ],
      snapshotDate: null
    },
    {
      productType: "prebook",
      name: "JetParks 1 (pre-book)",
      prices: [
        { days: 3, totalPence: 2400 },
        { days: 7, totalPence: 4200 },
        { days: 14, totalPence: 8000 }
      ],
      snapshotDate: "2026-06-01"
    }
  ],
  verifiedAt: "2026-06-01"
};

describe("compareParking", () => {
  it("returns options sorted cheapest first for the requested duration", () => {
    const c = compareParking(manchester, 7, NOW);
    expect(c.options[0]).toMatchObject({ name: "JetParks 1 (pre-book)", totalPence: 4200 });
    expect(c.options[1]).toMatchObject({ totalPence: 31500 });
  });
  it("computes savings vs the gate price", () => {
    const c = compareParking(manchester, 7, NOW);
    expect(c.savingsVsGatePence).toBe(31500 - 4200);
  });
  it("skips products that don't quote the requested duration", () => {
    const tariffWithoutFourteen: ParkingTariff = {
      ...manchester,
      products: manchester.products.map((p) => ({
        ...p,
        prices: p.prices.filter((pr) => pr.days !== 14)
      }))
    };
    const c = compareParking(tariffWithoutFourteen, 14, NOW);
    expect(c.options).toHaveLength(0);
    expect(c.warnings.map((w) => w.code)).toContain("DURATION_NOT_COVERED");
  });

  it("returns correctly ranked options for 14 days — covered-duration path", () => {
    const c = compareParking(manchester, 14, NOW);
    expect(c.options).toHaveLength(2);
    expect(c.options[0]).toMatchObject({ name: "JetParks 1 (pre-book)", totalPence: 8000 });
    expect(c.options[1]).toMatchObject({ totalPence: 63000 });
    expect(c.savingsVsGatePence).toBe(63000 - 8000);
    expect(c.cheapest?.name).toBe("JetParks 1 (pre-book)");
  });
  it("flags pre-book prices as snapshots", () => {
    const c = compareParking(manchester, 3, NOW);
    expect(c.warnings.map((w) => w.code)).toContain("PREBOOK_SNAPSHOT");
  });
  it("flags stale verification", () => {
    const stale = { ...manchester, verifiedAt: "2026-01-01" };
    expect(compareParking(stale, 3, NOW).warnings.map((w) => w.code)).toContain("DATA_UNVERIFIED_RECENTLY");
  });
  it("never throws on out-of-range duration — clamps to a positive integer", () => {
    expect(() => compareParking(manchester, -2, NOW)).not.toThrow();
  });
});
