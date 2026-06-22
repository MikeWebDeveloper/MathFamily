import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, faqPageLd, JsonLd, speakableLd } from "@mathfamily/geo";
import {
  AnswerLead,
  AnswerPassage,
  Callout,
  EmailCaptureSlot,
  FaqAccordion,
  FeeGrid,
  FreshnessBadge,
  MiniAnswerBar,
  PageHeading,
  SourcesBlock
} from "@mathfamily/ui";
import { AffiliateBlock } from "@/components/affiliate-block";
import { loadBroadbandDataset, plansBySpeedTier } from "@/lib/broadband-data";
import { planCostModel, buildPlanFaqs } from "@/lib/broadband-content";

export const dynamicParams = false;

export function generateStaticParams() {
  return loadBroadbandDataset().speedTiers.map((t) => ({ tier: t.slug }));
}

function getTier(slug: string) {
  const tier = loadBroadbandDataset().speedTiers.find((t) => t.slug === slug);
  if (!tier) return null;
  const plans = plansBySpeedTier(slug);
  return { tier, plans };
}

export async function generateMetadata({ params }: { params: Promise<{ tier: string }> }): Promise<Metadata> {
  const { tier } = await params;
  const data = getTier(tier);
  if (!data) return {};
  return {
    title: `${data.tier.name} broadband true cost 2026 — advertised vs real`,
    description: `What ${data.tier.name.toLowerCase()} broadband really costs over the contract once mid-contract rises and out-of-contract prices are counted. Sourced, date-stamped.`
  };
}

export default async function SpeedDetailPage({ params }: { params: Promise<{ tier: string }> }) {
  const { tier: slug } = await params;
  const data = getTier(slug);
  if (!data) notFound();
  const { tier, plans } = data;
  const { lastUpdated } = loadBroadbandDataset();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002";

  const models = plans.map((p) => planCostModel(p));
  const anyUnverified = plans.some((p) => !p.verified);

  const cheapest =
    models.length > 0
      ? [...models].sort((a, b) => a.contract.effectiveMonthlyPence - b.contract.effectiveMonthlyPence)[0]!
      : null;

  const answer = cheapest
    ? `${tier.name} broadband (${tier.minMbps}${tier.maxMbps ? `–${tier.maxMbps}` : "+"} Mbps) really costs from about ${formatPence(cheapest.contract.effectiveMonthlyPence)}/month over the contract — the cheapest tracked deal is ${cheapest.plan.provider} ${cheapest.plan.planName}, advertised at ${formatPence(cheapest.plan.advertisedMonthlyPence)}/month.`
    : `No deals are tracked yet in the ${tier.name} tier.`;

  const facts = models.map(
    (m) =>
      `${m.plan.provider} ${m.plan.planName} (${m.plan.speedMbps} Mbps): advertised ${formatPence(m.plan.advertisedMonthlyPence)}/mo, real ≈ ${formatPence(m.contract.effectiveMonthlyPence)}/mo over ${m.plan.contractMonths} months.`
  );

  const faqs = cheapest ? buildPlanFaqs(cheapest.plan) : [];
  const sources = Array.from(
    new Map(plans.map((p) => [p.sourceUrl, { label: `${p.provider} broadband deals & price-rise terms`, url: p.sourceUrl, verifiedAt: p.verifiedAt }])).values()
  );

  return (
    <article className="space-y-8">
      {faqs.length > 0 && <JsonLd data={faqPageLd(faqs)} />}
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "By speed", url: `${siteUrl}/speed` },
          { name: tier.name, url: `${siteUrl}/speed/${slug}` }
        ])}
      />
      <JsonLd data={speakableLd({ url: `${siteUrl}/speed/${slug}` })} />

      <header className="space-y-3">
        <PageHeading>{tier.name} broadband: the real cost</PageHeading>
        <FreshnessBadge verifiedAt={lastUpdated} />
      </header>

      <p className="text-ink-muted">{tier.blurb}</p>

      {anyUnverified && (
        <Callout variant="warning" title="Seed figures — verify before relying on them">
          These prices are representative seed data assembled offline and not yet confirmed against providers&apos; live
          pages. Each row links to its official source; check the current figure there before deciding.
        </Callout>
      )}

      <div id="mf-answer-anchor">
        <AnswerLead answer={answer}>{facts}</AnswerLead>
      </div>
      {cheapest && (
        // Only claim "verified" when every row is actually verified:true; while any plan is
        // verified:false these are honest estimates, so the green badge is dropped to match the warning.
        <MiniAnswerBar summary={`${tier.name} · ${anyUnverified ? "estimated real cost" : "real cost"} from ${formatPence(cheapest.contract.effectiveMonthlyPence)}/mo`} verified={!anyUnverified} />
      )}

      <AnswerPassage question={`How much does ${tier.name.toLowerCase()} broadband really cost?`}>
        {answer} Remember the advertised price holds only until the first mid-contract rise, and when the contract ends
        the price rolls onto a higher out-of-contract rate unless you switch.
      </AnswerPassage>

      {models.length > 0 ? (
        <FeeGrid
          caption={`${tier.name} deals — advertised vs true cost over the contract (seed data, verify against source).`}
          columns={["Provider", "Plan", "Speed", "Advertised", "Real (effective)", "Out-of-contract"]}
          numericColumns={[2, 3, 4, 5]}
          rows={models.map((m) => [
            m.plan.provider,
            m.plan.planName,
            `${m.plan.speedMbps} Mbps`,
            `${formatPence(m.plan.advertisedMonthlyPence)}/mo`,
            `${formatPence(m.contract.effectiveMonthlyPence)}/mo`,
            `${formatPence(m.plan.outOfContractMonthlyPence)}/mo`
          ])}
        />
      ) : (
        <p className="text-ink-muted">No deals tracked in this tier yet.</p>
      )}

      <AffiliateBlock planSlug={cheapest?.plan.slug ?? slug} surface="speed" />

      {faqs.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-ink">Frequently asked questions</h2>
          <FaqAccordion items={faqs} />
        </section>
      )}

      <EmailCaptureSlot
        brandName="BroadbandMath"
        hook={`Get notified when ${tier.name.toLowerCase()} broadband prices change`}
        description="updates when UK broadband prices and switching rules change"
        source="speed"
        privacyHref="/privacy"
      />

      <p className="text-sm">
        <Link href="/speed" className="text-brand-accent underline underline-offset-4">← All speed tiers</Link>
      </p>

      {sources.length > 0 && (
        <SourcesBlock
          sources={sources}
          method="Advertised price, contract length, mid-contract price-rise terms and out-of-contract price are taken from each provider's official deals and price-rise pages. The true-cost figure models the stated annual rise across the contract; it is an estimate, not a quote, and is not financial advice."
        />
      )}
    </article>
  );
}
