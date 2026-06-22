"use client";

import { useId, useState } from "react";
import { formatPence } from "@mathfamily/engine";
import { SegmentedControl } from "@mathfamily/ui";
import { calculateTax, effectiveRate, type TaxInput } from "../lib/calc";

interface TakeHomeCalculatorProps {
  /** Optional starting figures (a spoke page seeds its trade profile). */
  initialGrossPounds?: number;
  initialExpensesPounds?: number;
}

type DeductionMode = "expenses" | "allowance";

const GROSS_MAX = 150_000;
const EXP_MAX = 60_000;

export function TakeHomeCalculator({
  initialGrossPounds = 18_000,
  initialExpensesPounds = 3_000
}: TakeHomeCalculatorProps) {
  const [grossPounds, setGrossPounds] = useState(initialGrossPounds);
  const [expensesPounds, setExpensesPounds] = useState(initialExpensesPounds);
  const [mode, setMode] = useState<DeductionMode>("expenses");

  const grossId = useId();
  const expId = useId();

  const input: TaxInput = {
    grossPence: Math.round(grossPounds * 100),
    expensesPence: Math.round(expensesPounds * 100),
    useTradingAllowance: mode === "allowance"
  };
  const b = calculateTax(input);
  const effPct = Math.round(effectiveRate(b) * 1000) / 10;

  return (
    <div className="space-y-5 rounded-card border border-ink/10 bg-card p-4 sm:p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        {/* Gross income */}
        <label htmlFor={grossId} className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-ink-muted">
            Self-employed income (before expenses): <strong className="text-ink">£{grossPounds.toLocaleString("en-GB")}</strong>
          </span>
          <input
            id={grossId}
            type="range"
            min={0}
            max={GROSS_MAX}
            step={250}
            value={grossPounds}
            onChange={(e) => setGrossPounds(Number(e.target.value))}
            className="h-2 w-full cursor-pointer accent-brand-accent"
            aria-valuetext={`£${grossPounds} income`}
          />
        </label>

        {/* Expenses */}
        <label htmlFor={expId} className={`flex flex-col gap-1.5 transition-opacity ${mode === "allowance" ? "opacity-40" : ""}`}>
          <span className="text-xs font-medium text-ink-muted">
            Business expenses: <strong className="text-ink">£{expensesPounds.toLocaleString("en-GB")}</strong>
          </span>
          <input
            id={expId}
            type="range"
            min={0}
            max={EXP_MAX}
            step={100}
            value={expensesPounds}
            disabled={mode === "allowance"}
            onChange={(e) => setExpensesPounds(Number(e.target.value))}
            className="h-2 w-full cursor-pointer accent-brand-accent disabled:cursor-not-allowed"
            aria-valuetext={`£${expensesPounds} expenses`}
          />
        </label>
      </div>

      {/* Deduction mode */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium text-ink-muted">Deduct:</span>
        <SegmentedControl<DeductionMode>
          ariaLabel="Deduction method"
          value={mode}
          onChange={setMode}
          options={[
            { value: "expenses", label: "Actual expenses" },
            { value: "allowance", label: "£1,000 trading allowance" }
          ]}
        />
      </div>

      {b.fullRelief ? (
        <div className="rounded-card border border-positive/25 bg-green-50 p-4 text-sm text-ink-muted dark:bg-positive/[0.08]">
          Your gross income is £1,000 or less and you&apos;ve chosen the trading allowance, so this counts as
          <strong className="text-ink"> fully covered</strong> — you may not need to report it at all. Estimate only;
          check the rules on{" "}
          <a href="https://www.gov.uk/guidance/tax-free-allowances-on-property-and-trading-income" rel="noopener noreferrer" target="_blank" className="text-brand-accent underline underline-offset-4">gov.uk</a>.
        </div>
      ) : null}

      {/* Headline result */}
      <div className="grid gap-3 sm:grid-cols-3">
        <ResultCard label="Estimated tax & NIC" value={formatPence(b.totalTaxPence)} tone="muted" note={`≈ ${effPct}% of profit`} />
        <ResultCard label="Take-home from profit" value={formatPence(b.takeHomePence)} tone="accent" note={`on £${(b.profitPence / 100).toLocaleString("en-GB")} profit`} />
        <ResultCard label="Taxable profit" value={formatPence(b.profitPence)} tone="muted" note={mode === "allowance" ? "after £1,000 allowance" : "after expenses"} />
      </div>

      {/* Breakdown */}
      <dl className="grid gap-x-6 gap-y-2 rounded-card bg-surface p-4 text-sm sm:grid-cols-2">
        <Row label="Income tax (20/40/45%)" value={formatPence(b.incomeTaxPence)} />
        <Row label="Class 4 NIC (6% / 2%)" value={formatPence(b.class4Pence)} />
        <Row label="Class 2 NIC" value={b.class2Pence === 0 ? "£0 (treated as paid)" : formatPence(b.class2Pence)} />
        <Row label="Personal Allowance used" value={formatPence(b.personalAllowancePence)} />
      </dl>

      <p className="text-xs leading-relaxed text-ink-muted">
        <strong className="text-ink">Estimate, not advice.</strong> This is a simplified 2026/27 sole-trader
        calculation (income tax + Class 2/4 NIC + trading allowance) for England, Wales &amp; Northern Ireland. It
        ignores payments on account, student loans, the High Income Child Benefit Charge, pension relief, Scottish
        rates and more. Always check{" "}
        <a href="https://www.gov.uk/log-in-file-self-assessment-tax-return" rel="noopener noreferrer" target="_blank" className="text-brand-accent underline underline-offset-4">gov.uk</a>{" "}
        or an accountant before relying on a figure.
      </p>
    </div>
  );
}

function ResultCard({ label, value, note, tone }: { label: string; value: string; note?: string; tone: "accent" | "muted" }) {
  const wrap =
    tone === "accent"
      ? "border-brand-accent/25 bg-brand-accent/[0.06]"
      : "border-ink/10 bg-surface";
  return (
    <div className={`rounded-card border p-4 ${wrap}`}>
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      <p className="mf-num mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">{value}</p>
      {note ? <p className="mt-0.5 text-xs text-ink-muted">{note}</p> : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-ink/5 py-1 last:border-0">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="mf-num font-medium text-ink">{value}</dd>
    </div>
  );
}
