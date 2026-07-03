import type { Metadata } from "next";
import Link from "next/link";
import { loadAirports, loadDropOffDataset, loadParkingDataset } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, itemListLd, JsonLd } from "@mathfamily/geo";
import { FreshnessBadge, PageHeading } from "@mathfamily/ui";
import {
  parkingVsDropOffIndexSummary,
  parkingVsDropOffModel,
  qualifiesForParkingVsDropOff,
  type ParkingVsDropOffIndexRow
} from "@/lib/parking-vs-drop-off-content";

export const metadata: Metadata = {
  title: "Parking vs drop-off at UK airports 2026 — which is cheaper?",
  description:
    "Should you park or get dropped off? A verified, official-figures comparison of the forecourt drop-off charge against drive-up parking at every UK airport we cover.",
  alternates: { canonical: "/parking-vs-drop-off" }
};

export default function ParkingVsDropOffIndexPage() {
  const airports = new Map(loadAirports().map((a) => [a.slug, a]));
  const dropOffRecords = loadDropOffDataset().records;
  const parkingRecords = loadParkingDataset().records;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // Airports with BOTH a charged drop-off fee and a verified drive-up gate price. Dearest
  // drive-up park first (biggest "is parking worth it?" tension on top).
  const rows: ParkingVsDropOffIndexRow[] = dropOffRecords
    .map((dropOff) => {
      const parking = parkingRecords.find((r) => r.airportSlug === dropOff.airportSlug);
      if (!parking || !qualifiesForParkingVsDropOff({ dropOff, parking })) return null;
      const model = parkingVsDropOffModel({ dropOff, parking })!;
      return {
        slug: dropOff.airportSlug,
        name: airports.get(dropOff.airportSlug)?.name ?? dropOff.airportSlug,
        dropOffFeePence: model.dropOffFeePence,
        parkingPence: model.parkingPence,
        parkingDays: model.parkingDays,
        cheaperToday: model.cheaperToday
      } satisfies ParkingVsDropOffIndexRow;
    })
    .filter((r): r is ParkingVsDropOffIndexRow => r !== null)
    .sort((a, b) => b.parkingPence - a.parkingPence);

  // Regional-first emphasis (Mike's 2026-07-03 strategy call): concentrate extra link weight on the
  // smaller/regional airports in our pos-20-35 band. Of the named targets (Prestwick/Teesside/
  // Inverness/Aberdeen/Belfast/Exeter), only Teesside actually has a verified parking tariff — the
  // rest have no gate price on file, so genuinely cannot get a comparison page (fail-closed, not a
  // bug: see the 2026-07-03 parking-sprint board entry). Substituted with the other regional/secondary
  // airports that DO qualify, as the closest honest match to the same "underdog regional" intent.
  const regionalSlugs = ["teesside", "newcastle", "liverpool", "leeds-bradford"];
  const regional = regionalSlugs
    .map((slug) => rows.find((r) => r.slug === slug))
    .filter((r): r is ParkingVsDropOffIndexRow => Boolean(r));

  const verifiedDates = rows.map((r) => {
    const d = dropOffRecords.find((x) => x.airportSlug === r.slug)!;
    const p = parkingRecords.find((x) => x.airportSlug === r.slug)!;
    return d.verifiedAt > p.verifiedAt ? d.verifiedAt : p.verifiedAt;
  });
  const latestVerified = [...verifiedDates].sort().at(-1) ?? loadParkingDataset().lastUpdated;
  const oldestVerified = [...verifiedDates].sort()[0];

  return (
    <article className="space-y-6">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Drop-off charges", url: `${siteUrl}/drop-off-charges` },
          { name: "Parking vs drop-off", url: `${siteUrl}/parking-vs-drop-off` }
        ])}
      />
      <JsonLd
        data={itemListLd({
          name: "Parking vs drop-off at UK airports, dearest drive-up parking first",
          items: rows.map((r) => ({
            name: `${r.name} — drop-off ${formatPence(r.dropOffFeePence)} vs ${r.parkingDays}-day park ${formatPence(r.parkingPence)}`,
            url: `${siteUrl}/parking-vs-drop-off/${r.slug}`
          }))
        })}
      />
      <header className="space-y-3">
        <PageHeading>Parking vs drop-off at UK airports</PageHeading>
        <FreshnessBadge verifiedAt={latestVerified} oldestRowDate={oldestVerified} />
        <p className="text-lead text-ink">{parkingVsDropOffIndexSummary(rows)}</p>
      </header>

      {regional.length > 0 ? (
        <section className="space-y-2" aria-label="Regional UK airports — parking vs drop-off">
          <h2 className="text-base font-semibold text-ink">Regional airports</h2>
          <ul className="flex flex-wrap gap-2 text-sm">
            {regional.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/parking-vs-drop-off/${r.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-brand-accent/30 bg-brand-accent/[0.04] px-3 py-1.5 font-medium text-brand-accent hover:bg-brand-accent/10"
                >
                  Park or drop off at {r.name}?
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-h2 font-semibold text-ink">Pick your airport</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {rows.map((r) => (
            <li key={r.slug}>
              <Link
                href={`/parking-vs-drop-off/${r.slug}`}
                className="mf-edge group flex items-center justify-between gap-4 rounded-card border bg-card p-4 transition hover:-translate-y-0.5"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <span>
                  <span className="block font-semibold text-ink">{r.name}</span>
                  <span className="block text-sm text-ink-muted">
                    Drop-off {formatPence(r.dropOffFeePence)} · {r.parkingDays}-day park {formatPence(r.parkingPence)}
                  </span>
                </span>
                <span className="mf-num shrink-0 rounded-full bg-brand-accent/10 px-2.5 py-1 text-sm font-semibold text-brand-accent">
                  compare →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <nav aria-label="Related pages" className="space-y-2">
        <p>
          <Link href="/airport-parking" className="text-sm font-medium text-brand-accent underline underline-offset-4">
            Compare every UK airport&apos;s parking prices →
          </Link>
        </p>
        <p>
          <Link href="/avoid-drop-off-charge" className="text-sm font-medium text-brand-accent underline underline-offset-4">
            How to avoid the drop-off charge at every UK airport →
          </Link>
        </p>
      </nav>
    </article>
  );
}
