import { describe, expect, it } from "vitest";
import { buildAffiliateUrl, resolveDeeplink, resolveSlot } from "../lib/partners";

describe("buildAffiliateUrl", () => {
  it("substitutes {clickref}", () => {
    expect(buildAffiliateUrl("https://example.com/go?ref={clickref}", "home-removals")).toBe(
      "https://example.com/go?ref=home-removals"
    );
  });

  it("handles a template with no placeholder", () => {
    expect(buildAffiliateUrl("https://example.com/store", "x")).toBe("https://example.com/store");
  });
});

describe("resolveSlot fallback", () => {
  it("returns coming-soon for an inactive partner", () => {
    const slot = resolveSlot("removals", "home-removals");
    expect(slot.kind).toBe("coming-soon");
    expect(slot.partnerName).toBeNull();
    expect(slot.category).toBe("removals");
  });
});

describe("resolveDeeplink — /go resolver, inert + fail-closed", () => {
  it("returns null for every green category (rails still INERT)", () => {
    for (const category of ["removals", "conveyancing", "surveys"]) {
      expect(resolveDeeplink([category], "home")).toBeNull();
    }
  });

  it("returns null for FCA-red / unknown categories — mortgage is never routable through /go", () => {
    expect(resolveDeeplink(["mortgage"], "home")).toBeNull();
    expect(resolveDeeplink(["insurance"], "home")).toBeNull();
    expect(resolveDeeplink([], "home")).toBeNull();
  });
});
