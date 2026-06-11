import { describe, expect, it } from "vitest";
import { loadRoamingDataset } from "../src";

describe("roaming destinations iso2", () => {
  it("every destination has a lowercase iso2 code", () => {
    for (const d of loadRoamingDataset().destinations) {
      expect(d.iso2, d.countrySlug).toMatch(/^[a-z]{2}$/);
    }
  });
});
