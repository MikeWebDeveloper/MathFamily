"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SegmentedControl } from "@mathfamily/ui";
import type { EnergyRegion, UsageProfile } from "../lib/energy-data";
import {
  estimateAnnualBill,
  compareHeatPumpVsBoiler,
  estimateSolarPayback,
  formatPounds,
  formatPoundsPrecise
} from "../lib/energy-calc";

type Mode = "bill" | "heat-pump" | "solar";

interface BillCalculatorProps {
  regions: EnergyRegion[];
  profiles: UsageProfile[];
  defaultRegionSlug: string;
}

export function BillCalculator({ regions, profiles, defaultRegionSlug }: BillCalculatorProps) {
  const [mode, setMode] = useState<Mode>("bill");
  const [regionSlug, setRegionSlug] = useState(defaultRegionSlug);
  const [profileId, setProfileId] = useState(
    profiles.find((p) => p.id === "small")?.id ?? profiles[0]?.id ?? "small"
  );

  const region = regions.find((r) => r.slug === regionSlug) ?? regions[0]!;
  const profile = profiles.find((p) => p.id === profileId) ?? profiles[0]!;

  const bill = useMemo(
    () => estimateAnnualBill(region, profile.electricityKwhPerYear, profile.gasKwhPerYear),
    [region, profile]
  );

  // Heat pump: ~80% of the home's gas is heating demand.
  const heatPump = useMemo(
    () =>
      compareHeatPumpVsBoiler(
        Math.round(profile.gasKwhPerYear * 0.8),
        region.gasUnitRatePence,
        region.electricityUnitRatePence
      ),
    [region, profile]
  );

  const [systemKwp, setSystemKwp] = useState(4);
  const [systemCost, setSystemCost] = useState(7000);
  const solar = useMemo(
    () => estimateSolarPayback(systemKwp, systemCost, region.electricityUnitRatePence),
    [systemKwp, systemCost, region]
  );

  return (
    <div className="space-y-5 rounded-card border border-ink/10 bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl<Mode>
          ariaLabel="Calculator mode"
          value={mode}
          onChange={setMode}
          options={[
            { value: "bill", label: "Annual bill" },
            { value: "heat-pump", label: "Heat pump vs boiler" },
            { value: "solar", label: "Solar payback" }
          ]}
        />
        <label className="flex min-w-44 flex-col gap-1">
          <span className="text-xs font-medium text-ink-muted">Region</span>
          <select
            value={regionSlug}
            onChange={(e) => setRegionSlug(e.target.value)}
            className="min-h-10 rounded-lg border border-ink/15 bg-surface px-3 py-2 text-sm text-ink"
          >
            {regions.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {mode === "bill" && (
        <>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-ink-muted">Home size / usage</span>
            <div className="flex flex-wrap gap-1">
              {profiles.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProfileId(p.id)}
                  className={`min-h-10 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    profileId === p.id
                      ? "bg-brand-accent text-white"
                      : "border border-ink/15 bg-surface text-ink hover:border-brand-accent/40"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              {profile.description} · {profile.electricityKwhPerYear.toLocaleString("en-GB")} kWh
              electricity, {profile.gasKwhPerYear.toLocaleString("en-GB")} kWh gas a year
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="min-w-44 flex-1 rounded-lg border border-brand-accent/20 bg-brand-accent/[0.06] p-3">
              <p className="text-xs font-medium text-brand-accent">Estimated annual bill</p>
              <p className="text-2xl font-bold tracking-tight text-ink">{formatPounds(bill.totalPounds)}</p>
              <p className="text-xs text-ink-muted">
                {formatPoundsPrecise(bill.monthlyPounds)}/month · dual fuel
              </p>
            </div>
            <div className="min-w-40 flex-1 rounded-lg border border-ink/10 bg-surface p-3">
              <p className="text-xs font-medium text-ink-muted">Electricity</p>
              <p className="text-xl font-bold text-ink">{formatPounds(bill.electricityPounds)}</p>
              <p className="text-xs text-ink-muted">{region.electricityUnitRatePence}p/kWh</p>
            </div>
            <div className="min-w-40 flex-1 rounded-lg border border-ink/10 bg-surface p-3">
              <p className="text-xs font-medium text-ink-muted">Gas</p>
              <p className="text-xl font-bold text-ink">{formatPounds(bill.gasPounds)}</p>
              <p className="text-xs text-ink-muted">{region.gasUnitRatePence}p/kWh</p>
            </div>
          </div>
        </>
      )}

      {mode === "heat-pump" && (
        <div className="space-y-3">
          <p className="text-sm text-ink-muted">
            Indicative heating running cost for a {profile.label.toLowerCase()} (gas heating demand),
            heat pump at SCOP 3.0. Excludes install cost and grants.
          </p>
          <div className="flex flex-wrap gap-1">
            {profiles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProfileId(p.id)}
                className={`min-h-10 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  profileId === p.id
                    ? "bg-brand-accent text-white"
                    : "border border-ink/15 bg-surface text-ink hover:border-brand-accent/40"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="min-w-40 flex-1 rounded-lg border border-ink/10 bg-surface p-3">
              <p className="text-xs font-medium text-ink-muted">Gas boiler heating</p>
              <p className="text-2xl font-bold text-ink">{formatPounds(heatPump.boilerHeatingCostPounds)}/yr</p>
            </div>
            <div className="min-w-40 flex-1 rounded-lg border border-ink/10 bg-surface p-3">
              <p className="text-xs font-medium text-ink-muted">Heat pump heating</p>
              <p className="text-2xl font-bold text-ink">{formatPounds(heatPump.heatPumpHeatingCostPounds)}/yr</p>
            </div>
            <div className="min-w-44 flex-1 rounded-lg border border-brand-accent/20 bg-brand-accent/[0.06] p-3">
              <p className="text-xs font-medium text-brand-accent">
                {heatPump.cheaper === "heat-pump" ? "Heat pump saves" : "Boiler cheaper by"}
              </p>
              <p className="text-2xl font-bold text-ink">
                {formatPounds(Math.abs(heatPump.annualSavingPounds))}/yr
              </p>
              <p className="text-xs text-ink-muted">running cost only</p>
            </div>
          </div>
        </div>
      )}

      {mode === "solar" && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-4">
            <label className="flex min-w-40 flex-col gap-1">
              <span className="text-xs font-medium text-ink-muted">
                System size: <strong>{systemKwp} kWp</strong>
              </span>
              <input
                type="range"
                min={1}
                max={10}
                step={0.5}
                value={systemKwp}
                onChange={(e) => setSystemKwp(Number(e.target.value))}
                className="accent-brand-accent"
                aria-label="Solar system size in kilowatts peak"
              />
            </label>
            <label className="flex min-w-40 flex-col gap-1">
              <span className="text-xs font-medium text-ink-muted">
                Install cost: <strong>{formatPounds(systemCost)}</strong>
              </span>
              <input
                type="range"
                min={2000}
                max={15000}
                step={250}
                value={systemCost}
                onChange={(e) => setSystemCost(Number(e.target.value))}
                className="accent-brand-accent"
                aria-label="Solar install cost in pounds"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="min-w-40 flex-1 rounded-lg border border-ink/10 bg-surface p-3">
              <p className="text-xs font-medium text-ink-muted">Annual generation</p>
              <p className="text-2xl font-bold text-ink">
                {Math.round(solar.annualGenerationKwh).toLocaleString("en-GB")} kWh
              </p>
            </div>
            <div className="min-w-40 flex-1 rounded-lg border border-ink/10 bg-surface p-3">
              <p className="text-xs font-medium text-ink-muted">Annual benefit</p>
              <p className="text-2xl font-bold text-ink">{formatPounds(solar.annualBenefitPounds)}</p>
            </div>
            <div className="min-w-44 flex-1 rounded-lg border border-brand-accent/20 bg-brand-accent/[0.06] p-3">
              <p className="text-xs font-medium text-brand-accent">Payback time</p>
              <p className="text-2xl font-bold text-ink">
                {solar.paybackYears != null ? `${solar.paybackYears.toFixed(1)} yrs` : "—"}
              </p>
              <p className="text-xs text-ink-muted">indicative</p>
            </div>
          </div>
          <p className="text-xs text-ink-muted">
            Assumes ~900 kWh per kWp a year, 50% self-used at {region.electricityUnitRatePence}p/kWh,
            the rest exported at 15p/kWh. Indicative only — not a quote.
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 border-t border-ink/10 pt-3">
        <Link
          href={`/region/${region.slug}`}
          className="text-sm font-semibold text-brand-accent underline underline-offset-4"
        >
          See the full breakdown for {region.name} →
        </Link>
      </div>
    </div>
  );
}
