import { describe, it, expect } from "vitest";
import { ledgerId, landingUrlFor, ledgerEntryFor, recentSlugs, type LedgerEntry } from "../src/ledger";
import type { ReelScript } from "../src/schema";

const script: ReelScript = {
  version: "1", brand: "parkmath", format: "shock-fee", slug: "gatwick",
  figures: [{ id: "fee", label: "Fee", pence: 1000 }],
  scenes: [
    { kind: "intro", onScreenText: "a", figureIds: [], durationHintMs: 1000 },
    { kind: "cta", onScreenText: "parkmath.co.uk", figureIds: [], durationHintMs: 1000 }
  ],
  narration: "It costs £10 at Gatwick. parkmath.co.uk.",
  captions: ["£10 to drop off at Gatwick"],
  cta: "parkmath.co.uk",
  sourceUrl: "https://www.gatwickairport.com/x", verifiedAt: "2026-06-10"
};

describe("ledger", () => {
  it("builds a deterministic id", () => {
    expect(ledgerId(script, "2026-06-16")).toBe("parkmath-shock-fee-gatwick-20260616");
  });

  it("builds a first-party UTM landing url (no affiliate link)", () => {
    const url = landingUrlFor(script, "2026-06-16");
    expect(url).toContain("https://parkmath.co.uk/drop-off-charges/gatwick?");
    expect(url).toContain("utm_source=social");
    expect(url).toContain("utm_medium=reel");
    expect(url).toContain("utm_campaign=gatwick-202606");
    expect(url).toContain("utm_content=parkmath-shock-fee-gatwick-20260616");
    expect(url).not.toMatch(/awin/i);
  });

  it("maps format to the right on-site path", () => {
    expect(landingUrlFor({ ...script, format: "how-to" }, "2026-06-16")).toContain("/airport-parking/gatwick");
    expect(landingUrlFor({ ...script, format: "news", slug: "bristol" }, "2026-06-16")).toContain("/news/bristol");
  });

  it("ledgerEntryFor captures the hook + status", () => {
    const e = ledgerEntryFor(script, "2026-06-16");
    expect(e.id).toBe("parkmath-shock-fee-gatwick-20260616");
    expect(e.hook).toBe("£10 to drop off at Gatwick");
    expect(e.status).toBe("generated");
    expect(e.utmCampaign).toBe("gatwick-202606");
  });

  it("recentSlugs only returns slugs inside the window", () => {
    const entries: LedgerEntry[] = [
      ledgerEntryFor(script, "2026-06-15"),
      ledgerEntryFor({ ...script, slug: "luton" }, "2026-05-01")
    ];
    const recent = recentSlugs(entries, 14, "2026-06-16");
    expect(recent.has("gatwick")).toBe(true);
    expect(recent.has("luton")).toBe(false); // 46 days ago — outside the window
  });
});
