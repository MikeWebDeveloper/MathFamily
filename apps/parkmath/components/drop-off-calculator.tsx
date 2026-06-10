"use client";

import { useState } from "react";
import { formatPence, quoteDropOff, type DropOffTariff } from "@mathfamily/engine";

export function DropOffCalculator({ tariff, airportName }: { tariff: DropOffTariff; airportName: string }) {
  const [minutes, setMinutes] = useState(10);
  const quote = quoteDropOff(tariff, minutes);
  const cost = quote.costPence === null ? "Beyond published tariff" : formatPence(quote.costPence);

  return (
    <section aria-label={`${airportName} drop-off cost calculator`} className="rounded-card border border-ink/10 p-6">
      <h2 className="text-lg font-semibold text-ink">How long will you stop?</h2>
      <div className="mt-4 flex items-center gap-4">
        <input
          type="range"
          min={1}
          max={90}
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
          aria-label="Minutes at the drop-off zone"
          className="w-full accent-brand-accent"
        />
        <span className="w-24 shrink-0 text-right text-sm font-medium text-ink-muted">{minutes} min</span>
      </div>
      <p data-testid="calculator-result" className="mt-4 text-3xl font-bold tabular-nums text-brand">
        {cost}
      </p>
      <ul className="mt-3 space-y-1 text-sm text-ink-muted">
        {quote.warnings.map((w) => (
          <li key={w.code}>{w.message}</li>
        ))}
      </ul>
    </section>
  );
}
