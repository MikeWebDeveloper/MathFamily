import Link from "next/link";
import type { Metadata } from "next";
import { breadcrumbLd, JsonLd } from "@mathfamily/geo";
import { PageHeading, FreshnessBadge, SourceCitation, EmailCaptureSlot, SourcesBlock } from "@mathfamily/ui";
import { TakeHomeCalculator } from "@/components/take-home-calculator";
import { SoftwareSlot } from "@/components/software-slot";
import { TRADES } from "@/lib/trades";
import { TAX_YEAR, ALL_SOURCES, DATASET_VERIFIED_AT } from "@/lib/tax-rates";

export const metadata: Metadata = {
  title: "Self-employed take-home calculator",
  description:
    `Work out your UK self-employed take-home pay for ${TAX_YEAR.label}: income tax, Class 2 & 4 National Insurance and the £1,000 trading allowance, from current gov.uk rates.`
};

export default function TakeHomePage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002";

  return (
    <article className="space-y-8">
      <JsonLd data={breadcrumbLd([
        { name: "Home", url: siteUrl },
        { name: "Take-home calculator", url: `${siteUrl}/take-home` }
      ])} />

      <header className="space-y-3">
        <PageHeading>Self-employed take-home & tax calculator</PageHeading>
        <p className="max-w-2xl text-lg text-ink-muted">
          Enter your side-hustle income and expenses to estimate your {TAX_YEAR.label} tax, National Insurance and
          what you keep.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <FreshnessBadge verifiedAt={DATASET_VERIFIED_AT} href={null} />
          <SourceCitation url="https://www.gov.uk/self-employed-national-insurance-rates" label="HMRC NIC rates (gov.uk)" />
        </div>
      </header>

      <p className="rounded-card border-l-4 border-l-warning bg-amber-50 px-4 py-3 text-sm font-medium text-ink dark:bg-warning/[0.08]">
        Not tax advice — every figure is an <strong>estimate</strong> from published HMRC rates. Check{" "}
        <a href="https://www.gov.uk/log-in-file-self-assessment-tax-return" rel="noopener noreferrer" target="_blank" className="text-brand-accent underline underline-offset-4">gov.uk</a>{" "}
        or an accountant before you rely on it.
      </p>

      <TakeHomeCalculator initialGrossPounds={25_000} initialExpensesPounds={4_000} />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-ink">Estimates by side-hustle type</h2>
        <nav aria-label="Side hustles" className="grid gap-3 sm:grid-cols-2">
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

      <SoftwareSlot clickref="take-home" />

      <EmailCaptureSlot
        formAction={process.env.NEXT_PUBLIC_MAILERLITE_FORM_ACTION}
        hook="Get notified when HMRC rates or thresholds change"
        source="sidemath-take-home"
      />

      <SourcesBlock
        sources={ALL_SOURCES}
        method="Rates and thresholds are read from the official gov.uk pages and date-stamped. Figures are simplified sole-trader estimates on England/Wales/N. Ireland rates — not tax advice."
      />
    </article>
  );
}
