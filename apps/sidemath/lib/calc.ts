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
  /**
   * Main / PAYE employment income for the year, in pence (gross salary from a day job, etc.).
   * The self-employed profit is stacked MARGINALLY ON TOP of this: the personal allowance and the
   * basic-rate band are consumed by PAYE income first, so the side profit is taxed at the user's
   * TRUE marginal rate. Defaults to 0 (no day job) for back-compat. NIC here is income-tax only —
   * the side hustle's own Class 4 NIC is computed separately on the self-employed profit.
   */
  payeIncomePence?: number;
}

export interface TaxBreakdown {
  grossPence: number;
  /** Main / PAYE employment income the side profit was stacked on top of. */
  payeIncomePence: number;
  /** Deduction actually applied (max of expenses vs trading allowance, or the chosen one). */
  deductionPence: number;
  /** Taxable self-employed profit after the chosen deduction (never below 0). */
  profitPence: number;
  /** Personal Allowance after the £100k taper, computed on TOTAL income (PAYE + profit). */
  personalAllowancePence: number;
  /**
   * Income tax attributable to the SIDE PROFIT — the marginal slice on top of PAYE income.
   * (= income tax on PAYE+profit − income tax on PAYE alone.) NOT the user's whole income-tax bill.
   */
  incomeTaxPence: number;
  /** Class 4 NIC on the self-employed profit (a profit-based charge, independent of PAYE income). */
  class4Pence: number;
  class2Pence: number;
  /** incomeTax (on the side profit) + class4 + class2 — the extra tax the side hustle creates. */
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

/**
 * Income tax on the SIDE PROFIT stacked marginally on top of PAYE income.
 *
 * The personal allowance and the basic-rate band are consumed by total income, with PAYE income
 * taking them first. So we compute income tax on (PAYE + profit) and subtract income tax on PAYE
 * alone — the difference is the extra tax the side profit actually creates, at the user's true
 * marginal rate(s). The PA used is the one tapered on TOTAL income (£100k+ taper).
 *
 * With payeIncomePence = 0 this collapses to the isolated case (the profit gets the full PA itself).
 */
export function marginalIncomeTax(profitPence: number, payeIncomePence: number): number {
  const paye = clampNonNeg(payeIncomePence);
  const profit = clampNonNeg(profitPence);
  const total = paye + profit;

  const paOnTotal = taperedPersonalAllowance(total);
  const paOnPaye = taperedPersonalAllowance(paye);

  const taxOnTotal = incomeTax(total, paOnTotal);
  const taxOnPaye = incomeTax(paye, paOnPaye);

  return clampNonNeg(roundPence(taxOnTotal - taxOnPaye));
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
  const payeIncomePence = clampNonNeg(Math.round(input.payeIncomePence ?? 0));

  // Full trading-allowance relief: gross <= £1,000 means nothing to declare.
  const fullRelief = input.useTradingAllowance && grossPence <= TRADING_ALLOWANCE_PENCE;

  const deductionPence = input.useTradingAllowance ? TRADING_ALLOWANCE_PENCE : expensesPence;
  const profitPence = fullRelief ? 0 : clampNonNeg(grossPence - deductionPence);

  // The personal allowance reported is the one tapered on TOTAL income (PAYE + side profit) — the
  // £100k+ taper depends on a person's whole income, not the side hustle in isolation.
  const personalAllowancePence = taperedPersonalAllowance(payeIncomePence + profitPence);

  // Income tax on the side profit is the MARGINAL slice on top of PAYE income (PA + basic band are
  // consumed by the day job first), so side income is taxed at the user's true marginal rate.
  const incomeTaxPence = marginalIncomeTax(profitPence, payeIncomePence);
  // Class 4 NIC is a profit-based charge on the self-employed profit, independent of PAYE income.
  const class4Pence = class4Nic(profitPence);
  const class2Pence = class2Nic(profitPence);
  const totalTaxPence = incomeTaxPence + class4Pence + class2Pence;
  const takeHomePence = clampNonNeg(profitPence - totalTaxPence);

  return {
    grossPence,
    payeIncomePence,
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
