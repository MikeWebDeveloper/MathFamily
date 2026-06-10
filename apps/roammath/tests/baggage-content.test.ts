import { describe, expect, it } from "vitest";
import type { BaggageRecord } from "@mathfamily/data";
import { baggageAnswer, feeRangeLabel } from "../lib/baggage-content";

const record: BaggageRecord = {
  airlineSlug: "ryanair",
  airlineName: "Ryanair",
  fees: [
    { item: "Small personal bag", minPence: 0, maxPence: 0, note: "Included" },
    { item: "10kg cabin bag", minPence: 600, maxPence: 3600, note: "Varies by route/date" }
  ],
  dynamicPricingNote: "Dynamic pricing",
  sourceUrl: "https://www.ryanair.com/fees",
  verifiedAt: "2026-06-10"
};

describe("feeRangeLabel", () => {
  it("renders free, fixed and range fees", () => {
    expect(feeRangeLabel({ item: "x", minPence: 0, maxPence: 0, note: null })).toBe("Free");
    expect(feeRangeLabel({ item: "x", minPence: 1500, maxPence: 1500, note: null })).toBe("£15");
    expect(feeRangeLabel({ item: "x", minPence: 600, maxPence: 3600, note: null })).toBe("£6–£36");
    expect(feeRangeLabel({ item: "x", minPence: null, maxPence: null, note: null })).toBe("Not published");
  });
});

describe("baggageAnswer", () => {
  it("summarises cabin bag cost range", () => {
    const a = baggageAnswer(record);
    expect(a).toContain("Ryanair");
    expect(a).toContain("£6–£36");
  });
});
