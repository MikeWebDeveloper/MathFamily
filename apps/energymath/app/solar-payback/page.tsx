import type { Metadata } from "next";
import Link from "next/link";
import { breadcrumbLd, faqPageLd, speakableLd, JsonLd } from "@mathfamily/geo";
import {
  AnswerLead,
  Callout,
  EmailCaptureSlot,
  FaqAccordion,
  FeeGrid,
  FreshnessBadge,
  PageHeading,
  SourceCitation,
  SourcesBlock
} from "@mathfamily/ui";
import {
  GB_AVERAGE,
  GB_VERIFIED_AT,
  OFGEM_SOURCE_URL,
  SEG_SOURCE_URL,
  SEG_TYPICAL_RANGE_PENCE,
  SEG_VERIFIED_AT,
  SOLAR_COST_PER_KWP_RANGE_POUNDS
} from "@/lib/energy-data";
import { buildSolarFaqs, nationalSolarRows } from "@/lib/energy-content";
import {
  DEFAULT_EXPORT_RATE_PENCE,
  DEFAULT_SELF_CONSUMPTION,
  KWH_PER_KWP_PER_YEAR,
  formatPounds
} from "@/lib/energy-calc";
import { AffiliateBlock } from "@/components/affiliate-block";
import { FamilyLinks } from "@/components/family-links";

const REPRESENTATIVE_SYSTEM_SIZES_KWP = [3, 4, 5, 6];

export const metadata: Metadata = {
  title: "Solar panel payback: cost, export rate and years to break even",
  description:
    "Estimate solar panel payback for a typical UK home — install cost per kWp, self-consumption, Smart Export Guarantee (SEG) rates and years to break even, sourced and date-stamped.",
  alternates: { canonical: "/solar-payback" }
};

export default function SolarPaybackPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3004";
  const url = `${siteUrl}/solar-payback`;
  const rows = nationalSolarRows(REPRESENTATIVE_SYSTEM_SIZES_KWP);
  const faqs = buildSolarFaqs();
  const midRow = rows.find((r) => r.systemKwp === 4) ?? rows[0]!;

  return (
    <article className="space-y-8">
      <JsonLd data={faqPageLd(faqs)} />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Solar payback", url }
        ])}
      />
      <JsonLd data={speakableLd({ url })} />

      <header className="space-y-3">
        <PageHeading>Solar panel payback: how many years to break even?</PageHeading>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <FreshnessBadge verifiedAt={SEG_VERIFIED_AT} />
          <SourceCitation url={SEG_SOURCE_URL} label="Smart Export Guarantee, Ofgem" />
        </div>
      </header>

      <div id="mf-answer-anchor">
        <AnswerLead
          answer={`A typical ${midRow.systemKwp} kWp home solar system costs around ${formatPounds(
            midRow.typicalCostPounds
          )} installed and pays back in about ${midRow.payback.paybackYears?.toFixed(1) ?? "N/A"} years at the GB-average electricity rate — using ${Math.round(
            DEFAULT_SELF_CONSUMPTION * 100
          )}% self-consumption and a ${DEFAULT_EXPORT_RATE_PENCE}p/kWh export rate.`}
        />
      </div>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-ink">Payback by system size</h2>
        <p className="text-sm text-ink-muted">
          Assumes {KWH_PER_KWP_PER_YEAR} kWh generated per kWp a year (UK indicative), half self-used
          at the GB-average electricity rate ({GB_AVERAGE.electricityUnitRatePence}p/kWh) and half
          exported at an indicative {DEFAULT_EXPORT_RATE_PENCE}p/kWh Smart Export Guarantee rate, on a
          typical {formatPounds(SOLAR_COST_PER_KWP_RANGE_POUNDS.low)}–
          {formatPounds(SOLAR_COST_PER_KWP_RANGE_POUNDS.high)} per kWp install cost.
        </p>
        <FeeGrid
          caption="Indicative payback — not a personalised quote."
          columns={["System size", "Typical install cost", "Annual benefit", "Payback"]}
          numericColumns={[1, 2, 3]}
          rows={rows.map(({ systemKwp, typicalCostPounds, payback }) => [
            `${systemKwp} kWp`,
            formatPounds(typicalCostPounds),
            formatPounds(payback.annualBenefitPounds),
            payback.paybackYears != null ? `${payback.paybackYears.toFixed(1)} yrs` : "N/A"
          ])}
        />
      </section>

      <Callout variant="info" title="Export rates: the Smart Export Guarantee" titleAs="h2">
        <p>
          Suppliers must pay small-scale generators for exported electricity above zero, but the SEG
          rate itself is set by each supplier — current tariffs sit roughly in a{" "}
          {SEG_TYPICAL_RANGE_PENCE.low}–{SEG_TYPICAL_RANGE_PENCE.high}p/kWh band. Our figures use{" "}
          {DEFAULT_EXPORT_RATE_PENCE}p/kWh as an indicative mid-range rate — shop around, since
          switching your export tariff (without switching your import supplier) can improve payback.
        </p>
      </Callout>

      <AffiliateBlock category="solar" regionSlug="london" surface="solar-payback-page" />

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-ink">Frequently asked questions</h2>
        <FaqAccordion items={faqs} />
      </section>

      <EmailCaptureSlot
        brandName="EnergyMath"
        hook="Get notified when the Ofgem price cap or SEG rates change"
        description="quarterly UK energy update"
        source="solar-payback"
        privacyHref="/privacy"
      />

      <p className="text-sm">
        <Link href="/heat-pump-vs-boiler" className="text-brand-accent underline underline-offset-4">
          ← Heat pump vs boiler
        </Link>
        {" · "}
        <Link href="/" className="text-brand-accent underline underline-offset-4">
          Back to the bill calculator →
        </Link>
      </p>

      <p className="rounded-card bg-surface p-4 text-xs text-ink-muted">
        Figures are indicative estimates, not personalised quotes — real payback depends on your roof
        orientation and shading, your own usage pattern, your installer&apos;s price and your export
        tariff. <strong>Not financial or investment advice.</strong>
      </p>

      <SourcesBlock
        sources={[
          { label: "Ofgem energy price cap unit rates and standing charges", url: OFGEM_SOURCE_URL, verifiedAt: GB_VERIFIED_AT },
          { label: "Smart Export Guarantee (SEG), Ofgem", url: SEG_SOURCE_URL, verifiedAt: SEG_VERIFIED_AT }
        ]}
        method={`Annual benefit = (self-used kWh × electricity unit rate) + (exported kWh × export rate), at ${Math.round(
          DEFAULT_SELF_CONSUMPTION * 100
        )}% self-consumption and ${KWH_PER_KWP_PER_YEAR} kWh/kWp/year generation (UK indicative). Payback = install cost ÷ annual benefit. Install-cost-per-kWp range is a general UK market indication, not an Ofgem or gov.uk figure.`}
        independenceText="we are not owned by any solar installer, panel manufacturer or lead-gen network. Any affiliate links are labelled Ad and earn us a commission. This never affects the figures we publish."
      />

      <FamilyLinks />
    </article>
  );
}
