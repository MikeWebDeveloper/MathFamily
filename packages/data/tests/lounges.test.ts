import { describe, expect, it } from "vitest";
import { LoungeRecordSchema, loadLoungeDataset, loadPriorityPass } from "../src/lounges";

const validRecord = {
  airportSlug: "manchester",
  lounges: [
    { name: "Escape Lounge T1", walkInPence: 3500, priorityPass: true, notes: null },
    { name: "1903 Lounge", walkInPence: 5000, priorityPass: false, notes: "Premium lounge" }
  ],
  sourceUrl: "https://www.manchesterairport.co.uk/at-the-airport/lounges/",
  verifiedAt: "2026-06-10"
};

describe("LoungeRecordSchema", () => {
  it("accepts a valid record", () => {
    expect(() => LoungeRecordSchema.parse(validRecord)).not.toThrow();
  });
  it("rejects unknown fields (strict)", () => {
    expect(() => LoungeRecordSchema.parse({ ...validRecord, extra: 1 })).toThrow();
  });
});

describe("loaders", () => {
  it("loads the lounge dataset", () => {
    expect(loadLoungeDataset().records.length).toBeGreaterThanOrEqual(1);
  });
  it("loads Priority Pass tiers with positive fees", () => {
    const pp = loadPriorityPass();
    expect(pp.tiers.length).toBeGreaterThanOrEqual(2);
    for (const t of pp.tiers) expect(t.annualFeePence).toBeGreaterThan(0);
  });
});
