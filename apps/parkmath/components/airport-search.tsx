"use client";

import { useState } from "react";
import type { Airport } from "@mathfamily/data";

export function AirportSearch({ airports }: { airports: Airport[] }) {
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
        className="w-full rounded-lg border border-ink/20 px-4 py-3 text-base"
      />
      <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {matches.map((a) => (
          <li key={a.slug}>
            <a
              href={`/drop-off-charges/${a.slug}`}
              className="block rounded-lg border border-ink/10 px-3 py-2 text-sm font-medium text-ink hover:border-brand-accent hover:text-brand-accent"
            >
              {a.name}
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
