import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { resolveSlot, buildAffiliateUrl, resolveDeeplink, type PartnerCategory } from "../lib/partners";
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

  it("names GreenMatch specifically for the solar and heat-pump slots (not a generic placeholder)", () => {
    expect(partnersJson.partners.solar?.name).toBe("GreenMatch");
    expect(partnersJson.partners.heatpump?.name).toBe("GreenMatch");
  });
});

describe("buildAffiliateUrl", () => {
  it("substitutes {regionSlug} and {clickref}", () => {
    expect(buildAffiliateUrl("https://x.com/{regionSlug}?c={clickref}", "london")).toBe(
      "https://x.com/london?c=energy-london"
    );
  });
});

describe("resolveDeeplink (the /go resolver)", () => {
  it("returns null for every category while partners are inert", () => {
    expect(resolveDeeplink(["switching"], "home")).toBeNull();
    expect(resolveDeeplink(["solar", "london"], "region")).toBeNull();
    expect(resolveDeeplink(["heat-pump", "london"], "region")).toBeNull();
  });

  it("returns null for an unknown category (fail-closed)", () => {
    expect(resolveDeeplink(["mortgage"], "home")).toBeNull();
    expect(resolveDeeplink([], "home")).toBeNull();
  });
});

describe("go-live path (proves the wiring needs zero redesign once credentials land)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.doUnmock("../lib/partners.json");
    vi.resetModules();
  });

  it("resolveSlot + resolveDeeplink both return the real GreenMatch URL once solar is flipped active", async () => {
    // Simulates dropping real GreenMatch dashboard values into partners.json — no code change,
    // only data. If this test passes, the "just needs credentials, not a redesign" claim is real.
    vi.doMock("../lib/partners.json", () => ({
      default: {
        partners: {
          solar: {
            name: "GreenMatch",
            category: "solar",
            active: true,
            deeplinkTemplate: "https://www.greenmatch.co.uk/solar-panels?ref=PUB123&subid={clickref}",
            trackingNote: "live"
          },
          heatpump: {
            name: "GreenMatch",
            category: "heat-pump",
            active: false,
            deeplinkTemplate: "",
            trackingNote: "still inert"
          },
          switching: { name: "x", category: "switching", active: false, deeplinkTemplate: "", trackingNote: "" }
        }
      }
    }));

    const live = await import("../lib/partners");

    const slot = live.resolveSlot("solar", "london");
    expect(slot.kind).toBe("affiliate");
    expect(slot.url).toBe("https://www.greenmatch.co.uk/solar-panels?ref=PUB123&subid=energy-london");
    expect(slot.disclosureRequired).toBe(true);
    expect(slot.partnerName).toBe("GreenMatch");

    // heat-pump stays inert independently — flipping one category doesn't leak the other.
    expect(live.resolveSlot("heat-pump", "london").kind).toBe("inert");

    expect(live.resolveDeeplink(["solar", "london"], "home-solar-calc")).toBe(
      "https://www.greenmatch.co.uk/solar-panels?ref=PUB123&subid=energy-london"
    );
  });
});
