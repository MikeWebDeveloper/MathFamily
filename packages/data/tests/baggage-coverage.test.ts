import { describe, expect, it } from "vitest";
import { loadBaggageDataset } from "../src/index";

const EXPECTED = ["ryanair","easyjet","jet2","british-airways","wizz-air","tui","virgin-atlantic","aer-lingus","vueling","norwegian","emirates","lufthansa"].sort();

describe("baggage dataset coverage", () => {
  it("covers the 12 airlines exactly once", () => {
    const slugs = loadBaggageDataset().records.map((r) => r.airlineSlug).sort();
    expect(slugs).toEqual(EXPECTED);
  });
});
