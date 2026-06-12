import { describe, expect, it } from "vitest";
import { selectEntries, isNewsEntry, isCostEntry } from "../src/watchdog";
import type { Watchlist } from "../src/watchlist";

const list: Watchlist = { generatedAt: "2026-06-12", entries: [
  { url: "https://a/cost", refs: ["drop-off:gatwick"], watchable: true },
  { url: "https://b/news", refs: ["news:bristol"], watchable: true },
  { url: "https://c/dual", refs: ["drop-off:luton", "news:luton"], watchable: true },
] };

it("cost mode = cost-only + dual; news mode = news-only + dual", () => {
  const cost = selectEntries(list, "cost").map((e) => e.url);
  const news = selectEntries(list, "news").map((e) => e.url);
  expect(cost).toEqual(["https://a/cost", "https://c/dual"]);
  expect(news).toEqual(["https://b/news", "https://c/dual"]);
});
it("predicates", () => {
  expect(isNewsEntry(list.entries[1]!)).toBe(true);
  expect(isCostEntry(list.entries[1]!)).toBe(false);
  expect(isNewsEntry(list.entries[2]!)).toBe(true);
  expect(isCostEntry(list.entries[2]!)).toBe(true);
});
