/**
 * EnergyMath — content models. Pure functions that turn dataset rows into the
 * sentences, FAQs and figures the pages render. Testable, no React.
 */

import { CAP_PERIOD, GB_AVERAGE, TDCV, type EnergyRegion } from "./energy-data";
import {
  estimateAnnualBill,
  compareHeatPumpVsBoiler,
  formatPounds,
  type BillEstimate
} from "./energy-calc";

export interface RegionPageModel {
  region: EnergyRegion;
  medium: BillEstimate;
  /** Headline answer sentence. */
  answer: string;
  /** Whether the region's rates are verified-exact or a GB-average estimate. */
  verified: boolean;
}

export function regionPageModel(region: EnergyRegion): RegionPageModel {
  const medium = estimateAnnualBill(region, TDCV.electricityKwhPerYear, TDCV.gasKwhPerYear);
  const qualifier = region.verified
    ? "based on the region's Ofgem price-cap rates"
    : "estimated from the GB-average Ofgem price cap (regional rates vary by a few pence)";
  const answer = `A typical medium-usage dual-fuel home in ${region.name} pays about ${formatPounds(
    medium.totalPounds
  )} a year (${formatPounds(medium.monthlyPounds)}/month) on the Ofgem price cap for ${CAP_PERIOD} — ${qualifier}.`;
  return { region, medium, answer, verified: region.verified };
}

export function buildRegionFaqs(region: EnergyRegion): { question: string; answer: string }[] {
  const m = estimateAnnualBill(region, TDCV.electricityKwhPerYear, TDCV.gasKwhPerYear);
  const verifiedNote = region.verified
    ? "These are the region's Ofgem price-cap rates."
    : "We currently show the GB-average price-cap rates as an estimate for this region; Ofgem's exact regional figures vary by a few pence.";
  return [
    {
      question: `What is the typical energy bill in ${region.name}?`,
      answer: `On the Ofgem price cap for ${CAP_PERIOD}, a medium-usage household (2,700 kWh electricity, 11,500 kWh gas a year) in ${region.name} pays roughly ${formatPounds(
        m.totalPounds
      )} a year — about ${formatPounds(m.monthlyPounds)} a month. Your actual bill depends on how much energy you use. ${verifiedNote}`
    },
    {
      question: `What is the electricity unit rate in ${region.name}?`,
      answer: `The electricity unit rate shown is ${region.electricityUnitRatePence}p per kWh with a ${region.electricityStandingChargePence}p daily standing charge (Direct Debit, including VAT). ${verifiedNote}`
    },
    {
      question: `What is the gas unit rate in ${region.name}?`,
      answer: `The gas unit rate shown is ${region.gasUnitRatePence}p per kWh with a ${region.gasStandingChargePence}p daily standing charge (Direct Debit, including VAT). ${verifiedNote}`
    },
    {
      question: "Is the price cap a cap on my total bill?",
      answer:
        "No. The Ofgem price cap limits the unit rate and standing charge a supplier can charge — not your total bill. If you use more energy you pay more; if you use less you pay less. The widely-quoted figure (£" +
        GB_AVERAGE.typicalDualFuelAnnualPounds.toLocaleString("en-GB") +
        " a year) is for a typical medium-usage household only."
    }
  ];
}

export function homeFaqs(): { question: string; answer: string }[] {
  return [
    {
      question: "How is my annual energy bill estimated?",
      answer: `We multiply your annual usage (kWh) by your region's unit rate, then add 365 days of standing charge, for both electricity and gas. The rates come from the Ofgem price cap for ${CAP_PERIOD} (Direct Debit, including VAT).`
    },
    {
      question: "Does a heat pump cost less to run than a gas boiler?",
      answer:
        "It can. A heat pump delivers several units of heat per unit of electricity (its SCOP), so even though electricity costs more per kWh than gas, the running cost can be lower. Our toggle gives an indicative running-cost comparison — it excludes installation cost and any grants, which matter a lot to the real payback."
    },
    {
      question: "How long does solar take to pay back?",
      answer:
        "Our solar tool divides the system cost by the estimated annual benefit (electricity you no longer import, plus a typical export payment). It is indicative only — real payback depends on your roof, usage pattern, install price and export tariff."
    }
  ];
}

export function sortRegionsByBill(regions: EnergyRegion[]): {
  region: EnergyRegion;
  estimate: BillEstimate;
}[] {
  return regions
    .map((region) => ({
      region,
      estimate: estimateAnnualBill(region, TDCV.electricityKwhPerYear, TDCV.gasKwhPerYear)
    }))
    .sort((a, b) => a.estimate.totalPounds - b.estimate.totalPounds);
}

/** Build a one-line heat-pump verdict for a region (medium gas heating demand). */
export function heatPumpVerdictLine(region: EnergyRegion): string {
  // Assume ~80% of medium gas usage is space + water heating.
  const gasHeatingKwh = Math.round(TDCV.gasKwhPerYear * 0.8);
  const c = compareHeatPumpVsBoiler(
    gasHeatingKwh,
    region.gasUnitRatePence,
    region.electricityUnitRatePence
  );
  if (c.cheaper === "heat-pump") {
    return `On these rates a heat pump (SCOP 3.0) could cut heating running costs by about ${formatPounds(
      c.annualSavingPounds
    )} a year vs a gas boiler — before install cost or grants.`;
  }
  return `On these rates a gas boiler is currently the cheaper option to run by about ${formatPounds(
    Math.abs(c.annualSavingPounds)
  )} a year — before any heat-pump grant.`;
}
