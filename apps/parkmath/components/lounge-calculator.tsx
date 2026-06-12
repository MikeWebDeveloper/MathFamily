"use client";

import { useState } from "react";
import { formatPence, loungeBreakEven, type MembershipTier } from "@mathfamily/engine";
import { RangeSlider } from "@mathfamily/ui";

export function LoungeCalculator({ walkInPence, tiers, airportName }: { walkInPence: number; tiers: MembershipTier[]; airportName: string }) {
  const [visits, setVisits] = useState(3);
  const r = loungeBreakEven(walkInPence, visits, tiers);

  return (
    <section
      aria-label={`${airportName} lounge membership break-even`}
      className="rounded-card border border-ink/10 bg-white p-6"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <h2 className="text-lg font-semibold text-ink">How many lounge visits a year?</h2>
      <div className="mt-5 flex items-center gap-4">
        <RangeSlider
          min={1}
          max={20}
          value={visits}
          onChange={setVisits}
          ariaLabel="Lounge visits per year"
          ariaValuetext={`${visits} visits`}
          ariaDescribedby="lounge-result"
        />
        <span className="mf-num w-16 shrink-0 text-right text-sm font-medium text-ink-muted">{visits}×</span>
      </div>
      <div id="lounge-result" aria-live="polite" data-testid="lounge-result" className="mf-fade-in mt-5 space-y-2 rounded-xl bg-surface p-4 text-sm">
        <p className="flex justify-between text-ink">Pay-as-you-go <strong className="mf-num">{formatPence(r.payAsYouGoPence)}/yr</strong></p>
        {r.tierCosts.map((t) => (
          <p key={t.tier} className="flex justify-between text-ink-muted">Priority Pass {t.tier} <span className="mf-num">{formatPence(t.totalPence)}/yr</span></p>
        ))}
        <p className="mt-2 border-t border-ink/10 pt-3 text-base font-bold text-brand">
          {r.verdict === "payg" ? "Paying per visit wins at this frequency." : `${r.best?.tier} membership wins — saves ${formatPence(r.savingsPence)}/year.`}
        </p>
      </div>
    </section>
  );
}
