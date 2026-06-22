import type { Metadata } from "next";
import Link from "next/link";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, tableLd, JsonLd } from "@mathfamily/geo";
import { FeeGrid, FreshnessBadge, PageHeading, SourcesBlock } from "@mathfamily/ui";
import { TOWNS, datasetLatestVerifiedAt } from "../../lib/rent-data";
import { trueCostOfRenting, townToInput } from "../../lib/rent-content";

export const metadata: Metadata = {
  title: "True cost of renting by UK town — compared",
  description:
    "Compare the real annual cost of renting across UK towns: median rent plus council tax, typical bills and the capped deposit, side by side."
};

export default function TownsIndexPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
  const latestVerified = datasetLatestVerifiedAt();

  const ranked = TOWNS.map((t) => ({ town: t, result: trueCostOfRenting(townToInput(t)) })).sort(
    (a, b) => a.result.annualTrueCostPence - b.result.annualTrueCostPence
  );

  const columns = ["Town", "Real cost / year", "Median rent / mo", "Council tax / mo", "Bills / mo", "Deposit"];

  return (
    <article className="space-y-8">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Towns", url: `${siteUrl}/towns` }
        ])}
      />
      <JsonLd
        data={tableLd({
          about: "True cost of renting by UK town",
          url: `${siteUrl}/towns`,
          columns,
          rowCount: ranked.length,
          dateModified: latestVerified
        })}
      />

      <header className="space-y-3">
        <PageHeading>The true cost of renting, by UK town</PageHeading>
        <p className="max-w-2xl text-lead text-ink-muted">
          Each town&apos;s real annual cost = median monthly rent + Band D council tax + typical
          bills, over a year. The refundable deposit is shown separately. Sorted cheapest first.
        </p>
        <FreshnessBadge verifiedAt={latestVerified} href={null} />
      </header>

      <FeeGrid
        caption={`Real annual cost of renting across ${ranked.length} towns (seed estimates, verified ${latestVerified}).`}
        columns={columns}
        numericColumns={[1, 2, 3, 4, 5]}
        rowHref={(i) => `/towns/${ranked[i]!.town.townSlug}`}
        rows={ranked.map(({ town, result }) => [
          town.townName,
          formatPence(result.annualTrueCostPence),
          formatPence(town.medianMonthlyRentPence),
          formatPence(town.councilTaxBandDMonthlyPence),
          formatPence(town.typicalBillsMonthlyPence),
          formatPence(result.depositPence)
        ])}
      />

      <nav aria-label="Town pages" className="flex flex-wrap gap-3 text-sm">
        {ranked.map(({ town }) => (
          <Link
            key={town.townSlug}
            href={`/towns/${town.townSlug}`}
            className="font-medium text-brand-accent underline underline-offset-4"
          >
            {town.townName} →
          </Link>
        ))}
      </nav>

      <SourcesBlock
        sources={[
          {
            label: "ONS — Price Index of Private Rents (PIPR)",
            url: "https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/privaterentandhousepricesuk/latest",
            verifiedAt: latestVerified
          },
          {
            label: "gov.uk — Tenant Fees Act 2019 (5-week deposit cap)",
            url: "https://www.gov.uk/government/publications/tenant-fees-act-2019-guidance/tenant-fees-act-2019-guidance-for-tenants",
            verifiedAt: latestVerified
          },
          {
            label: "Ofgem — energy price cap",
            url: "https://www.ofgem.gov.uk/energy-price-cap",
            verifiedAt: latestVerified
          }
        ]}
        method="Rent figures approximate the ONS median private rent for each local authority; council tax uses each billing authority's Band D charge; bills approximate the Ofgem energy price cap plus a typical water bill. Seed figures are re-verified against the official source before they are published as confirmed."
      />

      <p className="text-xs text-ink-muted">
        Information only — not a recommendation, not financial advice. Confirm every figure with the
        landlord and your local council before you commit.
      </p>
    </article>
  );
}
