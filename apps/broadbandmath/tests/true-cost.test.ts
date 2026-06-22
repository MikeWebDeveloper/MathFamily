import { describe, expect, it } from "vitest";
import type { BroadbandPlan } from "../lib/broadband-types";
import { computeTrueCost, monthlyChargeInContract, earlyExitCost } from "../lib/true-cost";

const basePlan: BroadbandPlan = {
  slug: "test",
  provider: "Test",
  providerSlug: "test",
  planName: "Test Plan",
  speedMbps: 67,
  speedTier: "fast",
  advertisedMonthlyPence: 3000, // £30
  contractMonths: 24,
  outOfContractMonthlyPence: 4500, // £45
  upfrontPence: 0,
  exitFeePence: 0,
  priceRise: { type: "fixed_pence", fixedPencePerMonth: 300, summary: "" }, // +£3/mo each year
  sourceUrl: "https://example.com",
  verifiedAt: "2026-06-22",
  verified: false
};

describe("monthlyChargeInContract", () => {
  it("charges the base price in year one (months 1-12)", () => {
    expect(monthlyChargeInContract(3000, basePlan.priceRise, 1)).toBe(3000);
    expect(monthlyChargeInContract(3000, basePlan.priceRise, 12)).toBe(3000);
  });

  it("applies one fixed rise in year two (months 13-24)", () => {
    expect(monthlyChargeInContract(3000, basePlan.priceRise, 13)).toBe(3300);
    expect(monthlyChargeInContract(3000, basePlan.priceRise, 24)).toBe(3300);
  });

  it("never rises when type is none", () => {
    expect(monthlyChargeInContract(3000, { type: "none", summary: "" }, 24)).toBe(3000);
  });

  it("compounds CPI+plus across year blocks", () => {
    const rise = { type: "cpi_plus" as const, plusPercent: 3.9, assumedIndexPercent: 4.0, summary: "" };
    // Year 2 = 3000 * (1.079) = 3237 (rounded)
    expect(monthlyChargeInContract(3000, rise, 13)).toBe(Math.round(3000 * 1.079));
  });
});

describe("computeTrueCost", () => {
  it("real cost exceeds advertised when there is a mid-contract rise", () => {
    const r = computeTrueCost(basePlan, 24);
    // 12 months at 3000 + 12 months at 3300 = 36000 + 39600 = 75600
    expect(r.contractTotalPence).toBe(75600);
    expect(r.horizonTotalPence).toBe(75600);
    expect(r.advertisedHorizonPence).toBe(3000 * 24); // 72000
    expect(r.hiddenExtraPence).toBe(3600);
    expect(r.effectiveMonthlyPence).toBe(Math.round(75600 / 24));
  });

  it("applies the out-of-contract price beyond the contract term", () => {
    const r = computeTrueCost(basePlan, 36); // 24 in-contract + 12 out-of-contract
    // in-contract 75600 + 12 * 4500 = 75600 + 54000 = 129600
    expect(r.horizonTotalPence).toBe(129600);
    const lastRow = r.breakdown.at(-1)!;
    expect(lastRow.inContract).toBe(false);
    expect(lastRow.monthlyPence).toBe(4500);
  });

  it("includes the up-front cost once", () => {
    const r = computeTrueCost({ ...basePlan, upfrontPence: 1000 }, 24);
    expect(r.horizonTotalPence).toBe(75600 + 1000);
    expect(r.advertisedHorizonPence).toBe(72000 + 1000);
  });

  it("no-rise plan: real cost equals advertised over the contract", () => {
    const flat: BroadbandPlan = { ...basePlan, priceRise: { type: "none", summary: "" } };
    const r = computeTrueCost(flat, 24);
    expect(r.horizonTotalPence).toBe(72000);
    expect(r.hiddenExtraPence).toBe(0);
  });
});

describe("earlyExitCost", () => {
  it("adds the exit fee on top of charges incurred", () => {
    const plan = { ...basePlan, exitFeePence: 5000 };
    // Leave after 6 months: 6 * 3000 = 18000 + exit 5000 = 23000
    expect(earlyExitCost(plan, 6)).toBe(18000 + 5000);
  });
});
