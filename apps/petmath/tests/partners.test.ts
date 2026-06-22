import { describe, expect, it } from "vitest";
import { resolveFoodSlot, buildAffiliateUrl } from "../lib/partners";
import partnersJson from "../lib/partners.json";

describe("resolveFoodSlot", () => {
  it("is INERT for every species while no partner is active (gated)", () => {
    for (const slug of ["small-dog", "cat", "indoor-rabbits"]) {
      const slot = resolveFoodSlot(slug);
      expect(slot.kind).toBe("inert");
      expect(slot.url).toBeNull();
      expect(slot.disclosureRequired).toBe(false);
    }
  });

  it("only ever exposes pet-food-subscription partners (no insurance rail)", () => {
    const categories = Object.values(partnersJson.partners).map((p) => p.category);
    expect(categories.every((c) => c === "pet-food-subscription")).toBe(true);
    expect(categories).not.toContain("pet-insurance");
  });

  it("ships with all partners inactive (no live merchant IDs committed)", () => {
    for (const p of Object.values(partnersJson.partners)) {
      expect(p.active).toBe(false);
      expect(p.deeplinkTemplate).toBe("");
    }
  });
});

describe("buildAffiliateUrl", () => {
  it("substitutes species slug and a clickref", () => {
    const url = buildAffiliateUrl("https://x.test/?s={speciesSlug}&ref={clickref}", "small-dog");
    expect(url).toBe("https://x.test/?s=small-dog&ref=food-small-dog");
  });
});
