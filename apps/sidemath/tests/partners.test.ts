import { describe, expect, it } from "vitest";
import { resolveSoftwareSlot, buildAffiliateUrl, DEFAULT_PARTNER_KEY } from "../lib/partners";
import partnersJson from "../lib/partners.json";

describe("partners.json (compliance)", () => {
  it("ships EVERY partner inert — no active flags, no live deeplinks", () => {
    for (const [, p] of Object.entries(partnersJson.partners)) {
      expect(p.active).toBe(false);
      expect(p.deeplinkTemplate).toBe("");
    }
  });
});

describe("buildAffiliateUrl", () => {
  it("substitutes {clickref}", () => {
    expect(buildAffiliateUrl("https://x.com/go?ref={clickref}", "home")).toBe("https://x.com/go?ref=home");
  });
});

describe("resolveSoftwareSlot", () => {
  it("is always inert while partners are inactive", () => {
    const slot = resolveSoftwareSlot(DEFAULT_PARTNER_KEY, "home");
    expect(slot.kind).toBe("inert");
    expect(slot.url).toBeNull();
    expect(slot.disclosureRequired).toBe(false);
    expect(slot.partnerName).toBe("FreeAgent");
  });

  it("returns a fully-null inert slot for an unknown partner", () => {
    const slot = resolveSoftwareSlot("does-not-exist", "home");
    expect(slot.kind).toBe("inert");
    expect(slot.partnerName).toBeNull();
    expect(slot.disclosureRequired).toBe(false);
  });
});
