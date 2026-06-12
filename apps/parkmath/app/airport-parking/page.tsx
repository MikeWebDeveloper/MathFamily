import type { Metadata } from "next";
import Link from "next/link";
import { loadAirports, loadParkingDataset } from "@mathfamily/data";
import { formatPence, compareParking } from "@mathfamily/engine";
import { itemListLd, JsonLd } from "@mathfamily/geo";
import { FeeGrid, FreshnessBadge, PageHeading } from "@mathfamily/ui";

export const metadata: Metadata = {
  title: "UK airport parking compared — verified gate vs pre-book prices",
  description:
    "Gate (drive-up) vs pre-book parking prices at major UK airports for 3, 7 and 14 days — verified against official airport tariffs and dated portal snapshots."
};

export default function ParkingIndexPage() {
  const airports = new Map(loadAirports().map((a) => [a.slug, a]));
  const dataset = loadParkingDataset();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const latestVerified = dataset.records.map((r) => r.verifiedAt).sort().at(-1) ?? dataset.lastUpdated;

  const rows = dataset.records.map((r) => {
    const c = compareParking(r, 7);
    return {
      slug: r.airportSlug,
      name: airports.get(r.airportSlug)?.name ?? r.airportSlug,
      cheapest: c.cheapest,
      verifiedAt: r.verifiedAt
    };
  });

  return (
    <article className="space-y-6">
      <JsonLd
        data={itemListLd({
          name: "Cheapest 7-day airport parking (verified)",
          items: rows
            .filter((r) => r.cheapest)
            .map((r) => ({
              name: `${r.name} — from ${formatPence(r.cheapest!.totalPence)}`,
              url: `${siteUrl}/airport-parking/${r.slug}`
            }))
        })}
      />
      <header className="space-y-3">
        <PageHeading>UK airport parking, compared honestly</PageHeading>
        <FreshnessBadge verifiedAt={latestVerified} />
      </header>
      <FeeGrid
        caption="7-day cheapest verified option per airport. Click through for all durations, gate prices and the full comparison."
        columns={["Airport", "Cheapest 7-day option", "From", "Verified"]}
        numericColumns={[2]}
        rows={rows.map((r) => [
          <Link key="a" href={`/airport-parking/${r.slug}`} className="font-medium text-brand-accent underline-offset-4 hover:underline">
            {r.name}
          </Link>,
          r.cheapest?.name ?? "—",
          r.cheapest ? formatPence(r.cheapest.totalPence) : "—",
          r.verifiedAt
        ])}
      />
    </article>
  );
}
