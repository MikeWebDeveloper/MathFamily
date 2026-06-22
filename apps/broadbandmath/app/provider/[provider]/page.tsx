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
import { loadBroadbandDataset, listProviders, plansByProvider } from "@/lib/broadband-data";
import { planCostModel, buildPlanFaqs } from "@/lib/broadband-content";

export const dynamicParams = false;

export function generateStaticParams() {
  return listProviders().map((p) => ({ provider: p.slug }));
}

function getProvider(slug: string) {
  const plans = plansByProvider(slug);
  if (plans.length === 0) return null;
  return { name: plans[0]!.provider, plans };
}

export async function generateMetadata({ params }: { params: Promise<{ provider: string }> }): Promise<Metadata> {
  const { provider } = await params;
  const data = getProvider(provider);
  if (!data) return {};
  return {
    title: `${data.name} broadband true cost 2026 — advertised price vs real contract cost`,
    description: `What ${data.name} broadband really costs over the contract once mid-contract price rises and the out-of-contract price are counted. Figures sourced and date-stamped.`
  };
}

export default async function ProviderDetailPage({ params }: { params: Promise<{ provider: string }> }) {
  const { provider: slug } = await params;
  const data = getProvider(slug);
  if (!data) notFound();
  const { name, plans } = data;
  const { lastUpdated } = loadBroadbandDataset();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002";

  const models = plans.map((p) => planCostModel(p));
  const cheapest = [...models].sort((a, b) => a.contract.effectiveMonthlyPence - b.contract.effectiveMonthlyPence)[0]!;

  const anyUnverified = plans.some((p) => !p.verified);

  const answer =
    `${name} broadband deals advertise from ${formatPence(Math.min(...plans.map((p) => p.advertisedMonthlyPence)))}/month, ` +
    `but the real cost over the contract — after the mid-contract rise — works out from about ` +
    `${formatPence(cheapest.contract.effectiveMonthlyPence)}/month (${cheapest.plan.planName}).`;

  const facts = models.map(
    (m) =>
      `${m.plan.planName} (${m.plan.speedMbps} Mbps): advertised ${formatPence(m.plan.advertisedMonthlyPence)}/mo, real ≈ ${formatPence(m.contract.effectiveMonthlyPence)}/mo over ${m.plan.contractMonths} months; out-of-contract ${formatPence(m.plan.outOfContractMonthlyPence)}/mo.`
  );

  const faqs = buildPlanFaqs(cheapest.plan);

  // Deduplicated sources across this provider's plans.
  const sources = Array.from(
    new Map(plans.map((p) => [p.sourceUrl, { label: `${p.provider} broadband deals & price-rise terms`, url: p.sourceUrl, verifiedAt: p.verifiedAt }])).values()
  );

  return (
    <article className="space-y-8">
      <JsonLd data={faqPageLd(faqs)} />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "By provider", url: `${siteUrl}/provider` },
          { name, url: `${siteUrl}/provider/${slug}` }
        ])}
      />
      <JsonLd data={speakableLd({ url: `${siteUrl}/provider/${slug}` })} />

      <header className="space-y-3">
        <PageHeading>{name} broadband: what it really costs over the contract</PageHeading>
        <FreshnessBadge verifiedAt={lastUpdated} />
      </header>

      {anyUnverified && (
        <Callout variant="warning" title="Seed figures — verify before relying on them">
          These prices are representative seed data assembled offline and not yet confirmed against {name}&apos;s live
          pages. Each row links to the official source; check the current figure there before making a decision.
        </Callout>
      )}

      <div id="mf-answer-anchor">
        <AnswerLead answer={answer}>{facts}</AnswerLead>
      </div>
      {/* Only claim "verified" when every row is actually verified:true. While any plan is
          verified:false the figures are honest estimates, so we DROP the green verified badge to
          avoid contradicting the "verify before relying" warning above. */}
      <MiniAnswerBar summary={`${name} · ${anyUnverified ? "estimated real cost" : "real cost"} from ${formatPence(cheapest.contract.effectiveMonthlyPence)}/mo`} verified={!anyUnverified} />

      <AnswerPassage question={`How much does ${name} broadband really cost?`}>
        {answer} The advertised price applies only until the first April rise; after that the monthly charge steps up,
        and when the contract ends it rolls onto the higher out-of-contract price unless you switch. All figures are
        date-stamped and link to {name}&apos;s official pages.
      </AnswerPassage>

      <FeeGrid
        caption={`${name} deals — advertised price vs true cost over the contract (seed data, verify against source).`}
        columns={["Plan", "Speed", "Advertised", "Real (effective)", "Contract total", "Out-of-contract"]}
        numericColumns={[1, 2, 3, 4, 5]}
        rows={models.map((m) => [
          m.plan.planName,
          `${m.plan.speedMbps} Mbps`,
          `${formatPence(m.plan.advertisedMonthlyPence)}/mo`,
          `${formatPence(m.contract.effectiveMonthlyPence)}/mo`,
          formatPence(m.contract.contractTotalPence),
          `${formatPence(m.plan.outOfContractMonthlyPence)}/mo`
        ])}
      />

      <AffiliateBlock planSlug={cheapest.plan.slug} surface="provider" />

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-ink">Frequently asked questions</h2>
        <FaqAccordion items={faqs} />
      </section>

      <EmailCaptureSlot
        brandName="BroadbandMath"
        hook={`Get notified when ${name} broadband prices or terms change`}
        description="updates when UK broadband prices and switching rules change"
        source="provider"
        privacyHref="/privacy"
      />

      <p className="text-sm">
        <Link href="/provider" className="text-brand-accent underline underline-offset-4">← All providers</Link>
      </p>

      <SourcesBlock
        sources={sources}
        method="Advertised price, contract length, mid-contract price-rise terms and out-of-contract price are taken from each provider's official deals and price-rise pages. The true-cost figure models the stated annual rise across the contract; it is an estimate, not a quote, and is not financial advice."
      />
    </article>
  );
}
