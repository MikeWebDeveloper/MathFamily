"use client";

import { useState } from "react";
import type { Airport } from "@mathfamily/data";
import { nearestAirports } from "@mathfamily/engine";

type Status = "idle" | "locating" | "ready" | "error";
type Near = { slug: string; name: string; miles: number };

export function NearbyAirports({ airports, feeBySlug }: { airports: Airport[]; feeBySlug?: Record<string, string> }) {
  const [status, setStatus] = useState<Status>("idle");
  const [results, setResults] = useState<Near[]>([]);

  function locate() {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setStatus("error");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const near = nearestAirports(pos.coords.latitude, pos.coords.longitude, airports, 3);
        setResults(near.map((n) => ({ slug: n.airport.slug, name: n.airport.name, miles: Math.round(n.distanceKm * 0.621371) })));
        setStatus("ready");
      },
      () => setStatus("error"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
    );
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={locate}
        className="mf-press inline-flex min-h-11 items-center gap-2 rounded-card border border-ink/15 bg-white px-4 text-sm font-medium text-ink-muted outline-none transition hover:border-brand-accent/40 hover:text-brand-accent focus-visible:ring-2 focus-visible:ring-brand-accent/40"
      >
        <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
        {status === "locating" ? "Finding your location…" : "Find airports near me"}
      </button>
      <p className="mt-1.5 text-xs text-ink-muted/80">Your location stays in your browser — we don&apos;t send or store it.</p>

      {status === "error" ? (
        <p className="mt-2 text-xs text-warning">Couldn&apos;t get your location — search above instead.</p>
      ) : null}

      {status === "ready" && results.length > 0 ? (
        <ul className="mf-fade-in mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {results.map((r) => (
            <li key={r.slug}>
              <a
                href={`/drop-off-charges/${r.slug}`}
                className="mf-sheen mf-press flex items-center justify-between gap-2 rounded-card border border-ink/10 bg-white p-3 outline-none transition hover:border-brand-accent/40 focus-visible:ring-2 focus-visible:ring-brand-accent/40"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">{r.name}</span>
                  <span className="mf-num block text-xs text-ink-muted">
                    {r.miles} mi{feeBySlug?.[r.slug] ? ` · ${feeBySlug[r.slug]}` : ""}
                  </span>
                </span>
                <span aria-hidden className="text-brand-accent">→</span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
