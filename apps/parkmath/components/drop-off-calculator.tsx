"use client";

import { useEffect, useState } from "react";
import { formatPence, quoteDropOff, type DropOffTariff } from "@mathfamily/engine";
import { AnimatedNumber, CaveatChip, RangeSlider } from "@mathfamily/ui";

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
  const costString = quote.costPence === null ? "Beyond tariff" : formatPence(quote.costPence);
  const liveText = `${minutes} min · ${costString}`;

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("mf-live-answer", { detail: `${airportName} · ${liveText}` }));
    }
  }, [liveText]);

  return (
    <section
      aria-label={`${airportName} drop-off cost calculator`}
      className="mf-edge rounded-card bg-card p-6"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <h2 className="text-lg font-semibold text-ink">How long will you stop?</h2>
      <div className="mt-5 flex items-center gap-4">
        <RangeSlider
          min={1}
          max={90}
          value={minutes}
          onChange={setMinutes}
          ariaLabel="Minutes at the drop-off zone"
          ariaValuetext={`${minutes} minutes`}
          ariaDescribedby="calc-result"
        />
        <span className="mf-num w-20 shrink-0 text-right text-sm font-medium text-ink-muted">{minutes} min</span>
      </div>
      <div className="mf-fade-in mt-5 rounded-xl bg-surface p-4">
        <p id="calc-result" data-testid="calculator-result" aria-live="polite" className="text-4xl font-bold text-brand-strong">
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
