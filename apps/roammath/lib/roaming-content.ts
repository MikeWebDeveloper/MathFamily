import { roamingTripCost, formatPence, type RoamingTripResult } from "@mathfamily/engine";
import type { EsimCountry, RoamingDestination } from "@mathfamily/data";

export const NETWORK_LABELS: Record<string, string> = {
  ee: "EE",
  o2: "O2",
  vodafone: "Vodafone",
  three: "Three"
};

export interface RoamingPageModel extends RoamingTripResult {
  answer: string;
}

export function roamingPageModel(
  destination: RoamingDestination,
  esim: EsimCountry | null,
  days: number,
  dataGb: number
): RoamingPageModel {
  const result = roamingTripCost(destination.perNetwork, esim?.bundles ?? [], days, dataGb);
  const included = destination.perNetwork.filter((n) => n.included);
  const paidCosts = result.networkCosts
    .filter((c) => c.totalPence !== null && c.totalPence > 0)
    .map((c) => c.totalPence!);
  let answer: string;
  if (included.length > 0) {
    const names = included.map((n) => NETWORK_LABELS[n.network] ?? n.network).join(" and ");
    answer = `${names} customers roam in ${destination.countryName} at no extra daily charge (fair-use limits apply); on other networks a ${days}-day trip costs ${
      paidCosts.length > 0 ? `from ${formatPence(Math.min(...paidCosts))}` : "a daily charge"
    }${result.esimChoice ? `, or ${formatPence(result.esimChoice.totalPence)} with a ${result.esimChoice.provider} eSIM` : ""}.`;
  } else if (result.cheapestNetwork?.totalPence != null) {
    answer = `Roaming in ${destination.countryName} for ${days} days costs from ${formatPence(result.cheapestNetwork.totalPence)} (${NETWORK_LABELS[result.cheapestNetwork.network] ?? result.cheapestNetwork.network} daily charges)${
      result.esimChoice ? ` — or ${formatPence(result.esimChoice.totalPence)} with a ${result.esimChoice.provider} eSIM${result.verdict === "esim" ? `, saving ${formatPence(result.savingsPence)}` : ""}` : ""
    }.`;
  } else {
    answer = `UK networks publish no standard daily roaming pass for ${destination.countryName} — check each network's price guide${
      result.esimChoice ? `; a ${result.esimChoice.provider} eSIM costs ${formatPence(result.esimChoice.totalPence)}` : ""
    }.`;
  }
  return { ...result, answer };
}

export function buildRoamingFaqs(
  destination: RoamingDestination,
  esim: EsimCountry | null,
  days: number
): { question: string; answer: string }[] {
  const faqs = destination.perNetwork.map((n) => ({
    question: `What does ${NETWORK_LABELS[n.network] ?? n.network} charge for roaming in ${destination.countryName}?`,
    answer: n.included
      ? `Roaming in ${destination.countryName} is included at no extra daily charge${n.fairUseNote ? ` (${n.fairUseNote})` : ""}.`
      : n.dailyPassPence !== null
        ? `${formatPence(n.dailyPassPence)} per day${n.passName ? ` (${n.passName})` : ""}${n.fairUseNote ? `; ${n.fairUseNote}` : ""}.`
        : `No standard daily pass is published — check the official price guide.`
  }));
  if (esim && esim.bundles.length > 0) {
    const cheapest = [...esim.bundles].sort((a, b) => a.totalPence - b.totalPence)[0]!;
    faqs.push({
      question: `Is an eSIM cheaper than roaming in ${destination.countryName}?`,
      answer: `Tracked eSIM bundles start at ${formatPence(cheapest.totalPence)} (${cheapest.provider}, ${cheapest.bundleName}, snapshot ${cheapest.snapshotDate}); for a ${days}-day trip compare that against your network's daily charges above.`
    });
  }
  return faqs;
}
