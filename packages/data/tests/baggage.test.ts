import { describe, expect, it } from "vitest";
import { BaggageRecordSchema, loadBaggageDataset } from "../src/baggage";

const validRecord = {
  airlineSlug: "ryanair",
  airlineName: "Ryanair",
  fees: [
    { item: "Small personal bag (under seat)", minPence: 0, maxPence: 0, note: "Included with every fare" },
    { item: "10kg cabin bag", minPence: 600, maxPence: 3600, note: "Price varies by route and date" },
    { item: "20kg checked bag", minPence: 1899, maxPence: 5999, note: "Price varies by route and date" }
  ],
  dynamicPricingNote: "Ryanair prices bags dynamically; ranges reflect the official published min–max",
  sourceUrl: "https://www.ryanair.com/gb/en/useful-info/help-centre/fees",
  verifiedAt: "2026-06-10"
};

describe("BaggageRecordSchema", () => {
  it("accepts a valid record", () => {
    expect(() => BaggageRecordSchema.parse(validRecord)).not.toThrow();
  });
  it("rejects a fee where min exceeds max", () => {
    const bad = structuredClone(validRecord);
    bad.fees[1]!.minPence = 9999;
    expect(() => BaggageRecordSchema.parse(bad)).toThrow();
  });
  it("rejects unknown fields (strict)", () => {
    expect(() => BaggageRecordSchema.parse({ ...validRecord, extra: 1 })).toThrow();
  });
});

describe("loadBaggageDataset", () => {
  it("loads and validates", () => {
    expect(loadBaggageDataset().records.length).toBeGreaterThanOrEqual(1);
  });
});
