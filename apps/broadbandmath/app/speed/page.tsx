import type { Metadata } from "next";
import Link from "next/link";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, itemListLd, JsonLd } from "@mathfamily/geo";
import { FeeGrid, FreshnessBadge, PageHeading } from "@mathfamily/ui";
import { loadBroadbandDataset, plansBySpeedTier } from "@/lib/broadband-data";
import { planCostModel } from "@/lib/broadband-content";

export const metadata: Metadata = {
  title: "UK broadband true cost by speed — essential, fast, superfast, ultrafast, gigabit",
  description:
    "Real cost of broadband by speed tier once mid-contract price rises and out-of-contract prices are counted. Compare advertised price vs true cost across speeds."
};

export default function SpeedIndexPage() {
  const { speedTiers, lastUpdated } = loadBroadbandDataset();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002";

  const rows = speedTiers.map((t) => {
    const ps = plansBySpeedTier(t.slug);
    const cheapestReal = ps.map((p) => planCostModel(p).contract.effectiveMonthlyPence).sort((a, b) => a - b)[0];
    return [
      <Link key="t" href={`/speed/${t.slug}`} className="font-medium text-brand-accent underline-offset-4 hover:underline">
        {t.name}
      </Link>,
      String(ps.length),
      cheapestReal != null ? `${formatPence(cheapestReal)}/mo` : "—"
    ];
  });

  return (
    <article className="space-y-6">
      <JsonLd data={breadcrumbLd([{ name: "Home", url: siteUrl }, { name: "By speed", url: `${siteUrl}/speed` }])} />
      <JsonLd
        data={itemListLd({
          name: "UK broadband by speed tier — true cost",
          items: speedTiers.map((t) => ({ name: t.name, url: `${siteUrl}/speed/${t.slug}` }))
        })}
      />

      <header className="space-y-3">
        <PageHeading>UK broadband true cost, by speed</PageHeading>
        <FreshnessBadge verifiedAt={lastUpdated} />
      </header>

      <p className="text-ink-muted">
        Pick a speed tier to compare deals at that speed and see what each one really costs over the contract — not just
        the headline price.
      </p>

      <FeeGrid
        caption="Effective monthly = true average cost per month over the contract. Seed figures pending live verification."
        columns={["Speed tier", "Deals tracked", "Cheapest effective"]}
        numericColumns={[1, 2]}
        rows={rows}
      />
    </article>
  );
}
