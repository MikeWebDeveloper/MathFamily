import { describe, expect, it } from "vitest";
import { buildWatchlist } from "../src/watchlist";
import { loadNewsSources } from "../src/news-sources";

describe("news sources in watchlist", () => {
  it("loadNewsSources returns the curated sources", () => {
    const f = loadNewsSources();
    expect(f.sources.length).toBeGreaterThan(0);
    for (const s of f.sources) expect(s.url).toMatch(/^https:\/\//);
  });
  it("buildWatchlist includes a news:<airport> entry for each news source", () => {
    const list = buildWatchlist(new Date("2026-06-12T00:00:00Z"));
    const sources = loadNewsSources().sources;
    for (const s of sources) {
      const entry = list.entries.find((e) => e.url === s.url && e.refs.includes(`news:${s.airportSlug}`));
      expect(entry, `missing news entry for ${s.airportSlug}`).toBeDefined();
    }
  });
});
