/**
 * EnergyMath — pure, testable calculation logic. No React, no I/O.
 * All money is computed in pence internally where possible, but annual-bill
 * figures are returned in whole pounds (consistent with how Ofgem quotes them).
 */

import type { EnergyRegion, UsageProfile } from "./energy-data";

export interface FuelInput {
  unitRatePence: number; // p/kWh
  standingChargePence: number; // p/day
  kwhPerYear: number;
}

/** Annual cost in POUNDS for one fuel: usage × unit rate + 365 × standing charge. */
export function annualFuelCostPounds(input: FuelInput): number {
  const usagePence = input.kwhPerYear * input.unitRatePence;
  const standingPence = 365 * input.standingChargePence;
  return (usagePence + standingPence) / 100;
}

export interface BillEstimate {
  electricityPounds: number;
  gasPounds: number;
  totalPounds: number;
  monthlyPounds: number;
}

/** Full dual-fuel annual estimate for a region + usage figures. */
export function estimateAnnualBill(
  region: Pick<
    EnergyRegion,
    | "electricityUnitRatePence"
    | "electricityStandingChargePence"
    | "gasUnitRatePence"
    | "gasStandingChargePence"
  >,
  electricityKwhPerYear: number,
  gasKwhPerYear: number
): BillEstimate {
  const electricityPounds = annualFuelCostPounds({
    unitRatePence: region.electricityUnitRatePence,
    standingChargePence: region.electricityStandingChargePence,
    kwhPerYear: electricityKwhPerYear
  });
  const gasPounds = annualFuelCostPounds({
    unitRatePence: region.gasUnitRatePence,
    standingChargePence: region.gasStandingChargePence,
    kwhPerYear: gasKwhPerYear
  });
  const totalPounds = electricityPounds + gasPounds;
  return {
    electricityPounds,
    gasPounds,
    totalPounds,
    monthlyPounds: totalPounds / 12
  };
}

export function estimateBillForProfile(
  region: Parameters<typeof estimateAnnualBill>[0],
  profile: Pick<UsageProfile, "electricityKwhPerYear" | "gasKwhPerYear">
): BillEstimate {
  return estimateAnnualBill(region, profile.electricityKwhPerYear, profile.gasKwhPerYear);
}

// ---------------------------------------------------------------------------
// Heat pump vs gas boiler — indicative running-cost comparison.
// ASSUMPTIONS (clearly indicative, NOT verified Ofgem figures):
//  - A gas boiler is ~90% efficient; the gas demand for heat is gasKwhPerYear.
//  - The same useful heat from a heat pump needs heatDemand / SCOP electricity.
//  - SCOP (seasonal coefficient of performance) default 3.0 is a common planning value.
// These are running-cost estimates only — they exclude install cost and grants.
// ---------------------------------------------------------------------------

export interface HeatPumpComparison {
  boilerHeatingCostPounds: number;
  heatPumpHeatingCostPounds: number;
  annualSavingPounds: number; // positive ⇒ heat pump cheaper to run
  cheaper: "heat-pump" | "boiler";
}

export const BOILER_EFFICIENCY = 0.9;
export const DEFAULT_SCOP = 3.0;

export function compareHeatPumpVsBoiler(
  gasHeatingKwhPerYear: number,
  gasUnitRatePence: number,
  electricityUnitRatePence: number,
  scop: number = DEFAULT_SCOP
): HeatPumpComparison {
  // Useful heat delivered by the boiler from that gas input.
  const usefulHeatKwh = gasHeatingKwhPerYear * BOILER_EFFICIENCY;
  // Boiler running cost = gas burned × gas rate.
  const boilerHeatingCostPounds = (gasHeatingKwhPerYear * gasUnitRatePence) / 100;
  // Heat pump electricity needed = useful heat / SCOP.
  const heatPumpKwh = usefulHeatKwh / scop;
  const heatPumpHeatingCostPounds = (heatPumpKwh * electricityUnitRatePence) / 100;
  const annualSavingPounds = boilerHeatingCostPounds - heatPumpHeatingCostPounds;
  return {
    boilerHeatingCostPounds,
    heatPumpHeatingCostPounds,
    annualSavingPounds,
    cheaper: annualSavingPounds >= 0 ? "heat-pump" : "boiler"
  };
}

// ---------------------------------------------------------------------------
// Solar PV payback — indicative.
// ASSUMPTIONS (indicative, NOT verified): a kWp of UK solar generates ~900 kWh/yr.
// A share is self-consumed (offsets import at the electricity unit rate); the rest
// is exported (earns the export rate). Payback = system cost / annual benefit.
// ---------------------------------------------------------------------------

export interface SolarPayback {
  annualGenerationKwh: number;
  annualBenefitPounds: number;
  paybackYears: number | null; // null if no benefit
}

export const KWH_PER_KWP_PER_YEAR = 900; // UK indicative
export const DEFAULT_SELF_CONSUMPTION = 0.5; // half used at home
export const DEFAULT_EXPORT_RATE_PENCE = 15; // p/kWh, indicative SEG-style export rate

export function estimateSolarPayback(
  systemKwp: number,
  systemCostPounds: number,
  electricityUnitRatePence: number,
  selfConsumptionFraction: number = DEFAULT_SELF_CONSUMPTION,
  exportRatePence: number = DEFAULT_EXPORT_RATE_PENCE,
  kwhPerKwp: number = KWH_PER_KWP_PER_YEAR
): SolarPayback {
  const annualGenerationKwh = systemKwp * kwhPerKwp;
  const selfUsedKwh = annualGenerationKwh * selfConsumptionFraction;
  const exportedKwh = annualGenerationKwh - selfUsedKwh;
  const savingFromSelfUse = (selfUsedKwh * electricityUnitRatePence) / 100;
  const earningFromExport = (exportedKwh * exportRatePence) / 100;
  const annualBenefitPounds = savingFromSelfUse + earningFromExport;
  const paybackYears = annualBenefitPounds > 0 ? systemCostPounds / annualBenefitPounds : null;
  return { annualGenerationKwh, annualBenefitPounds, paybackYears };
}

/** Format a pounds amount as GBP with no pence (annual-bill convention). */
export function formatPounds(pounds: number): string {
  const rounded = Math.round(pounds);
  return `£${rounded.toLocaleString("en-GB")}`;
}

/** Format pounds with two decimals (for monthly figures). */
export function formatPoundsPrecise(pounds: number): string {
  return `£${pounds.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
