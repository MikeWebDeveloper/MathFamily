"use client";

import { useState } from "react";
import { compareParking, formatPence, type ParkingTariff } from "@mathfamily/engine";

const CHOICES = [1, 3, 7, 14, 28];

export function ParkingCalculator({ tariff, airportName, buildDate }: { tariff: ParkingTariff; airportName: string; buildDate: string }) {
  const [days, setDays] = useState(7);
  const c = compareParking(tariff, days, new Date(buildDate));

  return (
    <section aria-label={`${airportName} parking cost comparison`} className="rounded-card border border-ink/10 p-6">
      <h2 className="text-lg font-semibold text-ink">How long are you going for?</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {CHOICES.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDays(d)}
            aria-pressed={days === d}
            className={
              days === d
                ? "rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white"
                : "rounded-lg border border-ink/20 px-4 py-2 text-sm font-medium text-ink hover:border-brand-accent"
            }
          >
            {d} day{d > 1 ? "s" : ""}
          </button>
        ))}
      </div>
      <div aria-live="polite" data-testid="parking-result" className="mt-4 space-y-2">
        {c.options.length === 0 ? (
          <p className="text-ink-muted">No published price for {days} days — check the official site.</p>
        ) : (
          c.options.map((o, i) => (
            <div key={o.name} className="flex items-baseline justify-between rounded-lg border border-ink/10 px-4 py-2">
              <span className="text-sm font-medium text-ink">
                {i === 0 ? "🏆 " : ""}
                {o.name}
              </span>
              <span className="text-lg font-bold tabular-nums text-brand">{formatPence(o.totalPence)}</span>
            </div>
          ))
        )}
      </div>
      <ul className="mt-3 space-y-1 text-xs text-ink-muted">
        {c.warnings.map((w) => (
          <li key={w.code}>{w.message}</li>
        ))}
      </ul>
    </section>
  );
}
