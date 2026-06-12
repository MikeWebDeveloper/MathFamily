import type { Metadata } from "next";
import { loadAirports, loadDropOffDataset } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { datasetLd, itemListLd, JsonLd } from "@mathfamily/geo";
import { FreshnessBadge, PageHeading } from "@mathfamily/ui";
import { isPerEntryTariff } from "@/lib/content";
import { SortableFeeTable, type DropOffRow } from "@/components/sortable-fee-table";

export const metadata: Metadata = {
  title: "UK airport drop-off charges 2026 — every airport compared",
  description:
    "Current drop-off (kiss and fly) charges at every major UK airport: fee, time limit, penalty and the free alternative. Verified against official airport pages."
};

export default function MasterTablePage() {
  const airports = new Map(loadAirports().map((a) => [a.slug, a]));
  const dataset = loadDropOffDataset();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  // SSR default: most expensive first (matches "fee" sort key)
  const records = [...dataset.records].sort(
    (a, b) => (b.bands[0]?.totalPence ?? 0) - (a.bands[0]?.totalPence ?? 0)
  );
  const latestVerified = records.map((r) => r.verifiedAt).sort().at(-1) ?? dataset.lastUpdated;

  const rows: DropOffRow[] = records.map((r) => {
    const airport = airports.get(r.airportSlug);
    return {
      airportSlug: r.airportSlug,
      airportName: airport?.name ?? r.airportSlug,
      iata: airport?.iata ?? "???",
      feePence: r.isFree ? 0 : (r.bands[0]?.totalPence ?? 0),
      fee: r.isFree ? "Free" : formatPence(r.bands[0]?.totalPence ?? 0),
      timeLimit: r.isFree ? "—" : isPerEntryTariff(r) ? "Per entry" : `${r.bands[0]?.upToMinutes ?? "—"} min`,
      penalty: r.penaltyPence !== null ? formatPence(r.penaltyPence) : "—",
      freeAlt: r.freeAlternative ? `${r.freeAlternative.name} (${r.freeAlternative.minutesFree} min)` : "—",
      verifiedAt: r.verifiedAt
    };
  });

  return (
    <article className="space-y-6">
      <JsonLd
        data={datasetLd({
          name: "UK airport drop-off charges",
          description: `Drop-off fees, time limits, penalties and free alternatives at ${records.length} UK airports, verified against official airport pages.`,
          url: `${siteUrl}/drop-off-charges`,
          dateModified: latestVerified,
          siteUrl,
          creatorName: "ParkMath"
        })}
      />
      <JsonLd
        data={itemListLd({
          name: "UK airport drop-off charges, highest first",
          items: records.map((r) => ({
            name: `${airports.get(r.airportSlug)?.name ?? r.airportSlug} — ${r.isFree ? "free" : formatPence(r.bands[0]?.totalPence ?? 0)}`,
            url: `${siteUrl}/drop-off-charges/${r.airportSlug}`
          }))
        })}
      />
      <header className="space-y-3">
        <PageHeading>UK airport drop-off charges, compared</PageHeading>
        <FreshnessBadge verifiedAt={latestVerified} />
      </header>
      <SortableFeeTable rows={rows} />
    </article>
  );
}
