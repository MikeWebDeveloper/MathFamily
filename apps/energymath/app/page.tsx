import Link from "next/link";
import { webSiteLd, faqPageLd, JsonLd } from "@mathfamily/geo";
import { ChapterDivider, EmailCaptureSlot, FaqAccordion, StatStrip } from "@mathfamily/ui";
import { BillCalculator } from "@/components/bill-calculator";
import { AffiliateBlock } from "@/components/affiliate-block";
import { FamilyLinks } from "@/components/family-links";
import {
  REGIONS,
  USAGE_PROFILES,
  GB_AVERAGE,
  CAP_PERIOD,
  CAP_PERIOD_SHORT,
  TDCV_NOTE
} from "@/lib/energy-data";
import { homeFaqs, sortRegionsByBill } from "@/lib/energy-content";
import { formatPounds } from "@/lib/energy-calc";

export default function HomePage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3004";
  const faqs = homeFaqs();
  const ranked = sortRegionsByBill(REGIONS);

  return (
    <div className="space-y-10">
      <JsonLd data={webSiteLd({ name: "EnergyMath", url: siteUrl })} />
      <JsonLd data={faqPageLd(faqs)} />

      {/* Calculator-first: the interactive BillCalculator renders above the fold, directly under a
          tight hook, so the primary tool is the first thing a visitor sees — regions, the affiliate
          rail and the email funnel follow below. */}
      <section className="space-y-4">
        <h1 className="text-h1 font-bold tracking-tight text-balance text-ink">
          What does your home energy{" "}
          <span className="text-brand-accent">actually cost</span>?
        </h1>
        <p className="max-w-2xl text-ink-muted">
          Estimate your UK annual gas and electricity bill from the Ofgem price cap — pick your
          region and home size below. Every rate is sourced from Ofgem and date-stamped.
        </p>
        <BillCalculator regions={REGIONS} profiles={USAGE_PROFILES} defaultRegionSlug="london" />
      </section>

      <section>
        <StatStrip
          stats={[
            {
              label: "Typical dual-fuel bill",
              value: formatPounds(GB_AVERAGE.typicalDualFuelAnnualPounds),
              note: `Ofgem price cap, ${CAP_PERIOD_SHORT} (GB average)`
            },
            {
              label: "Electricity unit rate",
              value: `${GB_AVERAGE.electricityUnitRatePence}p`,
              note: `per kWh + ${GB_AVERAGE.electricityStandingChargePence}p/day standing`
            },
            {
              label: "Gas unit rate",
              value: `${GB_AVERAGE.gasUnitRatePence}p`,
              note: `per kWh + ${GB_AVERAGE.gasStandingChargePence}p/day standing`
            }
          ]}
        />
      </section>

      <ChapterDivider label="Where you live" />

      <section className="mf-reveal">
        <h2 className="mb-4 text-xl font-semibold text-ink">Energy bills by UK region</h2>
        <p className="mb-3 text-sm text-ink-muted">
          Ofgem sets a separate price cap for each of the 14 distribution regions. Pick yours for a
          full breakdown (medium-usage estimate, {CAP_PERIOD}).
        </p>
        <nav aria-label="Regions" className="mf-reveal flex flex-wrap gap-2">
          {ranked.map(({ region, estimate }) => (
            <Link
              key={region.slug}
              href={`/region/${region.slug}`}
              className="mf-press inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/10 bg-card px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-brand-accent/40 hover:bg-brand-accent/5"
            >
              {region.name}
              <span className="text-xs font-semibold text-brand-accent">
                ~{formatPounds(estimate.totalPounds)}/yr
              </span>
            </Link>
          ))}
        </nav>
      </section>

      <AffiliateBlock category="switching" regionSlug="london" surface="home" />

      <EmailCaptureSlot
        brandName="EnergyMath"
        hook="Get notified when the Ofgem price cap changes"
        description="quarterly UK energy price-cap update"
        source="home"
        privacyHref="/privacy"
      />

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-ink">Frequently asked questions</h2>
        <FaqAccordion items={faqs} />
      </section>

      <p className="rounded-card bg-surface p-4 text-xs text-ink-muted">
        EnergyMath shows estimates based on the published Ofgem price cap, not personalised quotes.
        Figures are for guidance only and are <strong>not financial, tax or investment advice</strong>.
        {" "}
        {TDCV_NOTE} Always check your own bills and confirm current prices with your supplier.
      </p>

      <FamilyLinks />
    </div>
  );
}
