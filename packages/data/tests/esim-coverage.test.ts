import { describe, expect, it } from "vitest";
import { loadEsimDataset, loadRoamingDataset } from "../src/index";

describe("esim dataset coverage", () => {
  it("every roaming destination has an esim record with at least one bundle", () => {
    const roaming = new Set(loadRoamingDataset().destinations.map((d) => d.countrySlug));
    const esim = new Map(loadEsimDataset().records.map((r) => [r.countrySlug, r]));
    for (const slug of roaming) {
      expect(esim.has(slug), `missing esim record for ${slug}`).toBe(true);
      expect(esim.get(slug)!.bundles.length).toBeGreaterThanOrEqual(1);
    }
  });
});
