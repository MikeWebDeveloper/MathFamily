"use client";

import { useMemo, useState } from "react";
import { formatPence } from "@mathfamily/engine";
import { calculateMoveCost } from "../lib/cost";
import { BUYER_TYPE_LABELS, type BuyerType } from "../lib/sdlt";
import { REMOVALS, SURVEYS } from "../lib/dataset";

const BUYER_TYPES: BuyerType[] = ["first-time-buyer", "home-mover", "additional-property"];

const DEFAULT_REMOVALS_KEY = REMOVALS[1]?.key ?? REMOVALS[0]?.key ?? "";
const DEFAULT_SURVEY_KEY = SURVEYS[1]?.key ?? SURVEYS[0]?.key ?? "";

function poundsToPence(pounds: string): number {
  const n = Number(pounds.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export function MoveCalculator() {
  const [priceInput, setPriceInput] = useState("350000");
  const [buyerType, setBuyerType] = useState<BuyerType>("home-mover");
  const [removalsKey, setRemovalsKey] = useState(DEFAULT_REMOVALS_KEY);
  const [surveyKey, setSurveyKey] = useState(DEFAULT_SURVEY_KEY);
  const [isSelling, setIsSelling] = useState(true);
  const [includeMortgageFee, setIncludeMortgageFee] = useState(true);

  const pricePence = poundsToPence(priceInput);

  const result = useMemo(
    () =>
      calculateMoveCost({ pricePence, buyerType, removalsKey, surveyKey, isSelling, includeMortgageFee }),
    [pricePence, buyerType, removalsKey, surveyKey, isSelling, includeMortgageFee]
  );

  return (
    <div className="space-y-5 rounded-card border border-ink/10 bg-card p-4 sm:p-6">
      <div className="flex flex-wrap gap-4">
        {/* Price */}
        <label className="flex min-w-48 flex-1 flex-col gap-1">
          <span className="text-xs font-medium text-ink-muted">Purchase price (£)</span>
          <input
            type="text"
            inputMode="numeric"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            className="min-h-10 rounded-lg border border-ink/15 bg-surface px-3 py-2 text-sm text-ink"
            aria-label="Purchase price in pounds"
          />
        </label>

        {/* Buyer type */}
        <label className="flex min-w-48 flex-1 flex-col gap-1">
          <span className="text-xs font-medium text-ink-muted">Buyer type</span>
          <select
            value={buyerType}
            onChange={(e) => setBuyerType(e.target.value as BuyerType)}
            className="min-h-10 rounded-lg border border-ink/15 bg-surface px-3 py-2 text-sm text-ink"
          >
            {BUYER_TYPES.map((t) => (
              <option key={t} value={t}>
                {BUYER_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-4">
        {/* Removals */}
        <label className="flex min-w-48 flex-1 flex-col gap-1">
          <span className="text-xs font-medium text-ink-muted">Removals (home size)</span>
          <select
            value={removalsKey}
            onChange={(e) => setRemovalsKey(e.target.value)}
            className="min-h-10 rounded-lg border border-ink/15 bg-surface px-3 py-2 text-sm text-ink"
          >
            {REMOVALS.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
        </label>

        {/* Survey */}
        <label className="flex min-w-48 flex-1 flex-col gap-1">
          <span className="text-xs font-medium text-ink-muted">Survey</span>
          <select
            value={surveyKey}
            onChange={(e) => setSurveyKey(e.target.value)}
            className="min-h-10 rounded-lg border border-ink/15 bg-surface px-3 py-2 text-sm text-ink"
          >
            {SURVEYS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={isSelling} onChange={(e) => setIsSelling(e.target.checked)} className="accent-brand-accent" />
          I&apos;m also selling my current home
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={includeMortgageFee}
            onChange={(e) => setIncludeMortgageFee(e.target.checked)}
            className="accent-brand-accent"
          />
          Include a mortgage arrangement fee
        </label>
      </div>

      {/* Headline total */}
      <div className="rounded-lg border border-brand-accent/20 bg-brand-accent/[0.06] p-4">
        <p className="text-xs font-medium text-brand-accent">Estimated total cost to move</p>
        <p className="text-3xl font-bold tracking-tight text-ink">{formatPence(result.totalPence)}</p>
        <p className="text-xs text-ink-muted">
          Includes {formatPence(result.sdlt.totalTaxPence)} Stamp Duty (England &amp; NI estimate)
        </p>
      </div>

      {/* Breakdown */}
      <ul className="divide-y divide-ink/5 text-sm">
        {result.lines.map((line) => (
          <li key={line.key} className="flex items-baseline justify-between gap-3 py-2">
            <span className="text-ink-muted">
              {line.label}
              {line.note ? <span className="ml-1 text-xs text-ink-muted/70">({line.note})</span> : null}
            </span>
            <span className="mf-num font-medium text-ink">{formatPence(line.pence)}</span>
          </li>
        ))}
      </ul>

      <p className="text-xs text-ink-muted">
        Stamp Duty from public gov.uk rates; other costs are typical estimates, not quotes. England &amp; Northern
        Ireland only — Scotland (LBTT) and Wales (LTT) differ.
      </p>
    </div>
  );
}
