import { describe, expect, it } from "vitest";
import { REGIONS, getRegion } from "../lib/energy-data";
import {
  regionPageModel,
  buildRegionFaqs,
  homeFaqs,
  sortRegionsByBill,
  heatPumpVerdictLine
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
