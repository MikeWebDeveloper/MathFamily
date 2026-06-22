import { describe, expect, it } from "vitest";
import { resolveSlot, buildAffiliateUrl, type PartnerCategory } from "../lib/partners";
import partnersJson from "../lib/partners.json";

describe("partners.json compliance", () => {
  it("every partner is inert (active: false, no live deeplink)", () => {
    for (const [, p] of Object.entries(partnersJson.partners)) {
      expect(p.active).toBe(false);
      expect(p.deeplinkTemplate).toBe("");
    }
  });

  it("contains no FCA-regulated categories", () => {
    const categories = Object.values(partnersJson.partners).map((p) => p.category);
    const forbidden = ["mortgage", "insurance", "pension", "credit", "loan", "funeral"];
    for (const c of categories) {
      expect(forbidden).not.toContain(c);
    }
    expect(categories.sort()).toEqual(["heat-pump", "solar", "switching"]);
  });
});

describe("resolveSlot", () => {
  const categories: PartnerCategory[] = ["solar", "heat-pump", "switching"];

  it("returns an inert slot for every category in this MVP", () => {
    for (const c of categories) {
      const slot = resolveSlot(c, "london");
      expect(slot.kind).toBe("inert");
      expect(slot.url).toBeNull();
      expect(slot.disclosureRequired).toBe(false);
      expect(slot.label).toBe("Coming soon");
    }
  });
});

describe("buildAffiliateUrl", () => {
  it("substitutes {regionSlug} and {clickref}", () => {
    expect(buildAffiliateUrl("https://x.com/{regionSlug}?c={clickref}", "london")).toBe(
      "https://x.com/london?c=energy-london"
    );
  });
});
