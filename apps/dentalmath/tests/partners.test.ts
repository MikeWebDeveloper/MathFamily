import { describe, expect, it } from "vitest";
import { DENTAL_PARTNERS, resolveDentalSlot } from "../lib/partners";

describe("affiliate slot is inert by design", () => {
  it("resolves to an inert, inactive slot with no URL", () => {
    const slot = resolveDentalSlot();
    expect(slot.kind).toBe("inert");
    expect(slot.active).toBe(false);
    // The inert slot carries only a label — there is no outbound link to leak.
    expect(slot).not.toHaveProperty("url");
  });

  it("ships no active partners and no live deep links", () => {
    for (const partner of Object.values(DENTAL_PARTNERS)) {
      expect(partner.active).toBe(false);
      expect(partner.deeplinkTemplate).toBe("");
    }
  });
});
