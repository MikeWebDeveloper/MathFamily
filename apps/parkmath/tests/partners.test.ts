import { describe, expect, it } from "vitest";
import { resolveSlot } from "../lib/partners";

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
