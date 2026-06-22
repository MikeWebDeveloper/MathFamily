/**
 * Full cost-to-move aggregation. Combines the SDLT tax (sdlt.ts) with typical removals,
 * conveyancing, survey and other costs (dataset.ts) into one total. All money in PENCE.
 *
 * Inputs are explicit selections so the calculator stays deterministic and testable. The
 * estate-agent fee and selling conveyancing only apply when the user is also selling.
 */

import {
  REMOVALS,
  SURVEYS,
  CONVEYANCING_BUY,
  CONVEYANCING_SELL,
  OTHER_COSTS,
  ESTATE_AGENT_PCT,
  type CostRange
} from "./dataset";
import { calculateSdlt, type BuyerType, type SdltResult } from "./sdlt";

export interface MoveCostInput {
  pricePence: number;
  buyerType: BuyerType;
  removalsKey: string;
  surveyKey: string;
  /** Whether the mover is also selling a current home (adds sale conveyancing + agent fee + EPC). */
  isSelling: boolean;
  /** Include a mortgage arrangement fee as a generic cost line (no product is promoted). */
  includeMortgageFee: boolean;
}

export interface MoveCostLine {
  key: string;
  label: string;
  pence: number;
  note?: string;
}

export interface MoveCostResult {
  sdlt: SdltResult;
  lines: MoveCostLine[];
  totalPence: number;
}

function findRange(list: CostRange[], key: string, fallbackIndex = 0): CostRange {
  const found = list.find((r) => r.key === key);
  if (found) return found;
  const fallback = list[fallbackIndex] ?? list[0];
  if (!fallback) throw new Error("cost range list is empty");
  return fallback;
}

export function calculateMoveCost(input: MoveCostInput): MoveCostResult {
  const sdlt = calculateSdlt(input.pricePence, input.buyerType);
  const removals = findRange(REMOVALS, input.removalsKey, 1);
  const survey = findRange(SURVEYS, input.surveyKey, 1);

  const lines: MoveCostLine[] = [
    { key: "sdlt", label: "Stamp Duty (SDLT)", pence: sdlt.totalTaxPence, note: "England & NI estimate" },
    { key: removals.key, label: removals.label, pence: removals.typicalPence },
    { key: CONVEYANCING_BUY.key, label: CONVEYANCING_BUY.label, pence: CONVEYANCING_BUY.typicalPence },
    { key: survey.key, label: survey.label, pence: survey.typicalPence }
  ];

  if (input.includeMortgageFee) {
    const mortgageFee = OTHER_COSTS.find((c) => c.key === "mortgage-arrangement-fee");
    if (mortgageFee) {
      lines.push({ key: mortgageFee.key, label: mortgageFee.label, pence: mortgageFee.typicalPence, note: "estimate only" });
    }
  }

  if (input.isSelling) {
    lines.push({ key: CONVEYANCING_SELL.key, label: CONVEYANCING_SELL.label, pence: CONVEYANCING_SELL.typicalPence });
    const epc = OTHER_COSTS.find((c) => c.key === "epc");
    if (epc) lines.push({ key: epc.key, label: epc.label, pence: epc.typicalPence });
    const agentPence = Math.round(input.pricePence * ESTATE_AGENT_PCT);
    lines.push({
      key: "estate-agent",
      label: "Estate agent fee (selling)",
      pence: agentPence,
      note: "1.42% of sale price (avg)"
    });
  }

  const totalPence = lines.reduce((sum, l) => sum + l.pence, 0);
  return { sdlt, lines, totalPence };
}
