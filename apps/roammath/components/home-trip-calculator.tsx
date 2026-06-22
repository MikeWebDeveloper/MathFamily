"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { roamingTripCost, formatPence } from "@mathfamily/engine";
import type { RoamingDestination, EsimCountry } from "@mathfamily/data";
import { AnimatedNumber, CountryFlag } from "@mathfamily/ui";
import { NETWORK_LABELS } from "../lib/roaming-content";

interface HomeTripCalculatorProps {
  destinations: RoamingDestination[];
  esimRecords: Pick<EsimCountry, "countrySlug" | "bundles">[];
}

const DATA_GB_OPTIONS = [1, 3, 5, 10] as const;

export function HomeTripCalculator({ destinations, esimRecords }: HomeTripCalculatorProps) {
  const defaultSlug = destinations.find((d) => d.countrySlug === "spain")?.countrySlug
    ?? destinations[0]?.countrySlug
    ?? "";

  const [selectedSlug, setSelectedSlug] = useState(defaultSlug);
  const [days, setDays] = useState(7);
  const [dataGb, setDataGb] = useState(5);

  const destination = destinations.find((d) => d.countrySlug === selectedSlug);
  const esimRecord = esimRecords.find((r) => r.countrySlug === selectedSlug);
  const result = destination
    ? roamingTripCost(destination.perNetwork, esimRecord?.bundles ?? [], days, dataGb)
    : null;

  const cheapest = result?.cheapestNetwork;
  const esimPick = result?.esimChoice;

  // Signature motion: one-shot accent glow as the new quote lands (mirrors ParkMath's
  // DropOffCalculator). Tracks the cheapest-network figure — the headline result.
  const cheapestPence = cheapest?.included ? 0 : cheapest?.totalPence ?? null;
  const [revealing, setRevealing] = useState(false);
  const prevPence = useRef<number | null>(null);
  const glowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const prev = prevPence.current;
    prevPence.current = cheapestPence;
    const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced && prev !== null && prev !== cheapestPence) {
      setRevealing(true);
      if (glowTimer.current) clearTimeout(glowTimer.current);
      glowTimer.current = setTimeout(() => setRevealing(false), 320);
    }
  }, [cheapestPence]);
  useEffect(() => () => { if (glowTimer.current) clearTimeout(glowTimer.current); }, []);

  return (
    <div className="space-y-5 rounded-card border border-ink/10 bg-card p-4 sm:p-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4">
        {/* Destination */}
        <label className="flex min-w-48 flex-1 flex-col gap-1">
          <span className="text-xs font-medium text-ink-muted">Destination</span>
          <select
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
            className="min-h-10 rounded-lg border border-ink/15 bg-surface px-3 py-2 text-sm text-ink"
          >
            {destinations.map((d) => (
              <option key={d.countrySlug} value={d.countrySlug}>
                {d.countryName}
              </option>
            ))}
          </select>
        </label>

        {/* Days */}
        <label className="flex min-w-36 flex-col gap-1">
          <span className="text-xs font-medium text-ink-muted">
            Days: <strong>{days}</strong>
          </span>
          <input
            type="range"
            min={1}
            max={30}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="accent-brand-accent"
            aria-label="Number of days"
          />
        </label>

        {/* Data */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-ink-muted">Data per day</span>
          <div className="flex gap-1">
            {DATA_GB_OPTIONS.map((gb) => (
              <button
                key={gb}
                type="button"
                onClick={() => setDataGb(gb)}
                className={`min-h-10 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  dataGb === gb
                    ? "bg-brand-accent text-white"
                    : "border border-ink/15 bg-surface text-ink hover:border-brand-accent/40"
                }`}
              >
                {gb}GB
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Inline results */}
      {result && destination && (
        <>
          {/* is-revealing: one-shot accent glow as the figures land (tokens.css mf-glow-pulse),
              mirroring ParkMath's DropOffCalculator. Wrapper carries the rounded shape + shadow
              so the box-shadow reads correctly. Skipped under reduced motion. */}
          <div
            className={`flex flex-wrap gap-3 rounded-xl transition-none${revealing ? " is-revealing" : ""}`}
          >
            {/* Cheapest network card */}
            <div className="min-w-40 flex-1 rounded-lg border border-ink/10 bg-surface p-3">
              <p className="text-xs font-medium text-ink-muted">Cheapest network</p>
              <p className="text-2xl font-bold tracking-tight text-ink">
                {cheapest?.included ? (
                  "£0"
                ) : cheapest?.totalPence != null ? (
                  <AnimatedNumber pence={cheapest.totalPence} render={(p) => (p === null ? "—" : formatPence(p))} dur={500} />
                ) : (
                  "—"
                )}
              </p>
              <p className="text-xs text-ink-muted">
                {cheapest
                  ? cheapest.included
                    ? `${NETWORK_LABELS[cheapest.network] ?? cheapest.network} — included`
                    : NETWORK_LABELS[cheapest.network] ?? cheapest.network
                  : "No standard pass"}
              </p>
            </div>

            {/* Best eSIM card */}
            {esimPick && (
              <div className="min-w-40 flex-1 rounded-lg border border-brand-accent/20 bg-brand-accent/[0.06] p-3">
                <p className="text-xs font-medium text-brand-accent">Best eSIM</p>
                <p className="text-2xl font-bold tracking-tight text-ink">
                  <AnimatedNumber pence={esimPick.totalPence} render={(p) => (p === null ? "—" : formatPence(p))} dur={500} />
                </p>
                <p className="text-xs text-ink-muted">
                  {esimPick.provider} · {esimPick.bundleName}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {destination.iso2 && (
              <CountryFlag iso2={destination.iso2} size={20} className="shrink-0" />
            )}
            <Link
              href={`/roaming/${destination.countrySlug}`}
              className="text-sm font-semibold text-brand-accent underline underline-offset-4"
            >
              See full breakdown for {destination.countryName} →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
