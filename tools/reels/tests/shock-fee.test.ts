import { describe, it, expect } from "vitest";
import { pickShockFeeRecord, buildShockFeeReel } from "../src/formats/shock-fee";
import { ReelScriptSchema } from "../src/schema";
import type { DropOffRecord, Airport } from "@mathfamily/data";

const airport: Airport = { name: "Stansted", slug: "stansted", iata: "STN", region: "East", lat: 51.88, lng: 0.24 };
const record: DropOffRecord = {
  airportSlug: "stansted", isFree: false, feeSummary: "£7 for 15 min",
  bands: [{ upToMinutes: 15, totalPence: 700 }],
  maxStayMinutes: 15, perMinuteAfterPence: null, maxChargePence: null,
  penaltyPence: null, penaltyNotes: null, paymentDeadline: null,
  blueBadgePolicy: "Same as standard",
  freeAlternative: { name: "Mid Stay car park", minutesFree: 60, details: "Free for 60 min" },
  priorYearFeePence: 600, sourceUrl: "https://www.stanstedairport.com/x", verifiedAt: "2026-06-14"
};
const cheaper: DropOffRecord = { ...record, airportSlug: "luton", bands: [{ upToMinutes: 10, totalPence: 500 }], feeSummary: "£5" };
const lutonAirport: Airport = { ...airport, name: "Luton", slug: "luton", iata: "LTN" };

describe("shock-fee builder", () => {
  it("picks the highest-fee eligible record (has a fee + a free alternative)", () => {
    const picked = pickShockFeeRecord([cheaper, record]);
    expect(picked.airportSlug).toBe("stansted");
  });
  it("builds a valid ReelScript that names the free alternative and the fee", () => {
    const script = buildShockFeeReel(record, airport);
    expect(() => ReelScriptSchema.parse(script)).not.toThrow();
    expect(script.format).toBe("shock-fee");
    expect(script.figures.find((f) => f.id === "fee")?.pence).toBe(700);
    expect(script.narration).toContain("£7");
    expect(script.narration).toContain("Mid Stay car park");
    expect(script.narration).toContain("parkmath.co.uk");
  });
  it("ignores free airports and those without a free alternative", () => {
    const free: DropOffRecord = { ...record, airportSlug: "cardiff", isFree: true, bands: [] };
    const noAlt: DropOffRecord = { ...record, airportSlug: "leeds", freeAlternative: null };
    expect(() => pickShockFeeRecord([free, noAlt])).toThrow(/no eligible/i);
  });
});
