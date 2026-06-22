import { describe, expect, it } from "vitest";
import { loadAirports, loadDropOffDataset } from "../src/index";

describe("loaders", () => {
  it("loads and validates all airports", () => {
    const airports = loadAirports();
    expect(airports.length).toBe(26);
  });
  it("loads and validates the drop-off dataset", () => {
    const dataset = loadDropOffDataset();
    expect(dataset.records.length).toBeGreaterThanOrEqual(1);
  });
  it("every drop-off record references a known airport", () => {
    const slugs = new Set(loadAirports().map((a) => a.slug));
    for (const record of loadDropOffDataset().records) {
      expect(slugs.has(record.airportSlug), `unknown airport: ${record.airportSlug}`).toBe(true);
    }
  });
});
