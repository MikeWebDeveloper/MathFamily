import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
import { REGIONS, USAGE_PROFILES, CAP_PERIOD, getRegion } from "@/lib/energy-data";
import {
  regionPageModel,
  buildRegionFaqs,
  heatPumpVerdictLine
} from "@/lib/energy-content";
import { estimateBillForProfile, formatPounds, formatPoundsPrecise } from "@/lib/energy-calc";
import { AffiliateBlock } from "@/components/affiliate-block";
import { FamilyLinks } from "@/components/family-links";

export const dynamicParams = false;

export function generateStaticParams() {
  return REGIONS.map((r) => ({ region: r.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ region: string }>;
}): Promise<Metadata> {
  const { region: slug } = await params;
  const region = getRegion(slug);
  if (!region) return {};
  const m = regionPageModel(region);
  return {
    title: `${region.name} energy bills ${CAP_PERIOD.split(" to ")[1]?.slice(-4) ?? ""} — Ofgem price cap rates`.trim(),
    description: `${m.answer} Unit rates, standing charges and a heat-pump vs boiler comparison.`
  };
}

export default async function RegionPage({ params }: { params: Promise<{ region: string }> }) {
  const { region: slug } = await params;
  const region = getRegion(slug);
  if (!region) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3004";
  const m = regionPageModel(region);
  const faqs = buildRegionFaqs(region);

  const profileRows = USAGE_PROFILES.map((p) => {
    const est = estimateBillForProfile(region, p);
    return {
      profile: p,
      est
    };
  });

  return (
    <article className="space-y-8">
      <JsonLd data={faqPageLd(faqs)} />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "By region", url: `${siteUrl}/region` },
          { name: region.name, url: `${siteUrl}/region/${region.slug}` }
        ])}
      />
      <JsonLd data={speakableLd({ url: `${siteUrl}/region/${region.slug}` })} />

      <header className="space-y-3">
        <PageHeading>{region.name} energy bills on the Ofgem price cap</PageHeading>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <FreshnessBadge verifiedAt={region.verifiedAt} />
          <SourceCitation url={region.sourceUrl} label="Ofgem price cap" />
        </div>
      </header>

      <div id="mf-answer-anchor">
        <AnswerLead answer={m.answer} />
      </div>

      {!region.verified ? (
        <Callout variant="warning" title="Regional figure shown as a GB-average estimate">
          Ofgem sets a separate cap for {region.name}; its exact unit rates differ from the GB
          average by a few pence. We currently display the verified GB-average rates as an estimate
          for this region and are confirming {region.name}&apos;s exact Ofgem table.
        </Callout>
      ) : null}

      <Callout variant="info" title="Heat pump vs gas boiler" titleAs="h2">
        {heatPumpVerdictLine(region)}
      </Callout>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-ink">
          Estimated annual bill by home size in {region.name}
        </h2>
        <FeeGrid
          caption={`Ofgem price cap, ${CAP_PERIOD} (Direct Debit, incl. VAT). Estimates, not quotes.`}
          columns={["Home size", "Per year", "Per month", "Electricity", "Gas"]}
          numericColumns={[1, 2, 3, 4]}
          rows={profileRows.map(({ profile, est }) => [
            profile.label,
            formatPounds(est.totalPounds),
            formatPoundsPrecise(est.monthlyPounds),
            formatPounds(est.electricityPounds),
            formatPounds(est.gasPounds)
          ])}
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-ink">{region.name} price-cap rates</h2>
        <FeeGrid
          columns={["Fuel", "Unit rate", "Standing charge"]}
          numericColumns={[1, 2]}
          rows={[
            ["Electricity", `${region.electricityUnitRatePence}p/kWh`, `${region.electricityStandingChargePence}p/day`],
            ["Gas", `${region.gasUnitRatePence}p/kWh`, `${region.gasStandingChargePence}p/day`]
          ]}
        />
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <AffiliateBlock category="heat-pump" regionSlug={region.slug} surface="region" />
        <AffiliateBlock category="solar" regionSlug={region.slug} surface="region" />
      </div>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-ink">Frequently asked questions</h2>
        <FaqAccordion items={faqs} />
      </section>

      {/* The funnel must live on the spoke pages too — pSEO traffic lands here, not just home. */}
      <EmailCaptureSlot
        brandName="EnergyMath"
        hook={`Get notified when the ${region.name} price cap changes`}
        description="quarterly UK energy price-cap update"
        source="region"
        privacyHref="/privacy"
      />

      <p className="text-sm">
        <Link href="/region" className="text-brand-accent underline underline-offset-4">
          ← All regions
        </Link>
      </p>

      <p className="rounded-card bg-surface p-4 text-xs text-ink-muted">
        Estimates based on the published Ofgem price cap, not personalised quotes.{" "}
        <strong>Not financial, tax or investment advice.</strong> Heat-pump and solar figures are
        indicative running-cost/payback estimates only — they exclude installation cost and grants.
      </p>

      <SourcesBlock
        sources={[{ label: "Ofgem energy price cap unit rates and standing charges", url: region.sourceUrl, verifiedAt: region.verifiedAt }]}
        method="Annual bills = usage (kWh) × unit rate + 365 × daily standing charge, per fuel, on Ofgem price-cap rates (Direct Debit, incl. VAT). Heat-pump comparison assumes a 90%-efficient boiler and a heat pump at SCOP 3.0, running cost only."
        independenceText="we are not owned by any energy supplier, comparison site or lead-gen network. Any affiliate links are labelled Ad and earn us a commission. This never affects the figures we publish or which option we show as cheapest."
      />

      <FamilyLinks />
    </article>
  );
}
