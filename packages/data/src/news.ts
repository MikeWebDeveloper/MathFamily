import { z } from "zod";
import newsJson from "../datasets/parkmath/news.json";
import { IsoDate, Slug, HttpUrl } from "./zod-helpers";

export const NEWS_CATEGORIES = [
  "fee-change", "parking", "lounge", "terminal-works",
  "drop-off-zone", "strike", "closure", "rule-change", "delay", "other"
] as const;

export const NewsChangeSchema = z.strictObject({
  label: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1)
});

export const NewsItemSchema = z.strictObject({
  id: Slug,
  airportSlug: Slug.nullable(),
  category: z.enum(NEWS_CATEGORIES),
  title: z.string().min(1),
  summary: z.string().min(1),
  body: z.string().nullable(),
  change: NewsChangeSchema.nullable(),
  sourceUrl: HttpUrl,
  sourceLabel: z.string().min(1),
  publishedAt: IsoDate,
  verifiedAt: IsoDate,
  supersedes: Slug.nullable()
});
export type NewsItem = z.infer<typeof NewsItemSchema>;

export const NewsDatasetSchema = z.strictObject({
  version: z.string().min(1),
  lastUpdated: IsoDate,
  items: z.array(NewsItemSchema)
});
export type NewsDataset = z.infer<typeof NewsDatasetSchema>;

export function loadNewsDataset(): NewsDataset {
  return NewsDatasetSchema.parse(newsJson);
}

const byNewest = (a: NewsItem, b: NewsItem) => (a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : 0);

/** Drops every item that a newer item names in `supersedes` — a replaced figure (e.g. Luton's June
 *  "£7 for 10 minutes" after the October "£9 for 12 minutes") must not read as current. */
export function withoutSuperseded(items: NewsItem[]): NewsItem[] {
  const replaced = new Set(items.flatMap((i) => (i.supersedes ? [i.supersedes] : [])));
  return items.filter((i) => !replaced.has(i.id));
}

/** Every item, newest first — the /news archive, RSS feed and sitemap, where history stays listed. */
export function recentNews(limit?: number): NewsItem[] {
  const sorted = [...loadNewsDataset().items].sort(byNewest);
  return limit ? sorted.slice(0, limit) : sorted;
}
/** Newest first, without superseded items — for anything presented as the current state. */
export function currentNews(limit?: number): NewsItem[] {
  const sorted = withoutSuperseded(loadNewsDataset().items).sort(byNewest);
  return limit ? sorted.slice(0, limit) : sorted;
}
/** An airport's current updates (the "Latest at …" boxes), newest first, superseded items left out. */
export function newsForAirport(slug: string, limit?: number): NewsItem[] {
  const items = withoutSuperseded(loadNewsDataset().items).filter((i) => i.airportSlug === slug).sort(byNewest);
  return limit ? items.slice(0, limit) : items;
}
/** The item that replaces `id`, if any — so a superseded update's own page can point to it. */
export function supersededBy(id: string): NewsItem | null {
  return loadNewsDataset().items.find((i) => i.supersedes === id) ?? null;
}
export function newsById(id: string): NewsItem | null {
  return loadNewsDataset().items.find((i) => i.id === id) ?? null;
}
