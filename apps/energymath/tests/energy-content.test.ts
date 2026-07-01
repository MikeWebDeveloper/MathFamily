import { describe, expect, it } from "vitest";
import { REGIONS, GB_AVERAGE, USAGE_PROFILES, getRegion } from "../lib/energy-data";
import {
  regionPageModel,
  buildRegionFaqs,
  homeFaqs,
  sortRegionsByBill,
  heatPumpVerdictLine,
  nationalHeatPumpRows,
  heatPumpPageModel,
  buildHeatPumpFaqs,
  nationalSolarRows,
  buildSolarFaqs
} from "../lib/energy-content";

describe("dataset integrity", () => {
  it("has 14 GB distribution regions with unique slugs", () => {
    expect(REGIONS).toHaveLength(14);
    const slugs = new Set(REGIONS.map((r) => r.slug));
    expect(slugs.size).toBe(14);
  });

  it("every region carries a sourceUrl and verifiedAt (no unsourced figures)", () => {
    for (const r of REGIONS) {
      expect(r.sourceUrl).toMatch(/^https:\/\/www\.ofgem\.gov\.uk/);
      expect(r.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.electricityUnitRatePence).toBeGreaterThan(0);
      expect(r.gasUnitRatePence).toBeGreaterThan(0);
      expect(r.electricityStandingChargePence).toBeGreaterThan(0);
      expect(r.gasStandingChargePence).toBeGreaterThan(0);
    }
  });

  it("every region carries REAL verified Ofgem regional rates (not the GB-average placeholder)", () => {
    // Guard against a silent regression back to seeding all regions with the GB average:
    // at least one of the four rates must differ from the GB average for every region,
    // and all 14 must be verified against an Ofgem source.
    for (const r of REGIONS) {
      expect(r.verified).toBe(true);
      const differsFromGbAverage =
        r.electricityUnitRatePence !== GB_AVERAGE.electricityUnitRatePence ||
        r.electricityStandingChargePence !== GB_AVERAGE.electricityStandingChargePence ||
        r.gasUnitRatePence !== GB_AVERAGE.gasUnitRatePence ||
        r.gasStandingChargePence !== GB_AVERAGE.gasStandingChargePence;
      expect(differsFromGbAverage).toBe(true);
    }
  });

  it("regional rates sit in a sane band around the GB average (no transcription blunders)", () => {
    // Per-region cap rates vary by a few pence around the GB average; anything wildly
    // outside this band signals a copy/paste or unit error.
    for (const r of REGIONS) {
      expect(r.electricityUnitRatePence).toBeGreaterThan(22);
      expect(r.electricityUnitRatePence).toBeLessThan(30);
      expect(r.electricityStandingChargePence).toBeGreaterThan(35);
      expect(r.electricityStandingChargePence).toBeLessThan(80);
      expect(r.gasUnitRatePence).toBeGreaterThan(6);
      expect(r.gasUnitRatePence).toBeLessThan(9);
      expect(r.gasStandingChargePence).toBeGreaterThan(25);
      expect(r.gasStandingChargePence).toBeLessThan(33);
    }
  });
});

describe("regionPageModel", () => {
  it("answers with the region name and a pound figure", () => {
    const r = getRegion("london")!;
    const m = regionPageModel(r);
    expect(m.answer).toContain("London");
    expect(m.answer).toMatch(/£[\d,]+/);
  });

  it("labels an unverified region as an estimate, not as verified", () => {
    const r = getRegion("london")!;
    const m = regionPageModel(r);
    if (!r.verified) {
      expect(m.answer.toLowerCase()).toContain("estimate");
      expect(m.verified).toBe(false);
    }
  });
});

describe("buildRegionFaqs", () => {
  it("includes a typical-bill question and a unit-rate question", () => {
    const faqs = buildRegionFaqs(getRegion("yorkshire")!);
    expect(faqs.some((f) => f.question.toLowerCase().includes("typical energy bill"))).toBe(true);
    expect(faqs.some((f) => f.question.toLowerCase().includes("electricity unit rate"))).toBe(true);
  });
});

describe("homeFaqs", () => {
  it("covers bill, heat pump and solar", () => {
    const faqs = homeFaqs();
    const text = faqs.map((f) => f.question.toLowerCase()).join(" ");
    expect(text).toContain("annual energy bill");
    expect(text).toContain("heat pump");
    expect(text).toContain("solar");
  });
});

describe("sortRegionsByBill", () => {
  it("returns all regions in non-decreasing bill order", () => {
    const ranked = sortRegionsByBill(REGIONS);
    expect(ranked).toHaveLength(14);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i]!.estimate.totalPounds).toBeGreaterThanOrEqual(ranked[i - 1]!.estimate.totalPounds);
    }
  });
});

describe("heatPumpVerdictLine", () => {
  it("produces a sentence mentioning a heat pump or boiler", () => {
    const line = heatPumpVerdictLine(getRegion("london")!);
    expect(line.toLowerCase()).toMatch(/heat pump|boiler/);
  });
});

describe("nationalHeatPumpRows", () => {
  it("returns one row per profile, each with a boiler and heat-pump cost", () => {
    const rows = nationalHeatPumpRows(USAGE_PROFILES);
    expect(rows).toHaveLength(USAGE_PROFILES.length);
    for (const row of rows) {
      expect(row.comparison.boilerHeatingCostPounds).toBeGreaterThan(0);
      expect(row.comparison.heatPumpHeatingCostPounds).toBeGreaterThan(0);
      expect(["heat-pump", "boiler"]).toContain(row.comparison.cheaper);
    }
  });
});

describe("heatPumpPageModel", () => {
  const model = heatPumpPageModel(USAGE_PROFILES);

  it("answer mentions a pound figure and either a heat pump or boiler verdict", () => {
    expect(model.answer).toMatch(/£[\d,]+/);
    expect(model.answer.toLowerCase()).toMatch(/heat pump|boiler/);
  });

  it("net install cost is the indicative range minus the Boiler Upgrade Scheme grant, never negative", () => {
    expect(model.netInstallLowPounds).toBeGreaterThanOrEqual(0);
    expect(model.netInstallHighPounds).toBeGreaterThanOrEqual(model.netInstallLowPounds);
  });

  it("payback years are both null or both non-null (never a fabricated one-sided figure)", () => {
    const bothNull = model.paybackYearsLow === null && model.paybackYearsHigh === null;
    const bothNumbers = typeof model.paybackYearsLow === "number" && typeof model.paybackYearsHigh === "number";
    expect(bothNull || bothNumbers).toBe(true);
    if (bothNumbers) {
      expect(model.paybackYearsLow!).toBeGreaterThan(0);
      expect(model.paybackYearsHigh!).toBeGreaterThanOrEqual(model.paybackYearsLow!);
    }
  });
});

describe("buildHeatPumpFaqs", () => {
  it("covers running cost, the Boiler Upgrade Scheme grant, and install cost", () => {
    const faqs = buildHeatPumpFaqs();
    const text = faqs.map((f) => `${f.question} ${f.answer}`.toLowerCase()).join(" ");
    expect(text).toContain("boiler upgrade scheme");
    expect(text).toMatch(/£7,500/);
    expect(text).toContain("install");
  });
});

describe("nationalSolarRows", () => {
  it("returns one row per system size with a positive benefit and cost", () => {
    const rows = nationalSolarRows([3, 4, 6]);
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(row.typicalCostPounds).toBeGreaterThan(0);
      expect(row.payback.annualBenefitPounds).toBeGreaterThan(0);
      expect(row.payback.paybackYears).not.toBeNull();
    }
  });

  it("bigger systems cost more and generate more", () => {
    const [small, large] = nationalSolarRows([3, 6]);
    expect(large!.typicalCostPounds).toBeGreaterThan(small!.typicalCostPounds);
    expect(large!.payback.annualBenefitPounds).toBeGreaterThan(small!.payback.annualBenefitPounds);
  });
});

describe("buildSolarFaqs", () => {
  it("covers payback, the Smart Export Guarantee and system cost, with a sane payback range", () => {
    const faqs = buildSolarFaqs();
    const text = faqs.map((f) => `${f.question} ${f.answer}`.toLowerCase()).join(" ");
    expect(text).toContain("smart export guarantee");
    expect(text).toContain("payback");
    const years = text.match(/roughly ([\d.]+)–([\d.]+) years/);
    expect(years).not.toBeNull();
    const [, low, high] = years!;
    expect(Number(low)).toBeGreaterThan(0);
    expect(Number(high)).toBeGreaterThanOrEqual(Number(low));
  });
});
