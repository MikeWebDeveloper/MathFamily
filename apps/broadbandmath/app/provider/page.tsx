import type { Metadata } from "next";
import Link from "next/link";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, itemListLd, JsonLd } from "@mathfamily/geo";
import { EmailCaptureSlot, FeeGrid, FreshnessBadge, PageHeading } from "@mathfamily/ui";
import { loadBroadbandDataset, listProviders, plansByProvider } from "@/lib/broadband-data";
import { planCostModel } from "@/lib/broadband-content";

export const metadata: Metadata = {
  title: "UK broadband true cost by provider — BT, Sky, Virgin, Vodafone, TalkTalk",
  description:
    "Real cost of broadband by provider once mid-contract price rises and out-of-contract prices are counted. Advertised price vs true contract cost, sourced and date-stamped."
};

export default function ProviderIndexPage() {
  const { plans, lastUpdated } = loadBroadbandDataset();
  const providers = listProviders();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002";

  const rows = providers.map((pr) => {
    const ps = plansByProvider(pr.slug);
    const cheapestReal = ps
      .map((p) => planCostModel(p).contract.effectiveMonthlyPence)
      .sort((a, b) => a - b)[0];
    return [
      <Link key="p" href={`/provider/${pr.slug}`} className="font-medium text-brand-accent underline-offset-4 hover:underline">
        {pr.name}
      </Link>,
      String(ps.length),
      cheapestReal != null ? `${formatPence(cheapestReal)}/mo` : "—"
    ];
  });

  return (
    <article className="space-y-6">
      <JsonLd data={breadcrumbLd([{ name: "Home", url: siteUrl }, { name: "By provider", url: `${siteUrl}/provider` }])} />
      <JsonLd
        data={itemListLd({
          name: "UK broadband providers — true cost",
          items: providers.map((pr) => ({ name: pr.name, url: `${siteUrl}/provider/${pr.slug}` }))
        })}
      />

      <header className="space-y-3">
        <PageHeading>UK broadband true cost, by provider</PageHeading>
        <FreshnessBadge verifiedAt={lastUpdated} />
      </header>

      <p className="text-ink-muted">
        Pick a provider to see every tracked deal, its advertised price, and what it actually costs over the contract
        once the mid-contract rise and out-of-contract price are counted.
      </p>

      <FeeGrid
        caption="Effective monthly = the true average cost per month over the contract (incl. mid-contract rises). Seed figures pending live verification."
        columns={["Provider", "Deals tracked", "Cheapest effective"]}
        numericColumns={[1, 2]}
        rows={rows}
      />

      <p className="text-sm text-ink-muted">
        Total deals tracked: {plans.length}. Every figure carries a source URL and verified date on the provider page.
      </p>

      <EmailCaptureSlot
        brandName="BroadbandMath"
        hook="Get notified when broadband prices and switching rules change"
        description="updates when UK broadband prices and switching rules change"
        source="provider"
        privacyHref="/privacy"
      />
    </article>
  );
}
