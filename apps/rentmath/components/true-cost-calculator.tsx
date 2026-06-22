"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatPence } from "@mathfamily/engine";
import type { TownRent } from "../lib/rent-data";
import { trueCostOfRenting } from "../lib/rent-content";

interface TrueCostCalculatorProps {
  towns: TownRent[];
}

/** Pence ⇄ pounds helpers for the £-denominated inputs (users think in pounds, we store pence). */
function poundsToPence(pounds: number): number {
  return Math.round(pounds * 100);
}

export function TrueCostCalculator({ towns }: TrueCostCalculatorProps) {
  const defaultTown = towns.find((t) => t.townSlug === "manchester") ?? towns[0];

  const [selectedSlug, setSelectedSlug] = useState(defaultTown?.townSlug ?? "");
  // The user can override any prefilled figure. We seed from the chosen town.
  const [rentPounds, setRentPounds] = useState(() =>
    defaultTown ? defaultTown.medianMonthlyRentPence / 100 : 0
  );
  const [councilPounds, setCouncilPounds] = useState(() =>
    defaultTown ? defaultTown.councilTaxBandDMonthlyPence / 100 : 0
  );
  const [billsPounds, setBillsPounds] = useState(() =>
    defaultTown ? defaultTown.typicalBillsMonthlyPence / 100 : 0
  );

  function applyTown(slug: string) {
    setSelectedSlug(slug);
    const town = towns.find((t) => t.townSlug === slug);
    if (town) {
      setRentPounds(town.medianMonthlyRentPence / 100);
      setCouncilPounds(town.councilTaxBandDMonthlyPence / 100);
      setBillsPounds(town.typicalBillsMonthlyPence / 100);
    }
  }

  const result = useMemo(
    () =>
      trueCostOfRenting({
        monthlyRentPence: poundsToPence(rentPounds || 0),
        councilTaxMonthlyPence: poundsToPence(councilPounds || 0),
        billsMonthlyPence: poundsToPence(billsPounds || 0)
      }),
    [rentPounds, councilPounds, billsPounds]
  );

  const selectedTown = towns.find((t) => t.townSlug === selectedSlug);

  return (
    <div className="space-y-5 rounded-card border border-ink/10 bg-card p-4 sm:p-6">
      {/* Controls */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-ink-muted">Prefill from town</span>
          <select
            value={selectedSlug}
            onChange={(e) => applyTown(e.target.value)}
            className="min-h-10 rounded-lg border border-ink/15 bg-surface px-3 py-2 text-sm text-ink"
          >
            {towns.map((t) => (
              <option key={t.townSlug} value={t.townSlug}>
                {t.townName}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-ink-muted">Monthly rent (£)</span>
          <input
            type="number"
            min={0}
            inputMode="decimal"
            value={rentPounds}
            onChange={(e) => setRentPounds(Number(e.target.value))}
            className="min-h-10 rounded-lg border border-ink/15 bg-surface px-3 py-2 text-sm text-ink"
            aria-label="Monthly rent in pounds"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-ink-muted">Council tax (£/mo)</span>
          <input
            type="number"
            min={0}
            inputMode="decimal"
            value={councilPounds}
            onChange={(e) => setCouncilPounds(Number(e.target.value))}
            className="min-h-10 rounded-lg border border-ink/15 bg-surface px-3 py-2 text-sm text-ink"
            aria-label="Council tax per month in pounds"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-ink-muted">Typical bills (£/mo)</span>
          <input
            type="number"
            min={0}
            inputMode="decimal"
            value={billsPounds}
            onChange={(e) => setBillsPounds(Number(e.target.value))}
            className="min-h-10 rounded-lg border border-ink/15 bg-surface px-3 py-2 text-sm text-ink"
            aria-label="Typical bills per month in pounds"
          />
        </label>
      </div>

      {/* Results */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-brand-accent/20 bg-brand-accent/[0.06] p-3">
          <p className="text-xs font-medium text-brand-accent">Real cost per year</p>
          <p className="text-2xl font-bold tracking-tight text-ink">
            {formatPence(result.annualTrueCostPence)}
          </p>
          <p className="text-xs text-ink-muted">
            ≈ {formatPence(result.effectiveMonthlyPence)}/mo, all in
          </p>
        </div>

        <div className="rounded-lg border border-ink/10 bg-surface p-3">
          <p className="text-xs font-medium text-ink-muted">To move in</p>
          <p className="text-2xl font-bold tracking-tight text-ink">
            {formatPence(result.moveInCostPence)}
          </p>
          <p className="text-xs text-ink-muted">
            first month + {result.depositCapWeeks}-week deposit ({formatPence(result.depositPence)})
          </p>
        </div>

        <div className="rounded-lg border border-ink/10 bg-surface p-3">
          <p className="text-xs font-medium text-ink-muted">Where it goes (per year)</p>
          <p className="text-sm text-ink">
            Rent {formatPence(result.annualRentPence)}
          </p>
          <p className="text-sm text-ink">
            Council tax {formatPence(result.annualCouncilTaxPence)}
          </p>
          <p className="text-sm text-ink">
            Bills {formatPence(result.annualBillsPence)}
          </p>
        </div>
      </div>

      {selectedTown && (
        <div className="flex items-center gap-3">
          <Link
            href={`/towns/${selectedTown.townSlug}`}
            className="text-sm font-semibold text-brand-accent underline underline-offset-4"
          >
            See the full breakdown for {selectedTown.townName} →
          </Link>
        </div>
      )}

      <p className="text-xs text-ink-muted">
        The deposit is refundable, so it is shown separately and not counted in the yearly cost.
        Figures are estimates — confirm with the landlord and your billing authority before you sign.
        Not financial advice.
      </p>
    </div>
  );
}
