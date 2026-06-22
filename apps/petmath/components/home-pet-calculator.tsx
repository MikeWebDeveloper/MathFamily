"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPence } from "@mathfamily/engine";
import { RangeSlider } from "@mathfamily/ui";
import { lifetimeEstimate } from "../lib/pet-content";
import { INSURANCE_ESTIMATE, type PetCostRecord } from "../lib/pet-costs";

interface HomePetCalculatorProps {
  records: PetCostRecord[];
}

export function HomePetCalculator({ records }: HomePetCalculatorProps) {
  const [selectedSlug, setSelectedSlug] = useState(records[0]?.slug ?? "");
  const record = records.find((r) => r.slug === selectedSlug) ?? records[0];

  // Default the slider to the midpoint of the PDSA lifespan band for this pet.
  const defaultYears = record ? Math.round((record.lifespanYears.low + record.lifespanYears.high) / 2) : 10;
  const [years, setYears] = useState(defaultYears);
  const [showInsurance, setShowInsurance] = useState(false);

  if (!record) return null;

  const est = lifetimeEstimate(record, years, showInsurance);

  function onChangePet(slug: string) {
    setSelectedSlug(slug);
    const next = records.find((r) => r.slug === slug);
    if (next) setYears(Math.round((next.lifespanYears.low + next.lifespanYears.high) / 2));
  }

  return (
    <div className="space-y-5 rounded-card border border-ink/10 bg-card p-4 sm:p-6">
      <div className="flex flex-wrap gap-4">
        <label className="flex min-w-48 flex-1 flex-col gap-1">
          <span className="text-xs font-medium text-ink-muted">Pet</span>
          <select
            value={selectedSlug}
            onChange={(e) => onChangePet(e.target.value)}
            className="min-h-10 rounded-lg border border-ink/15 bg-surface px-3 py-2 text-sm text-ink"
          >
            {records.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-48 flex-1 flex-col gap-1">
          <span className="text-xs font-medium text-ink-muted">
            Years together: <strong>{years}</strong>
          </span>
          <RangeSlider
            min={1}
            max={20}
            value={years}
            onChange={setYears}
            ariaLabel="Years you expect to have your pet"
            ariaValuetext={`${years} years`}
          />
          <span className="text-[11px] text-ink-muted">
            PDSA average lifespan for a {record.name.toLowerCase()}: {record.lifespanYears.low}–{record.lifespanYears.high} years
          </span>
        </label>
      </div>

      {/* Result headline */}
      <div className="rounded-lg border border-brand-accent/20 bg-brand-accent/[0.06] p-4">
        <p className="text-xs font-medium text-brand-accent">Estimated lifetime cost over {years} years</p>
        <p className="mf-num text-4xl font-bold tracking-tight text-ink">{formatPence(est.totalPence)}</p>
        <p className="mt-1 text-xs text-ink-muted">
          Essential care only (PDSA). Emergency vet treatment, grooming, training and boarding are not included.
        </p>
      </div>

      {/* Breakdown */}
      <dl className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-ink/10 bg-surface p-3">
          <dt className="text-xs font-medium text-ink-muted">One-off set-up</dt>
          <dd className="mf-num text-xl font-bold text-ink">{formatPence(est.setupPence)}</dd>
        </div>
        <div className="rounded-lg border border-ink/10 bg-surface p-3">
          <dt className="text-xs font-medium text-ink-muted">Monthly care</dt>
          <dd className="mf-num text-xl font-bold text-ink">{formatPence(record.monthlyCarePence)}</dd>
          <p className="text-[11px] text-ink-muted">× {Math.round(years * 12)} months = {formatPence(est.carePence)}</p>
        </div>
        <div className="rounded-lg border border-ink/10 bg-surface p-3">
          <dt className="text-xs font-medium text-ink-muted">Lifetime cost total</dt>
          <dd className="mf-num text-xl font-bold text-ink">{formatPence(est.totalPence)}</dd>
        </div>
      </dl>

      {/* Optional insurance reference line — AMBER: estimate only, never an affiliate link */}
      <div className="rounded-lg border border-amber-300/40 bg-amber-50 p-3 dark:border-warning/20 dark:bg-warning/[0.08]">
        <label className="flex items-start gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={showInsurance}
            onChange={(e) => setShowInsurance(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded border-ink/30 text-brand-accent focus:ring-2 focus:ring-brand-accent/30"
          />
          <span>Show pet insurance as a separate estimate</span>
        </label>
        {showInsurance ? (
          <div className="mt-2 text-sm text-ink-muted">
            <p>
              <strong className="text-ink">{formatPence(INSURANCE_ESTIMATE.annualPremiumPence)}/year</strong>{" "}
              (≈ {formatPence(est.insurancePence)} over {Math.round(years)} years) — ABI 2024 average annual
              premium across all pets.
            </p>
            <p className="mt-1 text-xs">
              This is a reference estimate, not a quote. The monthly care figure above already includes a typical
              insurance line, so we do <strong>not</strong> add this on top of the total. Pet insurance is a
              regulated product — always compare live quotes for your pet.
            </p>
          </div>
        ) : null}
      </div>

      <p className="text-sm">
        <Link href={`/cost/${record.slug}`} className="font-semibold text-brand-accent underline underline-offset-4">
          Full {record.name.toLowerCase()} cost breakdown →
        </Link>
      </p>
    </div>
  );
}
