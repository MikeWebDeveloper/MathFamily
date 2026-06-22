import { describe, expect, it } from "vitest";
import { PLANS, SPEED_TIERS, listProviders, plansByProvider, plansBySpeedTier } from "../lib/broadband-data";

describe("broadband dataset integrity", () => {
  it("every plan carries a sourceUrl and a verifiedAt date (no fabricated, unsourced figures)", () => {
    for (const p of PLANS) {
      expect(p.sourceUrl, `${p.slug} sourceUrl`).toMatch(/^https?:\/\//);
      expect(p.verifiedAt, `${p.slug} verifiedAt`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("every plan has a positive advertised price and out-of-contract price", () => {
    for (const p of PLANS) {
      expect(p.advertisedMonthlyPence, p.slug).toBeGreaterThan(0);
      expect(p.outOfContractMonthlyPence, p.slug).toBeGreaterThan(0);
      expect(p.contractMonths, p.slug).toBeGreaterThan(0);
    }
  });

  it("every plan's speedTier is a known tier", () => {
    const tierSlugs = new Set(SPEED_TIERS.map((t) => t.slug));
    for (const p of PLANS) expect(tierSlugs.has(p.speedTier), `${p.slug} tier`).toBe(true);
  });

  it("plan slugs are unique", () => {
    const slugs = PLANS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("fixed_pence rises carry a fixedPencePerMonth; cpi/rpi carry a plusPercent", () => {
    for (const p of PLANS) {
      if (p.priceRise.type === "fixed_pence") {
        expect(p.priceRise.fixedPencePerMonth, p.slug).toBeTypeOf("number");
      }
      if (p.priceRise.type === "cpi_plus" || p.priceRise.type === "rpi_plus") {
        expect(p.priceRise.plusPercent, p.slug).toBeTypeOf("number");
      }
    }
  });

  it("provider and speed-tier lookups return only matching plans", () => {
    for (const pr of listProviders()) {
      for (const p of plansByProvider(pr.slug)) expect(p.providerSlug).toBe(pr.slug);
    }
    for (const t of SPEED_TIERS) {
      for (const p of plansBySpeedTier(t.slug)) expect(p.speedTier).toBe(t.slug);
    }
  });

  it("covers multiple providers and several speed tiers (enough for spoke pages)", () => {
    expect(listProviders().length).toBeGreaterThanOrEqual(5);
    const tiersUsed = new Set(PLANS.map((p) => p.speedTier));
    expect(tiersUsed.size).toBeGreaterThanOrEqual(3);
  });
});
