import { describe, it, expect } from "vitest";
import { gatePrebookSaving, buildHowToReel } from "../src/formats/how-to";
import { ReelScriptSchema } from "../src/schema";
import type { ParkingRecord, Airport } from "@mathfamily/data";

const airport: Airport = { name: "Gatwick", slug: "gatwick", iata: "LGW", region: "South", lat: 51.15, lng: -0.18 };
const record: ParkingRecord = {
  airportSlug: "gatwick",
  products: [
    { productType: "gate", name: "Drive-up", prices: [{ days: 7, totalPence: 12000 }], snapshotDate: null, notes: null },
    { productType: "prebook", name: "Long Stay", prices: [{ days: 7, totalPence: 7000 }], snapshotDate: "2026-06-10", notes: null }
  ],
  sourceUrl: "https://www.gatwickairport.com/x", verifiedAt: "2026-06-14"
};

describe("how-to builder", () => {
  it("computes gate-vs-prebook saving for a duration", () => {
    expect(gatePrebookSaving(record, 7)).toEqual({ gatePence: 12000, prebookPence: 7000, savingPence: 5000 });
  });
  it("returns null when a duration has no gate or no prebook price", () => {
    expect(gatePrebookSaving(record, 3)).toBeNull();
  });
  it("builds a valid ReelScript led by the saving", () => {
    const script = buildHowToReel(record, airport, 7);
    expect(() => ReelScriptSchema.parse(script)).not.toThrow();
    expect(script.format).toBe("how-to");
    expect(script.figures.find((f) => f.id === "saving")?.pence).toBe(5000);
    expect(script.narration).toContain("£50");
    expect(script.narration).toContain("Same tarmac"); // the sticky payoff line (Route C)
    expect(script.narration).toContain("parkmath.co.uk");
  });
});
