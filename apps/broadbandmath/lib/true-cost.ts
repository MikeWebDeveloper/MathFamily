import type { BroadbandPlan, PriceRiseTerm } from "./broadband-types";

/**
 * The BroadbandMath true-cost model.
 *
 * "Advertised price" is rarely what you pay. A UK broadband contract typically:
 *   1. starts at the advertised monthly price,
 *   2. rises mid-contract (every April) — either by a fixed £/month (2025+ Ofcom rules)
 *      or by CPI/RPI + a fixed % (legacy deals),
 *   3. then, when the contract ends, rolls onto a higher out-of-contract price if you
 *      don't switch.
 *
 * This module computes what a plan ACTUALLY costs over its contract, and over a chosen
 * horizon that may extend past the contract end (where the out-of-contract price applies).
 *
 * All money is integer pence. We round each monthly charge to whole pence to avoid
 * fractional-penny drift, then sum.
 */

export interface MonthlyBreakdownRow {
  /** 1-based month index over the horizon. */
  month: number;
  /** Whether this month is still within the original contract term. */
  inContract: boolean;
  /** The monthly charge applied this month, in pence. */
  monthlyPence: number;
}

export interface TrueCostResult {
  /** Months modelled (the horizon). */
  horizonMonths: number;
  /** Total over the full contract term only (incl. up-front cost), in pence. */
  contractTotalPence: number;
  /** Total over the chosen horizon (incl. up-front cost), in pence. */
  horizonTotalPence: number;
  /** What the advertised price alone would imply over the horizon (no rises), in pence. */
  advertisedHorizonPence: number;
  /** horizonTotalPence - advertisedHorizonPence: the "hidden" extra you actually pay. */
  hiddenExtraPence: number;
  /** True average cost per month over the horizon, in pence (rounded). */
  effectiveMonthlyPence: number;
  /** Per-month detail (handy for charts / tables). */
  breakdown: MonthlyBreakdownRow[];
}

/**
 * Given a base monthly price (pence), the price-rise term, and the 1-based month index
 * within the CONTRACT, return the monthly charge for that month (pence).
 *
 * Mid-contract rises in the UK apply each April. We model rises as taking effect once per
 * 12-month block of the contract: months 1–12 at base, 13–24 after one rise, 25–36 after two.
 * This is an intentional simplification (the real April timing depends on sign-up date) and
 * is labelled as such in the UI. It is deterministic and source-anchored on the rise size.
 */
export function monthlyChargeInContract(
  baseMonthlyPence: number,
  rise: PriceRiseTerm,
  monthIndex: number // 1-based
): number {
  const yearBlock = Math.floor((monthIndex - 1) / 12); // 0 for months 1-12, 1 for 13-24, ...
  if (yearBlock === 0 || rise.type === "none") return baseMonthlyPence;

  if (rise.type === "fixed_pence") {
    const perMonth = rise.fixedPencePerMonth ?? 0;
    return baseMonthlyPence + perMonth * yearBlock;
  }

  // Legacy inflation-linked: compound (index + plus%) per elapsed year block.
  const ratePct = (rise.assumedIndexPercent ?? 0) + (rise.plusPercent ?? 0);
  const factor = Math.pow(1 + ratePct / 100, yearBlock);
  return Math.round(baseMonthlyPence * factor);
}

export function computeTrueCost(plan: BroadbandPlan, horizonMonths: number): TrueCostResult {
  const horizon = Math.max(1, Math.floor(horizonMonths));
  const breakdown: MonthlyBreakdownRow[] = [];

  let contractTotal = 0;
  let horizonTotal = 0;

  for (let m = 1; m <= horizon; m++) {
    const inContract = m <= plan.contractMonths;
    const monthlyPence = inContract
      ? monthlyChargeInContract(plan.advertisedMonthlyPence, plan.priceRise, m)
      : plan.outOfContractMonthlyPence;

    breakdown.push({ month: m, inContract, monthlyPence });
    horizonTotal += monthlyPence;
    if (inContract) contractTotal += monthlyPence;
  }

  // Up-front cost belongs to both the contract and the horizon (it's paid once at the start).
  contractTotal += plan.upfrontPence;
  horizonTotal += plan.upfrontPence;

  const advertisedHorizonPence = plan.advertisedMonthlyPence * horizon + plan.upfrontPence;
  const hiddenExtraPence = horizonTotal - advertisedHorizonPence;
  const effectiveMonthlyPence = Math.round(horizonTotal / horizon);

  return {
    horizonMonths: horizon,
    contractTotalPence: contractTotal,
    horizonTotalPence: horizonTotal,
    advertisedHorizonPence,
    hiddenExtraPence,
    effectiveMonthlyPence,
    breakdown
  };
}

/** Cost of leaving early at a given month (1-based) = exit fee + up-front already paid +
 *  monthly charges incurred up to and including that month. Useful for the "is it worth
 *  switching?" framing. Returns pence. */
export function earlyExitCost(plan: BroadbandPlan, leaveAfterMonth: number): number {
  const r = computeTrueCost(plan, Math.min(leaveAfterMonth, plan.contractMonths));
  // computeTrueCost already added upfront; add the exit fee on top.
  return r.horizonTotalPence + plan.exitFeePence;
}
