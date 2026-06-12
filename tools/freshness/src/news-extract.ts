import { NewsDatasetSchema, type NewsItem, type NewsDataset } from "@mathfamily/data";

const MONTHS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
const kebab = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export function newsId(airportSlug: string | null, topic: string, isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  const my = `${MONTHS[d.getUTCMonth()]}-${d.getUTCFullYear()}`;
  return kebab(`${airportSlug ?? "uk"}-${topic}-${my}`);
}

const normTitle = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export function isDuplicateNews(
  existing: NewsItem[],
  cand: { airportSlug: string | null; title: string; change: NewsItem["change"] }
): boolean {
  return existing.some((e) => {
    if (e.airportSlug !== cand.airportSlug) return false;
    if (normTitle(e.title) === normTitle(cand.title)) return true;
    if (e.change && cand.change && e.change.label === cand.change.label && e.change.to === cand.change.to) return true;
    return false;
  });
}

export function refsWithPrefix(changedRefs: string[], prefix: string): string[] {
  return changedRefs.filter((r) => r.startsWith(prefix)).map((r) => r.slice(prefix.length));
}

export type NewsCandidate = Omit<NewsItem, "id" | "verifiedAt" | "supersedes" | "body"> & { body?: string | null };

export function mergeNewsItems(dataset: NewsDataset, candidates: NewsCandidate[], today: string): NewsDataset {
  const items = [...dataset.items];
  for (const c of candidates) {
    if (isDuplicateNews(items, { airportSlug: c.airportSlug, title: c.title, change: c.change })) continue;
    const topic = c.category;
    items.push({
      id: newsId(c.airportSlug, topic, c.publishedAt),
      airportSlug: c.airportSlug, category: c.category, title: c.title, summary: c.summary,
      body: c.body ?? null, change: c.change, sourceUrl: c.sourceUrl, sourceLabel: c.sourceLabel,
      publishedAt: c.publishedAt, verifiedAt: today, supersedes: null
    });
  }
  const out: NewsDataset = { version: dataset.version, lastUpdated: today, items };
  return NewsDatasetSchema.parse(out); // throws on any invalid candidate — safety gate
}
