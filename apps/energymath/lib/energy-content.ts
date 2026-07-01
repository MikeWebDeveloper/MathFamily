/**
 * EnergyMath — content models. Pure functions that turn dataset rows into the
 * sentences, FAQs and figures the pages render. Testable, no React.
 */

import {
  BOILER_UPGRADE_SCHEME,
  CAP_PERIOD,
  GB_AVERAGE,
  HEAT_PUMP_INSTALL_COST_RANGE_POUNDS,
  SOLAR_COST_PER_KWP_RANGE_POUNDS,
  TDCV,
  type EnergyRegion,
  type UsageProfile
} from "./energy-data";
import {
  estimateAnnualBill,
  compareHeatPumpVsBoiler,
  estimateSolarPayback,
  formatPounds,
  DEFAULT_SCOP,
  type BillEstimate,
  type HeatPumpComparison,
  type SolarPayback
} from "./energy-calc";

/** Share of a home's gas usage that goes on space + water heating (the rest is cooking
 *  etc.) — same 80% planning assumption used by heatPumpVerdictLine and the homepage
 *  calculator's heat-pump toggle, applied here at the GB-average rate for a national page. */
const HEATING_SHARE_OF_GAS = 0.8;

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
      answer: `On the Ofgem price cap for ${CAP_PERIOD}, a medium-usage household (${TDCV.electricityKwhPerYear.toLocaleString()} kWh electricity, ${TDCV.gasKwhPerYear.toLocaleString()} kWh gas a year) in ${region.name} pays roughly ${formatPounds(
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
  const gasHeatingKwh = Math.round(TDCV.gasKwhPerYear * HEATING_SHARE_OF_GAS);
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

// ---------------------------------------------------------------------------
// /heat-pump-vs-boiler — national (GB-average rate) content model.
// ---------------------------------------------------------------------------

export interface HeatPumpProfileRow {
  profile: UsageProfile;
  gasHeatingKwh: number;
  comparison: HeatPumpComparison;
}

/** Running-cost comparison by home size, at GB-average Ofgem unit rates. */
export function nationalHeatPumpRows(profiles: UsageProfile[]): HeatPumpProfileRow[] {
  return profiles.map((profile) => {
    const gasHeatingKwh = Math.round(profile.gasKwhPerYear * HEATING_SHARE_OF_GAS);
    const comparison = compareHeatPumpVsBoiler(
      gasHeatingKwh,
      GB_AVERAGE.gasUnitRatePence,
      GB_AVERAGE.electricityUnitRatePence
    );
    return { profile, gasHeatingKwh, comparison };
  });
}

export interface HeatPumpPageModel {
  medium: HeatPumpProfileRow;
  answer: string;
  /** Net install cost after the Boiler Upgrade Scheme grant, low/high indicative range. */
  netInstallLowPounds: number;
  netInstallHighPounds: number;
  /** Simple payback: net install cost ÷ annual running-cost saving. Null if the heat
   *  pump doesn't save money at these rates (boiler cheaper to run). */
  paybackYearsLow: number | null;
  paybackYearsHigh: number | null;
}

/** Full content model for the standalone /heat-pump-vs-boiler page: GB-average medium-home
 *  verdict, plus a simple install-cost-minus-grant payback range. Composes existing
 *  compareHeatPumpVsBoiler() output with the Boiler Upgrade Scheme grant and the indicative
 *  install-cost range — no new pricing logic, just page-level arithmetic on those figures. */
export function heatPumpPageModel(profiles: UsageProfile[]): HeatPumpPageModel {
  const rows = nationalHeatPumpRows(profiles);
  const medium = rows.find((r) => r.profile.id === "small") ?? rows[0]!;
  const { comparison } = medium;

  const netInstallLowPounds = Math.max(
    0,
    HEAT_PUMP_INSTALL_COST_RANGE_POUNDS.low - BOILER_UPGRADE_SCHEME.airSourceGrantPounds
  );
  const netInstallHighPounds = Math.max(
    0,
    HEAT_PUMP_INSTALL_COST_RANGE_POUNDS.high - BOILER_UPGRADE_SCHEME.airSourceGrantPounds
  );

  const canPayBack = comparison.annualSavingPounds > 0;
  const answer =
    comparison.cheaper === "heat-pump"
      ? `For a typical medium-usage home, a heat pump (SCOP ${DEFAULT_SCOP.toFixed(1)}) costs about ${formatPounds(
          comparison.annualSavingPounds
        )} a year less to run than a gas boiler at GB-average Ofgem rates — before install cost or the ${formatPounds(
          BOILER_UPGRADE_SCHEME.airSourceGrantPounds
        )} Boiler Upgrade Scheme grant.`
      : `For a typical medium-usage home, a gas boiler is currently about ${formatPounds(
          Math.abs(comparison.annualSavingPounds)
        )} a year cheaper to run than a heat pump at GB-average Ofgem rates — the gap electricity and gas unit rates would need to close before a heat pump saves money on running costs alone.`;

  return {
    medium,
    answer,
    netInstallLowPounds,
    netInstallHighPounds,
    paybackYearsLow: canPayBack ? netInstallLowPounds / comparison.annualSavingPounds : null,
    paybackYearsHigh: canPayBack ? netInstallHighPounds / comparison.annualSavingPounds : null
  };
}

export function buildHeatPumpFaqs(): { question: string; answer: string }[] {
  return [
    {
      question: "Does a heat pump cost less to run than a gas boiler?",
      answer: `It can. A heat pump delivers several units of heat per unit of electricity it uses (its "coefficient of performance"); we assume a seasonal figure (SCOP) of ${DEFAULT_SCOP.toFixed(
        1
      )}, a common planning value. Even though electricity costs more per kWh than gas, that multiplier can make the running cost lower — but the gap depends on your electricity and gas unit rates, so check the figures for your own region too.`
    },
    {
      question: "How much is the Boiler Upgrade Scheme grant?",
      answer: `The Boiler Upgrade Scheme (England & Wales) gives £${BOILER_UPGRADE_SCHEME.airSourceGrantPounds.toLocaleString(
        "en-GB"
      )} towards an air-source or ground-source heat pump, £${BOILER_UPGRADE_SCHEME.airToAirGrantPounds.toLocaleString(
        "en-GB"
      )} towards an air-to-air heat pump, or £${BOILER_UPGRADE_SCHEME.biomassGrantPounds.toLocaleString(
        "en-GB"
      )} towards a biomass boiler. It's applied for on your behalf by an MCS-certified installer and deducted from your quote, not paid to you directly. The scheme runs to ${BOILER_UPGRADE_SCHEME.schemeEndDate.slice(
        0,
        4
      )}.`
    },
    {
      question: "How much does a heat pump cost to install?",
      answer: `Indicative UK market range for a fully installed domestic air-source heat pump is roughly ${formatPounds(
        HEAT_PUMP_INSTALL_COST_RANGE_POUNDS.low
      )}–${formatPounds(
        HEAT_PUMP_INSTALL_COST_RANGE_POUNDS.high
      )} before any grant — actual quotes vary with property size, radiator upgrades and site conditions. This is a general market indication, not an Ofgem or gov.uk figure.`
    },
    {
      question: "What does this comparison leave out?",
      answer:
        "This is a running-cost and simple-payback estimate only. It excludes radiator or pipework upgrades some homes need, the property's actual heat loss and insulation, and any finance costs. Get a home survey and a firm quote from an MCS-certified installer before deciding."
    }
  ];
}

// ---------------------------------------------------------------------------
// /solar-payback — national (GB-average rate) content model.
// ---------------------------------------------------------------------------

export interface SolarSystemRow {
  systemKwp: number;
  typicalCostPounds: number;
  payback: SolarPayback;
}

const SOLAR_COST_PER_KWP_MID_POUNDS =
  (SOLAR_COST_PER_KWP_RANGE_POUNDS.low + SOLAR_COST_PER_KWP_RANGE_POUNDS.high) / 2;

/** Payback by representative system size, at the GB-average Ofgem electricity rate and
 *  the indicative mid-market install cost per kWp. Uses estimateSolarPayback()'s own
 *  defaults for self-consumption share and export rate. */
export function nationalSolarRows(systemSizesKwp: number[]): SolarSystemRow[] {
  return systemSizesKwp.map((systemKwp) => {
    const typicalCostPounds = Math.round(systemKwp * SOLAR_COST_PER_KWP_MID_POUNDS);
    const payback = estimateSolarPayback(systemKwp, typicalCostPounds, GB_AVERAGE.electricityUnitRatePence);
    return { systemKwp, typicalCostPounds, payback };
  });
}

/** Representative 4 kWp payback at the low/high ends of the indicative install-cost-per-kWp
 *  range (system size held fixed) — because benefit scales with system size too, payback for
 *  a FIXED price-per-kWp is roughly size-independent; a real range only shows up by varying
 *  the price, which is what installers actually quote differently. Feeds the FAQ answer below
 *  so it can never drift from the underlying calculation. */
function representativePaybackRangeYears(): { low: number; high: number } {
  const REPRESENTATIVE_KWP = 4;
  const low = estimateSolarPayback(
    REPRESENTATIVE_KWP,
    REPRESENTATIVE_KWP * SOLAR_COST_PER_KWP_RANGE_POUNDS.low,
    GB_AVERAGE.electricityUnitRatePence
  ).paybackYears;
  const high = estimateSolarPayback(
    REPRESENTATIVE_KWP,
    REPRESENTATIVE_KWP * SOLAR_COST_PER_KWP_RANGE_POUNDS.high,
    GB_AVERAGE.electricityUnitRatePence
  ).paybackYears;
  return { low: low ?? 0, high: high ?? 0 };
}

/** Payback figure quoted in the FAQ is DERIVED from the same estimateSolarPayback() calls as
 *  the comparison table (never a separate hardcoded guess), so the FAQ answer can never drift
 *  from the underlying calculation. */
export function buildSolarFaqs(): { question: string; answer: string }[] {
  const { low: lowYears, high: highYears } = representativePaybackRangeYears();
  return [
    {
      question: "How long does solar take to pay back?",
      answer: `Payback = system cost ÷ annual benefit, where the benefit is the electricity you no longer import (at your unit rate) plus what you earn exporting the rest via the Smart Export Guarantee (SEG). On a typical 4 kWp home system, our indicative install-cost range and the GB-average electricity rate give a payback of roughly ${lowYears.toFixed(
        1
      )}–${highYears.toFixed(
        1
      )} years — it depends heavily on your own usage pattern, roof orientation, install price and export tariff.`
    },
    {
      question: "What is the Smart Export Guarantee (SEG)?",
      answer:
        "SEG is the scheme that requires electricity suppliers to pay small-scale generators (like home solar) for the electricity they export to the grid, at a rate the supplier sets — Ofgem only requires it to be above zero. Rates vary by supplier; our indicative figure sits inside the typical current market band."
    },
    {
      question: "How much does a home solar PV system cost?",
      answer: `Indicative UK market cost is roughly ${formatPounds(
        SOLAR_COST_PER_KWP_RANGE_POUNDS.low
      )}–${formatPounds(SOLAR_COST_PER_KWP_RANGE_POUNDS.high)} per kWp of panels installed, so a typical 4 kWp system costs somewhere around ${formatPounds(
        4 * SOLAR_COST_PER_KWP_RANGE_POUNDS.low
      )}–${formatPounds(4 * SOLAR_COST_PER_KWP_RANGE_POUNDS.high)}. Get quotes from MCS-certified installers to compare — prices vary by roof and installer.`
    },
    {
      question: "What does this estimate leave out?",
      answer:
        "It excludes battery storage, shading and roof-orientation losses, financing costs, and any increase in your home's value. It also assumes a fixed self-consumption share and export rate for every household, when both vary a lot in practice — use the home-page calculator to try your own numbers."
    }
  ];
}
