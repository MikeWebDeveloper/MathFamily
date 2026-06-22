import { describe, expect, it } from "vitest";
import { formatPence } from "@mathfamily/engine";
import {
  cappedDepositPence,
  trueCostOfRenting,
  townToInput,
  townAnswer,
  buildTownFaqs
} from "../lib/rent-content";
import { DEPOSIT_CAP_HIGH_RENT_ANNUAL_THRESHOLD_PENCE, type TownRent } from "../lib/rent-data";

const town: TownRent = {
  townSlug: "testton",
  townName: "Testton",
  region: "Test Region",
  medianMonthlyRentPence: 100_000, // £1,000/mo
  rentSource: { sourceUrl: "https://example.gov.uk/rent", verifiedAt: "2026-06-22", verified: false },
  councilTaxBandDMonthlyPence: 15_000, // £150/mo
  councilTaxSource: { sourceUrl: "https://example.gov.uk/ctax", verifiedAt: "2026-06-22", verified: false },
  typicalBillsMonthlyPence: 20_000, // £200/mo
  billsSource: { sourceUrl: "https://example.gov.uk/bills", verifiedAt: "2026-06-22", verified: false }
};

describe("cappedDepositPence", () => {
  it("caps the deposit at 5 weeks' rent when annual rent is under £50k", () => {
    // £1,000/mo → £12,000/yr (< £50k) → weekly £12,000/52 → 5 weeks
    const { depositPence, weeks } = cappedDepositPence(100_000);
    expect(weeks).toBe(5);
    // 100000*12/52*5 = 1,153,846.15… → rounded
    expect(depositPence).toBe(Math.round((100_000 * 12) / 52 * 5));
  });

  it("uses the 6-week cap when annual rent is £50,000 or more", () => {
    const highMonthly = Math.ceil(DEPOSIT_CAP_HIGH_RENT_ANNUAL_THRESHOLD_PENCE / 12); // pushes annual >= £50k
    const { weeks } = cappedDepositPence(highMonthly);
    expect(weeks).toBe(6);
  });

  it("rejects negative input", () => {
    expect(() => cappedDepositPence(-1)).toThrow();
  });
});

describe("trueCostOfRenting", () => {
  const result = trueCostOfRenting(townToInput(town));

  it("annual true cost excludes the (refundable) deposit", () => {
    // (1000 + 150 + 200)/mo * 12 = 16,200/yr → in pence: (100000 + 15000 + 20000) * 12
    expect(result.annualTrueCostPence).toBe((100_000 + 15_000 + 20_000) * 12);
    // the deposit is a separate, refundable figure — never folded into the annual cost
    expect(result.depositPence).toBeGreaterThan(0);
    expect(result.annualTrueCostPence).toBeLessThan(
      result.annualTrueCostPence + result.depositPence
    );
  });

  it("move-in cost = first month + capped deposit", () => {
    expect(result.moveInCostPence).toBe(town.medianMonthlyRentPence + result.depositPence);
  });

  it("effective monthly is the annual true cost / 12", () => {
    expect(result.effectiveMonthlyPence).toBe(Math.round(result.annualTrueCostPence / 12));
  });

  it("splits the annual cost across rent, council tax and bills", () => {
    expect(result.annualRentPence + result.annualCouncilTaxPence + result.annualBillsPence).toBe(
      result.annualTrueCostPence
    );
  });
});

describe("townAnswer", () => {
  it("is figure-first and flags unverified seed data", () => {
    const result = trueCostOfRenting(townToInput(town));
    const answer = townAnswer(town, result, formatPence);
    expect(answer).toContain("Testton");
    expect(answer).toContain(formatPence(result.annualTrueCostPence));
    // town has verified:false sources → must carry the re-verification caveat
    expect(answer.toLowerCase()).toContain("seed estimates");
  });
});

describe("buildTownFaqs", () => {
  it("covers true cost, deposit cap and move-in, all derived from facts", () => {
    const result = trueCostOfRenting(townToInput(town));
    const faqs = buildTownFaqs(town, result, formatPence);
    expect(faqs.some((f) => f.question.toLowerCase().includes("true cost"))).toBe(true);
    expect(faqs.some((f) => f.question.toLowerCase().includes("deposit"))).toBe(true);
    expect(faqs.some((f) => f.answer.includes("Tenant Fees Act 2019"))).toBe(true);
  });
});
