import { describe, expect, it } from "vitest";
import { loungeBreakEven, type MembershipTier } from "../src/lounge";

const tiers: MembershipTier[] = [
  { tier: "Standard", annualFeePence: 6900, includedVisits: 0, perVisitPence: 2400 },
  { tier: "Standard Plus", annualFeePence: 22900, includedVisits: 10, perVisitPence: 2400 },
  { tier: "Prestige", annualFeePence: 45900, includedVisits: null, perVisitPence: 0 }
];

describe("loungeBreakEven", () => {
  it("computes pay-as-you-go total", () => {
    expect(loungeBreakEven(3500, 4, tiers).payAsYouGoPence).toBe(14000);
  });
  it("computes each tier's annual cost (fee + visits beyond included)", () => {
    const r = loungeBreakEven(3500, 4, tiers);
    expect(r.tierCosts.find((t) => t.tier === "Standard")?.totalPence).toBe(6900 + 4 * 2400);
    expect(r.tierCosts.find((t) => t.tier === "Standard Plus")?.totalPence).toBe(22900);
    expect(r.tierCosts.find((t) => t.tier === "Prestige")?.totalPence).toBe(45900);
  });
  it("verdict is payg when walk-ins are cheaper", () => {
    const r = loungeBreakEven(3500, 2, tiers);
    expect(r.verdict).toBe("payg");
  });
  it("verdict is membership with the best tier when a tier wins", () => {
    const r = loungeBreakEven(3500, 12, tiers);
    expect(r.verdict).toBe("membership");
    expect(r.best?.tier).toBe("Standard Plus"); // 22900 + 2*2400 = 27700 vs payg 42000
    expect(r.savingsPence).toBe(42000 - 27700);
  });
  it("clamps nonsense input instead of throwing", () => {
    expect(() => loungeBreakEven(3500, -3, tiers)).not.toThrow();
    expect(loungeBreakEven(3500, -3, tiers).visitsPerYear).toBe(1);
  });
});
