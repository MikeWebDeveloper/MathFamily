import { describe, expect, it } from "vitest";
import type { DropOffRecord, ParkingRecord } from "@mathfamily/data";
import { buildOptionRows, buildOptionsFaqs, optionsAnswer } from "../lib/options-content";

const dropOff: DropOffRecord = {
  airportSlug: "gatwick",
  isFree: false,
  feeSummary: "£10 for up to 10 minutes",
  bands: [{ upToMinutes: 10, totalPence: 1000 }],
  maxStayMinutes: 30,
  perMinuteAfterPence: 100,
  maxChargePence: 3000,
  penaltyPence: 10000,
  penaltyNotes: "£100 PCN",
  paymentDeadline: "Midnight the day after",
  blueBadgePolicy: "Exempt if registered in advance",
  freeAlternative: { name: "Long Stay car park", kind: "car-park", minutesFree: 120, details: "Free shuttle to the terminals." },
  priorYearFeePence: null,
  sourceUrl: "https://www.gatwickairport.com/drop-off",
  verifiedAt: "2026-06-22"
};

const parking: ParkingRecord = {
  airportSlug: "gatwick",
  products: [
    { name: "Long Stay (gate)", productType: "gate", prices: [{ days: 7, totalPence: 8900 }] }
  ],
  sourceUrl: "https://www.gatwickairport.com/parking",
  verifiedAt: "2026-06-22"
} as unknown as ParkingRecord;

describe("buildOptionRows", () => {
  it("always includes a drop-off row with the verified fee", () => {
    const rows = buildOptionRows(dropOff, null);
    const r = rows.find((x) => x.id === "drop-off");
    expect(r?.costBasis).toBe("£10 per drop-off");
    expect(r?.source).toBe("official");
  });
  it("includes the free-alternative row only when the dataset has one", () => {
    expect(buildOptionRows(dropOff, null).some((r) => r.id === "free-alternative")).toBe(true);
    expect(buildOptionRows({ ...dropOff, freeAlternative: null }, null).some((r) => r.id === "free-alternative")).toBe(false);
  });
  it("frames a public-transport free alternative as 'no car / solo traveller', not minutes", () => {
    const transit = { ...dropOff, freeAlternative: { name: "DLR", kind: "public-transport" as const, minutesFree: null, details: "Train to terminal." } };
    const r = buildOptionRows(transit, null).find((x) => x.id === "free-alternative");
    expect(r?.whenItWins).toMatch(/no car|solo traveller/i);
  });
  it("includes the gate-parking row only when a verified 7-day gate price exists", () => {
    expect(buildOptionRows(dropOff, parking).some((r) => r.id === "gate-parking")).toBe(true);
    expect(buildOptionRows(dropOff, null).some((r) => r.id === "gate-parking")).toBe(false);
  });
  it("ALWAYS appends Park & Ride and Meet & Greet rows with NO fabricated price (affiliate, dormant)", () => {
    const rows = buildOptionRows(dropOff, parking);
    const pr = rows.find((r) => r.id === "park-and-ride");
    const mg = rows.find((r) => r.id === "meet-and-greet");
    expect(pr?.costBasis).toBeNull();
    expect(pr?.source).toBe("affiliate");
    expect(mg?.costBasis).toBeNull();
    expect(mg?.source).toBe("affiliate");
  });
});

describe("optionsAnswer", () => {
  it("leads with the verified drop-off fee and never asserts a pre-book price", () => {
    const a = optionsAnswer(dropOff, parking, "London Gatwick");
    expect(a).toContain("£10");
    expect(a).toContain("Long Stay car park");
    expect(a).toContain("£89 for 7 days");
    // No fabricated pre-book figure: "from £<number>" must never appear (the honest disclaimer
    // string "from £X" with a literal X is fine).
    expect(a).not.toMatch(/from £\d/i);
  });
  it("frees airports read as free", () => {
    const free = { ...dropOff, isFree: true, bands: [] };
    expect(optionsAnswer(free, null, "Birmingham")).toContain("free at the forecourt");
  });
});

describe("buildOptionsFaqs", () => {
  it("answers the cheapest-way question from verified data", () => {
    const faqs = buildOptionsFaqs(dropOff, parking, "London Gatwick");
    expect(faqs[0]?.question).toContain("cheapest way");
    expect(faqs[0]?.answer).toContain("Verified 2026-06-22");
  });
  it("explains Meet & Greet vs Park & Ride without quoting an unverifiable price", () => {
    const faqs = buildOptionsFaqs(dropOff, parking, "London Gatwick");
    const mg = faqs.find((f) => /Meet & Greet or Park & Ride/i.test(f.question));
    expect(mg?.answer).toMatch(/never quote a price we can't verify/i);
    expect(mg?.answer).not.toMatch(/from £/i);
  });
});
