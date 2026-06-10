import { describe, expect, it } from "vitest";
import {
  loadAirports,
  loadBaggageDataset,
  loadDropOffDataset,
  loadEsimDataset,
  loadLoungeDataset,
  loadParkingDataset,
  loadPriorityPass,
  loadRoamingDataset
} from "@mathfamily/data";
import { buildWatchlist, UNWATCHABLE_DOMAINS } from "../src/watchlist";

describe("buildWatchlist", () => {
  const list = buildWatchlist();

  it("covers every sourceUrl from every dataset exactly once (deduped by URL)", () => {
    const urls = new Set<string>();
    for (const r of loadDropOffDataset().records) urls.add(r.sourceUrl);
    for (const r of loadParkingDataset().records) urls.add(r.sourceUrl);
    for (const r of loadLoungeDataset().records) urls.add(r.sourceUrl);
    urls.add(loadPriorityPass().sourceUrl);
    for (const s of loadRoamingDataset().networkSources) urls.add(s.sourceUrl);
    for (const r of loadEsimDataset().records) urls.add(r.sourceUrl);
    for (const r of loadBaggageDataset().records) urls.add(r.sourceUrl);

    expect(new Set(list.entries.map((e) => e.url)).size).toBe(list.entries.length); // no dupes
    expect(list.entries.map((e) => e.url).sort()).toEqual([...urls].sort()); // exact cover
  });

  it("every entry carries at least one ref and refs are namespaced", () => {
    for (const e of list.entries) {
      expect(e.refs.length).toBeGreaterThanOrEqual(1);
      for (const ref of e.refs) expect(ref).toMatch(/^(drop-off|parking|lounges|priority-pass|roaming|esim|baggage):/);
    }
  });

  it("known WAF-hopeless domains are marked unwatchable (PDFs excepted — direct fetch works)", () => {
    for (const e of list.entries) {
      const domain = new URL(e.url).hostname.replace(/^www\./, "");
      if (UNWATCHABLE_DOMAINS.has(domain) && !e.url.toLowerCase().endsWith(".pdf")) {
        expect(e.watchable, e.url).toBe(false);
      }
    }
    expect(list.entries.some((e) => !e.watchable)).toBe(true); // at least one exists in our data
  });

  it("airports referenced exist (refs use real slugs)", () => {
    const slugs = new Set(loadAirports().map((a) => a.slug));
    for (const e of list.entries) {
      for (const ref of e.refs) {
        const [kind, slug] = ref.split(":");
        if (kind === "drop-off" || kind === "parking" || kind === "lounges") {
          expect(slugs.has(slug!), `unknown airport in ref ${ref}`).toBe(true);
        }
      }
    }
  });
});
