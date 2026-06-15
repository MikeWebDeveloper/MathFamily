"use client";

import { useState } from "react";
import { buildParkingSearchUrl, validateSearchDates } from "../lib/partners";

export function BookingOptions({
  airportName,
  airportSlug,
  officialUrl,
  price,
  days,
  iata,
}: {
  airportName: string;
  airportSlug: string;
  officialUrl: string;
  /** Optional: cheapest pre-book price in pence, shown in the affiliate CTA. */
  price?: number;
  /** Optional: duration in days, shown beside the price figure. */
  days?: number;
  /** Optional: IATA code for the airport, used for HE date-prefill deep links. */
  iata?: string;
}) {
  const [dropOff, setDropOff] = useState("");
  const [returnDate, setReturnDate] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const dateError = dropOff && returnDate ? validateSearchDates(dropOff, returnDate, today) : null;
  const datesValid = !!dropOff && !!returnDate && !dateError;

  // Airport-specific affiliate link; dates enhance the href on the client when datePrefill is on,
  // otherwise it stays on the airport page (reliable baseline). Falls back to the official link only
  // if the parking slot is somehow inactive.
  const link = buildParkingSearchUrl({
    airportSlug,
    iata,
    dropOff: datesValid ? dropOff : undefined,
    returnDate: datesValid ? returnDate : undefined,
  });
  const hasAffiliate = link !== null;
  const affiliateHref = link?.url ?? officialUrl;
  const partnerName = link?.partnerName ?? "Holiday Extras";

  const priceStr =
    price !== undefined && days !== undefined
      ? `from £${(price / 100).toFixed(2)} for ${days} day${days === 1 ? "" : "s"}`
      : price !== undefined
        ? `from £${(price / 100).toFixed(2)}`
        : null;

  const dateField = "min-h-11 w-full rounded-card border border-ink/15 bg-card px-3 text-sm text-ink";

  return (
    <section aria-label="Your booking options" className="space-y-4 rounded-card border border-ink/10 bg-surface p-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-ink">Your booking options</h2>
        <p className="text-sm text-ink-muted">
          Our ranking above uses only the airport&apos;s own published prices — it isn&apos;t affected by commission.
        </p>
      </div>

      {hasAffiliate ? (
        <>
          <div className="rounded-card border border-brand-accent/30 bg-blue-50 dark:bg-brand-accent/[0.08] dark:border-brand-accent/20 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-ink">Pre-book &amp; save with {partnerName}</h3>
              <span className="rounded border border-ink-muted/40 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Ad</span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="block text-xs font-medium text-ink-muted">
                Drop-off
                <input
                  type="date"
                  value={dropOff}
                  onChange={(e) => setDropOff(e.target.value)}
                  min={today}
                  className={`mt-1 ${dateField}`}
                />
              </label>
              <label className="block text-xs font-medium text-ink-muted">
                Return
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  min={dropOff || today}
                  className={`mt-1 ${dateField}`}
                />
              </label>
            </div>

            {dateError ? (
              <p role="alert" className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">{dateError}</p>
            ) : null}

            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink">
              <li>✓ Free cancellation (cancel to arrival)</li>
              <li>✓ No code needed</li>
              <li>✓ Best Price Guaranteed</li>
            </ul>
            <p className="mt-2 text-sm text-ink-muted">
              10% off most Holiday Extras car parks — up to 25% at Gatwick (Meet &amp; Greet North). Discount applied
              automatically, no code.{" "}
              <a href="https://www.holidayextras.com/airport-parking.html" rel="noopener noreferrer" target="_blank" className="underline underline-offset-4">
                Terms ↗
              </a>
            </p>
            <p className="mt-2 text-xs text-ink-muted">
              We earn a commission only if you book the &ldquo;Ad&rdquo; option — it never changes our ranking or which park
              we show as cheapest.
            </p>
            <a
              href={affiliateHref}
              rel="sponsored noopener noreferrer"
              target="_blank"
              className="mt-3 inline-block min-h-11 rounded-card bg-brand-accent px-4 py-2 text-sm font-semibold text-white"
            >
              Book my parking{priceStr ? ` — ${priceStr}` : ""} — free cancellation ↗
            </a>
          </div>

          <div className="rounded-card border border-ink/10 bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-ink">Book direct with the airport</h3>
              <span className="rounded border border-ink-muted/40 px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">Official site</span>
            </div>
            <p className="mt-1 text-sm text-ink-muted">{airportName} official car parks.</p>
            <a
              href={officialUrl}
              rel="noopener noreferrer"
              target="_blank"
              className="mt-3 inline-block min-h-11 rounded-card border border-brand-accent px-4 py-2 text-sm font-semibold text-brand-accent"
            >
              Go to airport site ▸
            </a>
          </div>
        </>
      ) : (
        <div className="rounded-card border border-ink/10 bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-ink">Book direct with the airport</h3>
            <span className="rounded border border-ink-muted/40 px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">Official site</span>
          </div>
          <p className="mt-1 text-sm text-ink-muted">{airportName} official car parks.</p>
          <a
            href={officialUrl}
            rel="noopener noreferrer"
            target="_blank"
            className="mt-3 inline-block min-h-11 rounded-card border border-brand-accent px-4 py-2 text-sm font-semibold text-brand-accent"
          >
            Go to airport site ▸
          </a>
        </div>
      )}
    </section>
  );
}
