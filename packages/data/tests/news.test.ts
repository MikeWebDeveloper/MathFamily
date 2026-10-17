import { describe, expect, it } from "vitest";
import {
  NewsItemSchema,
  NewsDatasetSchema,
  currentNews,
  loadNewsDataset,
  newsById,
  newsForAirport,
  recentNews,
  supersededBy,
  withoutSuperseded,
  type NewsItem
} from "../src/news";

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

describe("supersedes", () => {
  const base = { ...item, change: null } as NewsItem;
  const old = { ...base, id: "luton-old", airportSlug: "luton", publishedAt: "2026-06-12" };
  const replacement = { ...base, id: "luton-new", airportSlug: "luton", publishedAt: "2026-10-07", supersedes: "luton-old" };
  const unrelated = { ...base, id: "bristol-x", airportSlug: "bristol", publishedAt: "2026-01-02" };

  it("withoutSuperseded drops only items a newer item explicitly replaces", () => {
    expect(withoutSuperseded([old, replacement, unrelated]).map((i) => i.id)).toEqual(["luton-new", "bristol-x"]);
  });
  it("withoutSuperseded keeps everything when nothing is superseded", () => {
    expect(withoutSuperseded([old, unrelated])).toHaveLength(2);
  });

  // Real dataset: Luton's June "£7 for 10 minutes" item is replaced by the October "£9 for 12 minutes" one.
  it("newsForAirport (the Latest-at boxes) leaves out superseded items", () => {
    const ids = newsForAirport("luton").map((i) => i.id);
    expect(ids).not.toContain("luton-dropoff-zone-jun-2026");
    expect(ids[0]).toBe("luton-fee-change-oct-2026");
  });
  it("currentNews leaves superseded items out, recentNews (the /news archive) keeps them", () => {
    expect(currentNews().map((i) => i.id)).not.toContain("luton-dropoff-zone-jun-2026");
    expect(recentNews().map((i) => i.id)).toContain("luton-dropoff-zone-jun-2026");
  });
  it("supersededBy finds the replacing item, or null", () => {
    expect(supersededBy("luton-dropoff-zone-jun-2026")?.id).toBe("luton-fee-change-oct-2026");
    expect(supersededBy("luton-fee-change-oct-2026")).toBeNull();
  });
  it("every supersedes points at an existing, older item for the same airport", () => {
    const items = loadNewsDataset().items;
    for (const i of items.filter((x) => x.supersedes)) {
      const target = items.find((x) => x.id === i.supersedes);
      expect(target, `${i.id} supersedes missing ${i.supersedes}`).toBeDefined();
      expect(target!.airportSlug).toBe(i.airportSlug);
      expect(target!.publishedAt <= i.publishedAt).toBe(true);
    }
  });
});
