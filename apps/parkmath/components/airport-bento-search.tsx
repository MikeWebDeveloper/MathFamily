"use client";

import { useMemo, useState } from "react";
import { CommandSearch, IataTile, Sparkline } from "@mathfamily/ui";
import { formatPence } from "@mathfamily/engine";

export interface AirportTile {
  slug: string;
  name: string;
  iata: string;
  isFree: boolean;
  feePence: number;
  /** Verified prior-year drop-off fee, or null when we have nothing to compare. */
  priorPence: number | null;
}

/** The command-search hero + the tracked-airport bento grid. Sparklines render
 *  only where a verified prior-year price exists — ParkMath never draws a curve
 *  it can't source. */
export function AirportBentoSearch({ airports }: { airports: AirportTile[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const matches = useMemo(
    () => (q ? airports.filter((a) => a.name.toLowerCase().includes(q) || a.iata.toLowerCase() === q) : airports),
    [airports, q]
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-h2 font-semibold text-ink">Tracked airports</h2>
        <span className="mf-num text-sm text-ink-muted">{matches.length} of {airports.length} shown</span>
      </div>

      <CommandSearch
        value={query}
        onChange={setQuery}
        ariaLabel="Search airports"
        placeholder="Search your airport — e.g. Gatwick or LGW"
      />

      {matches.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {matches.map((a) => {
            const series = !a.isFree && a.priorPence != null ? [a.priorPence, a.feePence] : null;
            return (
              <li key={a.slug}>
                <a
                  href={`/drop-off-charges/${a.slug}`}
                  className="mf-card-lg mf-soft-lift mf-press mf-edge group flex h-full flex-col gap-3 p-4 outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/40"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex-1 min-w-0 flex items-center gap-2 text-sm font-semibold text-ink transition-colors group-hover:text-brand-accent">
                      <span className="truncate">{a.name}</span>
                      <IataTile code={a.iata} />
                    </span>
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <span
                      className={`mf-num-display text-2xl font-bold ${a.isFree ? "text-positive" : "text-brand-strong"}`}
                    >
                      {a.isFree ? "Free" : formatPence(a.feePence)}
                    </span>
                    {series ? <Sparkline data={series} /> : null}
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mf-fade-in flex flex-col items-center gap-3 rounded-card border border-ink/8 bg-surface px-6 py-10 text-center">
          <p className="text-sm font-semibold text-ink">No airports found for &ldquo;{query}&rdquo;</p>
          <p className="-mt-1.5 text-xs text-ink-muted">Try the full name (e.g. Gatwick) or the 3-letter code (e.g. LGW)</p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mt-1 inline-flex min-h-9 items-center rounded-full border border-ink/15 bg-card px-4 text-xs font-medium text-ink-muted transition hover:border-brand-accent/40 hover:text-brand-accent"
          >
            Clear search
          </button>
        </div>
      )}
    </section>
  );
}
