"use client";

import { useState } from "react";
import { formatPence, roamingTripCost, type NetworkRoamingOption, type EsimBundleOption, type RoamingTripResult } from "@mathfamily/engine";
import { AnswerLead, CaveatChip, RangeSlider } from "@mathfamily/ui";
import type { ResolvedSlot } from "../lib/partners";

export interface RoamingAnswerProps {
  networkOption: NetworkRoamingOption;
  esimBundles: EsimBundleOption[];
  networkLabel: string;
  countryName: string;
  countrySlug: string;
  esimSlot: ResolvedSlot;
  defaultDays?: number;
  defaultDataGb?: number;
}

// ---------------------------------------------------------------------------
// Pure rendering logic — no hooks, testable via renderToStaticMarkup
// ---------------------------------------------------------------------------

export function buildHeroAnswer(
  networkOption: NetworkRoamingOption,
  networkLabel: string,
  countryName: string,
  days: number,
  result: RoamingTripResult
): string {
  if (networkOption.included) {
    return `${networkLabel} customers roam in ${countryName} at no extra daily charge${
      networkOption.fairUseNote ? ` (fair use: ${networkOption.fairUseNote})` : ""
    }.`;
  }
  if (networkOption.dailyPassPence !== null) {
    const tripCost = networkOption.dailyPassPence * days;
    return `${networkLabel} charges ${formatPence(networkOption.dailyPassPence)}/day for roaming in ${countryName}${
      networkOption.passName ? ` (${networkOption.passName})` : ""
    } — ${formatPence(tripCost)} for ${days} day${days !== 1 ? "s" : ""}${
      result.esimChoice
        ? `, vs ${formatPence(result.esimChoice.totalPence)} with a ${result.esimChoice.provider} eSIM`
        : ""
    }.`;
  }
  return `${networkLabel} does not publish a standard daily roaming pass for ${countryName} — charges apply per minute/MB at standard out-of-bundle rates. Check the official price guide.`;
}

export interface RoamingAnswerDisplayProps {
  networkOption: NetworkRoamingOption;
  networkLabel: string;
  countryName: string;
  days: number;
  dataGb: number;
  result: RoamingTripResult;
  esimSlot: ResolvedSlot;
  heroAnswer: string;
  onDaysChange?: (v: number) => void;
  onDataGbChange?: (v: number) => void;
}

export function RoamingAnswerDisplay({
  networkOption,
  networkLabel,
  countryName,
  days,
  dataGb,
  result,
  esimSlot,
  heroAnswer,
  onDaysChange,
  onDataGbChange,
}: RoamingAnswerDisplayProps) {
  const showEsimCta = result.esimChoice !== null && !networkOption.included;

  return (
    <section aria-label={`${networkLabel} roaming in ${countryName} answer`} className="space-y-4">
      {/* Sliders */}
      <div
        className="rounded-card border border-ink/10 bg-card p-6"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <h2 className="text-lg font-semibold text-ink">Your trip</h2>
        <div className="mt-4 space-y-4">
          <label className="block text-sm text-ink-muted">
            Days: <strong className="mf-num text-ink">{days}</strong>
            <RangeSlider
              min={1}
              max={30}
              value={days}
              onChange={onDaysChange ?? (() => {})}
              ariaLabel="Trip duration in days"
              ariaValuetext={`${days} days`}
              className="mt-1"
            />
          </label>
          <label className="block text-sm text-ink-muted">
            Data needed: <strong className="mf-num text-ink">{dataGb}GB</strong>
            <RangeSlider
              min={1}
              max={30}
              value={dataGb}
              onChange={onDataGbChange ?? (() => {})}
              ariaLabel="Data needed in gigabytes"
              ariaValuetext={`${dataGb} gigabytes`}
              className="mt-1"
            />
          </label>
        </div>
      </div>

      {/* Hero answer — live region so changes are announced */}
      <div aria-live="polite" data-testid="roaming-answer-result" className="space-y-4">
        <AnswerLead answer={heroAnswer} />

        {/* Network vs eSIM comparison (only when network has a cost and eSIM data exists) */}
        {!networkOption.included && result.esimChoice ? (
          <div className="space-y-2">
            {/* Network row */}
            <div
              className={
                result.verdict === "network"
                  ? "flex items-start justify-between rounded-xl border border-brand-accent/40 bg-brand-accent/[0.06] px-4 py-3 ring-1 ring-brand-accent/20"
                  : "flex items-start justify-between rounded-xl border border-ink/10 px-4 py-3"
              }
            >
              <span className="flex min-w-0 items-start gap-2 text-sm font-medium text-ink">
                {result.verdict === "network" ? (
                  <span className="mt-0.5 shrink-0 rounded-full bg-brand-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Cheaper
                  </span>
                ) : null}
                <span className="min-w-0">{networkLabel} daily pass</span>
              </span>
              <span className="mf-num shrink-0 text-lg font-bold text-brand-strong">
                {result.cheapestNetwork?.totalPence != null
                  ? formatPence(result.cheapestNetwork.totalPence)
                  : "No standard pass"}
              </span>
            </div>

            {/* eSIM row */}
            <div
              className={
                result.verdict === "esim"
                  ? "flex items-start justify-between rounded-xl border border-brand-accent/40 bg-brand-accent/[0.06] px-4 py-3 ring-1 ring-brand-accent/20"
                  : "flex items-start justify-between rounded-xl border border-ink/10 px-4 py-3"
              }
            >
              <span className="flex min-w-0 items-start gap-2 text-sm font-medium text-ink">
                {result.verdict === "esim" ? (
                  <span className="mt-0.5 shrink-0 rounded-full bg-brand-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Cheaper
                  </span>
                ) : null}
                <span className="min-w-0">
                  Best eSIM ({result.esimChoice.provider}, {result.esimChoice.bundleName})
                </span>
              </span>
              <span className="mf-num shrink-0 text-lg font-bold text-brand-strong">
                {formatPence(result.esimChoice.totalPence)}
              </span>
            </div>
          </div>
        ) : null}

        {/* Verdict summary */}
        {!networkOption.included ? (
          <p className="rounded-lg border border-ink/10 bg-surface px-4 py-3 text-sm font-semibold text-brand-strong">
            {result.verdict === "esim" && result.esimChoice
              ? `eSIM saves ${formatPence(result.savingsPence)} vs ${networkLabel} daily charges for ${days} day${days !== 1 ? "s" : ""}.`
              : result.verdict === "network" && result.cheapestNetwork?.totalPence != null
                ? `${networkLabel} daily charge (${formatPence(result.cheapestNetwork.totalPence)}) is cheaper than the best tracked eSIM for ${days} day${days !== 1 ? "s" : ""}.`
                : "Not enough published data — check the official pages."}
          </p>
        ) : null}

        {/* Warnings / caveats */}
        {result.warnings.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {result.warnings.map((w) => (
              <li key={w.code}>
                <CaveatChip>{w.message}</CaveatChip>
              </li>
            ))}
          </ul>
        ) : null}

        {/* eSIM CTA — shown only when esimChoice exists AND not included network */}
        {showEsimCta ? (
          <div data-testid="esim-cta" className="rounded-card border border-ink/10 bg-card p-4">
            {esimSlot.kind === "affiliate" ? (
              <>
                <p className="mb-2 text-xs text-ink-muted" data-testid="affiliate-disclosure">
                  We may earn a commission if you buy through our link — at no extra cost to you.
                </p>
                <a
                  href={esimSlot.url}
                  className="inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90"
                  rel="sponsored noopener"
                  target="_blank"
                >
                  {esimSlot.label}
                </a>
              </>
            ) : (
              <a
                href={esimSlot.url}
                className="text-sm text-brand-accent underline underline-offset-4"
                rel="noopener"
                target="_blank"
              >
                {esimSlot.label} →
              </a>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Client shell — owns state and wires it to the pure display component
// ---------------------------------------------------------------------------

export function RoamingAnswer({
  networkOption,
  esimBundles,
  networkLabel,
  countryName,
  countrySlug: _countrySlug,
  esimSlot,
  defaultDays = 7,
  defaultDataGb = 5,
}: RoamingAnswerProps) {
  const [days, setDays] = useState(defaultDays);
  const [dataGb, setDataGb] = useState(defaultDataGb);

  // Single source of truth — all derived from this one call
  const result = roamingTripCost([networkOption], esimBundles, days, dataGb);
  const heroAnswer = buildHeroAnswer(networkOption, networkLabel, countryName, days, result);

  return (
    <RoamingAnswerDisplay
      networkOption={networkOption}
      networkLabel={networkLabel}
      countryName={countryName}
      days={days}
      dataGb={dataGb}
      result={result}
      esimSlot={esimSlot}
      heroAnswer={heroAnswer}
      onDaysChange={setDays}
      onDataGbChange={setDataGb}
    />
  );
}
