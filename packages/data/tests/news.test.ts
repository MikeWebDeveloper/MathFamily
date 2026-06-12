import { describe, expect, it } from "vitest";
import { NewsItemSchema, NewsDatasetSchema, loadNewsDataset, newsForAirport, recentNews, newsById } from "../src/news";

const item = {
  id: "heathrow-dropoff-fee-jun-2026", airportSlug: "heathrow", category: "fee-change",
  title: "Heathrow drop-off rises to £7", summary: "Heathrow raised its forecourt drop-off charge to £7.",
  body: null, change: { label: "Drop-off charge", from: "£6", to: "£7" },
  sourceUrl: "https://www.heathrow.com/transport-and-directions/dropping-off",
  sourceLabel: "Heathrow official", publishedAt: "2026-06-01", verifiedAt: "2026-06-02", supersedes: null
} as const;

describe("NewsItemSchema", () => {
  it("accepts a well-formed item", () => { expect(() => NewsItemSchema.parse(item)).not.toThrow(); });
  it("rejects a non-http source", () => { expect(() => NewsItemSchema.parse({ ...item, sourceUrl: "ftp://x" })).toThrow(); });
  it("rejects an unknown category", () => { expect(() => NewsItemSchema.parse({ ...item, category: "gossip" })).toThrow(); });
});

describe("loaders", () => {
  it("real dataset parses and every item has an official source + verified date + unique id", () => {
    const ds = loadNewsDataset();
    NewsDatasetSchema.parse(ds);
    const ids = new Set<string>();
    for (const i of ds.items) {
      expect(i.sourceUrl).toMatch(/^https?:\/\//);
      expect(i.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(ids.has(i.id), `duplicate id ${i.id}`).toBe(false);
      ids.add(i.id);
    }
  });
  it("newsById returns null for a missing id", () => { expect(newsById("nope-nope")).toBeNull(); });
  it("recentNews + newsForAirport return arrays", () => {
    expect(Array.isArray(recentNews(5))).toBe(true);
    expect(Array.isArray(newsForAirport("heathrow", 3))).toBe(true);
  });
});
