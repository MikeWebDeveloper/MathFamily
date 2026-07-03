import { describe, expect, it } from "vitest";
import type { DropOffRecord, ParkingRecord } from "@mathfamily/data";
import {
  REFERENCE_DAYS,
  buildParkingVsDropOffFaqs,
  dropOffCalculatorBridge,
  dropOffCalculatorBridgeLine,
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
    // (Tranche 3, 2026-07-03: Inverness's official Long Stay tariff was researched but SKIPPED — it only
    // publishes banded rates from 4 days upward, with no 1-3 day figure and no backward-applicable per-day
    // rate to derive one honestly — so this airport genuinely still has no parking record.)
    const b = dropOffParkingBridge("inverness");
    expect(b.show).toBe(false);
    expect(b.affiliateOnly).toBe(false);
    expect(b.hasComparison).toBe(false);
    expect(b.hasParking).toBe(false);
    expect(b.parkingPence).toBeNull();
  });

  it("tier 1 (tranche 3, 2026-07-03): aberdeen now carries the comparison figure from its newly-verified gate tariff", () => {
    // aberdeen: charged drop-off (£7 Express Drop Off) + newly-added verified 7-day drive-up gate price
    // (£125.00, Long Stay Turn Up) → full comparison bridge, same shape as the gatwick tier-1 case.
    const b = dropOffParkingBridge("aberdeen");
    expect(b.show).toBe(true);
    expect(b.hasComparison).toBe(true);
    expect(b.hasParking).toBe(true);
    expect(b.affiliateOnly).toBe(false);
    expect(b.parkingDays).toBe(REFERENCE_DAYS);
    // Exact figures traced to the dataset: the GATE price only (12500p = £125.00), never the cheaper
    // pre-book snapshot — the comparison bridge intentionally uses the drive-up ceiling, not a "from" price.
    expect(b.parkingPence).toBe(12500);
    expect(b.dropOffFeePence).toBe(700);
  });

  it("tier 1 (tranche 3, 2026-07-03): belfast-international now carries the comparison figure from its newly-verified gate tariff", () => {
    // belfast-international: charged drop-off (£5 Drop Off Zone) + newly-added verified 7-day drive-up
    // gate price (£95.00, computed from the official £55 3-day base + 4x£10/day) → full comparison bridge.
    const b = dropOffParkingBridge("belfast-international");
    expect(b.show).toBe(true);
    expect(b.hasComparison).toBe(true);
    expect(b.parkingPence).toBe(9500);
    expect(b.dropOffFeePence).toBe(500);
  });
});

describe("dropOffCalculatorBridge (above-the-fold £X-vs-£Y teaser, tranche 2 item 7)", () => {
  it("shows for a charging airport with a verified gate parking tariff and a live merchant (gatwick)", () => {
    const b = dropOffCalculatorBridge("gatwick");
    expect(b.show).toBe(true);
    expect(b.dropOffFeePence).not.toBeNull();
    expect(b.parkingFromPence).not.toBeNull();
    expect(Number.isInteger(b.dropOffFeePence!)).toBe(true);
    expect(Number.isInteger(b.parkingFromPence!)).toBe(true);
    // The "from" price can never exceed the drive-up gate price (it's the cheapest verified option).
    expect(b.parkingDays).toBe(REFERENCE_DAYS);
    expect(b.ctaHref).toBe(`/go/gatwick/parking?s=dropoffbridge`);
  });

  it("fails closed for a FREE drop-off airport, even though it has a parking page (birmingham)", () => {
    // Unlike the lower DropOffParkingBridge (which degrades to a plain onward link for tier 2), this
    // compact bridge only ever shows the £X-vs-£Y figure — with no drop-off fee there is no honest
    // "One drop-off costs £X" to state, so it renders nothing rather than a half-true line.
    const b = dropOffCalculatorBridge("birmingham");
    expect(b.show).toBe(false);
    expect(b.dropOffFeePence).toBeNull();
    expect(b.parkingFromPence).toBeNull();
    expect(b.ctaHref).toBe("");
  });

  it("fails closed for a charging airport with no parking tariff at all (belfast-city)", () => {
    // belfast-city: charged drop-off, but its official Long Stay page states the drive-up daily rate is
    // shown only on physical drive-up boards (never published online) — researched and SKIPPED 2026-07-03
    // (tranche 3) rather than guessed. (prestwick, the previous example here, was verified this same
    // tranche and now has a real record — see the tier-1/calculator tests below.)
    const b = dropOffCalculatorBridge("belfast-city");
    expect(b.show).toBe(false);
    expect(b.ctaHref).toBe("");
  });

  it("fails closed for an unknown slug", () => {
    const b = dropOffCalculatorBridge("not-a-real-airport");
    expect(b.show).toBe(false);
  });

  it("tranche 3 (2026-07-03): shows for prestwick using its newly-verified gate tariff", () => {
    const b = dropOffCalculatorBridge("prestwick");
    expect(b.show).toBe(true);
    expect(b.dropOffFeePence).toBe(450);
    // Car Park Two 7-day gate price (REFERENCE_DAYS), no pre-book snapshot on file → "from" equals the
    // gate price itself, not the 3-day (6650) or 14-day (16000) figure.
    expect(b.parkingFromPence).toBe(10350);
    expect(b.parkingDays).toBe(REFERENCE_DAYS);
    expect(b.ctaHref).toBe(`/go/prestwick/parking?s=dropoffbridge`);
  });

  it("tranche 3 (2026-07-03): aberdeen's 'from' price is the cheaper PRE-BOOK snapshot, not the pricier gate rate", () => {
    // Aberdeen has BOTH a gate price (12500p, £125.00) and a same-duration pre-book snapshot (4999p,
    // £49.99). compareParking sorts by totalPence, so "cheapest" (what the compact bridge shows) is the
    // pre-book snapshot — proving this bridge never silently shows the more expensive gate ceiling when a
    // genuinely cheaper verified option exists for the same 7-day duration.
    const b = dropOffCalculatorBridge("aberdeen");
    expect(b.show).toBe(true);
    expect(b.parkingFromPence).toBe(4999);
    expect(b.dropOffFeePence).toBe(700);
    expect(b.ctaHref).toBe(`/go/aberdeen/parking?s=dropoffbridge`);
  });
});

describe("dropOffCalculatorBridgeLine", () => {
  it("renders the exact 'One drop-off costs £X — N days of parking from £Y.' shape when the bridge shows", () => {
    const line = dropOffCalculatorBridgeLine(dropOffCalculatorBridge("gatwick"));
    expect(line).not.toBeNull();
    expect(line).toMatch(/^One drop-off costs £[\d.]+ — 7 days of parking from £[\d.]+\.$/);
  });

  it("returns null when the bridge doesn't show (never renders a half-true line)", () => {
    expect(dropOffCalculatorBridgeLine(dropOffCalculatorBridge("birmingham"))).toBeNull();
  });
});
