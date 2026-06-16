import { describe, it, expect } from "vitest";
import { buildDigest, type ReachRow } from "../src/digest";
import { ledgerEntryFor } from "../src/ledger";
import type { ReelScript } from "../src/schema";

const mk = (slug: string, format: ReelScript["format"]): ReelScript => ({
  version: "1", brand: "parkmath", format, slug,
  figures: [{ id: "f", label: "f", pence: 100 }],
  scenes: [
    { kind: "intro", onScreenText: "a", figureIds: [], durationHintMs: 1000 },
    { kind: "cta", onScreenText: "parkmath.co.uk", figureIds: [], durationHintMs: 1000 }
  ],
  narration: "x parkmath.co.uk", captions: ["hook"], cta: "parkmath.co.uk",
  sourceUrl: "https://www.gatwickairport.com/x", verifiedAt: "2026-06-10"
});

const ledger = [
  ledgerEntryFor(mk("gatwick", "shock-fee"), "2026-06-10"),
  ledgerEntryFor(mk("glasgow", "how-to"), "2026-06-10"),
  ledgerEntryFor(mk("bristol", "news"), "2026-06-10")
];

describe("buildDigest", () => {
  it("ranks performers by visitors (matched on utm_campaign)", () => {
    const reach: ReachRow[] = [
      { key: "glasgow-202606", visitors: 500 },
      { key: "gatwick-202606", visitors: 100 }
    ];
    const d = buildDigest(ledger, reach);
    expect(d.performers[0]?.slug).toBe("glasgow");
    expect(d.totalVisitors).toBe(600);
    expect(d.boostFormats[0]).toBe("how-to");
    expect(d.boostSlugs).toContain("glasgow");
    expect(d.boostSlugs).not.toContain("bristol"); // 0 visitors
  });

  it("falls back to landing-path match (Cloudflare path keys)", () => {
    const reach: ReachRow[] = [{ key: "/airport-parking/glasgow", visitors: 42 }];
    const d = buildDigest(ledger, reach);
    expect(d.performers.find((p) => p.slug === "glasgow")?.visitors).toBe(42);
  });

  it("no analytics → safe recommendation, no boosts", () => {
    const d = buildDigest(ledger, []);
    expect(d.totalVisitors).toBe(0);
    expect(d.boostSlugs).toEqual([]);
    expect(d.recommendation).toMatch(/no analytics/i);
  });
});
