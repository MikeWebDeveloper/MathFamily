import { describe, expect, it } from "vitest";
import { buildAwinLink, resolveSlot } from "../lib/partners";

describe("buildAwinLink", () => {
  it("builds a bare cread.php link with clickref and no ued", () => {
    expect(buildAwinLink({ awinmid: "3496", publisherId: "2932035", airportSlug: "gatwick" })).toBe(
      "https://www.awin1.com/cread.php?awinmid=3496&awinaffid=2932035&clickref=parkmath-gatwick"
    );
  });
  it("percent-encodes a ued destination so its own query string cannot leak", () => {
    const url = buildAwinLink({
      awinmid: "3496",
      publisherId: "2932035",
      airportSlug: "gatwick",
      ued: "https://shop.example.com/p?a=1&b=2",
    });
    expect(url).toContain("ued=https%3A%2F%2Fshop.example.com%2Fp%3Fa%3D1%26b%3D2");
    expect(url.split("&")).toHaveLength(4); // awinmid, awinaffid, clickref, ued — destination's & is encoded
  });
});

describe("resolveSlot", () => {
  it("returns the official fallback when no partner is active", () => {
    const r = resolveSlot("parking-prebook", "gatwick", "https://www.gatwickairport.com/parking");
    expect(r.kind).toBe("official");
    expect(r.url).toBe("https://www.gatwickairport.com/parking");
    expect(r.disclosureRequired).toBe(false);
  });
  it("never returns an affiliate link while all slots ship inactive", () => {
    for (const slot of ["parking-prebook", "lounge-membership"] as const) {
      expect(resolveSlot(slot, "manchester", "https://example.com").kind).toBe("official");
    }
  });
});
