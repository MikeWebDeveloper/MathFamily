"use client";

import { useState } from "react";
import { formatPence, quoteDropOff, type DropOffTariff } from "@mathfamily/engine";
import { AnimatedNumber, CaveatChip } from "@mathfamily/ui";

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

  return (
    <section
      aria-label={`${airportName} drop-off cost calculator`}
      className="mf-edge rounded-card bg-white p-6"
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
          className="h-2 w-full cursor-pointer accent-brand-accent transition-shadow focus-visible:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-brand-accent)_25%,transparent)] active:shadow-[0_0_12px_color-mix(in_srgb,var(--color-brand-accent)_45%,transparent)]"
        />
        <span className="mf-num w-20 shrink-0 text-right text-sm font-medium text-ink-muted">{minutes} min</span>
      </div>
      <div className="mt-5 rounded-xl bg-surface p-4">
        <p id="calc-result" data-testid="calculator-result" aria-live="polite" className="text-4xl font-bold text-brand">
          <AnimatedNumber pence={quote.costPence} render={(p) => (p === null ? "Beyond published tariff" : formatPence(p))} />
        </p>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {quote.warnings.map((w) => (
          <li key={w.code} className="mf-rise-in"><CaveatChip>{w.message}</CaveatChip></li>
        ))}
      </ul>
    </section>
  );
}
