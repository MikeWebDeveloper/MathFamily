import type { Metadata } from "next";
import Link from "next/link";
import { loadAirports, loadDropOffDataset, loadParkingDataset } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, datasetLd, itemListLd, JsonLd } from "@mathfamily/geo";
import { AnswerLead, Callout, FreshnessBadge, OpenDataBand, PageHeading, SourcesBlock } from "@mathfamily/ui";
import { dropOffIndexSummary, trendNote } from "@/lib/content";
import { parkingPageModel } from "@/lib/parking-content";

export const metadata: Metadata = {
  title: "UK Airport Parking & Drop-off Price Index 2026",
  description:
    "The 2026 index of UK airport drop-off charges and pre-book parking prices — every major airport, verified against official sources and date-stamped, with the raw data free to download.",
  alternates: { canonical: "/parking-price-index-2026" }
};

export default function PriceIndexPage() {
  const airports = new Map(loadAirports().map((a) => [a.slug, a]));
  const name = (slug: string) => airports.get(slug)?.name ?? slug;
  const dropOff = loadDropOffDataset().records;
  const parking = loadParkingDataset().records;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const latestVerified =
    [...dropOff, ...parking].map((r) => r.verifiedAt).sort().at(-1) ?? new Date().toISOString().slice(0, 10);

  // Drop-off headline
  const paidDropOff = dropOff
    .filter((r) => !r.isFree && r.bands[0])
    .map((r) => ({ name: name(r.airportSlug), pence: r.bands[0]!.totalPence }))
    .sort((a, b) => a.pence - b.pence);
  const dearestDropOff = paidDropOff.at(-1);
  const dropSummary = dropOffIndexSummary(
    dropOff.map((r) => ({ name: name(r.airportSlug), isFree: r.isFree, feePence: r.bands[0]?.totalPence ?? 0 }))
  );

  // Parking headline — cheapest 7-day pre-book per airport
  const parking7 = parking
    .map((r) => {
      const m = parkingPageModel(r, 7);
      return m.cheapest ? { name: name(r.airportSlug), price: m.cheapest.totalPence, saving: m.savingsVsGatePence ?? 0 } : null;
    })
    .filter((x): x is { name: string; price: number; saving: number } => x !== null)
    .sort((a, b) => a.price - b.price);
  const cheapest7 = parking7[0];
  const dearest7 = parking7.at(-1);
  const biggestSaving = [...parking7].sort((a, b) => b.saving - a.saving)[0];

  // Year-on-year movers (only the records that carry a prior-year figure)
  const movers = dropOff
    .map((r) => ({ name: name(r.airportSlug), note: trendNote(r) }))
    .filter((x): x is { name: string; note: string } => x.note !== null && !x.note.startsWith("Unchanged"));

  const keyFigures = [
    dearestDropOff ? `Dearest drop-off: ${dearestDropOff.name} at ${formatPence(dearestDropOff.pence)}` : null,
    cheapest7 ? `Cheapest 7-day pre-book parking: ${cheapest7.name} at ${formatPence(cheapest7.price)}` : null,
    dearest7 ? `Dearest 7-day pre-book parking: ${dearest7.name} at ${formatPence(dearest7.price)}` : null,
    biggestSaving && biggestSaving.saving > 0
      ? `Biggest pre-book saving vs gate: ${biggestSaving.name} (${formatPence(biggestSaving.saving)} on 7 days)`
      : null
  ].filter((x): x is string => x !== null);

  return (
    <article className="space-y-8">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Parking Price Index 2026", url: `${siteUrl}/parking-price-index-2026` }
        ])}
      />
      <JsonLd
        data={itemListLd({
          name: "UK airport parking & drop-off price index 2026 — key sections",
          items: [
            { name: "Every UK airport drop-off charge, compared", url: `${siteUrl}/drop-off-charges` },
            { name: "Every UK airport parking comparison (gate vs pre-book)", url: `${siteUrl}/airport-parking` }
          ]
        })}
      />
      <JsonLd
        data={datasetLd({
          name: "UK airport parking & drop-off price index 2026",
          description: `Drop-off charges and pre-book parking prices at ${dropOff.length} UK airports, verified against official sources and date-stamped.`,
          url: `${siteUrl}/parking-price-index-2026`,
          dateModified: latestVerified,
          siteUrl,
          creatorName: "ParkMath",
          distribution: {
            encodingFormat: "text/csv",
            contentUrl: `${siteUrl}/data/drop-off-charges.csv`
          }
        })}
      />

      <header className="space-y-3">
        <PageHeading>UK Airport Parking &amp; Drop-off Price Index 2026</PageHeading>
        <FreshnessBadge verifiedAt={latestVerified} />
      </header>

      <AnswerLead
        answer={`${dropSummary}${
          cheapest7 && dearest7
            ? ` Pre-book 7-day parking ranges from ${formatPence(cheapest7.price)} (${cheapest7.name}) to ${formatPence(dearest7.price)} (${dearest7.name}).`
            : ""
        }`}
      >
        {keyFigures}
      </AnswerLead>

      {movers.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-h2 font-semibold text-ink">Year-on-year movers</h2>
          <ul className="space-y-1 text-sm text-ink-muted">
            {movers.map((m) => (
              <li key={m.name}>
                <span className="font-medium text-ink">{m.name}:</span> {m.note}
              </li>
            ))}
          </ul>
          <p className="text-xs text-ink-muted">
            Year-on-year figures are shown for airports where we hold a verified prior-year price.
          </p>
        </section>
      ) : null}

      <OpenDataBand
        downloads={[
          { href: "/data/drop-off-charges.csv", label: "Drop-off charges (CSV)" },
          { href: "/data/parking-tariffs.csv", label: "Parking tariffs (CSV)" }
        ]}
        citation={`ParkMath, "UK Airport Parking & Drop-off Price Index 2026", verified ${latestVerified}, parkmath.co.uk`}
      />

      <section className="space-y-2">
        <h2 className="text-h2 font-semibold text-ink">The full tables</h2>
        <ul className="space-y-1 text-sm">
          <li>
            <Link href="/drop-off-charges" className="text-brand-accent underline underline-offset-4">
              Every UK airport drop-off charge, compared →
            </Link>
          </li>
          <li>
            <Link href="/airport-parking" className="text-brand-accent underline underline-offset-4">
              Every UK airport parking comparison (gate vs pre-book) →
            </Link>
          </li>
        </ul>
      </section>

      <SourcesBlock
        sources={[{ label: "Official UK airport drop-off & parking pages", url: `${siteUrl}/drop-off-charges`, verifiedAt: latestVerified }]}
        method="Drop-off fees and gate tariffs are each airport's official published prices; pre-book figures are dated quote snapshots from the official booking portals. Nothing is scraped from third-party aggregators, and every figure is date-stamped."
      />
    </article>
  );
}
