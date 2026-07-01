import { roamingTripCost, formatPence, terminate, type RoamingTripResult } from "@mathfamily/engine";
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

/** Names which network(s) are already fee-free and what everyone else pays for the same trip.
 *  The SavesVerdict banner must never say "your network already includes roaming" without
 *  saying which network — it sits directly under a table where 3 of 4 UK networks are usually
 *  shown charging a daily rate, so an unnamed "your network" reads as contradicting the numbers
 *  right above it. */
export function networkIncludedVerdict(destination: RoamingDestination, m: RoamingPageModel): string {
  const includedLabels = destination.perNetwork
    .filter((n) => n.included)
    .map((n) => NETWORK_LABELS[n.network] ?? n.network);
  if (includedLabels.length === 0) return "";

  const verb = includedLabels.length === 1 ? "already includes" : "already include";
  const lead = `${joinNames(includedLabels)} ${verb} roaming in ${destination.countryName} — no daily charge applies.`;

  const paidLabels = destination.perNetwork
    .filter((n) => !n.included)
    .map((n) => NETWORK_LABELS[n.network] ?? n.network);
  const paidTotals = m.networkCosts
    .filter((c) => !c.included && c.totalPence !== null)
    .map((c) => c.totalPence!);

  if (paidLabels.length === 0 || paidTotals.length === 0) return lead;

  const min = Math.min(...paidTotals);
  const max = Math.max(...paidTotals);
  const range = min === max ? formatPence(min) : `${formatPence(min)} to ${formatPence(max)}`;
  return `${lead} ${joinNames(paidLabels)} customers pay from ${range} for ${m.days} day${m.days === 1 ? "" : "s"}.`;
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export function buildRoamingFaqs(
  destination: RoamingDestination,
  esim: EsimCountry | null,
  days: number
): { question: string; answer: string }[] {
  const faqs = destination.perNetwork.map((n) => ({
    question: `What does ${NETWORK_LABELS[n.network] ?? n.network} charge for roaming in ${destination.countryName}?`,
    answer: n.included
      ? terminate(`Roaming in ${destination.countryName} is included at no extra daily charge${n.fairUseNote ? ` (${n.fairUseNote})` : ""}`)
      : n.dailyPassPence !== null
        ? terminate(`${formatPence(n.dailyPassPence)} per day${n.passName ? ` (${n.passName})` : ""}${n.fairUseNote ? `; ${n.fairUseNote}` : ""}`)
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
