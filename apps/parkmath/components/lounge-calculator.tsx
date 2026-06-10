"use client";

import { useState } from "react";
import { formatPence, loungeBreakEven, type MembershipTier } from "@mathfamily/engine";

export function LoungeCalculator({ walkInPence, tiers, airportName }: { walkInPence: number; tiers: MembershipTier[]; airportName: string }) {
  const [visits, setVisits] = useState(3);
  const r = loungeBreakEven(walkInPence, visits, tiers);

  return (
    <section aria-label={`${airportName} lounge membership break-even`} className="rounded-card border border-ink/10 p-6">
      <h2 className="text-lg font-semibold text-ink">How many lounge visits a year?</h2>
      <div className="mt-4 flex items-center gap-4">
        <input type="range" min={1} max={20} value={visits} aria-valuetext={`${visits} visits`} aria-describedby="lounge-result"
          onChange={(e) => setVisits(Number(e.target.value))} className="w-full accent-brand-accent" />
        <span className="w-20 shrink-0 text-right text-sm font-medium text-ink-muted">{visits}×</span>
      </div>
      <div id="lounge-result" aria-live="polite" data-testid="lounge-result" className="mt-4 space-y-1 text-sm">
        <p className="text-ink">Pay-as-you-go: <strong className="tabular-nums">{formatPence(r.payAsYouGoPence)}</strong>/year</p>
        {r.tierCosts.map((t) => (
          <p key={t.tier} className="text-ink-muted">Priority Pass {t.tier}: <span className="tabular-nums">{formatPence(t.totalPence)}</span>/year</p>
        ))}
        <p className="mt-2 text-lg font-bold text-brand">
          {r.verdict === "payg" ? "Paying per visit wins at this frequency." : `${r.best?.tier} membership wins — saves ${formatPence(r.savingsPence)}/year.`}
        </p>
      </div>
    </section>
  );
}
