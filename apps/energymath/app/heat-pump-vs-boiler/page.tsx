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
  BOILER_UPGRADE_SCHEME,
  BUS_VERIFIED_AT,
  GB_AVERAGE,
  GB_VERIFIED_AT,
  HEAT_PUMP_INSTALL_COST_RANGE_POUNDS,
  OFGEM_SOURCE_URL,
  USAGE_PROFILES
} from "@/lib/energy-data";
import { buildHeatPumpFaqs, heatPumpPageModel, nationalHeatPumpRows } from "@/lib/energy-content";
import { BOILER_EFFICIENCY, DEFAULT_SCOP, formatPounds } from "@/lib/energy-calc";
import { AffiliateBlock } from "@/components/affiliate-block";
import { FamilyLinks } from "@/components/family-links";

export const metadata: Metadata = {
  title: "Heat pump vs gas boiler: running cost, install cost and grants",
  description:
    "Compare a heat pump against a gas boiler on running cost at GB-average Ofgem rates, plus indicative install cost and the Boiler Upgrade Scheme grant — sourced and date-stamped.",
  alternates: { canonical: "/heat-pump-vs-boiler" }
};

export default function HeatPumpVsBoilerPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3004";
  const url = `${siteUrl}/heat-pump-vs-boiler`;
  const rows = nationalHeatPumpRows(USAGE_PROFILES);
  const model = heatPumpPageModel(USAGE_PROFILES);
  const faqs = buildHeatPumpFaqs();

  return (
    <article className="space-y-8">
      <JsonLd data={faqPageLd(faqs)} />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Heat pump vs boiler", url }
        ])}
      />
      <JsonLd data={speakableLd({ url })} />

      <header className="space-y-3">
        <PageHeading>Heat pump vs gas boiler: which costs less?</PageHeading>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <FreshnessBadge verifiedAt={BUS_VERIFIED_AT} />
          <SourceCitation url={BOILER_UPGRADE_SCHEME.sourceUrl} label="Boiler Upgrade Scheme, gov.uk" />
        </div>
      </header>

      <div id="mf-answer-anchor">
        <AnswerLead answer={model.answer} />
      </div>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-ink">Running cost by home size</h2>
        <p className="text-sm text-ink-muted">
          Assumes {Math.round((rows[0]!.gasHeatingKwh / rows[0]!.profile.gasKwhPerYear) * 100)}% of gas
          usage goes on space + water heating, a {Math.round(BOILER_EFFICIENCY * 100)}%-efficient gas
          boiler, and a heat pump at SCOP {DEFAULT_SCOP.toFixed(1)} — all at GB-average Ofgem price-cap
          rates ({GB_AVERAGE.electricityUnitRatePence}p/kWh electricity, {GB_AVERAGE.gasUnitRatePence}
          p/kWh gas).
        </p>
        <FeeGrid
          caption="Heating running cost only — excludes install cost and any grant."
          columns={["Home size", "Gas boiler /yr", "Heat pump /yr", "Heat pump vs boiler"]}
          numericColumns={[1, 2, 3]}
          rows={rows.map(({ profile, comparison }) => [
            profile.label,
            formatPounds(comparison.boilerHeatingCostPounds),
            formatPounds(comparison.heatPumpHeatingCostPounds),
            comparison.cheaper === "heat-pump"
              ? `Heat pump saves ${formatPounds(comparison.annualSavingPounds)}`
              : `Boiler cheaper by ${formatPounds(Math.abs(comparison.annualSavingPounds))}`
          ])}
        />
      </section>

      <Callout variant="info" title="Install cost and the Boiler Upgrade Scheme grant" titleAs="h2">
        <p>
          A fully installed domestic heat pump indicatively costs{" "}
          {formatPounds(HEAT_PUMP_INSTALL_COST_RANGE_POUNDS.low)}–
          {formatPounds(HEAT_PUMP_INSTALL_COST_RANGE_POUNDS.high)} in the UK market before any grant —
          actual quotes vary with property size and radiator upgrades. The government&apos;s Boiler
          Upgrade Scheme deducts {formatPounds(BOILER_UPGRADE_SCHEME.airSourceGrantPounds)} from an
          air-source or ground-source heat pump quote (applied for by your MCS-certified installer),
          bringing a typical net cost to roughly {formatPounds(model.netInstallLowPounds)}–
          {formatPounds(model.netInstallHighPounds)}.
        </p>
        {model.paybackYearsLow != null && model.paybackYearsHigh != null ? (
          <p className="mt-2">
            At the medium-usage running-cost saving above, that net cost pays back in roughly{" "}
            {model.paybackYearsLow.toFixed(1)}–{model.paybackYearsHigh.toFixed(1)} years.
          </p>
        ) : (
          <p className="mt-2">
            At GB-average rates a heat pump doesn&apos;t currently save on running costs for a
            medium-usage home (see the table above), so there is no running-cost payback on the grant
            alone at these assumptions — a heat pump with a higher real-world SCOP, or a narrower
            gas/electricity price gap, changes this. The grant still directly cuts your upfront cost
            regardless.
          </p>
        )}
      </Callout>

      <AffiliateBlock category="heat-pump" regionSlug="london" surface="heat-pump-page" />

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-ink">Frequently asked questions</h2>
        <FaqAccordion items={faqs} />
      </section>

      <EmailCaptureSlot
        brandName="EnergyMath"
        hook="Get notified when the Ofgem price cap or Boiler Upgrade Scheme changes"
        description="quarterly UK energy update"
        source="heat-pump-vs-boiler"
        privacyHref="/privacy"
      />

      <p className="text-sm">
        <Link href="/" className="text-brand-accent underline underline-offset-4">
          ← Back to the bill calculator
        </Link>
        {" · "}
        <Link href="/solar-payback" className="text-brand-accent underline underline-offset-4">
          Solar payback →
        </Link>
      </p>

      <p className="rounded-card bg-surface p-4 text-xs text-ink-muted">
        Running-cost figures are estimates at GB-average Ofgem price-cap rates, not personalised
        quotes. Install cost and grant figures are indicative and general — always get a home survey
        and a firm quote from an MCS-certified installer. <strong>Not financial advice.</strong>
      </p>

      <SourcesBlock
        sources={[
          { label: "Ofgem energy price cap unit rates and standing charges", url: OFGEM_SOURCE_URL, verifiedAt: GB_VERIFIED_AT },
          { label: "Boiler Upgrade Scheme — what you can get, gov.uk", url: BOILER_UPGRADE_SCHEME.sourceUrl, verifiedAt: BUS_VERIFIED_AT },
          { label: "Boiler Upgrade Scheme (BUS), Ofgem", url: BOILER_UPGRADE_SCHEME.ofgemSourceUrl, verifiedAt: BUS_VERIFIED_AT }
        ]}
        method={`Heating running cost = gas heating demand × boiler efficiency⁻¹-adjusted gas rate vs (heat demand ÷ SCOP) × electricity rate, at GB-average Ofgem price-cap rates. Boiler assumed 90% efficient; heat pump at SCOP ${DEFAULT_SCOP.toFixed(1)} (a common planning value) — your real-world SCOP depends on sizing and radiators. Install-cost range is general UK market indication, not an Ofgem or gov.uk figure.`}
        independenceText="we are not owned by any heat-pump installer, boiler manufacturer or lead-gen network. Any affiliate links are labelled Ad and earn us a commission. This never affects the figures we publish or which option we show as cheaper."
      />

      <FamilyLinks />
    </article>
  );
}
