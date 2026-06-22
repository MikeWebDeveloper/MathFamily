import { describe, expect, it } from "vitest";
import { estimate, perSqmLabel } from "../lib/estimate";
import type { FinishLevel, ProjectType, Region } from "../lib/data/types";

const perSqmProject: ProjectType = {
  slug: "test-ext",
  name: "Test extension",
  category: "extension",
  pricing: "perSqm",
  baseLowPence: 1_500_00, // £1,500/m²
  baseHighPence: 2_500_00, // £2,500/m²
  typicalAreaLow: 10,
  typicalAreaHigh: 40,
  defaultArea: 20,
  scope: "test",
  source: { sourceUrl: "https://example.com", verifiedAt: "2026-06-22" },
};

const wholeJobProject: ProjectType = {
  ...perSqmProject,
  slug: "test-kitchen",
  name: "Test kitchen",
  category: "renovation",
  pricing: "wholeJob",
  baseLowPence: 5_000_00, // £5,000
  baseHighPence: 20_000_00, // £20,000
};

const ukAvgRegion: Region = { slug: "midlands", name: "Midlands", costIndex: 1.0, source: perSqmProject.source };
const londonRegion: Region = { slug: "london", name: "London", costIndex: 1.3, source: perSqmProject.source };

const standard: FinishLevel = { slug: "standard", name: "Standard", multiplier: 1.0, blurb: "" };
const premium: FinishLevel = { slug: "premium", name: "Premium", multiplier: 1.3, blurb: "" };

describe("estimate — perSqm", () => {
  it("multiplies base £/m² by floor area at UK average / standard", () => {
    const e = estimate({ project: perSqmProject, region: ukAvgRegion, finish: standard, areaSqm: 20 });
    // £1,500 × 20 = £30,000 ; £2,500 × 20 = £50,000
    expect(e.lowFormatted).toBe("£30,000");
    expect(e.highFormatted).toBe("£50,000");
    expect(e.rangeLabel).toBe("£30,000–£50,000");
  });

  it("applies the regional cost index", () => {
    const e = estimate({ project: perSqmProject, region: londonRegion, finish: standard, areaSqm: 20 });
    // £30,000 × 1.3 = £39,000 ; £50,000 × 1.3 = £65,000
    expect(e.lowFormatted).toBe("£39,000");
    expect(e.highFormatted).toBe("£65,000");
  });

  it("applies the finish multiplier", () => {
    const e = estimate({ project: perSqmProject, region: ukAvgRegion, finish: premium, areaSqm: 20 });
    // £30,000 × 1.3 = £39,000 ; £50,000 × 1.3 = £65,000
    expect(e.lowFormatted).toBe("£39,000");
    expect(e.highFormatted).toBe("£65,000");
  });

  it("scales with floor area", () => {
    const small = estimate({ project: perSqmProject, region: ukAvgRegion, finish: standard, areaSqm: 10 });
    const big = estimate({ project: perSqmProject, region: ukAvgRegion, finish: standard, areaSqm: 40 });
    expect(big.lowPence).toBe(small.lowPence * 4);
  });

  it("computes a midpoint between low and high", () => {
    const e = estimate({ project: perSqmProject, region: ukAvgRegion, finish: standard, areaSqm: 20 });
    expect(e.midPence).toBe((e.lowPence + e.highPence) / 2);
  });
});

describe("estimate — wholeJob", () => {
  it("ignores floor area for whole-job projects", () => {
    const a = estimate({ project: wholeJobProject, region: ukAvgRegion, finish: standard, areaSqm: 8 });
    const b = estimate({ project: wholeJobProject, region: ukAvgRegion, finish: standard, areaSqm: 99 });
    expect(a.lowPence).toBe(b.lowPence);
    expect(a.lowFormatted).toBe("£5,000");
    expect(a.highFormatted).toBe("£20,000");
  });

  it("still applies region and finish to whole-job ranges", () => {
    const e = estimate({ project: wholeJobProject, region: londonRegion, finish: standard, areaSqm: 8 });
    // £5,000 × 1.3 = £6,500 ; £20,000 × 1.3 = £26,000
    expect(e.lowFormatted).toBe("£6,500");
    expect(e.highFormatted).toBe("£26,000");
  });
});

describe("perSqmLabel", () => {
  it("returns a per-m² range for perSqm projects", () => {
    expect(perSqmLabel(perSqmProject, ukAvgRegion, standard)).toBe("£1,500–£2,500/m²");
  });
  it("returns null for whole-job projects", () => {
    expect(perSqmLabel(wholeJobProject, ukAvgRegion, standard)).toBeNull();
  });
});
