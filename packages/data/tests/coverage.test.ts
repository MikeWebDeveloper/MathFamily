import { describe, expect, it } from "vitest";
import { loadAirports, loadDropOffDataset } from "../src/index";

describe("drop-off dataset coverage", () => {
  it("every airport has exactly one drop-off record", () => {
    const recordSlugs = loadDropOffDataset().records.map((r) => r.airportSlug);
    const airportSlugs = loadAirports().map((a) => a.slug).sort();
    expect([...recordSlugs].sort()).toEqual(airportSlugs);
    expect(new Set(recordSlugs).size).toBe(recordSlugs.length);
  });
});
