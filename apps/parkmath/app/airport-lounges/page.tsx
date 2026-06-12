import type { Metadata } from "next";
import Link from "next/link";
import { loadAirports, loadLoungeDataset } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { itemListLd, JsonLd } from "@mathfamily/geo";
import { FeeGrid, PageHeading } from "@mathfamily/ui";

export const metadata: Metadata = {
  title: "UK airport lounge prices compared — pre-book from-prices & Priority Pass",
  description: "Pre-book from-prices for lounges at major UK airports, which lounges take Priority Pass, and break-even calculators for membership."
};

export default function LoungeIndexPage() {
  const airports = new Map(loadAirports().map((a) => [a.slug, a]));
  const dataset = loadLoungeDataset();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const rows = dataset.records.map((r) => {
    const priced = r.lounges.filter((l) => l.walkInPence !== null).sort((a, b) => a.walkInPence! - b.walkInPence!);
    return { slug: r.airportSlug, name: airports.get(r.airportSlug)?.name ?? r.airportSlug, from: priced[0]?.walkInPence ?? null, count: r.lounges.length };
  });

  return (
    <article className="space-y-6">
      <JsonLd data={itemListLd({
        name: "UK airport lounges by cheapest pre-book from-price",
        items: rows.map((r) => ({ name: `${r.name} — ${r.from !== null ? `from ${formatPence(r.from)}` : "price on the day"}`, url: `${siteUrl}/airport-lounges/${r.slug}` }))
      })} />
      <PageHeading>UK airport lounges, compared</PageHeading>
      <FeeGrid
        caption="Cheapest verified pre-book from-price per airport."
        columns={["Airport", "Lounges", "From (pre-book)"]}
        numericColumns={[1, 2]}
        rows={rows.map((r) => [
          <Link key="a" href={`/airport-lounges/${r.slug}`} className="font-medium text-brand-accent underline-offset-4 hover:underline">{r.name}</Link>,
          String(r.count),
          r.from !== null ? formatPence(r.from) : "—"
        ])}
      />
    </article>
  );
}
