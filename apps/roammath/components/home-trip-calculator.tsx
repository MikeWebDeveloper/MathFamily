"use client";

import { useState } from "react";
import Link from "next/link";
import { roamingTripCost, formatPence } from "@mathfamily/engine";
import type { RoamingDestination, EsimCountry } from "@mathfamily/data";
import { CountryFlag } from "@mathfamily/ui";
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
                    ? "bg-accent-solid text-white"
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
          <div className="flex flex-wrap gap-3">
            {/* Cheapest network card */}
            <div className="min-w-40 flex-1 rounded-lg border border-ink/10 bg-surface p-3">
              <p className="text-xs font-medium text-ink-muted">Cheapest network</p>
              <p className="text-2xl font-bold tracking-tight text-ink">
                {cheapest?.included
                  ? "£0"
                  : cheapest?.totalPence != null
                    ? formatPence(cheapest.totalPence)
                    : "—"}
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
                <p className="text-xs font-medium text-accent-strong">Best eSIM</p>
                <p className="text-2xl font-bold tracking-tight text-ink">
                  {formatPence(esimPick.totalPence)}
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
              className="text-sm font-semibold text-accent-strong underline underline-offset-4"
            >
              See full breakdown for {destination.countryName} →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
