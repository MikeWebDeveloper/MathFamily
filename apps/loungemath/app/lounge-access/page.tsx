import type { Metadata } from "next";
import Link from "next/link";
import { loadLoungeDataset, loadAirports } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { datasetLd, breadcrumbLd, JsonLd } from "@mathfamily/geo";
import { FeeGrid, PageHeading, FreshnessBadge, SourcesBlock } from "@mathfamily/ui";
import { latestVerifiedAt } from "@/lib/lounge-content";

export const metadata: Metadata = {
  title: "UK airport lounges compared — access, price & Priority Pass",
  description:
    "Every UK airport lounge we track, with the cheapest published walk-in price and whether Priority Pass is accepted. Verified against official sources and date-stamped.",
};

export default function LoungeAccessIndexPage() {
  const ds = loadLoungeDataset();
  const airports = loadAirports();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3003";
  const latest = latestVerifiedAt();

  const rows = ds.records
    .map((r) => {
      const airport = airports.find((a) => a.slug === r.airportSlug);
      const priced = r.lounges
        .map((l) => l.walkInPence)
        .filter((p): p is number => p !== null)
        .sort((a, b) => a - b);
      return {
        slug: r.airportSlug,
        name: airport?.name ?? r.airportSlug,
        loungeCount: r.lounges.length,
        cheapestPence: priced[0] ?? null,
        priorityPass: r.lounges.some((l) => l.priorityPass),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-8">
      <JsonLd
        data={datasetLd({
          name: "UK airport lounge access",
          description: "Per-airport airport-lounge access methods and walk-in prices, UK.",
          url: `${siteUrl}/lounge-access`,
          dateModified: ds.lastUpdated,
          siteUrl,
          creatorName: "LoungeMath",
        })}
      />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "UK airport lounges", url: `${siteUrl}/lounge-access` },
        ])}
      />

      <header className="space-y-3">
        <PageHeading>UK airport lounges, compared</PageHeading>
        <p className="max-w-2xl text-ink-muted">
          Every UK airport we cover, with the cheapest published walk-in price and whether Priority
          Pass gets you in. Open an airport for its full lounge list and a membership break-even.
        </p>
        <FreshnessBadge verifiedAt={latest} href={null} />
      </header>

      <FeeGrid
        caption={`Cheapest published walk-in price per airport (verified ${latest}). Prices are operator from-prices and change by date.`}
        columns={["Airport", "Lounges", "Cheapest from", "Priority Pass"]}
        numericColumns={[2]}
        rowHref={(i) => `/lounge-access/${rows[i]!.slug}`}
        rows={rows.map((r) => [
          r.name,
          String(r.loungeCount),
          r.cheapestPence !== null ? formatPence(r.cheapestPence) : "Dynamic",
          r.priorityPass ? "Accepted" : "Not confirmed",
        ])}
      />

      <p className="text-sm">
        <Link href="/" className="text-brand-accent underline underline-offset-4">
          ← Back to home
        </Link>
      </p>

      <SourcesBlock
        sources={ds.records.map((r) => ({
          label: `${airports.find((a) => a.slug === r.airportSlug)?.name ?? r.airportSlug} lounge source`,
          url: r.sourceUrl,
          verifiedAt: r.verifiedAt,
        }))}
        method="Walk-in prices and access methods are taken from the lounge operator's or airport's own official page. We never publish a price without an official source and a verification date."
      />
    </div>
  );
}
