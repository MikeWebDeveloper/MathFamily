import type { Metadata } from "next";
import Link from "next/link";
import { loadAirports, loadLoungeDataset } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, itemListLd, JsonLd } from "@mathfamily/geo";
import { EmailCaptureSlot, FeeGrid, PageHeading } from "@mathfamily/ui";

export const metadata: Metadata = {
  title: "UK airport lounge prices & Priority Pass, compared",
  description: "Pre-book from-prices for lounges at major UK airports, which lounges take Priority Pass, and break-even calculators for membership.",
  alternates: { canonical: "/airport-lounges" }
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
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Airport lounges", url: `${siteUrl}/airport-lounges` }
        ])}
      />
      <JsonLd data={itemListLd({
        name: "UK airport lounges by cheapest pre-book from-price",
        items: rows.map((r) => ({ name: `${r.name} — ${r.from !== null ? `from ${formatPence(r.from)}` : "price on the day"}`, url: `${siteUrl}/airport-lounges/${r.slug}` }))
      })} />
      <PageHeading>UK airport lounges, compared</PageHeading>
      <p className="text-lead text-ink">
        {(() => {
          const priced = rows.filter((r) => r.from !== null);
          if (priced.length === 0) return "Walk-in lounge prices aren't published for most UK airports — pre-booking guarantees entry, and membership can beat paying per visit.";
          const min = priced.reduce((m, r) => (r.from! < m.from ? { name: r.name, from: r.from! } : m), { name: "", from: Number.POSITIVE_INFINITY });
          return `Pre-book lounge access at major UK airports. The cheapest published from-price is ${formatPence(min.from)} at ${min.name}; membership can beat paying per visit if you fly often.`;
        })()}
      </p>
      <h2 className="text-h2 font-semibold text-ink">Every airport, cheapest pre-book</h2>
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
      <EmailCaptureSlot
        source="airport-lounges-index"
        hook="Get notified when UK airport lounge prices change"
      />
    </article>
  );
}
