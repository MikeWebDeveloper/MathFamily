"use client";

import { useState } from "react";
import { formatPence, quoteDropOff, type DropOffTariff } from "@mathfamily/engine";

export function DropOffCalculator({
  tariff,
  airportName,
  buildDate,
}: {
  tariff: DropOffTariff;
  airportName: string;
  buildDate: string;
}) {
  const [minutes, setMinutes] = useState(() => {
    const maxUp = tariff.bands.reduce((m, b) => Math.max(m, b.upToMinutes), 0);
    return maxUp > 0 ? Math.min(10, maxUp) : 10;
  });
  const quote = quoteDropOff(tariff, minutes, new Date(buildDate));
  const cost = quote.costPence === null ? "Beyond published tariff" : formatPence(quote.costPence);

  return (
    <section
      aria-label={`${airportName} drop-off cost calculator`}
      className="rounded-card border border-ink/10 bg-white p-6"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <h2 className="text-lg font-semibold text-ink">How long will you stop?</h2>
      <div className="mt-5 flex items-center gap-4">
        <input
          type="range"
          min={1}
          max={90}
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
          aria-label="Minutes at the drop-off zone"
          aria-valuetext={`${minutes} minutes`}
          aria-describedby="calc-result"
          className="h-2 w-full cursor-pointer accent-brand-accent"
        />
        <span className="mf-num w-20 shrink-0 text-right text-sm font-medium text-ink-muted">{minutes} min</span>
      </div>
      <div className="mt-5 rounded-xl bg-surface p-4">
        <p id="calc-result" data-testid="calculator-result" aria-live="polite" className="mf-num text-4xl font-bold text-brand">
          <span key={cost} className="mf-fade-in inline-block">{cost}</span>
        </p>
      </div>
      <ul className="mt-3 space-y-1 text-sm text-ink-muted">
        {quote.warnings.map((w) => (
          <li key={w.code}>{w.message}</li>
        ))}
      </ul>
    </section>
  );
}
