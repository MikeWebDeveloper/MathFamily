import { describe, expect, it } from "vitest";
import { PARTNERS, resolveSlot, buildAffiliateUrl, resolveDeeplink } from "../lib/partners";

describe("affiliate compliance (inert in scaffold)", () => {
  it("every partner is inactive with no live deeplink (no merchant IDs shipped)", () => {
    for (const [key, p] of Object.entries(PARTNERS)) {
      expect(p.active, `${key} active`).toBe(false);
      expect(p.deeplinkTemplate, `${key} deeplink`).toBe("");
    }
  });

  it("every partner is a permitted green rail (broadband-switching) — no FCA-red rails", () => {
    for (const [key, p] of Object.entries(PARTNERS)) {
      expect(p.rail, `${key} rail`).toBe("broadband-switching");
    }
  });

  it("resolveSlot always returns an inert slot with no URL in the scaffold", () => {
    const slot = resolveSlot("bt-fibre-2");
    expect(slot.kind).toBe("inert");
    expect(slot.url).toBeNull();
    expect(slot.disclosureRequired).toBe(true);
  });

  it("an inactive partner cannot go live even with a stray template", () => {
    // Simulate a mistake: a template was filled but active stays false.
    const partner = PARTNERS.comparison!;
    const original = partner.deeplinkTemplate;
    partner.deeplinkTemplate = "https://example.com/?ref={planSlug}";
    try {
      expect(resolveSlot("bt-fibre-2").kind).toBe("inert");
    } finally {
      partner.deeplinkTemplate = original;
    }
  });

  it("buildAffiliateUrl substitutes placeholders (used only once a partner is active)", () => {
    const url = buildAffiliateUrl("https://x.test/?p={planSlug}&c={clickref}", "bt-fibre-2");
    expect(url).toBe("https://x.test/?p=bt-fibre-2&c=bb-bt-fibre-2");
  });

  it("resolveDeeplink fails CLOSED — always null while the rail is inert (the /go route then 302s on-site)", () => {
    expect(resolveDeeplink(["bt-fibre-2"], "provider")).toBeNull();
    expect(resolveDeeplink([], "home")).toBeNull();
  });
});
