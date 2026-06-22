import Link from "next/link";
import { formatPence } from "@mathfamily/engine";
import { webSiteLd, JsonLd } from "@mathfamily/geo";
import { EmailCaptureSlot, StatStrip } from "@mathfamily/ui";
import { FamilyLinks } from "@/components/family-links";
import { AffiliateBlock } from "@/components/affiliate-block";
import { TrueCostCalculator } from "@/components/true-cost-calculator";
import { loadBroadbandDataset, listProviders } from "@/lib/broadband-data";
import { planCostModel } from "@/lib/broadband-content";

export default function HomePage() {
  const { plans, speedTiers } = loadBroadbandDataset();
  const providers = listProviders();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002";

  // Find the plan with the largest gap between advertised and real cost, for the stat strip.
  const withGap = plans
    .map((p) => ({ p, m: planCostModel(p) }))
    .sort((a, b) => b.m.contract.hiddenExtraPence - a.m.contract.hiddenExtraPence);
  const worst = withGap[0];

  return (
    <div className="space-y-10">
      <JsonLd data={webSiteLd({ name: "BroadbandMath", url: siteUrl })} />

      <section className="space-y-4">
        <h1 className="text-h1 font-bold tracking-tight text-balance text-ink">
          What does UK broadband{" "}
          <span className="text-brand-accent">really cost</span>?
        </h1>
        <p className="max-w-2xl text-lg text-ink-muted">
          The advertised price is rarely what you pay. Mid-contract price rises and the
          out-of-contract price quietly add up. Put in any deal and see the real cost over the
          contract — every seed figure is sourced and date-stamped.
        </p>
      </section>

      <section>
        <TrueCostCalculator presets={plans} />
      </section>

      <section>
        <StatStrip
          stats={[
            { label: "Deals tracked", value: String(plans.length), note: `across ${providers.length} providers` },
            { label: "Speed tiers", value: String(speedTiers.length), note: "essential → gigabit" },
            worst
              ? {
                  label: "Biggest hidden extra",
                  value: formatPence(Math.max(0, worst.m.contract.hiddenExtraPence)),
                  note: `${worst.p.provider} ${worst.p.planName} over ${worst.p.contractMonths} months`
                }
              : { label: "Biggest hidden extra", value: "—", note: "" }
          ]}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-ink">Browse by provider</h2>
        <nav aria-label="Providers" className="mf-reveal flex flex-wrap gap-2">
          {providers.map((pr) => (
            <Link
              key={pr.slug}
              href={`/provider/${pr.slug}`}
              className="mf-press inline-flex min-h-11 items-center rounded-full border border-ink/10 bg-card px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-brand-accent/40 hover:bg-brand-accent/5"
            >
              {pr.name}
            </Link>
          ))}
        </nav>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-ink">Browse by speed</h2>
        <nav aria-label="Speed tiers" className="mf-reveal flex flex-wrap gap-2">
          {speedTiers.map((t) => (
            <Link
              key={t.slug}
              href={`/speed/${t.slug}`}
              className="mf-press inline-flex min-h-11 items-center rounded-full border border-ink/10 bg-card px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-brand-accent/40 hover:bg-brand-accent/5"
            >
              {t.name}
            </Link>
          ))}
        </nav>
      </section>

      <p className="flex flex-wrap gap-6">
        <Link href="/provider" className="text-base font-semibold text-brand-accent underline underline-offset-4">
          Compare all providers →
        </Link>
        <Link href="/speed" className="text-base font-semibold text-brand-accent underline underline-offset-4">
          Compare by speed →
        </Link>
      </p>

      <AffiliateBlock planSlug="home" surface="home" />

      <EmailCaptureSlot
        brandName="BroadbandMath"
        hook="Get notified when broadband prices and rules change"
        description="updates when UK broadband prices and switching rules change"
        source="home"
        privacyHref="/privacy"
      />

      <FamilyLinks />
    </div>
  );
}
