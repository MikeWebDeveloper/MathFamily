import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { STALE_AFTER_DAYS } from "@mathfamily/engine";
import { dropOffVerifiedSentence, pageDates } from "../lib/page-dates";

const NOW = new Date("2026-11-20T09:00:00Z");

describe("pageDates", () => {
  it("never shows a newer news item's date as the record's verified date (Stansted, Nov 2026)", () => {
    // The £10 charge was last checked 3 Sep; a news item on the page was checked 17 Oct. The page
    // said "verified on 17 October" and the 78-day-old figure lost its stale label.
    const d = pageDates("2026-09-03", "2026-10-17", NOW);
    expect(d.verifiedAt).toBe("2026-09-03");
    expect(d.dateModified).toBe("2026-10-17");
    expect(d.stale).toBe(true);
  });
  it("uses the record's date for both when there is no newer news item", () => {
    expect(pageDates("2026-10-07", undefined, NOW)).toEqual({ verifiedAt: "2026-10-07", dateModified: "2026-10-07", stale: false });
    expect(pageDates("2026-10-07", "2026-09-01", NOW).dateModified).toBe("2026-10-07");
  });
  it("goes stale exactly where the engine's warning and the FreshnessBadge do", () => {
    const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString().slice(0, 10);
    expect(pageDates(daysAgo(STALE_AFTER_DAYS), null, NOW).stale).toBe(false);
    expect(pageDates(daysAgo(STALE_AFTER_DAYS + 1), null, NOW).stale).toBe(true);
  });
  it("treats an unreadable date as stale", () => {
    expect(pageDates("not-a-date", null, NOW).stale).toBe(true);
  });
});

describe("dropOffVerifiedSentence", () => {
  it("says the figure is current only while it is inside the freshness window", () => {
    const fresh = dropOffVerifiedSentence("Leeds Bradford", "Leeds Bradford Airport", pageDates("2026-10-07", null, NOW));
    expect(fresh).toBe(
      "Yes, this is current information: Leeds Bradford Airport's drop-off charge was verified on 7 October 2026 against the official Leeds Bradford Airport page."
    );
  });
  it("drops the 'current' claim and points to the official page once stale", () => {
    const stale = dropOffVerifiedSentence("Stansted", "London Stansted Airport", pageDates("2026-09-03", "2026-10-17", NOW));
    expect(stale).not.toContain("current information");
    expect(stale).toContain("last verified on 3 September 2026");
    expect(stale).not.toContain("17 October");
    expect(stale).toContain("check the official London Stansted Airport page before you travel");
  });
});

describe("airport pages that show news keep the two dates apart", () => {
  // Source guard: every route that mixes a news item into the page must take its dates from
  // pageDates(), so a "Verified" badge can't drift back to the news date.
  const routes = ["drop-off-charges", "blue-badge", "avoid-drop-off-charge", "parking-vs-drop-off"];
  for (const route of routes) {
    it(route, () => {
      const src = readFileSync(join(__dirname, `../app/${route}/[airport]/page.tsx`), "utf8");
      expect(src).toContain("newsForAirport");
      expect(src).toContain("pageDates(");
      expect(src).not.toMatch(/FreshnessBadge verifiedAt=\{(?!dates\.verifiedAt\})/);
      expect(src).not.toContain("pageVerifiedAt");
    });
  }
});
