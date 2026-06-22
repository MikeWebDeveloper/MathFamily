import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, faqPageLd, speakableLd, JsonLd } from "@mathfamily/geo";
import { PageHeading, FreshnessBadge, SourceCitation, AnswerLead, AnswerPassage, FeeGrid, FaqAccordion, Callout, EmailCaptureSlot, SourcesBlock } from "@mathfamily/ui";
import { TakeHomeCalculator } from "@/components/take-home-calculator";
import { SoftwareSlot } from "@/components/software-slot";
import { TRADES, getTrade } from "@/lib/trades";
import { calculateTax } from "@/lib/calc";
import { TAX_YEAR, ALL_SOURCES, DATASET_VERIFIED_AT } from "@/lib/tax-rates";

export const dynamicParams = false;

export function generateStaticParams() {
  return TRADES.map((t) => ({ trade: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ trade: string }> }): Promise<Metadata> {
  const { trade: slug } = await params;
  const t = getTrade(slug);
  if (!t) return {};
  return {
    title: `${t.name} tax & take-home (${TAX_YEAR.label})`,
    description:
      `Estimate ${t.shortName} tax and take-home pay in the UK for ${TAX_YEAR.label}: income tax, Class 2 & 4 National Insurance and the £1,000 trading allowance, from current gov.uk rates.`
  };
}

export default async function TradePage({ params }: { params: Promise<{ trade: string }> }) {
  const { trade: slug } = await params;
  const t = getTrade(slug);
  if (!t) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002";
  const grossPounds = Math.round(t.typicalGrossPence / 100);
  const expPounds = Math.round(t.typicalExpensesPence / 100);

  const b = calculateTax({
    grossPence: t.typicalGrossPence,
    expensesPence: t.typicalExpensesPence,
    useTradingAllowance: false
  });

  const answer = `A ${t.shortName} earning about ${formatPence(t.typicalGrossPence)} with ${formatPence(t.typicalExpensesPence)} of expenses would owe roughly ${formatPence(b.totalTaxPence)} in tax and National Insurance for ${TAX_YEAR.label}, keeping about ${formatPence(b.takeHomePence)} — an estimate, not advice.`;

  const faqs = [
    {
      question: `Do I pay tax as a self-employed ${t.shortName}?`,
      answer: `If your gross ${t.shortName} income is more than £1,000 a year you usually register for Self Assessment and may owe income tax and Class 4 National Insurance on your profit. Under £1,000 the trading allowance normally means nothing to report. This is an estimate — check gov.uk.`
    },
    {
      question: `What can a ${t.shortName} claim as expenses?`,
      answer: `Typical allowable costs include ${t.commonExpenses.slice(0, 3).map((e) => e.toLowerCase()).join(", ")} and similar costs wholly for the business. Keep receipts; only claim what HMRC allows.`
    },
    {
      question: `Should a ${t.shortName} use the £1,000 trading allowance?`,
      answer: t.allowanceNote
    }
  ];

  return (
    <article className="space-y-8">
      <JsonLd data={faqPageLd(faqs)} />
      <JsonLd data={breadcrumbLd([
        { name: "Home", url: siteUrl },
        { name: "Take-home calculator", url: `${siteUrl}/take-home` },
        { name: t.name, url: `${siteUrl}/take-home/${t.slug}` }
      ])} />
      <JsonLd data={speakableLd({ url: `${siteUrl}/take-home/${t.slug}` })} />

      <header className="space-y-3">
        <PageHeading>{t.name}: UK tax &amp; take-home ({TAX_YEAR.label})</PageHeading>
        <div className="flex flex-wrap items-center gap-3">
          <FreshnessBadge verifiedAt={DATASET_VERIFIED_AT} href={null} />
          <SourceCitation url="https://www.gov.uk/income-tax-rates" label="HMRC rates (gov.uk)" />
        </div>
      </header>

      <p className="rounded-card border-l-4 border-l-warning bg-amber-50 px-4 py-3 text-sm font-medium text-ink dark:bg-warning/[0.08]">
        Not tax advice — the figures below are <strong>estimates</strong> from published HMRC rates and an
        illustrative income profile. Your real bill depends on your own income and expenses. Check{" "}
        <a href="https://www.gov.uk/set-up-self-employed" rel="noopener noreferrer" target="_blank" className="text-brand-accent underline underline-offset-4">gov.uk</a>{" "}
        or an accountant.
      </p>

      <AnswerLead answer={answer}>
        {[
          `Typical income: ${formatPence(t.typicalGrossPence)} gross`,
          `Typical expenses: ${formatPence(t.typicalExpensesPence)}`,
          `Estimated tax & NIC: ${formatPence(b.totalTaxPence)}`,
          `Estimated take-home: ${formatPence(b.takeHomePence)}`
        ]}
      </AnswerLead>

      <AnswerPassage question={`How much tax does a self-employed ${t.shortName} pay?`}>
        {t.blurb} On a typical {formatPence(t.typicalGrossPence)} of income with {formatPence(t.typicalExpensesPence)} of
        expenses, the {TAX_YEAR.label} estimate is {formatPence(b.incomeTaxPence)} income tax plus {formatPence(b.class4Pence)} Class 4
        National Insurance, leaving about {formatPence(b.takeHomePence)}. Class 2 is treated as paid once profit reaches £7,105.
        Adjust the figures below to match your own situation.
      </AnswerPassage>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">Estimate for your own numbers</h2>
        <TakeHomeCalculator initialGrossPounds={grossPounds} initialExpensesPounds={expPounds} />
      </section>

      <FeeGrid
        caption={`Illustrative ${t.shortName} estimate for ${TAX_YEAR.label} (not a benchmark or guarantee).`}
        columns={["Item", "Amount"]}
        numericColumns={[1]}
        rows={[
          ["Gross income (typical)", formatPence(t.typicalGrossPence)],
          ["Less expenses (typical)", formatPence(t.typicalExpensesPence)],
          ["Taxable profit", formatPence(b.profitPence)],
          ["Income tax", formatPence(b.incomeTaxPence)],
          ["Class 4 NIC", formatPence(b.class4Pence)],
          ["Class 2 NIC", b.class2Pence === 0 ? "£0 (treated as paid)" : formatPence(b.class2Pence)],
          ["Estimated take-home", formatPence(b.takeHomePence)]
        ]}
      />

      <Callout variant="info" title={`Expenses a ${t.shortName} can usually claim`}>
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          {t.commonExpenses.map((e) => <li key={e}>{e}</li>)}
        </ul>
        <p className="mt-2">{t.allowanceNote}</p>
      </Callout>

      <SoftwareSlot clickref={`trade-${t.slug}`} />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-ink">Frequently asked questions</h2>
        <FaqAccordion items={faqs} />
      </section>

      <EmailCaptureSlot
        brandName="SideMath"
        hook="Get notified when HMRC rates or thresholds change"
        description="updates when UK self-employed tax rates or thresholds change"
        source={t.slug}
        privacyHref="/privacy"
      />

      <p className="text-sm">
        <Link href="/take-home" className="text-brand-accent underline underline-offset-4">← All side hustles</Link>
      </p>

      <SourcesBlock
        sources={ALL_SOURCES}
        method="Tax bands, NIC thresholds and the trading allowance are read from the official gov.uk pages and date-stamped. The income profile shown is an illustrative example, not survey data; figures are simplified sole-trader estimates on rUK rates and are not tax advice."
      />
    </article>
  );
}
