import { describe, expect, it } from "vitest";
import {
  annualFuelCostPounds,
  estimateAnnualBill,
  compareHeatPumpVsBoiler,
  estimateSolarPayback,
  formatPounds,
  formatPoundsPrecise
} from "../lib/energy-calc";
import { GB_AVERAGE, TDCV } from "../lib/energy-data";

describe("annualFuelCostPounds", () => {
  it("computes usage × rate + 365 × standing charge in pounds", () => {
    // 1000 kWh @ 10p = £100 usage; 365 × 50p = £182.50 standing; total £282.50
    const cost = annualFuelCostPounds({ unitRatePence: 10, standingChargePence: 50, kwhPerYear: 1000 });
    expect(cost).toBeCloseTo(282.5, 2);
  });
});

describe("estimateAnnualBill", () => {
  const region = {
    electricityUnitRatePence: GB_AVERAGE.electricityUnitRatePence,
    electricityStandingChargePence: GB_AVERAGE.electricityStandingChargePence,
    gasUnitRatePence: GB_AVERAGE.gasUnitRatePence,
    gasStandingChargePence: GB_AVERAGE.gasStandingChargePence
  };

  it("reconciles roughly with Ofgem's published typical dual-fuel bill at medium TDCV", () => {
    const bill = estimateAnnualBill(region, TDCV.electricityKwhPerYear, TDCV.gasKwhPerYear);
    // Within ~£40 of Ofgem's £1,862 headline (rounding in the cap calc).
    expect(Math.abs(bill.totalPounds - GB_AVERAGE.typicalDualFuelAnnualPounds)).toBeLessThan(40);
  });

  it("monthly is total / 12", () => {
    const bill = estimateAnnualBill(region, 2700, 11500);
    expect(bill.monthlyPounds).toBeCloseTo(bill.totalPounds / 12, 6);
  });

  it("total equals electricity + gas", () => {
    const bill = estimateAnnualBill(region, 2700, 11500);
    expect(bill.totalPounds).toBeCloseTo(bill.electricityPounds + bill.gasPounds, 6);
  });
});

describe("compareHeatPumpVsBoiler", () => {
  it("favours the heat pump at a high SCOP", () => {
    const c = compareHeatPumpVsBoiler(10000, 7.33, 26.11, 4);
    expect(c.cheaper).toBe("heat-pump");
    expect(c.annualSavingPounds).toBeGreaterThan(0);
  });

  it("can favour the boiler at a low SCOP", () => {
    const c = compareHeatPumpVsBoiler(10000, 7.33, 26.11, 1.2);
    expect(c.cheaper).toBe("boiler");
    expect(c.annualSavingPounds).toBeLessThan(0);
  });
});

describe("estimateSolarPayback", () => {
  it("returns a positive payback period for a paying system", () => {
    const s = estimateSolarPayback(4, 7000, 26.11);
    expect(s.annualGenerationKwh).toBe(3600);
    expect(s.annualBenefitPounds).toBeGreaterThan(0);
    expect(s.paybackYears).not.toBeNull();
    expect(s.paybackYears!).toBeGreaterThan(0);
  });

  it("returns null payback when there is no benefit", () => {
    const s = estimateSolarPayback(0, 7000, 26.11);
    expect(s.paybackYears).toBeNull();
  });
});

describe("formatPounds", () => {
  it("rounds and adds thousands separators", () => {
    expect(formatPounds(1862.4)).toBe("£1,862");
    expect(formatPounds(0)).toBe("£0");
  });
  it("formatPoundsPrecise keeps two decimals", () => {
    expect(formatPoundsPrecise(155.5)).toBe("£155.50");
  });
});
