"use client";

import { useState } from "react";
import { formatPence, loungeBreakEven, type MembershipTier } from "@mathfamily/engine";
import { AnswerLead, RangeSlider, SavesVerdict } from "@mathfamily/ui";

export interface LoungeAnswerProps {
  walkInPence: number;
  tiers: MembershipTier[];
  airportName: string;
  defaultVisits?: number;
}

export function LoungeAnswer({ walkInPence, tiers, airportName, defaultVisits = 3 }: LoungeAnswerProps) {
  const [visits, setVisits] = useState(defaultVisits);

  // Single computation — hero verdict, tier comparison, recommendation all derive from here
  const r = loungeBreakEven(walkInPence, visits, tiers);

  const heroAnswer =
    r.verdict === "membership" && r.best
      ? `At ${visits} visit${visits !== 1 ? "s" : ""}/year, a ${r.best.tier} membership beats paying per visit at ${airportName}.`
      : `At ${visits} visit${visits !== 1 ? "s" : ""}/year, paying per visit (${formatPence(walkInPence)} each) is cheaper than any membership at ${airportName}.`;

  const savingsVerdictText =
    r.verdict === "membership" && r.best && r.savingsPence > 0
      ? `A ${r.best.tier} membership saves ${formatPence(r.savingsPence)}/year vs paying per visit — adjust the slider to match your travel frequency.`
      : `At ${visits} visit${visits !== 1 ? "s" : ""}/year, pay-as-you-go (${formatPence(r.payAsYouGoPence)}/yr) beats membership — increase your visits to see where membership wins.`;

  return (
    <section aria-label={`${airportName} lounge break-even calculator`} className="space-y-4">
      {/* Visits slider */}
      <div
        className="rounded-card border border-ink/10 bg-card p-6"
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
            ariaDescribedby="lounge-answer-result"
          />
          <span className="mf-num w-16 shrink-0 text-right text-sm font-medium text-ink-muted">
            {visits}×
          </span>
        </div>
      </div>

      {/* Hero verdict — live region so screen readers announce changes */}
      <div
        id="lounge-answer-result"
        aria-live="polite"
        data-testid="lounge-result"
        className="space-y-4"
      >
        <AnswerLead answer={heroAnswer} />

        {/* Pay-as-you-go vs tier comparison */}
        <div className="space-y-2">
          {/* PAYG row */}
          <div
            className={
              r.verdict === "payg"
                ? "flex items-center justify-between rounded-xl border border-brand-accent/40 bg-brand-accent/[0.06] px-4 py-3 ring-1 ring-brand-accent/20"
                : "flex items-center justify-between rounded-xl border border-ink/10 px-4 py-3"
            }
          >
            <span className="flex items-center gap-2 text-sm font-medium text-ink">
              {r.verdict === "payg" ? (
                <span className="shrink-0 rounded-full bg-brand-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Best
                </span>
              ) : null}
              Pay as you go
            </span>
            <span className="mf-num shrink-0 text-lg font-bold text-brand">
              {formatPence(r.payAsYouGoPence)}/yr
            </span>
          </div>

          {/* Membership tier rows */}
          {r.tierCosts.map((t) => {
            const isBest = r.verdict === "membership" && r.best?.tier === t.tier;
            return (
              <div
                key={t.tier}
                className={
                  isBest
                    ? "flex items-center justify-between rounded-xl border border-brand-accent/40 bg-brand-accent/[0.06] px-4 py-3 ring-1 ring-brand-accent/20"
                    : "flex items-center justify-between rounded-xl border border-ink/10 px-4 py-3"
                }
              >
                <span className="flex items-center gap-2 text-sm font-medium text-ink">
                  {isBest ? (
                    <span className="shrink-0 rounded-full bg-brand-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      Best
                    </span>
                  ) : null}
                  Priority Pass {t.tier}
                </span>
                <span className={`mf-num shrink-0 text-lg font-bold ${isBest ? "text-brand" : "text-ink-muted"}`}>
                  {formatPence(t.totalPence)}/yr
                </span>
              </div>
            );
          })}
        </div>

        {/* Plain-English recommendation */}
        <SavesVerdict
          amount={
            r.verdict === "membership" && r.savingsPence > 0
              ? formatPence(r.savingsPence)
              : undefined
          }
          verdict={savingsVerdictText}
        />
      </div>
    </section>
  );
}
