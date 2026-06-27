import { describe, expect, it } from "vitest";
import type { DropOffRecord, ParkingRecord } from "@mathfamily/data";
import {
  REFERENCE_DAYS,
  buildParkingVsDropOffFaqs,
  buildParkingVsDropOffHowToSteps,
  dropOffFeePence,
  dropOffParkingBridge,
  gateParkingPence,
  parkingEquivalenceLine,
  parkingVsDropOffAnswer,
  parkingVsDropOffDecisionDescription,
  parkingVsDropOffDecisionH1,
  parkingVsDropOffDecisionTitle,
  parkingVsDropOffIndexSummary,
  parkingVsDropOffLeadFacts,
  parkingVsDropOffModel,
  qualifiesForParkingVsDropOff
} from "../lib/parking-vs-drop-off-content";

const dropOff: DropOffRecord = {
  airportSlug: "gatwick",
  isFree: false,
  feeSummary: "£10 for up to 10 minutes",
  bands: [{ upToMinutes: 10, totalPence: 1000 }],
  maxStayMinutes: 30,
  perMinuteAfterPence: 100,
  maxChargePence: 3000,
  penaltyPence: 10000,
  penaltyNotes: "Reduced to £60 if paid within 14 days",
  paymentDeadline: "Midnight the day after",
  blueBadgePolicy: "Blue Badge holders are exempt if registered in advance",
  freeAlternative: { name: "Long Stay car park", minutesFree: 120, details: "Free shuttle bus to the terminals." },
  priorYearFeePence: null,
  sourceUrl: "https://www.gatwickairport.com/drop-off",
  verifiedAt: "2026-06-10"
};

// 7-day gate = £230.00, i.e. £32.86/24h → one £10 drop-off ≈ 438 min of parking.
const parking: ParkingRecord = {
  airportSlug: "gatwick",
  products: [
    {
      productType: "gate",
      name: "Long Stay — roll-up (drive-up)",
      prices: [
        { days: 3, totalPence: 10200 },
        { days: 7, totalPence: 23000 },
        { days: 14, totalPence: 45400 }
      ],
      snapshotDate: null,
      notes: null
    },
    {
      productType: "prebook",
      name: "Long Stay (pre-book) — 'from' price",
      prices: [{ days: 8, totalPence: 7199 }],
      snapshotDate: "2026-06-12",
      notes: null
    }
  ],
  sourceUrl: "https://www.gatwickairport.com/parking",
  verifiedAt: "2026-06-12"
};

describe("dropOffFeePence / gateParkingPence", () => {
  it("reads the first drop-off band and the gate price for the duration", () => {
    expect(dropOffFeePence(dropOff)).toBe(1000);
    expect(gateParkingPence(parking, 7)).toBe(23000);
  });
  it("returns null for a free airport (nothing to compare)", () => {
    expect(dropOffFeePence({ isFree: true, bands: [] })).toBeNull();
  });
  it("uses ONLY the gate product, never a pre-book snapshot", () => {
    // 8-day pre-book exists but no gate price for 8 days → null, never the pre-book value.
    expect(gateParkingPence(parking, 8)).toBeNull();
  });
});

describe("qualifiesForParkingVsDropOff", () => {
  it("true only when a real drop-off charge AND a gate parking price both exist", () => {
    expect(qualifiesForParkingVsDropOff({ dropOff, parking })).toBe(true);
  });
  it("false when the airport's drop-off is free", () => {
    const free = { ...dropOff, isFree: true, bands: [] };
    expect(qualifiesForParkingVsDropOff({ dropOff: free, parking })).toBe(false);
  });
  it("false when no gate parking price covers the reference duration", () => {
    const noGate: ParkingRecord = { ...parking, products: parking.products.filter((p) => p.productType !== "gate") };
    expect(qualifiesForParkingVsDropOff({ dropOff, parking: noGate })).toBe(false);
  });
});

describe("parkingVsDropOffModel", () => {
  it("derives per-day, minutes-equivalence and the verdict from data", () => {
    const m = parkingVsDropOffModel({ dropOff, parking })!;
    expect(m.dropOffFeePence).toBe(1000);
    expect(m.parkingPence).toBe(23000);
    expect(m.parkingDays).toBe(REFERENCE_DAYS);
    expect(m.perDayPence).toBe(Math.round(23000 / 7)); // 3286
    expect(m.parkingMinutesPerDropOff).toBe(Math.round((1000 / 3286) * 1440)); // 438
    expect(m.dropOffsPerParkingStay).toBe(Math.round(23000 / 1000)); // 23
    expect(m.cheaperToday).toBe("drop-off");
  });
  it("reports the FRESHER of the two source verification dates", () => {
    const m = parkingVsDropOffModel({ dropOff, parking })!;
    expect(m.verifiedAt).toBe("2026-06-12"); // parking is fresher than 2026-06-10
  });
  it("flips the verdict when parking is the smaller outlay", () => {
    const cheapPark: ParkingRecord = {
      ...parking,
      products: [{ productType: "gate", name: "g", prices: [{ days: 7, totalPence: 800 }], snapshotDate: null, notes: null }]
    };
    expect(parkingVsDropOffModel({ dropOff, parking: cheapPark })!.cheaperToday).toBe("parking");
  });
  it("returns null when inputs don't qualify (defensive)", () => {
    expect(parkingVsDropOffModel({ dropOff: { ...dropOff, isFree: true, bands: [] }, parking })).toBeNull();
  });
});

describe("parkingVsDropOffAnswer", () => {
  it("gives the honest dual framing and exact figures when drop-off is cheaper", () => {
    const a = parkingVsDropOffAnswer(parkingVsDropOffModel({ dropOff, parking })!, "London Gatwick");
    expect(a).toContain("£10");
    expect(a).toContain("£230");
    expect(a).toContain("438 minutes");
    expect(a).toContain("cheaper");
  });
});

describe("parkingVsDropOffLeadFacts / equivalence", () => {
  it("lead facts are all data-backed", () => {
    const facts = parkingVsDropOffLeadFacts(parkingVsDropOffModel({ dropOff, parking })!);
    expect(facts.some((f) => f.includes("£10"))).toBe(true);
    expect(facts.some((f) => f.includes("£230"))).toBe(true);
    expect(facts.some((f) => f.includes("438 minutes"))).toBe(true);
  });
  it("equivalence line states the minutes-per-drop-off", () => {
    const line = parkingEquivalenceLine(parkingVsDropOffModel({ dropOff, parking })!, "London Gatwick");
    expect(line).toContain("438 minutes");
    expect(line).toContain("£10");
  });
});

describe("buildParkingVsDropOffFaqs", () => {
  it("leads with the park-or-drop-off question and cites the verified date", () => {
    const faqs = buildParkingVsDropOffFaqs(parkingVsDropOffModel({ dropOff, parking })!, dropOff, "London Gatwick");
    expect(faqs[0]?.question).toBe("Is it cheaper to park or get dropped off at London Gatwick?");
    expect(faqs[0]?.answer).toContain("2026-06-12");
  });
  it("includes the avoid-the-charge cross-sell only when a free alternative exists", () => {
    const faqs = buildParkingVsDropOffFaqs(parkingVsDropOffModel({ dropOff, parking })!, dropOff, "London Gatwick");
    expect(faqs.some((f) => f.question.includes("avoid"))).toBe(true);
    const noAlt = { ...dropOff, freeAlternative: null };
    const faqs2 = buildParkingVsDropOffFaqs(parkingVsDropOffModel({ dropOff, parking })!, noAlt, "London Gatwick");
    expect(faqs2.some((f) => f.question.includes("avoid"))).toBe(false);
  });
});

describe("decision-query title / H1 / description", () => {
  it("title contains the literal decision phrasing + the airport name", () => {
    const t = parkingVsDropOffDecisionTitle("London Stansted");
    expect(t).toContain("cheaper to park or get dropped off");
    expect(t).toContain("London Stansted");
  });
  it("H1 is the literal decision query for the airport", () => {
    const h1 = parkingVsDropOffDecisionH1("London Stansted");
    expect(h1).toBe("Is it cheaper to park or get dropped off at London Stansted?");
    expect(h1).toContain("cheaper to park or get dropped off");
  });
  it("description leads with the answer and contains BOTH £ figures", () => {
    const d = parkingVsDropOffDecisionDescription(parkingVsDropOffModel({ dropOff, parking })!, "London Gatwick");
    expect(d).toContain("£10"); // one drop-off
    expect(d).toContain("£230"); // 7-day drive-up parking
    expect(d).toContain("London Gatwick");
  });
});

describe("buildParkingVsDropOffHowToSteps", () => {
  it("returns >=3 steps, each with a non-empty name and text", () => {
    const steps = buildParkingVsDropOffHowToSteps(parkingVsDropOffModel({ dropOff, parking })!, dropOff, "London Gatwick");
    expect(steps.length).toBeGreaterThanOrEqual(3);
    for (const s of steps) {
      expect(s.name.trim().length).toBeGreaterThan(0);
      expect(s.text.trim().length).toBeGreaterThan(0);
    }
  });
  it("the parking step references the per-day rate or the minutes-equivalence figure", () => {
    const steps = buildParkingVsDropOffHowToSteps(parkingVsDropOffModel({ dropOff, parking })!, dropOff, "London Gatwick");
    const parkingStep = steps.find((s) => /parking for the trip/i.test(s.name));
    expect(parkingStep).toBeDefined();
    // £32.86 per 24h (perDay) and/or the 438-minute equivalence — both trace to the model.
    expect(/£32\.86|438 minutes/.test(parkingStep!.text)).toBe(true);
  });
  it("adds the 'avoid both' step only when a free alternative exists", () => {
    const withAlt = buildParkingVsDropOffHowToSteps(parkingVsDropOffModel({ dropOff, parking })!, dropOff, "London Gatwick");
    expect(withAlt.some((s) => /avoid both/i.test(s.name))).toBe(true);
    const noAlt = { ...dropOff, freeAlternative: null };
    const withoutAlt = buildParkingVsDropOffHowToSteps(parkingVsDropOffModel({ dropOff, parking })!, noAlt, "London Gatwick");
    expect(withoutAlt.some((s) => /avoid both/i.test(s.name))).toBe(false);
    expect(withoutAlt.length).toBeGreaterThanOrEqual(3);
  });
});

describe("parkingVsDropOffIndexSummary", () => {
  it("counts comparable airports and headlines the dearest drive-up park", () => {
    const s = parkingVsDropOffIndexSummary([
      { slug: "gatwick", name: "Gatwick", dropOffFeePence: 1000, parkingPence: 23000, parkingDays: 7, cheaperToday: "drop-off" },
      { slug: "manchester", name: "Manchester", dropOffFeePence: 500, parkingPence: 42980, parkingDays: 7, cheaperToday: "drop-off" }
    ]);
    expect(s).toContain("2 UK airports");
    expect(s).toContain("Manchester");
    expect(s).toContain("£429.80");
  });
  it("handles an empty list", () => {
    expect(parkingVsDropOffIndexSummary([])).toContain("don't yet have");
  });
});

describe("dropOffParkingBridge (drop-off → parking decision bridge)", () => {
  it("tier 1: carries the concrete comparison figure when the airport qualifies (charged drop-off + gate price)", () => {
    // gatwick: charged drop-off AND a verified 7-day drive-up gate price → full comparison bridge.
    const b = dropOffParkingBridge("gatwick");
    expect(b.show).toBe(true);
    expect(b.hasComparison).toBe(true);
    expect(b.hasParking).toBe(true);
    expect(b.affiliateOnly).toBe(false);
    expect(b.parkingDays).toBe(REFERENCE_DAYS);
    expect(b.parkingPence).not.toBeNull();
    expect(b.dropOffFeePence).not.toBeNull();
    expect(b.verifiedAt).not.toBeNull();
    // The figures are integer pence drawn from the dataset, never fabricated.
    expect(Number.isInteger(b.parkingPence!)).toBe(true);
    expect(Number.isInteger(b.dropOffFeePence!)).toBe(true);
  });

  it("tier 2: degrades to a plain onward link (no figure) for a FREE drop-off airport that still has a parking page", () => {
    // birmingham: free drop-off (excluded from comparison) but a parking page exists.
    const b = dropOffParkingBridge("birmingham");
    expect(b.show).toBe(true);
    expect(b.hasComparison).toBe(false);
    expect(b.hasParking).toBe(true);
    expect(b.affiliateOnly).toBe(false);
    // No fabricated comparison numbers when there is nothing honest to compare.
    expect(b.parkingPence).toBeNull();
    expect(b.dropOffFeePence).toBeNull();
    expect(b.verifiedAt).toBeNull();
  });

  it("tier 3 (de-gated funnel): surfaces an affiliate-only parking CTA for a CHARGED drop-off airport with no parking page", () => {
    // norwich: charged drop-off, no parking record — but a verified affiliate parking link resolves
    // (Holiday Extras' per-airport template), so the audience is funnelled onward via /go, not dead-ended.
    const b = dropOffParkingBridge("norwich");
    expect(b.show).toBe(true);
    expect(b.affiliateOnly).toBe(true);
    expect(b.hasComparison).toBe(false);
    expect(b.hasParking).toBe(false);
    // Still no fabricated price — we don't have an official tariff for this airport yet.
    expect(b.parkingPence).toBeNull();
    expect(b.dropOffFeePence).toBeNull();
    expect(b.verifiedAt).toBeNull();
  });

  it("renders nothing for a FREE drop-off airport with no parking page (no live park-or-drop-off decision)", () => {
    // inverness: free drop-off AND no parking record → no honest parking decision to surface → no bridge.
    const b = dropOffParkingBridge("inverness");
    expect(b.show).toBe(false);
    expect(b.affiliateOnly).toBe(false);
    expect(b.hasComparison).toBe(false);
    expect(b.hasParking).toBe(false);
    expect(b.parkingPence).toBeNull();
  });
});
