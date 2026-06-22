import { describe, expect, it } from "vitest";
import {
  TOWNS,
  DEPOSIT_CAP_SOURCE,
  DEPOSIT_CAP_WEEKS,
  getTown,
  datasetLatestVerifiedAt
} from "../lib/rent-data";

describe("TOWNS dataset integrity", () => {
  it("ships at least 5 towns (MVP spoke count)", () => {
    expect(TOWNS.length).toBeGreaterThanOrEqual(5);
  });

  it("has unique slugs", () => {
    const slugs = TOWNS.map((t) => t.townSlug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every money figure is a non-negative integer of pence (never fabricated as a float)", () => {
    for (const t of TOWNS) {
      for (const v of [t.medianMonthlyRentPence, t.councilTaxBandDMonthlyPence, t.typicalBillsMonthlyPence]) {
        expect(Number.isInteger(v)).toBe(true);
        expect(v).toBeGreaterThan(0);
      }
    }
  });

  it("every figure carries a sourceUrl (https) and an ISO verifiedAt date", () => {
    for (const t of TOWNS) {
      for (const s of [t.rentSource, t.councilTaxSource, t.billsSource]) {
        expect(s.sourceUrl).toMatch(/^https:\/\//);
        expect(s.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(typeof s.verified).toBe("boolean");
      }
    }
  });

  it("the statutory deposit cap is marked verified and is 5 weeks", () => {
    expect(DEPOSIT_CAP_WEEKS).toBe(5);
    expect(DEPOSIT_CAP_SOURCE.verified).toBe(true);
    expect(DEPOSIT_CAP_SOURCE.sourceUrl).toMatch(/gov\.uk/);
  });
});

describe("getTown", () => {
  it("returns a town by slug and undefined otherwise", () => {
    expect(getTown(TOWNS[0]!.townSlug)?.townName).toBe(TOWNS[0]!.townName);
    expect(getTown("nope-not-a-town")).toBeUndefined();
  });
});

describe("datasetLatestVerifiedAt", () => {
  it("returns an ISO date", () => {
    expect(datasetLatestVerifiedAt()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
