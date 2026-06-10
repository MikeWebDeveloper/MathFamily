import { describe, expect, it } from "vitest";
import { EsimCountrySchema, loadEsimDataset } from "../src/esim";

const validRecord = {
  countrySlug: "spain",
  bundles: [
    { provider: "airalo", bundleName: "Guay Mobile 5GB / 30 days", dataGb: 5, validityDays: 30, totalPence: 1150, snapshotDate: "2026-06-10" },
    { provider: "holafly", bundleName: "Unlimited 5 days", dataGb: null, validityDays: 5, totalPence: 1900, snapshotDate: "2026-06-10" }
  ],
  sourceUrl: "https://www.airalo.com/spain-esim",
  verifiedAt: "2026-06-10"
};

describe("EsimCountrySchema", () => {
  it("accepts a valid record (null dataGb = unlimited)", () => {
    expect(() => EsimCountrySchema.parse(validRecord)).not.toThrow();
  });
  it("rejects a bundle without snapshotDate", () => {
    const bad = structuredClone(validRecord);
    // @ts-expect-error deliberate
    bad.bundles[0]!.snapshotDate = null;
    expect(() => EsimCountrySchema.parse(bad)).toThrow();
  });
  it("rejects unknown providers", () => {
    const bad = structuredClone(validRecord);
    (bad.bundles[0] as { provider: string }).provider = "esimgo";
    expect(() => EsimCountrySchema.parse(bad)).toThrow();
  });
});

describe("loadEsimDataset", () => {
  it("loads and validates", () => {
    expect(loadEsimDataset().records.length).toBeGreaterThanOrEqual(1);
  });
});
