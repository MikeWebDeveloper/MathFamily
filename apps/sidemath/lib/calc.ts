/**
 * SideMath calculation engine — pure functions, all money in integer PENCE.
 *
 * Models the headline Self Assessment maths for a UK sole trader (rUK bands):
 * income tax + Class 4 NIC (+ Class 2 treatment) with the optional £1,000 trading
 * allowance. ESTIMATE ONLY — see lib/tax-rates.ts for the long list of things this
 * deliberately ignores. Never present output as advice.
 */
import {
  PERSONAL_ALLOWANCE_PENCE,
  PERSONAL_ALLOWANCE_TAPER_FROM_PENCE,
  BASIC_RATE_LIMIT_PENCE,
  HIGHER_RATE_LIMIT_PENCE,
  BASIC_RATE,
  HIGHER_RATE,
  ADDITIONAL_RATE,
  CLASS4_LOWER_PROFITS_THRESHOLD_PENCE,
  CLASS4_UPPER_PROFITS_LIMIT_PENCE,
  CLASS4_MAIN_RATE,
  CLASS4_UPPER_RATE,
  CLASS2_SMALL_PROFITS_THRESHOLD_PENCE,
  TRADING_ALLOWANCE_PENCE
} from "./tax-rates";

export interface TaxInput {
  /** Gross self-employed trading income for the year, in pence. */
  grossPence: number;
  /** Allowable business expenses for the year, in pence. */
  expensesPence: number;
  /** Use the £1,000 trading allowance instead of deducting actual expenses. */
  useTradingAllowance: boolean;
}

export interface TaxBreakdown {
  grossPence: number;
  /** Deduction actually applied (max of expenses vs trading allowance, or the chosen one). */
  deductionPence: number;
  /** Taxable profit after the chosen deduction (never below 0). */
  profitPence: number;
  /** Personal Allowance after the £100k taper. */
  personalAllowancePence: number;
  incomeTaxPence: number;
  class4Pence: number;
  class2Pence: number;
  /** incomeTax + class4 + class2. */
  totalTaxPence: number;
  /** profit − totalTax (what's left from the business profit after tax). */
  takeHomePence: number;
  /** True when the trading allowance gave full relief (gross <= £1,000): nothing to declare. */
  fullRelief: boolean;
}

function clampNonNeg(n: number): number {
  return n < 0 ? 0 : n;
}

/** Round half-up to whole pence. Inputs are already pence but rate maths produces fractions. */
function roundPence(n: number): number {
  return Math.round(n);
}

/** Personal Allowance after the £1-for-£2 taper above £100,000 of profit. */
export function taperedPersonalAllowance(profitPence: number): number {
  if (profitPence <= PERSONAL_ALLOWANCE_TAPER_FROM_PENCE) return PERSONAL_ALLOWANCE_PENCE;
  const excess = profitPence - PERSONAL_ALLOWANCE_TAPER_FROM_PENCE;
  const reduction = Math.floor(excess / 2);
  return clampNonNeg(PERSONAL_ALLOWANCE_PENCE - reduction);
}

/**
 * Income tax on a taxable profit (rUK England/NI/Wales bands).
 * The band limits in tax-rates are expressed on TOTAL income (PA + basic band etc.),
 * so we tax slices of profit between those limits, applying the (possibly tapered) PA
 * as the 0% slice.
 */
export function incomeTax(profitPence: number, personalAllowancePence: number): number {
  if (profitPence <= personalAllowancePence) return 0;

  let tax = 0;
  // Basic-rate slice: from PA up to the basic-rate limit (£50,270).
  const basicSlice = clampNonNeg(Math.min(profitPence, BASIC_RATE_LIMIT_PENCE) - personalAllowancePence);
  tax += basicSlice * BASIC_RATE;

  // Higher-rate slice: £50,270 up to £125,140.
  const higherSlice = clampNonNeg(Math.min(profitPence, HIGHER_RATE_LIMIT_PENCE) - BASIC_RATE_LIMIT_PENCE);
  tax += higherSlice * HIGHER_RATE;

  // Additional-rate slice: above £125,140.
  const additionalSlice = clampNonNeg(profitPence - HIGHER_RATE_LIMIT_PENCE);
  tax += additionalSlice * ADDITIONAL_RATE;

  return roundPence(tax);
}

/** Class 4 NIC: 6% between LPT and UPL, 2% above the UPL. */
export function class4Nic(profitPence: number): number {
  const mainSlice = clampNonNeg(
    Math.min(profitPence, CLASS4_UPPER_PROFITS_LIMIT_PENCE) - CLASS4_LOWER_PROFITS_THRESHOLD_PENCE
  );
  const upperSlice = clampNonNeg(profitPence - CLASS4_UPPER_PROFITS_LIMIT_PENCE);
  return roundPence(mainSlice * CLASS4_MAIN_RATE + upperSlice * CLASS4_UPPER_RATE);
}

/**
 * Class 2 NIC: since 2024/25 there is NO Class 2 bill for the self-employed at or
 * above the Small Profits Threshold (contributions are treated as paid). We model
 * the bill only, so this returns 0 for any profit — the voluntary-below-SPT rate is
 * presented as information in the UI, not added to the bill.
 */
export function class2Nic(profitPence: number): number {
  // Above SPT: treated-as-paid → £0 payable. Below SPT: voluntary, so £0 payable by default.
  void profitPence;
  void CLASS2_SMALL_PROFITS_THRESHOLD_PENCE;
  return 0;
}

export function calculateTax(input: TaxInput): TaxBreakdown {
  const grossPence = clampNonNeg(Math.round(input.grossPence));
  const expensesPence = clampNonNeg(Math.round(input.expensesPence));

  // Full trading-allowance relief: gross <= £1,000 means nothing to declare.
  const fullRelief = input.useTradingAllowance && grossPence <= TRADING_ALLOWANCE_PENCE;

  const deductionPence = input.useTradingAllowance ? TRADING_ALLOWANCE_PENCE : expensesPence;
  const profitPence = fullRelief ? 0 : clampNonNeg(grossPence - deductionPence);

  const personalAllowancePence = taperedPersonalAllowance(profitPence);
  const incomeTaxPence = incomeTax(profitPence, personalAllowancePence);
  const class4Pence = class4Nic(profitPence);
  const class2Pence = class2Nic(profitPence);
  const totalTaxPence = incomeTaxPence + class4Pence + class2Pence;
  const takeHomePence = clampNonNeg(profitPence - totalTaxPence);

  return {
    grossPence,
    deductionPence: fullRelief ? grossPence : deductionPence,
    profitPence,
    personalAllowancePence,
    incomeTaxPence,
    class4Pence,
    class2Pence,
    totalTaxPence,
    takeHomePence,
    fullRelief
  };
}

/** Effective tax rate on profit, as a 0–1 fraction (0 when profit is 0). */
export function effectiveRate(b: TaxBreakdown): number {
  return b.profitPence === 0 ? 0 : b.totalTaxPence / b.profitPence;
}
