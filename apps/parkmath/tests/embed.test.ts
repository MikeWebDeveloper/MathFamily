import { describe, expect, it } from "vitest";
import {
  buildEmbedWidgetHtml,
  buildIframeSnippet,
  buildScriptSnippet,
  escapeHtml,
  formatVerifiedDate
} from "../lib/embed";
import type { LeagueEntry } from "../lib/content";

const league: LeagueEntry[] = [
  { airportSlug: "london-city", name: "London City", feePence: 800, minutes: 5, perMinutePence: 160, isFree: false, isPerEntry: false },
  { airportSlug: "stansted", name: "Stansted", feePence: 1000, minutes: 15, perMinutePence: 1000 / 15, isFree: false, isPerEntry: false },
  { airportSlug: "heathrow", name: "Heathrow", feePence: 700, minutes: 0, perMinutePence: null, isFree: false, isPerEntry: true },
  { airportSlug: "cardiff", name: "Cardiff", feePence: 0, minutes: 0, perMinutePence: null, isFree: true, isPerEntry: false }
];

const opts = { siteUrl: "https://parkmath.co.uk", league, verifiedAt: "2026-06-10" };

describe("escapeHtml", () => {
  it("escapes the dangerous characters", () => {
    expect(escapeHtml(`<a href="x">&'`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&#39;");
  });
});

describe("formatVerifiedDate", () => {
  it("formats an ISO date as a UK long date", () => {
    expect(formatVerifiedDate("2026-06-10")).toBe("10 June 2026");
  });
  it("falls back to the raw string when unparseable", () => {
    expect(formatVerifiedDate("not-a-date")).toBe("not-a-date");
  });
});

describe("buildEmbedWidgetHtml — full table", () => {
  const html = buildEmbedWidgetHtml(opts);

  it("is a complete self-contained document with inline styles and no external assets", () => {
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain("<style>");
    expect(html).not.toMatch(/<link[^>]+stylesheet/);
    expect(html).not.toMatch(/src="https?:\/\/(?!parkmath)/); // no third-party scripts/images
  });

  it("always carries an attribution link back to ParkMath's Price Index (the canonical citable asset)", () => {
    expect(html).toContain('href="https://parkmath.co.uk/drop-off-charges/price-index"');
    expect(html).toContain("ParkMath");
  });

  it("renders every airport row with a real fee (no fabricated numbers)", () => {
    expect(html).toContain("London City");
    expect(html).toContain("Stansted");
    expect(html).toContain("Heathrow");
    expect(html).toContain("Free"); // the free airport renders honestly, not as £0
    expect(html).toContain("£8"); // London City headline fee (formatPence drops .00 for whole £)
  });

  it("shows the verified date and a per-minute figure for time-based charges", () => {
    expect(html).toContain("10 June 2026");
    expect(html).toContain("/min");
  });

  it("includes the resize beacon so the script embed can auto-fit", () => {
    expect(html).toContain("parkmath-embed-height");
  });
});

describe("buildEmbedWidgetHtml — single airport card", () => {
  it("renders just that airport's fee when a valid slug is given", () => {
    const html = buildEmbedWidgetHtml({ ...opts, airportSlug: "stansted" });
    expect(html).toContain("£10");
    expect(html).toContain("Stansted");
    expect(html).not.toContain("London City"); // not the whole table
    expect(html).toContain('href="https://parkmath.co.uk/drop-off-charges/price-index"');
  });

  it("falls back to the full table when the slug is unknown", () => {
    const html = buildEmbedWidgetHtml({ ...opts, airportSlug: "nope" });
    expect(html).toContain("London City");
    expect(html).toContain("Stansted");
  });
});

describe("snippets", () => {
  it("the iframe snippet points at the embed route and carries a title", () => {
    const s = buildIframeSnippet("https://parkmath.co.uk");
    expect(s).toContain('src="https://parkmath.co.uk/embed/drop-off-charges"');
    expect(s).toContain("<iframe");
    expect(s).toContain('title="UK airport drop-off charges — ParkMath"');
  });

  it("the single-airport iframe snippet uses the path-based variant", () => {
    const s = buildIframeSnippet("https://parkmath.co.uk", "stansted");
    expect(s).toContain("/embed/drop-off-charges/stansted");
    expect(s).not.toContain("?airport="); // path, not query (a query can't vary a static route)
  });

  it("the script snippet wires the postMessage height listener", () => {
    const s = buildScriptSnippet("https://parkmath.co.uk");
    expect(s).toContain("parkmath-embed-height");
    expect(s).toContain('id="parkmath-embed"');
  });
});
