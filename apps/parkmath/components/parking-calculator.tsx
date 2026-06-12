"use client";

import { useState } from "react";
import { compareParking, formatPence, type ParkingTariff } from "@mathfamily/engine";
import { CaveatChip } from "@mathfamily/ui";

const CHOICES = [1, 3, 7, 14, 28];

export function ParkingCalculator({ tariff, airportName, buildDate }: { tariff: ParkingTariff; airportName: string; buildDate: string }) {
  const [days, setDays] = useState(7);
  const c = compareParking(tariff, days, new Date(buildDate));

  return (
    <section
      aria-label={`${airportName} parking cost comparison`}
      className="rounded-card border border-ink/10 bg-white p-6"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <h2 className="text-lg font-semibold text-ink">How long are you going for?</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {CHOICES.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDays(d)}
            aria-pressed={days === d}
            className={
              days === d
                ? "min-h-11 rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition"
                : "min-h-11 cursor-pointer rounded-lg border border-ink/20 px-4 py-2 text-sm font-medium text-ink transition hover:-translate-y-0.5 hover:border-brand-accent hover:text-brand-accent"
            }
          >
            {d} day{d > 1 ? "s" : ""}
          </button>
        ))}
      </div>
      <div aria-live="polite" data-testid="parking-result" className="mf-fade-in mt-5 space-y-2">
        {c.options.length === 0 ? (
          <p className="text-ink-muted">No published price for {days} days — check the official site.</p>
        ) : (
          c.options.map((o, i) => (
            <div
              key={o.name}
              className={
                i === 0
                  ? "flex items-start justify-between rounded-xl border border-brand-accent/40 bg-brand-accent/[0.06] px-4 py-3 ring-1 ring-brand-accent/20"
                  : "flex items-start justify-between rounded-xl border border-ink/10 px-4 py-3"
              }
            >
              <span className="flex min-w-0 items-start gap-2 text-sm font-medium text-ink">
                {i === 0 ? (
                  <span className="mt-0.5 shrink-0 rounded-full bg-brand-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Cheapest</span>
                ) : null}
                <span className="min-w-0">{o.name}</span>
              </span>
              <span className="mf-num shrink-0 text-lg font-bold text-brand">{formatPence(o.totalPence)}</span>
            </div>
          ))
        )}
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {c.warnings.map((w) => (
          <li key={w.code}><CaveatChip>{w.message}</CaveatChip></li>
        ))}
      </ul>
    </section>
  );
}
