import { formatPence } from "@mathfamily/engine";
import type { BroadbandPlan } from "./broadband-types";
import { computeTrueCost, type TrueCostResult } from "./true-cost";

/** Default horizon for the headline true-cost framing: the contract length itself. */
export function defaultHorizon(plan: BroadbandPlan): number {
  return plan.contractMonths;
}

export interface PlanCostModel {
  plan: BroadbandPlan;
  /** True cost over the contract term. */
  contract: TrueCostResult;
  /** Plain-English answer sentence. */
  answer: string;
}

export function planCostModel(plan: BroadbandPlan, horizonMonths?: number): PlanCostModel {
  const horizon = horizonMonths ?? plan.contractMonths;
  const contract = computeTrueCost(plan, horizon);
  const adMonthly = formatPence(plan.advertisedMonthlyPence);
  const realMonthly = formatPence(contract.effectiveMonthlyPence);
  const total = formatPence(contract.horizonTotalPence);
  const hidden = formatPence(Math.max(0, contract.hiddenExtraPence));

  const riseClause =
    plan.priceRise.type === "none"
      ? "with no mid-contract price rise"
      : plan.priceRise.type === "fixed_pence"
        ? `with a fixed ${formatPence(plan.priceRise.fixedPencePerMonth ?? 0)}/month rise each year`
        : `with an inflation-linked rise (illustrative ${plan.priceRise.plusPercent ?? 0}% above the index)`;

  const answer =
    `${plan.provider} ${plan.planName} advertises ${adMonthly}/month, but over the ${plan.contractMonths}-month contract ` +
    `${riseClause} it works out at about ${realMonthly}/month — roughly ${total} in total` +
    (contract.hiddenExtraPence > 0 ? `, ${hidden} more than the headline price suggests.` : ".");

  return { plan, contract, answer };
}

export function buildPlanFaqs(plan: BroadbandPlan): { question: string; answer: string }[] {
  const model = planCostModel(plan);
  const faqs: { question: string; answer: string }[] = [
    {
      question: `What does ${plan.provider} ${plan.planName} really cost over the contract?`,
      answer: `About ${formatPence(model.contract.horizonTotalPence)} over ${plan.contractMonths} months (around ${formatPence(model.contract.effectiveMonthlyPence)}/month), versus the ${formatPence(plan.advertisedMonthlyPence)}/month advertised price.`
    },
    {
      question: `How much will ${plan.provider} ${plan.planName} go up mid-contract?`,
      answer:
        plan.priceRise.type === "none"
          ? "It is marketed with no mid-contract price rise — confirm the current terms before signing."
          : plan.priceRise.type === "fixed_pence"
            ? `By a fixed ${formatPence(plan.priceRise.fixedPencePerMonth ?? 0)} per month each year, stated up front (Ofcom's 2025 rules require pounds-and-pence rises).`
            : `It is an older inflation-linked deal (illustrative ${plan.priceRise.plusPercent ?? 0}% above CPI/RPI); such terms are banned on contracts signed on or after 17 January 2025.`
    },
    {
      question: `What happens to the price when the ${plan.provider} contract ends?`,
      answer: `If you don't switch or renegotiate, it rolls onto the out-of-contract price of about ${formatPence(plan.outOfContractMonthlyPence)}/month.`
    }
  ];
  return faqs;
}

export const HORIZON_OPTIONS = [12, 18, 24, 36] as const;
