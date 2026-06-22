import type { Metadata } from "next";
import Link from "next/link";
import { breadcrumbLd, tableLd, JsonLd } from "@mathfamily/geo";
import { FeeGrid, PageHeading, SourcesBlock } from "@mathfamily/ui";
import { REGIONS, CAP_PERIOD, OFGEM_SOURCE_URL, GB_VERIFIED_AT } from "@/lib/energy-data";
import { sortRegionsByBill } from "@/lib/energy-content";
import { formatPounds } from "@/lib/energy-calc";

export const metadata: Metadata = {
  title: `UK energy bills by region — Ofgem price cap ${CAP_PERIOD}`,
  description:
    "Compare typical annual energy bills across all 14 UK distribution regions on the Ofgem price cap, with unit rates and standing charges for gas and electricity."
};

export default function RegionIndexPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3004";
  const ranked = sortRegionsByBill(REGIONS);
  const columns = ["Region", "Typical bill/yr", "Elec p/kWh", "Gas p/kWh"];

  return (
    <article className="space-y-8">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "By region", url: `${siteUrl}/region` }
        ])}
      />
      <JsonLd
        data={tableLd({
          about: "UK energy bills by region under the Ofgem price cap",
          url: `${siteUrl}/region`,
          columns,
          rowCount: ranked.length,
          dateModified: GB_VERIFIED_AT
        })}
      />

      <header className="space-y-3">
        <PageHeading>UK energy bills by region</PageHeading>
        <p className="text-lead text-ink-muted">
          Ofgem sets a separate price cap for each of the 14 GB distribution regions. Typical
          medium-usage dual-fuel bill ({CAP_PERIOD}), cheapest first.
        </p>
      </header>

      <FeeGrid
        caption={`Typical medium-usage dual-fuel bill by region (Ofgem price cap, ${CAP_PERIOD}).`}
        columns={columns}
        numericColumns={[1, 2, 3]}
        rowHref={(i) => `/region/${ranked[i]!.region.slug}`}
        rows={ranked.map(({ region, estimate }) => [
          region.name,
          formatPounds(estimate.totalPounds),
          `${region.electricityUnitRatePence}p`,
          `${region.gasUnitRatePence}p`
        ])}
      />

      <p className="rounded-card bg-surface p-4 text-xs text-ink-muted">
        Figures are estimates based on the published Ofgem price cap, not personalised quotes, and
        are <strong>not financial advice</strong>. Most regional figures are currently shown at the
        GB-average rate as an estimate; we are confirming each region&apos;s exact Ofgem table.
      </p>

      <SourcesBlock
        sources={[{ label: "Ofgem energy price cap unit rates and standing charges", url: OFGEM_SOURCE_URL, verifiedAt: GB_VERIFIED_AT }]}
        method="Annual bills are computed as usage (kWh) × unit rate + 365 × daily standing charge, for gas and electricity, using Ofgem price-cap rates (Direct Debit, incl. VAT). The GB-average rates are verified against Ofgem; per-region precise rates are being confirmed."
      />
    </article>
  );
}
