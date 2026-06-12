import { describe, expect, it } from "vitest";
import { newsId, isDuplicateNews, mergeNewsItems, refsWithPrefix } from "../src/news-extract";
import type { NewsItem, NewsDataset } from "@mathfamily/data";

const base: NewsItem = {
  id: "bristol-dropoff-fee-jan-2026", airportSlug: "bristol", category: "fee-change",
  title: "Bristol raises drop-off to £8.50", summary: "Now £8.50.", body: null,
  change: { label: "Drop-off", from: "£7", to: "£8.50" },
  sourceUrl: "https://www.bristolairport.co.uk/x", sourceLabel: "Bristol",
  publishedAt: "2026-01-02", verifiedAt: "2026-06-12", supersedes: null
};

describe("news-extract", () => {
  it("newsId builds a stable kebab slug with month-year", () => {
    expect(newsId("bristol", "dropoff-fee", "2026-01-02")).toBe("bristol-dropoff-fee-jan-2026");
    expect(newsId(null, "uk-strike", "2025-12-15")).toBe("uk-uk-strike-dec-2025");
  });
  it("isDuplicateNews flags same airport + same change", () => {
    expect(isDuplicateNews([base], { airportSlug: "bristol", title: "Bristol raises drop-off to £8.50", change: base.change })).toBe(true);
    expect(isDuplicateNews([base], { airportSlug: "gatwick", title: "x", change: null })).toBe(false);
  });
  it("refsWithPrefix extracts the suffixes for a prefix", () => {
    expect(refsWithPrefix(["news:bristol", "drop-off:gatwick", "news:luton"], "news:")).toEqual(["bristol", "luton"]);
  });
  it("mergeNewsItems appends non-duplicates, stamps verifiedAt, bumps lastUpdated, stays valid", () => {
    const ds: NewsDataset = { version: "1.0.0", lastUpdated: "2026-06-10", items: [base] };
    const merged = mergeNewsItems(ds, [
      { airportSlug: "bristol", category: "fee-change", title: "Bristol raises drop-off to £8.50", summary: "dup", change: base.change, sourceUrl: base.sourceUrl, sourceLabel: "Bristol", publishedAt: "2026-01-02" },
      { airportSlug: "luton", category: "drop-off-zone", title: "Luton ANPR live", summary: "New ANPR.", change: null, sourceUrl: "https://www.london-luton.co.uk/x", sourceLabel: "Luton", publishedAt: "2026-05-01" }
    ], "2026-06-12");
    expect(merged.items).toHaveLength(2);           // Bristol dup skipped, Luton added
    expect(merged.lastUpdated).toBe("2026-06-12");
    const luton = merged.items.find((i) => i.airportSlug === "luton")!;
    expect(luton.verifiedAt).toBe("2026-06-12");
    expect(luton.id).toBe("luton-drop-off-zone-may-2026");
    expect(luton.supersedes).toBeNull();
  });
});
