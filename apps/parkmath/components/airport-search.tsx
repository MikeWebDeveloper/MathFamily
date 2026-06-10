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
      <input
        id="airport-search-input"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search your airport — e.g. Gatwick or LGW"
        className="w-full rounded-card border border-ink/15 bg-white px-4 py-3.5 text-base shadow-sm outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/30"
      />
      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {matches.map((a) => (
          <li key={a.slug}>
            <a
              href={`/drop-off-charges/${a.slug}`}
              className="group flex h-full flex-col justify-between gap-1 rounded-card border border-ink/10 bg-white p-3.5 outline-none transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-accent/40 focus-visible:ring-2 focus-visible:ring-brand-accent/40"
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
        <p className="mt-4 text-sm text-ink-muted">No airports found for &quot;{query}&quot;.</p>
      ) : null}
    </div>
  );
}
