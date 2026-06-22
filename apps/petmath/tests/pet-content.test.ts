import { describe, expect, it } from "vitest";
import { lifetimeEstimate, petAnswer, lifetimeRangeLabel } from "../lib/pet-content";
import { getPetCostRecord, PET_COST_RECORDS, INSURANCE_ESTIMATE } from "../lib/pet-costs";

const smallDog = getPetCostRecord("small-dog")!;

describe("lifetimeEstimate", () => {
  it("computes set-up + monthly × 12 × years (insurance excluded by default)", () => {
    // small dog: £69/mo, £415 set-up. 10 years = 120 months.
    const est = lifetimeEstimate(smallDog, 10);
    expect(est.setupPence).toBe(41500);
    expect(est.carePence).toBe(6900 * 120); // 828,000p = £8,280
    expect(est.insurancePence).toBe(0);
    expect(est.totalPence).toBe(41500 + 6900 * 120);
  });

  it("never sums the insurance reference line into the total (no double-count)", () => {
    const withoutIns = lifetimeEstimate(smallDog, 10, false);
    const withIns = lifetimeEstimate(smallDog, 10, true);
    // Insurance is surfaced as its own line but the total is identical either way.
    expect(withIns.totalPence).toBe(withoutIns.totalPence);
    expect(withIns.insurancePence).toBe(INSURANCE_ESTIMATE.annualPremiumPence * 10);
  });

  it("rounds fractional years to whole months", () => {
    const est = lifetimeEstimate(smallDog, 7.1); // 85.2 → 85 months
    expect(est.carePence).toBe(6900 * 85);
  });

  it("rejects non-positive years", () => {
    expect(() => lifetimeEstimate(smallDog, 0)).toThrow();
    expect(() => lifetimeEstimate(smallDog, -3)).toThrow();
  });
});

describe("petAnswer", () => {
  it("states the verified lifetime range and is honest about exclusions", () => {
    const a = petAnswer(smallDog);
    expect(a).toContain("£6,200");
    expect(a).toContain("£12,000");
    expect(a).toContain("£69");
    expect(a.toLowerCase()).toContain("emergency vet");
  });
});

describe("lifetimeRangeLabel", () => {
  it("renders the min–max range", () => {
    expect(lifetimeRangeLabel(smallDog)).toBe("£6,200–£12,000");
  });
});

describe("dataset integrity", () => {
  it("every record has a source URL and an ISO verified date", () => {
    for (const r of PET_COST_RECORDS) {
      expect(r.sourceUrl).toMatch(/^https:\/\//);
      expect(r.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.monthlyCarePence).toBeGreaterThan(0);
      expect(r.lifetimeMaxPence).toBeGreaterThanOrEqual(r.lifetimeMinPence);
    }
  });

  it("the insurance estimate carries its own ABI source and date", () => {
    expect(INSURANCE_ESTIMATE.sourceUrl).toContain("abi.org.uk");
    expect(INSURANCE_ESTIMATE.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
