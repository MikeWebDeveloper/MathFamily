import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LoungeAnswer } from "../components/lounge-answer";
import type { MembershipTier } from "@mathfamily/engine";

const tiers: MembershipTier[] = [
  { tier: "Standard", annualFeePence: 6900, includedVisits: 0, perVisitPence: 2400 },
  { tier: "Standard Plus", annualFeePence: 22900, includedVisits: 10, perVisitPence: 2400 },
  { tier: "Prestige", annualFeePence: 45900, includedVisits: null, perVisitPence: 0 }
];

// walkInPence=3500, defaultVisits=3 → payg=10500 vs Standard=6900+3*2400=14100 vs SP=22900 vs Prestige=45900
// PAYG wins at 3 visits
const htmlPayg = renderToStaticMarkup(
  <LoungeAnswer walkInPence={3500} tiers={tiers} airportName="Heathrow" defaultVisits={3} />
);

// walkInPence=3500, defaultVisits=12 → payg=42000 vs Standard=6900+12*2400=35700 vs SP=22900+2*2400=27700 vs Prestige=45900
// Standard Plus wins at 12 visits (cheapest tier at 27700)
const htmlMembership = renderToStaticMarkup(
  <LoungeAnswer walkInPence={3500} tiers={tiers} airportName="Heathrow" defaultVisits={12} />
);

describe("LoungeAnswer SSR at defaultVisits=3 (payg wins)", () => {
  it("renders the hero verdict mentioning pay per visit", () => {
    expect(htmlPayg).toContain("paying per visit");
  });

  it("renders the visits slider control (aria-label)", () => {
    expect(htmlPayg).toContain("Lounge visits per year");
  });

  it("renders the pay-as-you-go row with correct annual cost", () => {
    // 3 visits × £35 = £105 (formatPence omits pence for round numbers)
    expect(htmlPayg).toContain("£105");
  });

  it("renders Priority Pass tier rows in the comparison", () => {
    expect(htmlPayg).toContain("Priority Pass Standard");
    expect(htmlPayg).toContain("Priority Pass Standard Plus");
    expect(htmlPayg).toContain("Priority Pass Prestige");
  });

  it("renders the lounge-result aria-live region", () => {
    expect(htmlPayg).toContain('data-testid="lounge-result"');
  });

  it("renders the airport name in the aria-label", () => {
    expect(htmlPayg).toContain("Heathrow lounge break-even calculator");
  });
});

describe("LoungeAnswer SSR at defaultVisits=12 (membership wins)", () => {
  it("renders the hero verdict mentioning membership", () => {
    expect(htmlMembership).toContain("membership beats paying per visit");
  });

  it("renders the winning tier name", () => {
    expect(htmlMembership).toContain("Standard Plus");
  });

  it("renders the savings amount in the verdict", () => {
    // payg=42000 − SP=27700 = 14300 pence = £143 (formatPence omits pence for round numbers)
    expect(htmlMembership).toContain("£143");
  });

  it("renders pay-as-you-go annual total", () => {
    // 12 × £35 = £420 (formatPence omits pence for round numbers)
    expect(htmlMembership).toContain("£420");
  });
});
