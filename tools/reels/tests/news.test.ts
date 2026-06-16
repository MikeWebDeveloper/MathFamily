import { describe, it, expect } from "vitest";
import { buildNewsReel } from "../src/formats/news";
import { ReelScriptSchema } from "../src/schema";
import type { NewsItem, Airport } from "@mathfamily/data";

const airport: Airport = { name: "Luton", slug: "luton", iata: "LTN", region: "East", lat: 51.87, lng: -0.36 };
const item: NewsItem = {
  id: "luton-dropoff-jun-2026", airportSlug: "luton", category: "fee-change",
  title: "Luton raises drop-off to £6", summary: "Up from £5.",
  body: null, change: { label: "Drop-off", from: "£5", to: "£6" },
  sourceUrl: "https://www.london-luton.co.uk/x", sourceLabel: "Luton Airport",
  publishedAt: "2026-06-12", verifiedAt: "2026-06-14", supersedes: null
};

describe("news builder", () => {
  it("builds a valid ReelScript from a news change", () => {
    const script = buildNewsReel(item, airport);
    expect(() => ReelScriptSchema.parse(script)).not.toThrow();
    expect(script.format).toBe("news");
    expect(script.narration).toContain("£6");
    expect(script.narration).toContain("Quietly"); // calm-authority voice (Route B)
    expect(script.narration).toContain("parkmath.co.uk");
  });
  it("throws on a news item with no quantified change (nothing to show)", () => {
    expect(() => buildNewsReel({ ...item, change: null }, airport)).toThrow(/change/i);
  });
});
