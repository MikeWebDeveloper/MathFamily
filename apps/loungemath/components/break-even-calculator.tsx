"use client";

import { useState } from "react";
import { formatPence, loungeBreakEven, type MembershipTier } from "@mathfamily/engine";
import { AnimatedNumber, RangeSlider } from "@mathfamily/ui";

// LoungeMath's value engine, reused from ParkMath's break-even calculator. Given a
// verified cheapest walk-in price and the real Priority Pass tiers, it answers the
// only question that matters: at YOUR travel frequency, is membership cheaper than
// paying on the door? Pure client-side maths on already-verified inputs.
export function BreakEvenCalculator({
  walkInPence,
  tiers,
  airportName,
  initialVisits = 6,
}: {
  walkInPence: number;
  tiers: MembershipTier[];
  airportName: string;
  initialVisits?: number;
}) {
  const [visits, setVisits] = useState(initialVisits);
  const r = loungeBreakEven(walkInPence, visits, tiers);

  return (
    <section
      aria-label={`${airportName} lounge break-even calculator`}
      className="mf-edge rounded-card bg-card p-6"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <h2 className="text-lg font-semibold text-ink">Is membership worth it for you?</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Compares paying on the door at the cheapest lounge ({formatPence(walkInPence)}/visit) against
        each Priority Pass tier, for your lounge visits per year.
      </p>
      <div className="mt-4">
        <label className="block text-sm text-ink-muted">
          Lounge visits per year: <strong className="mf-num text-ink">{visits}</strong>
          <RangeSlider
            min={1}
            max={40}
            value={visits}
            onChange={setVisits}
            ariaLabel="Lounge visits per year"
            ariaValuetext={`${visits} visits per year`}
            className="mt-1"
          />
        </label>
      </div>
      <div
        aria-live="polite"
        data-testid="break-even-result"
        className="mf-fade-in mt-5 space-y-2 rounded-xl bg-surface p-4 text-sm"
      >
        <p className="flex justify-between text-ink-muted">
          <span>Pay on the door ({visits} × {formatPence(walkInPence)})</span>
          <span className="font-medium text-ink">
            <AnimatedNumber pence={r.payAsYouGoPence} render={(p) => (p === null ? "—" : formatPence(p))} />
          </span>
        </p>
        {r.tierCosts.map((t) => (
          <p key={t.tier} className="flex justify-between text-ink-muted">
            <span>Priority Pass {t.tier}</span>
            <span className="font-medium text-ink">
              <AnimatedNumber pence={t.totalPence} render={(p) => (p === null ? "—" : formatPence(p))} />
            </span>
          </p>
        ))}
        <p className="mt-2 rounded-lg border-t border-ink/10 bg-brand-accent/[0.07] p-3 text-sm font-semibold text-brand-strong">
          {r.verdict === "membership" && r.best
            ? `Priority Pass ${r.best.tier} wins — about ${formatPence(r.savingsPence)} cheaper than paying per visit at ${visits} visits/yr.`
            : `Paying on the door is cheaper at ${visits} visits/yr — membership only pays off if you fly more often.`}
        </p>
      </div>
      <p className="mt-3 text-xs text-ink-muted">
        Walk-in prices are operator from-prices and change by date/time; Priority Pass tiers are the
        published annual fees. Confirm both before you buy.
      </p>
    </section>
  );
}
