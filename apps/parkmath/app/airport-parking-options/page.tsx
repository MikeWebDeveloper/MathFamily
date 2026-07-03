import type { Metadata } from "next";
import Link from "next/link";
import { loadAirports, loadDropOffDataset } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, itemListLd, JsonLd, speakableLd } from "@mathfamily/geo";
import { AnswerPassage, FreshnessBadge, PageHeading } from "@mathfamily/ui";
import { searchName } from "@/lib/content";

export const metadata: Metadata = {
  title: "UK airport parking options 2026 — drop-off, Park & Ride & Meet & Greet compared",
  description:
    "The cheapest way to park or drop off at every UK airport: forecourt drop-off, the free alternative, drive-up gate parking, Park & Ride and Meet & Greet — a neutral, verified comparison. No fabricated 'from £X'.",
  alternates: { canonical: "/airport-parking-options" }
};

export default function AirportParkingOptionsIndex() {
  const airports = new Map(loadAirports().map((a) => [a.slug, a]));
  const dataset = loadDropOffDataset();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const records = [...dataset.records].sort((a, b) =>
    (airports.get(a.airportSlug)?.name ?? a.airportSlug).localeCompare(airports.get(b.airportSlug)?.name ?? b.airportSlug)
  );
  const latestVerified = records.map((r) => r.verifiedAt).sort().at(-1) ?? dataset.lastUpdated;

  // Most-searched parking-options pages (curated, same trio as the /drop-off-charges hub for
  // consistency): concentrate internal-link equity from this hub at the airports with the most real
  // search demand. 2026-07-02 SEO pass — this hub previously had only a plain link grid, the weakest
  // internal-linking page in the cluster, while airport-parking-options/stansted sits flat at ~pos 64
  // (vs. drop-off-charges/stansted, which improved after the SAME kind of featured link).
  const featuredSlugs = ["stansted", "southend", "bristol"];
  const featured = featuredSlugs
    .map((slug) => records.find((r) => r.airportSlug === slug))
    .filter((r): r is (typeof records)[number] => Boolean(r))
    .map((r) => ({
      slug: r.airportSlug,
      name: searchName(airports.get(r.airportSlug)?.name ?? r.airportSlug),
      fee: r.isFree ? "Free" : formatPence(r.bands[0]?.totalPence ?? 0)
    }));

  return (
    <article className="space-y-6">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Drop-off charges", url: `${siteUrl}/drop-off-charges` },
          { name: "Airport parking options", url: `${siteUrl}/airport-parking-options` }
        ])}
      />
      <JsonLd
        data={itemListLd({
          name: "UK airport parking options compared",
          items: records.map((r) => ({
            name: `${airports.get(r.airportSlug)?.name ?? r.airportSlug} parking options`,
            url: `${siteUrl}/airport-parking-options/${r.airportSlug}`
          }))
        })}
      />
      <JsonLd data={speakableLd({ url: `${siteUrl}/airport-parking-options` })} />

      <header className="space-y-3">
        <PageHeading>UK airport parking options: drop-off vs Park &amp; Ride vs Meet &amp; Greet</PageHeading>
        <FreshnessBadge verifiedAt={latestVerified} />
      </header>

      <AnswerPassage question="What's the cheapest way to park or drop off at a UK airport?">
        The cheapest way in and out of each UK airport, side by side: a quick forecourt drop-off, the free alternative,
        drive-up gate parking, and pre-booked Park &amp; Ride or Meet &amp; Greet. Every verified price is read from the
        airport&apos;s own page — our ranking is never affected by commission, and we never invent a &ldquo;from £X&rdquo;.
      </AnswerPassage>

      {featured.length > 0 ? (
        <section className="space-y-2" aria-label="Most-searched airport parking options">
          <h2 className="text-base font-semibold text-ink">Most-searched parking options</h2>
          <ul className="flex flex-wrap gap-2 text-sm">
            {featured.map((f) => (
              <li key={f.slug}>
                <Link
                  href={`/airport-parking-options/${f.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-brand-accent/30 bg-brand-accent/[0.04] px-3 py-1.5 font-medium text-brand-accent hover:bg-brand-accent/10"
                >
                  {f.name} parking options
                  <span className="text-xs font-normal text-ink-muted">{f.fee}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-h2 font-semibold text-ink">Pick your airport</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {records.map((r) => {
            const a = airports.get(r.airportSlug);
            return (
              <li key={r.airportSlug}>
                <Link
                  href={`/airport-parking-options/${r.airportSlug}`}
                  className="mf-edge group flex items-center justify-between gap-4 rounded-card border bg-card p-4 transition hover:-translate-y-0.5"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <span>
                    <span className="block font-semibold text-ink">{searchName(a?.name ?? r.airportSlug)} Airport</span>
                    <span className="block text-sm text-ink-muted">
                      {r.isFree ? "Free drop-off" : r.feeSummary.split(",")[0]} · all options compared
                    </span>
                  </span>
                  <span aria-hidden className="text-brand-accent">→</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <p>
        <Link href="/drop-off-charges" className="text-sm font-medium text-brand-accent underline underline-offset-4">
          Compare drop-off charges at all UK airports →
        </Link>
      </p>
    </article>
  );
}
