"use client";

import { useMemo, useState } from "react";
import { buildParkingSearchUrl, validateSearchDates } from "../lib/partners";

export interface SearchAirport {
  slug: string;
  name: string;
  iata: string;
}

/** Home "find parking" search: airport (typeahead via datalist) + drop-off + return.
 *  At rest (no airport matched) the CTA points to the internal /airport-parking hub, so the page
 *  is crawlable and JS-off safe and the home never emits a generic affiliate click. Once a known
 *  airport is typed, the CTA becomes a tracked, airport-specific affiliate handoff (dates enhance
 *  the href when datePrefill is enabled). */
export function ParkingSearch({ airports }: { airports: SearchAirport[] }) {
  const [airportText, setAirportText] = useState("");
  const [dropOff, setDropOff] = useState("");
  const [returnDate, setReturnDate] = useState("");

  const index = useMemo(() => {
    const m = new Map<string, SearchAirport>();
    for (const a of airports) {
      m.set(a.name.toLowerCase(), a);
      m.set(a.iata.toLowerCase(), a);
    }
    return m;
  }, [airports]);

  const matched = index.get(airportText.trim().toLowerCase());
  const today = new Date().toISOString().slice(0, 10);
  const dateError = dropOff && returnDate ? validateSearchDates(dropOff, returnDate, today) : null;
  const datesValid = !!dropOff && !!returnDate && !dateError;
  const link = matched
    ? buildParkingSearchUrl({
        airportSlug: matched.slug,
        dropOff: datesValid ? dropOff : undefined,
        returnDate: datesValid ? returnDate : undefined,
      })
    : null;
  const isAffiliate = link !== null;
  const href = link?.url ?? "/airport-parking";

  const field = "min-h-11 w-full rounded-card border border-ink/15 bg-card px-3 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/40";

  return (
    <section aria-label="Find airport parking" className="rounded-card border border-ink/10 bg-surface p-4 space-y-3">
      <h2 className="text-lg font-semibold text-ink">Find airport parking</h2>

      <form
        className="grid grid-cols-1 gap-3 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-end"
        onSubmit={(e) => e.preventDefault()}
      >
        <label className="block text-xs font-medium text-ink-muted">
          Airport
          <input
            list="pm-airports"
            value={airportText}
            onChange={(e) => setAirportText(e.target.value)}
            placeholder="Start typing — e.g. Gatwick or LGW"
            className={`mt-1 ${field}`}
            aria-label="Airport"
          />
          <datalist id="pm-airports">
            {airports.map((a) => (
              <option key={a.slug} value={a.name}>{a.iata}</option>
            ))}
          </datalist>
        </label>

        <label className="block text-xs font-medium text-ink-muted">
          Drop-off
          <input type="date" value={dropOff} onChange={(e) => setDropOff(e.target.value)} min={today} className={`mt-1 ${field}`} aria-label="Drop-off date" />
        </label>

        <label className="block text-xs font-medium text-ink-muted">
          Return
          <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} min={dropOff || today} className={`mt-1 ${field}`} aria-label="Return date" />
        </label>

        <a
          href={href}
          {...(isAffiliate ? { rel: "sponsored noopener noreferrer", target: "_blank" } : {})}
          className="inline-flex min-h-11 items-center justify-center rounded-card bg-brand-accent px-4 text-sm font-semibold text-white"
        >
          Search parking →
        </a>
      </form>

      {dateError ? (
        <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">{dateError}</p>
      ) : null}

      <p className="text-xs text-ink-muted">
        <span className="mr-1 rounded border border-ink-muted/40 px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide">Ad</span>
        Opens our travel partner ({link?.partnerName ?? "Holiday Extras"}) with your search ready — we may earn commission, at no extra cost to you.
      </p>
    </section>
  );
}
