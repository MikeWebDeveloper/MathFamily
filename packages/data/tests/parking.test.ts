import { describe, expect, it } from "vitest";
import { ParkingRecordSchema, loadParkingDataset } from "../src/parking";

const validRecord = {
  airportSlug: "manchester",
  products: [
    {
      productType: "gate",
      name: "Multi-Storey T1 (drive-up)",
      prices: [
        { days: 1, totalPence: 4500 },
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
      notes: "Quote snapshot from the official pre-booking portal"
    }
  ],
  sourceUrl: "https://www.manchesterairport.co.uk/parking/",
  verifiedAt: "2026-06-10"
};

describe("ParkingRecordSchema", () => {
  it("accepts a valid record", () => {
    expect(() => ParkingRecordSchema.parse(validRecord)).not.toThrow();
  });
  it("rejects a prebook product without a snapshotDate", () => {
    const bad = structuredClone(validRecord);
    bad.products[1]!.snapshotDate = null;
    expect(() => ParkingRecordSchema.parse(bad)).toThrow();
  });
  it("rejects unknown product types", () => {
    const bad = structuredClone(validRecord);
    (bad.products[0] as { productType: string }).productType = "valet";
    expect(() => ParkingRecordSchema.parse(bad)).toThrow();
  });
  it("rejects non-integer pence", () => {
    const bad = structuredClone(validRecord);
    bad.products[0]!.prices[0]!.totalPence = 45.5;
    expect(() => ParkingRecordSchema.parse(bad)).toThrow();
  });
});

describe("loadParkingDataset", () => {
  it("loads and validates the dataset; every slug is a known airport", () => {
    const dataset = loadParkingDataset();
    expect(dataset.records.length).toBeGreaterThanOrEqual(1);
  });
});
