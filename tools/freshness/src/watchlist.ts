import {
  loadBaggageDataset,
  loadDropOffDataset,
  loadEsimDataset,
  loadLoungeDataset,
  loadParkingDataset,
  loadPriorityPass,
  loadRoamingDataset
} from "@mathfamily/data";

export interface WatchEntry {
  url: string;
  refs: string[]; // e.g. "drop-off:gatwick", "roaming:ee"
  watchable: boolean;
}

export interface Watchlist {
  generatedAt: string;
  entries: WatchEntry[];
}

// Domains where neither direct fetch nor the reader proxy reliably returns content
// (hard WAF / JS-only). The weekly sweep covers these with deeper transports instead.
export const UNWATCHABLE_DOMAINS = new Set([
  "londoncityairport.com",
  "dropoff.londoncityairport.com",
  "birminghamairport.co.uk",
  "glasgowairport.com",
  "leedsbradfordairport.co.uk",
  "saily.com",
  "ee.co.uk" // JS shell; the watched source is the PDF guide, which IS watchable when the URL points at the PDF
]);

function domainOf(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "");
}

export function buildWatchlist(now: Date = new Date()): Watchlist {
  const byUrl = new Map<string, Set<string>>();
  const add = (url: string, ref: string) => {
    if (!byUrl.has(url)) byUrl.set(url, new Set());
    byUrl.get(url)!.add(ref);
  };

  for (const r of loadDropOffDataset().records) add(r.sourceUrl, `drop-off:${r.airportSlug}`);
  for (const r of loadParkingDataset().records) add(r.sourceUrl, `parking:${r.airportSlug}`);
  for (const r of loadLoungeDataset().records) add(r.sourceUrl, `lounges:${r.airportSlug}`);
  add(loadPriorityPass().sourceUrl, "priority-pass:tiers");
  for (const s of loadRoamingDataset().networkSources) add(s.sourceUrl, `roaming:${s.network}`);
  for (const r of loadEsimDataset().records) add(r.sourceUrl, `esim:${r.countrySlug}`);
  for (const r of loadBaggageDataset().records) add(r.sourceUrl, `baggage:${r.airlineSlug}`);

  const entries: WatchEntry[] = [...byUrl.entries()]
    .map(([url, refs]) => {
      const domain = domainOf(url);
      const isPdf = url.toLowerCase().endsWith(".pdf");
      return {
        url,
        refs: [...refs].sort(),
        watchable: isPdf ? true : !UNWATCHABLE_DOMAINS.has(domain)
      };
    })
    .sort((a, b) => a.url.localeCompare(b.url));

  return { generatedAt: now.toISOString().slice(0, 10), entries };
}
