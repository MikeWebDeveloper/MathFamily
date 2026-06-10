import type { Metadata } from "next";
import Link from "next/link";
import { loadAirports, loadDropOffDataset } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { datasetLd, JsonLd } from "@mathfamily/geo";
import { FeeGrid, FreshnessBadge } from "@mathfamily/ui";
import { isPerEntryTariff } from "@/lib/content";

export const metadata: Metadata = {
  title: "UK airport drop-off charges 2026 — every airport compared",
  description:
    "Current drop-off (kiss and fly) charges at every major UK airport: fee, time limit, penalty and the free alternative. Verified against official airport pages."
};

export default function MasterTablePage() {
  const airports = new Map(loadAirports().map((a) => [a.slug, a]));
  const dataset = loadDropOffDataset();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const records = [...dataset.records].sort(
    (a, b) => (b.bands[0]?.totalPence ?? 0) - (a.bands[0]?.totalPence ?? 0)
  );
  const latestVerified = records.map((r) => r.verifiedAt).sort().at(-1) ?? dataset.lastUpdated;

  return (
    <article className="space-y-6">
      <JsonLd
        data={datasetLd({
          name: "UK airport drop-off charges",
          description: `Drop-off fees, time limits, penalties and free alternatives at ${records.length} UK airports, verified against official airport pages.`,
          url: `${siteUrl}/drop-off-charges`,
          dateModified: latestVerified,
          creatorName: "ParkMath"
        })}
      />
      <header className="space-y-3">
        <h1 className="text-3xl font-bold text-ink">UK airport drop-off charges, compared</h1>
        <FreshnessBadge verifiedAt={latestVerified} />
      </header>
      <FeeGrid
        caption="Sorted by entry fee, highest first. Data verified per airport — click through for details, sources and the free alternative."
        columns={["Airport", "Fee", "Time limit", "Penalty", "Free alternative", "Verified"]}
        rows={records.map((r) => {
          const airport = airports.get(r.airportSlug);
          return [
            <Link key="a" href={`/drop-off-charges/${r.airportSlug}`} className="font-medium text-brand-accent underline-offset-4 hover:underline">
              {airport?.name ?? r.airportSlug}
            </Link>,
            r.isFree ? "Free" : formatPence(r.bands[0]?.totalPence ?? 0),
            r.isFree ? "—" : isPerEntryTariff(r) ? "Per entry" : `${r.bands[0]?.upToMinutes ?? "—"} min`,
            r.penaltyPence !== null ? formatPence(r.penaltyPence) : "—",
            r.freeAlternative ? `${r.freeAlternative.name} (${r.freeAlternative.minutesFree} min)` : "—",
            r.verifiedAt
          ];
        })}
      />
    </article>
  );
}
