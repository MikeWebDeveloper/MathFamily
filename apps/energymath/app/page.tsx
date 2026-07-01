import Link from "next/link";
import { webSiteLd, faqPageLd, JsonLd } from "@mathfamily/geo";
import { ChapterDivider, EmailCaptureSlot, FaqAccordion, NavTileGrid, StatStrip } from "@mathfamily/ui";
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
          {ranked.map(({ region, estimate }, i) => {
            // The cheapest region gets the family's reserved "one glow per page" treatment
            // (tokens.css .mf-glow-winner: "reserve for the single recommended/cheapest element") —
            // real semantic state (lowest price cap), not decoration.
            const isCheapest = i === 0;
            return (
              <Link
                key={region.slug}
                href={`/region/${region.slug}`}
                className={`mf-press inline-flex min-h-11 items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium text-ink outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-accent ${
                  isCheapest
                    ? "mf-glow-winner border-brand-accent/25 bg-brand-accent/[0.06]"
                    : "border-ink/10 bg-card hover:border-brand-accent/40 hover:bg-brand-accent/5"
                }`}
              >
                {isCheapest ? (
                  // WCAG AA fix: white-on-bg-brand-accent (#ea580c) measures 3.56:1 at this
                  // 10px size (well below the 4.5:1 normal-text threshold — 10px bold is nowhere
                  // near the 18.66px-bold "large text" cutoff, so 3:1 doesn't apply here). A
                  // scoped darker fill (orange-700 #c2410c, same hue family) clears 5.18:1
                  // without touching the shared --color-brand-accent token used as CTA fill
                  // elsewhere (that's a separate systemic call, tracked for Mike).
                  <span className="rounded-full bg-orange-700 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Cheapest
                  </span>
                ) : null}
                {region.name}
                <span className="text-xs font-semibold text-brand-accent">
                  ~{formatPounds(estimate.totalPounds)}/yr
                </span>
              </Link>
            );
          })}
        </nav>
      </section>

      <ChapterDivider label="Compare more" />

      <section className="mf-reveal space-y-4">
        <h2 className="text-xl font-semibold text-ink">Heat pump, boiler and solar comparisons</h2>
        <NavTileGrid
          variant="primary"
          tiles={[
            {
              href: "/heat-pump-vs-boiler",
              title: "Heat pump vs gas boiler",
              descriptor: "Running cost by home size, install cost and the Boiler Upgrade Scheme grant"
            },
            {
              href: "/solar-payback",
              title: "Solar panel payback",
              descriptor: "Install cost, export rate and years to break even, by system size"
            }
          ]}
        />
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
