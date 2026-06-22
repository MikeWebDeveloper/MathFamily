/**
 * RentMath calculator — the *true cost of renting* maths.
 *
 * Pure functions only (no React, no IO) so they are unit-testable. All money is integer
 * PENCE. Inputs come from the app-local dataset (rent-data.ts) or the user's own numbers.
 *
 * "True cost of a tenancy" = the cash a tenant actually parts with, split into:
 *   - upfront (move-in): first month's rent + the capped tenancy deposit
 *   - recurring annual: 12 × (rent + council tax + typical bills)
 * The deposit is refundable in principle, so we report it separately and never fold it
 * into the "real annual cost of living there" figure — that would overstate the cost.
 */

import {
  DEPOSIT_CAP_WEEKS,
  DEPOSIT_CAP_HIGH_RENT_WEEKS,
  DEPOSIT_CAP_HIGH_RENT_ANNUAL_THRESHOLD_PENCE,
  type TownRent
} from "./rent-data";

export interface TrueCostInput {
  /** Monthly rent in PENCE. */
  monthlyRentPence: number;
  /** Council tax in PENCE/month. */
  councilTaxMonthlyPence: number;
  /** Typical combined bills in PENCE/month. */
  billsMonthlyPence: number;
}

export interface TrueCostResult {
  /** Tenancy deposit, capped per the Tenant Fees Act 2019, in PENCE. */
  depositPence: number;
  /** How many weeks' rent the deposit cap is (5 or 6 depending on annual rent). */
  depositCapWeeks: number;
  /** Cash needed to move in: first month's rent + deposit, in PENCE. */
  moveInCostPence: number;
  /** Annual rent (12 × monthly), in PENCE. */
  annualRentPence: number;
  /** Annual council tax (12 × monthly), in PENCE. */
  annualCouncilTaxPence: number;
  /** Annual bills (12 × monthly), in PENCE. */
  annualBillsPence: number;
  /**
   * Real annual cost of the tenancy in PENCE: rent + council tax + bills for a year.
   * The (refundable) deposit is deliberately excluded.
   */
  annualTrueCostPence: number;
  /** Real cost per MONTH (annualTrueCost ÷ 12), in PENCE — the "actually you pay" number. */
  effectiveMonthlyPence: number;
}

/**
 * Deposit cap under the Tenant Fees Act 2019.
 * 5 weeks' rent if total annual rent < £50,000, otherwise 6 weeks' rent.
 * weeklyRent = monthlyRent × 12 ÷ 52. Result is rounded to whole pence.
 */
export function cappedDepositPence(monthlyRentPence: number): { depositPence: number; weeks: number } {
  if (!Number.isFinite(monthlyRentPence) || monthlyRentPence < 0) {
    throw new Error(`cappedDepositPence expects non-negative pence, got ${monthlyRentPence}`);
  }
  const annualRentPence = monthlyRentPence * 12;
  const weeks =
    annualRentPence >= DEPOSIT_CAP_HIGH_RENT_ANNUAL_THRESHOLD_PENCE
      ? DEPOSIT_CAP_HIGH_RENT_WEEKS
      : DEPOSIT_CAP_WEEKS;
  const weeklyRentPence = annualRentPence / 52;
  return { depositPence: Math.round(weeklyRentPence * weeks), weeks };
}

export function trueCostOfRenting(input: TrueCostInput): TrueCostResult {
  const { monthlyRentPence, councilTaxMonthlyPence, billsMonthlyPence } = input;
  for (const [name, v] of Object.entries(input)) {
    if (!Number.isFinite(v) || v < 0) {
      throw new Error(`trueCostOfRenting: ${name} must be non-negative, got ${v}`);
    }
  }

  const { depositPence, weeks } = cappedDepositPence(monthlyRentPence);
  const annualRentPence = monthlyRentPence * 12;
  const annualCouncilTaxPence = councilTaxMonthlyPence * 12;
  const annualBillsPence = billsMonthlyPence * 12;
  const annualTrueCostPence = annualRentPence + annualCouncilTaxPence + annualBillsPence;

  return {
    depositPence,
    depositCapWeeks: weeks,
    moveInCostPence: monthlyRentPence + depositPence,
    annualRentPence,
    annualCouncilTaxPence,
    annualBillsPence,
    annualTrueCostPence,
    effectiveMonthlyPence: Math.round(annualTrueCostPence / 12)
  };
}

/** Build calculator input from a dataset town. */
export function townToInput(town: TownRent): TrueCostInput {
  return {
    monthlyRentPence: town.medianMonthlyRentPence,
    councilTaxMonthlyPence: town.councilTaxBandDMonthlyPence,
    billsMonthlyPence: town.typicalBillsMonthlyPence
  };
}

/**
 * One-sentence, figure-first answer for a town. Caveats the headline rent as
 * "median" and flags any placeholder data so we never assert an unverified figure
 * as confirmed fact.
 */
export function townAnswer(town: TownRent, result: TrueCostResult, formatPence: (p: number) => string): string {
  const anyUnverified =
    !town.rentSource.verified || !town.councilTaxSource.verified || !town.billsSource.verified;
  const base = `Renting in ${town.townName} costs about ${formatPence(
    result.annualTrueCostPence
  )} a year — roughly ${formatPence(result.effectiveMonthlyPence)} a month once you add council tax (Band D) and typical bills to the median rent of ${formatPence(
    town.medianMonthlyRentPence
  )}. To move in you need around ${formatPence(result.moveInCostPence)} upfront (first month plus a ${
    result.depositCapWeeks
  }-week deposit).`;
  return anyUnverified
    ? `${base} Figures are seed estimates pending re-verification against the official sources below.`
    : base;
}

/** FAQ entries derived only from dataset facts — never fabricated. */
export function buildTownFaqs(
  town: TownRent,
  result: TrueCostResult,
  formatPence: (p: number) => string
): { question: string; answer: string }[] {
  return [
    {
      question: `What is the true cost of renting in ${town.townName}?`,
      answer: `About ${formatPence(result.annualTrueCostPence)} per year (median rent ${formatPence(
        town.medianMonthlyRentPence
      )}/mo + council tax ${formatPence(town.councilTaxBandDMonthlyPence)}/mo + typical bills ${formatPence(
        town.typicalBillsMonthlyPence
      )}/mo). That is the recurring cost; the refundable deposit is separate.`
    },
    {
      question: `How much deposit can a landlord ask for in ${town.townName}?`,
      answer: `Under the Tenant Fees Act 2019 the deposit is capped at ${result.depositCapWeeks} weeks' rent — here about ${formatPence(
        result.depositPence
      )} on the median rent. (It is 6 weeks if your annual rent is £50,000 or more.)`
    },
    {
      question: `How much do I need upfront to move in to a ${town.townName} rental?`,
      answer: `Around ${formatPence(result.moveInCostPence)} — the first month's rent plus the capped deposit. The deposit must by law be protected in a government-approved scheme.`
    }
  ];
}
