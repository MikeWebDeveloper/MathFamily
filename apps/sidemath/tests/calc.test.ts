import { describe, expect, it } from "vitest";
import {
  calculateTax,
  incomeTax,
  class4Nic,
  class2Nic,
  taperedPersonalAllowance,
  effectiveRate
} from "../lib/calc";
import { PERSONAL_ALLOWANCE_PENCE } from "../lib/tax-rates";

// All figures hand-computed from gov.uk 2026/27 rates (verified 2026-06-22).

describe("taperedPersonalAllowance", () => {
  it("is the full allowance below £100k", () => {
    expect(taperedPersonalAllowance(3_000_000)).toBe(PERSONAL_ALLOWANCE_PENCE);
    expect(taperedPersonalAllowance(10_000_000)).toBe(PERSONAL_ALLOWANCE_PENCE);
  });
  it("reduces £1 for every £2 over £100k", () => {
    // £110,000 profit → £10,000 over → £5,000 reduction → £7,570 PA
    expect(taperedPersonalAllowance(11_000_000)).toBe(1_257_000 - 500_000);
  });
  it("hits zero at £125,140", () => {
    expect(taperedPersonalAllowance(12_514_000)).toBe(0);
    expect(taperedPersonalAllowance(20_000_000)).toBe(0);
  });
});

describe("incomeTax", () => {
  it("is zero up to the personal allowance", () => {
    expect(incomeTax(1_257_000, PERSONAL_ALLOWANCE_PENCE)).toBe(0);
    expect(incomeTax(500_000, PERSONAL_ALLOWANCE_PENCE)).toBe(0);
  });
  it("taxes the basic-rate slice at 20%", () => {
    // £30,000 → (30,000 − 12,570) × 20% = £3,486
    expect(incomeTax(3_000_000, PERSONAL_ALLOWANCE_PENCE)).toBe(348_600);
  });
  it("taxes basic + higher slices", () => {
    // £60,000 → 7,540 + 3,892 = £11,432
    expect(incomeTax(6_000_000, PERSONAL_ALLOWANCE_PENCE)).toBe(1_143_200);
  });
  it("taxes the additional-rate slice at 45%", () => {
    // £130,000 with PA tapered to 0:
    // basic 50,270 × 20% = 10,054; higher (125,140−50,270) × 40% = 74,870×0.4 = 29,948;
    // additional (130,000−125,140) × 45% = 4,860 × 0.45 = 2,187 → £42,189
    expect(incomeTax(13_000_000, 0)).toBe(4_218_900);
  });
});

describe("class4Nic", () => {
  it("is zero below the lower profits threshold", () => {
    expect(class4Nic(1_000_000)).toBe(0);
    expect(class4Nic(1_257_000)).toBe(0);
  });
  it("charges 6% between LPT and UPL", () => {
    // £30,000 → (30,000 − 12,570) × 6% = £1,045.80
    expect(class4Nic(3_000_000)).toBe(104_580);
  });
  it("charges 2% above the UPL", () => {
    // £60,000 → main 2,262 + upper (9,730 × 2%) 194.60 = £2,456.60
    expect(class4Nic(6_000_000)).toBe(245_660);
  });
});

describe("class2Nic", () => {
  it("is zero (treated-as-paid above SPT, voluntary below) for the bill", () => {
    expect(class2Nic(500_000)).toBe(0);
    expect(class2Nic(3_000_000)).toBe(0);
  });
});

describe("calculateTax", () => {
  it("gives full relief when gross <= £1,000 and the allowance is used", () => {
    const b = calculateTax({ grossPence: 80_000, expensesPence: 0, useTradingAllowance: true });
    expect(b.fullRelief).toBe(true);
    expect(b.profitPence).toBe(0);
    expect(b.totalTaxPence).toBe(0);
    expect(b.takeHomePence).toBe(0);
  });

  it("computes a typical £30k courier with £5k expenses", () => {
    // profit £25,000 → IT (25,000−12,570)×20% = £2,486; Class4 (25,000−12,570)×6% = £745.80
    const b = calculateTax({ grossPence: 3_000_000, expensesPence: 500_000, useTradingAllowance: false });
    expect(b.profitPence).toBe(2_500_000);
    expect(b.incomeTaxPence).toBe(248_600);
    expect(b.class4Pence).toBe(74_580);
    expect(b.totalTaxPence).toBe(248_600 + 74_580);
    expect(b.takeHomePence).toBe(2_500_000 - (248_600 + 74_580));
  });

  it("uses the £1,000 trading allowance as a deduction when chosen", () => {
    // gross £10,000, allowance → profit £9,000 (below PA) → £0 tax
    const b = calculateTax({ grossPence: 1_000_000, expensesPence: 200_000, useTradingAllowance: true });
    expect(b.deductionPence).toBe(100_000);
    expect(b.profitPence).toBe(900_000);
    expect(b.totalTaxPence).toBe(0);
  });

  it("never returns negative take-home or profit", () => {
    const b = calculateTax({ grossPence: 50_000, expensesPence: 200_000, useTradingAllowance: false });
    expect(b.profitPence).toBe(0);
    expect(b.takeHomePence).toBe(0);
    expect(b.totalTaxPence).toBe(0);
  });

  it("effectiveRate is 0 for zero profit and positive otherwise", () => {
    const zero = calculateTax({ grossPence: 0, expensesPence: 0, useTradingAllowance: false });
    expect(effectiveRate(zero)).toBe(0);
    const some = calculateTax({ grossPence: 3_000_000, expensesPence: 0, useTradingAllowance: false });
    expect(effectiveRate(some)).toBeGreaterThan(0);
    expect(effectiveRate(some)).toBeLessThan(1);
  });
});
