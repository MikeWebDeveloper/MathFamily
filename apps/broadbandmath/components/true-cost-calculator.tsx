"use client";

import { useMemo, useState } from "react";
import { formatPence } from "@mathfamily/engine";
import type { BroadbandPlan, PriceRiseType } from "../lib/broadband-types";
import { computeTrueCost } from "../lib/true-cost";

interface CalcPlan {
  slug: string;
  label: string;
  advertisedMonthlyPence: number;
  contractMonths: number;
  outOfContractMonthlyPence: number;
  exitFeePence: number;
  upfrontPence: number;
  riseType: PriceRiseType;
  fixedPencePerMonth: number;
  plusPercent: number;
  assumedIndexPercent: number;
}

function planToCalc(p: BroadbandPlan): CalcPlan {
  return {
    slug: p.slug,
    label: `${p.provider} ${p.planName}`,
    advertisedMonthlyPence: p.advertisedMonthlyPence,
    contractMonths: p.contractMonths,
    outOfContractMonthlyPence: p.outOfContractMonthlyPence,
    exitFeePence: p.exitFeePence,
    upfrontPence: p.upfrontPence,
    riseType: p.priceRise.type,
    fixedPencePerMonth: p.priceRise.fixedPencePerMonth ?? 0,
    plusPercent: p.priceRise.plusPercent ?? 0,
    assumedIndexPercent: p.priceRise.assumedIndexPercent ?? 4
  };
}

const poundsToPence = (pounds: number) => Math.round(pounds * 100);
const penceToPounds = (pence: number) => pence / 100;

export function TrueCostCalculator({ presets }: { presets: BroadbandPlan[] }) {
  const presetCalcs = useMemo(() => presets.map(planToCalc), [presets]);
  const [selectedSlug, setSelectedSlug] = useState(presetCalcs[0]?.slug ?? "custom");
  const initial = presetCalcs.find((p) => p.slug === selectedSlug) ?? presetCalcs[0];

  const [advertised, setAdvertised] = useState(penceToPounds(initial?.advertisedMonthlyPence ?? 3000));
  const [contractMonths, setContractMonths] = useState(initial?.contractMonths ?? 24);
  const [outOfContract, setOutOfContract] = useState(penceToPounds(initial?.outOfContractMonthlyPence ?? 4500));
  const [exitFee, setExitFee] = useState(penceToPounds(initial?.exitFeePence ?? 0));
  const [upfront, setUpfront] = useState(penceToPounds(initial?.upfrontPence ?? 0));
  const [riseType, setRiseType] = useState<PriceRiseType>(initial?.riseType ?? "fixed_pence");
  const [fixedRise, setFixedRise] = useState(penceToPounds(initial?.fixedPencePerMonth ?? 300));
  const [plusPercent, setPlusPercent] = useState(initial?.plusPercent ?? 3.9);
  const [assumedIndex, setAssumedIndex] = useState(initial?.assumedIndexPercent ?? 4);
  const [horizon, setHorizon] = useState(initial?.contractMonths ?? 24);

  function applyPreset(slug: string) {
    setSelectedSlug(slug);
    const p = presetCalcs.find((x) => x.slug === slug);
    if (!p) return;
    setAdvertised(penceToPounds(p.advertisedMonthlyPence));
    setContractMonths(p.contractMonths);
    setOutOfContract(penceToPounds(p.outOfContractMonthlyPence));
    setExitFee(penceToPounds(p.exitFeePence));
    setUpfront(penceToPounds(p.upfrontPence));
    setRiseType(p.riseType);
    setFixedRise(penceToPounds(p.fixedPencePerMonth));
    setPlusPercent(p.plusPercent);
    setAssumedIndex(p.assumedIndexPercent);
    setHorizon(p.contractMonths);
  }

  const result = useMemo(() => {
    const synthetic: BroadbandPlan = {
      slug: "calc",
      provider: "Custom",
      providerSlug: "custom",
      planName: "Custom",
      speedMbps: 0,
      speedTier: "fast",
      advertisedMonthlyPence: poundsToPence(advertised),
      contractMonths,
      outOfContractMonthlyPence: poundsToPence(outOfContract),
      upfrontPence: poundsToPence(upfront),
      exitFeePence: poundsToPence(exitFee),
      priceRise: {
        type: riseType,
        fixedPencePerMonth: poundsToPence(fixedRise),
        plusPercent,
        assumedIndexPercent: assumedIndex,
        summary: ""
      },
      sourceUrl: "",
      verifiedAt: "",
      verified: false
    };
    return computeTrueCost(synthetic, horizon);
  }, [advertised, contractMonths, outOfContract, upfront, exitFee, riseType, fixedRise, plusPercent, assumedIndex, horizon]);

  const numberField = (label: string, value: number, onChange: (n: number) => void, opts?: { step?: number; prefix?: string; suffix?: string; min?: number }) => (
    <label className="flex min-w-40 flex-1 flex-col gap-1">
      <span className="text-xs font-medium text-ink-muted">{label}</span>
      <div className="flex items-center rounded-lg border border-ink/15 bg-surface px-3 focus-within:border-brand-accent">
        {opts?.prefix && <span className="text-sm text-ink-muted">{opts.prefix}</span>}
        <input
          type="number"
          inputMode="decimal"
          min={opts?.min ?? 0}
          step={opts?.step ?? 1}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className="min-h-10 w-full bg-transparent px-1 py-2 text-sm text-ink outline-none"
        />
        {opts?.suffix && <span className="text-sm text-ink-muted">{opts.suffix}</span>}
      </div>
    </label>
  );

  return (
    <div className="space-y-5 rounded-card border border-ink/10 bg-card p-4 sm:p-6">
      {/* Preset picker */}
      {presetCalcs.length > 0 && (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-ink-muted">Start from a real deal (then edit anything)</span>
          <select
            value={selectedSlug}
            onChange={(e) => applyPreset(e.target.value)}
            className="min-h-10 rounded-lg border border-ink/15 bg-surface px-3 py-2 text-sm text-ink"
          >
            {presetCalcs.map((p) => (
              <option key={p.slug} value={p.slug}>{p.label}</option>
            ))}
          </select>
        </label>
      )}

      <div className="flex flex-wrap gap-4">
        {numberField("Advertised price", advertised, setAdvertised, { step: 0.5, prefix: "£", suffix: "/mo" })}
        {numberField("Contract length", contractMonths, (n) => setContractMonths(Math.max(1, Math.round(n))), { step: 1, suffix: "months", min: 1 })}
        {numberField("Out-of-contract price", outOfContract, setOutOfContract, { step: 0.5, prefix: "£", suffix: "/mo" })}
      </div>

      <div className="flex flex-wrap gap-4">
        {numberField("Up-front / setup cost", upfront, setUpfront, { step: 1, prefix: "£" })}
        {numberField("Early-exit fee", exitFee, setExitFee, { step: 1, prefix: "£" })}
        <label className="flex min-w-40 flex-1 flex-col gap-1">
          <span className="text-xs font-medium text-ink-muted">Cost over (horizon)</span>
          <select
            value={horizon}
            onChange={(e) => setHorizon(Number(e.target.value))}
            className="min-h-10 rounded-lg border border-ink/15 bg-surface px-3 py-2 text-sm text-ink"
          >
            {[12, 18, 24, 36, 48].map((m) => (
              <option key={m} value={m}>{m} months</option>
            ))}
          </select>
        </label>
      </div>

      {/* Price-rise model */}
      <fieldset className="space-y-3 rounded-lg border border-ink/10 p-3">
        <legend className="px-1 text-xs font-medium text-ink-muted">Mid-contract price rise</legend>
        <div className="flex flex-wrap gap-2">
          {([
            ["fixed_pence", "Fixed £/month (2025+)"],
            ["cpi_plus", "CPI + %"],
            ["rpi_plus", "RPI + %"],
            ["none", "No rise"]
          ] as [PriceRiseType, string][]).map(([t, label]) => (
            <button
              key={t}
              type="button"
              onClick={() => setRiseType(t)}
              className={`min-h-10 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                riseType === t ? "bg-brand-accent text-white" : "border border-ink/15 bg-surface text-ink hover:border-brand-accent/40"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {riseType === "fixed_pence" && numberField("Annual rise", fixedRise, setFixedRise, { step: 0.5, prefix: "£", suffix: "/mo per year" })}
        {(riseType === "cpi_plus" || riseType === "rpi_plus") && (
          <div className="flex flex-wrap gap-4">
            {numberField("Plus percent", plusPercent, setPlusPercent, { step: 0.1, suffix: "%" })}
            {numberField("Assumed index (CPI/RPI)", assumedIndex, setAssumedIndex, { step: 0.1, suffix: "%" })}
          </div>
        )}
      </fieldset>

      {/* Results */}
      <div className="flex flex-wrap gap-3">
        <div className="min-w-44 flex-1 rounded-lg border border-ink/10 bg-surface p-3">
          <p className="text-xs font-medium text-ink-muted">Advertised over {horizon} mo</p>
          <p className="text-2xl font-bold tracking-tight text-ink">{formatPence(result.advertisedHorizonPence)}</p>
          <p className="text-xs text-ink-muted">if the price never changed</p>
        </div>
        <div className="min-w-44 flex-1 rounded-lg border border-brand-accent/30 bg-brand-accent/[0.06] p-3">
          <p className="text-xs font-medium text-brand-accent">Real cost over {horizon} mo</p>
          <p className="text-2xl font-bold tracking-tight text-ink">{formatPence(result.horizonTotalPence)}</p>
          <p className="text-xs text-ink-muted">≈ {formatPence(result.effectiveMonthlyPence)}/mo effective</p>
        </div>
        <div className="min-w-44 flex-1 rounded-lg border border-ink/10 bg-surface p-3">
          <p className="text-xs font-medium text-ink-muted">Hidden extra</p>
          <p className="text-2xl font-bold tracking-tight text-ink">
            {result.hiddenExtraPence > 0 ? "+" : ""}
            {formatPence(Math.max(0, result.hiddenExtraPence))}
          </p>
          <p className="text-xs text-ink-muted">above the headline price</p>
        </div>
      </div>

      <p className="text-xs text-ink-muted">
        Estimate only — rises are modelled annually from sign-up; actual timing (usually each April) and any exit fee
        depend on your contract. Not financial advice.
      </p>
    </div>
  );
}
