"use client";

import { useState } from "react";
import type { Airport } from "@mathfamily/data";

export function AirportSearch({ airports, feeBySlug }: { airports: Airport[]; feeBySlug?: Record<string, string> }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const matches = q
    ? airports.filter((a) => a.name.toLowerCase().includes(q) || a.iata.toLowerCase() === q)
    : airports;

  return (
    <div>
      <label htmlFor="airport-search-input" className="sr-only">Search airports</label>
      <div className="relative">
        <svg aria-hidden viewBox="0 0 20 20" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="9" cy="9" r="6" /><path d="m14 14 3 3" />
        </svg>
        <input
          id="airport-search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your airport — e.g. Gatwick or LGW"
          className="w-full rounded-card border border-ink/15 bg-card py-3.5 pl-11 pr-4 text-base shadow-sm outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/30"
        />
      </div>
      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {matches.map((a) => (
          <li key={a.slug}>
            <a
              href={`/drop-off-charges/${a.slug}`}
              className="mf-sheen mf-press group flex h-full flex-col justify-between gap-1 rounded-card border border-ink/10 bg-card p-3.5 outline-none transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-accent/40 focus-visible:ring-2 focus-visible:ring-brand-accent/40"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <span className="text-sm font-semibold text-ink transition-colors group-hover:text-brand-accent">{a.name}</span>
              {feeBySlug?.[a.slug] ? (
                <span className="mf-num text-xs text-ink-muted">{feeBySlug[a.slug]}</span>
              ) : null}
            </a>
          </li>
        ))}
      </ul>
      {q && matches.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-card border border-ink/8 bg-surface py-10 px-6 text-center mf-fade-in">
          <svg aria-hidden viewBox="0 0 40 40" className="h-10 w-10 text-ink-muted/50" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="18" cy="18" r="11" />
            <path d="m27 27 7 7" />
            <path d="M14 18h8M18 14v8" strokeWidth="1.2" opacity="0.5" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-ink">No airports found for &ldquo;{query}&rdquo;</p>
            <p className="mt-0.5 text-xs text-ink-muted">Try the full name (e.g. Gatwick) or the 3-letter code (e.g. LGW)</p>
          </div>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mt-1 inline-flex min-h-9 items-center rounded-full border border-ink/15 bg-card px-4 text-xs font-medium text-ink-muted transition hover:border-brand-accent/40 hover:text-brand-accent"
          >
            Clear search
          </button>
        </div>
      ) : null}
    </div>
  );
}
