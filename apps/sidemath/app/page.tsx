import Link from "next/link";
import type { Metadata } from "next";
import { formatPence } from "@mathfamily/engine";
import { webSiteLd, faqPageLd, JsonLd } from "@mathfamily/geo";
import { EmailCaptureSlot, StatStrip, FreshnessBadge, SourceCitation, AnswerLead, FaqAccordion, SourcesBlock } from "@mathfamily/ui";
import { TakeHomeCalculator } from "@/components/take-home-calculator";
import { SoftwareSlot } from "@/components/software-slot";
import { FamilyLinks } from "@/components/family-links";
import { TRADES } from "@/lib/trades";
import { calculateTax } from "@/lib/calc";
import { TAX_YEAR, ALL_SOURCES, DATASET_VERIFIED_AT, TRADING_ALLOWANCE_PENCE } from "@/lib/tax-rates";

export const metadata: Metadata = {
  description:
    "Estimate your UK self-employed tax and take-home pay for the 2026/27 tax year — income tax, Class 2 & 4 National Insurance and the £1,000 trading allowance, using current HMRC rates from gov.uk."
};

// A representative worked figure for the headline stat (£20,000 income, £4,000 expenses).
const SAMPLE = calculateTax({ grossPence: 2_000_000, expensesPence: 400_000, useTradingAllowance: false });

const FAQS = [
  {
    question: "Do I have to pay tax on a side hustle in the UK?",
    answer:
      "If your gross self-employed income is more than £1,000 in a tax year you usually need to register for Self Assessment and may owe income tax and National Insurance. Below £1,000 the trading allowance normally means there is nothing to report. This is an estimate — check gov.uk."
  },
  {
    question: "What is the £1,000 trading allowance?",
    answer:
      "It is a tax-free allowance on trading income. If your gross side income is £1,000 or less you may not need to tell HMRC. If it is more, you can deduct £1,000 instead of your actual expenses — whichever is bigger saves you more."
  },
  {
    question: "What National Insurance do the self-employed pay?",
    answer:
      "For 2026/27, Class 4 NIC is 6% on profits between £12,570 and £50,270 and 2% above that. Class 2 is treated as paid (no bill) once profits reach £7,105, so you still build State Pension entitlement without a separate Class 2 charge."
  },
  {
    question: "Is SideMath tax advice?",
    answer:
      "No. SideMath gives simplified estimates using published HMRC rates so you can sense-check a figure. It is not tax advice and does not cover every situation — always confirm on gov.uk or with an accountant before you rely on a number."
  }
];

export default function HomePage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002";

  return (
    <div className="space-y-10">
      <JsonLd data={webSiteLd({ name: "SideMath", url: siteUrl })} />
      <JsonLd data={faqPageLd(FAQS)} />

      <section className="space-y-4">
        <h1 className="mf-speakable text-h1 font-bold tracking-tight text-balance text-ink">
          What does your <span className="text-brand-accent">side hustle</span> owe in tax?
        </h1>
        <p className="mf-speakable max-w-2xl text-lg text-ink-muted">
          Estimate your UK self-employed take-home pay for {TAX_YEAR.label}: income tax, Class 2 &amp; 4 National
          Insurance and the £1,000 trading allowance — every rate sourced from gov.uk and date-stamped.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <FreshnessBadge verifiedAt={DATASET_VERIFIED_AT} href={null} />
          <SourceCitation url="https://www.gov.uk/income-tax-rates" label="HMRC rates (gov.uk)" />
        </div>
      </section>

      {/* Prominent, vertical-specific disclaimer */}
      <p className="rounded-card border-l-4 border-l-warning bg-amber-50 px-4 py-3 text-sm font-medium text-ink dark:bg-warning/[0.08]">
        Not tax advice. Every figure here is an <strong>estimate</strong> from published HMRC rates to help you
        sense-check your own numbers. Always check{" "}
        <a href="https://www.gov.uk/set-up-self-employed" rel="noopener noreferrer" target="_blank" className="text-brand-accent underline underline-offset-4">gov.uk</a>{" "}
        or an accountant before you rely on it.
      </p>

      <section>
        <TakeHomeCalculator initialGrossPounds={18_000} initialExpensesPounds={3_000} />
      </section>

      <section>
        <StatStrip stats={[
          { label: "Tax year", value: TAX_YEAR.label, note: "England, Wales & N. Ireland rates" },
          { label: "Trading allowance", value: formatPence(TRADING_ALLOWANCE_PENCE), note: "tax-free side income" },
          { label: "Take-home on £20k", value: formatPence(SAMPLE.takeHomePence), note: `£20,000 income, £4,000 expenses → ${formatPence(SAMPLE.totalTaxPence)} tax` }
        ]} />
      </section>

      <AnswerLead answer="Most UK side hustles earning over £1,000 a year pay income tax (from 20%) plus 6% Class 4 National Insurance on profit above £12,570 — but your real bill depends on your total income and expenses.">
        {[
          "Income tax: 20% from £12,570, 40% from £50,270, 45% above £125,140.",
          "Class 4 NIC: 6% on profit £12,570–£50,270, then 2%.",
          "Class 2 NIC: treated as paid (no bill) once profit reaches £7,105.",
          "First £1,000 of gross trading income can be tax-free via the trading allowance."
        ]}
      </AnswerLead>

      {/* Spokes by trade */}
      <section id="trades" className="space-y-4 scroll-mt-24">
        <h2 className="text-xl font-semibold text-ink">Tax by side-hustle type</h2>
        <p className="max-w-2xl text-sm text-ink-muted">
          Worked estimates for common UK side hustles, each with the expenses people in that trade can usually claim.
        </p>
        <nav aria-label="Side hustles" className="mf-reveal grid gap-3 sm:grid-cols-2">
          {TRADES.map((t) => (
            <Link
              key={t.slug}
              href={`/take-home/${t.slug}`}
              className="mf-press group rounded-card border border-ink/10 bg-card p-4 transition-colors hover:border-brand-accent/40 hover:bg-brand-accent/[0.04]"
            >
              <p className="font-semibold text-ink group-hover:text-brand-accent">{t.name}</p>
              <p className="mt-0.5 text-sm text-ink-muted">{t.blurb}</p>
            </Link>
          ))}
        </nav>
      </section>

      <SoftwareSlot clickref="home" />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-ink">Common questions</h2>
        <FaqAccordion items={FAQS} />
      </section>

      <EmailCaptureSlot
        formAction={process.env.NEXT_PUBLIC_MAILERLITE_FORM_ACTION}
        hook="Get notified when HMRC rates or thresholds change"
        source="sidemath-home"
      />

      <FamilyLinks />

      <SourcesBlock
        sources={ALL_SOURCES}
        method="Income tax bands, National Insurance thresholds and the trading allowance are read directly from the official gov.uk pages and date-stamped. Calculations are simplified estimates for a sole trader on rUK rates and are not tax advice."
      />
    </div>
  );
}
