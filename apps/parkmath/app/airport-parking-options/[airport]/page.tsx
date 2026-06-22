import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadAirports, loadDropOffDataset, type Airport } from "@mathfamily/data";
import { breadcrumbLd, faqPageLd, JsonLd, speakableLd, tableLd } from "@mathfamily/geo";
import { AnswerLead, AnswerPassage, FaqAccordion, FreshnessBadge, MiniAnswerBar, PageHeading, SourceCitation, SourcesBlock, EmailCaptureSlot } from "@mathfamily/ui";
import { BookingOptions } from "@/components/booking-options";
import { parkingCtaModel } from "@/lib/parking-content";
import { searchName } from "@/lib/content";
import { airportHasParkingVsDropOff } from "@/lib/parking-vs-drop-off-content";
import { buildOptionRows, buildOptionsFaqs, optionsAnswer, optionsInputs, type OptionRow } from "@/lib/options-content";

export const dynamicParams = false;

/** One booking-intent options page per airport (every airport has a drop-off record). */
export function generateStaticParams() {
  return loadDropOffDataset().records.map((r) => ({ airport: r.airportSlug }));
}

function getData(slug: string): { airport: Airport; inputs: NonNullable<ReturnType<typeof optionsInputs>> } | null {
  const airport = loadAirports().find((a) => a.slug === slug);
  const inputs = optionsInputs(slug);
  return airport && inputs ? { airport, inputs } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ airport: string }> }): Promise<Metadata> {
  const { airport } = await params;
  const data = getData(airport);
  if (!data) return {};
  const { airport: a, inputs } = data;
  const sn = searchName(a.name);
  const fee = inputs.dropOff.isFree ? "free drop-off" : inputs.dropOff.bands[0] ? `${inputs.dropOff.feeSummary.split(",")[0]}` : "drop-off";
  return {
    title: `${sn} Airport parking options 2026 — drop-off, Park & Ride & Meet & Greet compared`,
    description: `The cheapest way to park or drop off at ${sn} Airport: forecourt drop-off (${fee}), the free alternative, drive-up gate parking, Park & Ride and Meet & Greet — a neutral, verified comparison. Updated ${inputs.dropOff.verifiedAt}.`,
    alternates: { canonical: `/airport-parking-options/${airport}` }
  };
}

function SourceTag({ row }: { row: OptionRow }) {
  return row.source === "official" ? (
    <span className="rounded border border-positive/40 px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-positive">Verified</span>
  ) : (
    <span className="rounded border border-ink-muted/40 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Ad</span>
  );
}

export default async function AirportParkingOptionsPage({ params }: { params: Promise<{ airport: string }> }) {
  const { airport: slug } = await params;
  const data = getData(slug);
  if (!data) notFound();
  const { airport, inputs } = data;
  const { dropOff, parking } = inputs;
  const sn = searchName(airport.name);

  const rows = buildOptionRows(dropOff, parking);
  const faqs = buildOptionsFaqs(dropOff, parking, airport.name);
  const answer = optionsAnswer(dropOff, parking, airport.name);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const pageUrl = `${siteUrl}/airport-parking-options/${airport.slug}`;

  return (
    <article className="space-y-8">
      <JsonLd data={faqPageLd(faqs)} />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Drop-off charges", url: `${siteUrl}/drop-off-charges` },
          { name: `${airport.name} parking options`, url: pageUrl }
        ])}
      />
      <JsonLd
        data={tableLd({
          about: `${airport.name} airport parking and drop-off options compared`,
          url: pageUrl,
          columns: ["Option", "When it wins", "Cost basis", "Source"],
          rowCount: rows.length,
          dateModified: dropOff.verifiedAt
        })}
      />
      <JsonLd data={speakableLd({ url: pageUrl })} />

      <header className="space-y-3">
        <PageHeading>{sn} Airport parking options: drop-off, Park &amp; Ride &amp; Meet &amp; Greet</PageHeading>
        <div className="flex flex-wrap items-center gap-3">
          <FreshnessBadge verifiedAt={dropOff.verifiedAt} />
          <SourceCitation url={dropOff.sourceUrl} label={`Official ${airport.name} page`} />
        </div>
        <p className="text-sm text-ink-muted">
          A neutral comparison of every way in and out of {airport.name}. The verified prices below come from the airport&apos;s
          own published pages — they decide our ranking, not commission.
        </p>
      </header>

      <AnswerLead answer={`The cheapest way to ${dropOff.isFree ? "use" : "get into"} ${airport.name} depends on your trip length.`}>
        {[
          dropOff.isFree ? "Drop-off is free at the forecourt" : `Quick drop-off: ${dropOff.feeSummary.split(",")[0]}`,
          ...(dropOff.freeAlternative ? [`Free alternative: ${dropOff.freeAlternative.name}`] : []),
          "Longer trip: pre-booked Park & Ride usually beats the gate"
        ]}
      </AnswerLead>
      <MiniAnswerBar summary={`${airport.iata} · drop-off vs park & ride vs meet & greet`} verified />

      <AnswerPassage question={`What's the cheapest way to park or drop off at ${airport.name}?`}>
        {answer}
      </AnswerPassage>

      {/* The neutral decision table — verified rows are the visual anchor; the affiliate rows are
          clearly priced "from the live feed" and labelled "Ad" (they light up when AWIN merchants
          are approved). Renders fully with JS off. */}
      <section aria-label="Parking and drop-off options" className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink/15 text-left">
              <th scope="col" className="py-2 pr-3 font-semibold text-ink">Option</th>
              <th scope="col" className="py-2 pr-3 font-semibold text-ink">When it wins</th>
              <th scope="col" className="py-2 pr-3 font-semibold text-ink">Cost</th>
              <th scope="col" className="py-2 font-semibold text-ink">Source</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-ink/10 align-top">
                <td className="py-3 pr-3 font-medium text-ink">{row.option}</td>
                <td className="py-3 pr-3 text-ink-muted">{row.whenItWins}</td>
                <td className="py-3 pr-3 text-ink">
                  {row.costBasis ?? <span className="text-ink-muted">Pre-book price coming</span>}
                </td>
                <td className="py-3"><SourceTag row={row} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Booking-intent monetisation: fail-closed affiliate CTA. Dormant (renders the official-site
          card only) until an AWIN parking merchant is live for this airport, then lights up with the
          "Ad"-labelled Park & Ride / Meet & Greet pre-book CTA. Never shows a fabricated price. */}
      <BookingOptions
        airportName={airport.name}
        airportSlug={airport.slug}
        officialUrl={dropOff.sourceUrl}
        cta={parking ? parkingCtaModel(parking, 7) : undefined}
        surface="options"
      />

      <section className="mf-reveal space-y-2">
        <h2 className="mf-underline-grow text-xl font-semibold text-ink">Frequently asked questions</h2>
        <FaqAccordion items={faqs} />
      </section>

      <EmailCaptureSlot
        source="airport-parking-options"
        hook={`Get notified when ${airport.name} parking prices change`}
      />

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-ink">More at this airport</h2>
        <ul className="space-y-1 text-sm">
          <li>
            <Link href={`/drop-off-charges/${airport.slug}`} className="text-brand-accent underline underline-offset-4">
              Full {airport.name} drop-off charge breakdown →
            </Link>
          </li>
          {!dropOff.isFree && dropOff.freeAlternative ? (
            <li>
              <Link href={`/avoid-drop-off-charge/${airport.slug}`} className="text-brand-accent underline underline-offset-4">
                How to avoid the {airport.name} drop-off charge →
              </Link>
            </li>
          ) : null}
          {airportHasParkingVsDropOff(airport.slug) ? (
            <li>
              <Link href={`/parking-vs-drop-off/${airport.slug}`} className="text-brand-accent underline underline-offset-4">
                Parking vs drop-off at {airport.name}: which is cheaper? →
              </Link>
            </li>
          ) : null}
          {parking ? (
            <li>
              <Link href={`/airport-parking/${airport.slug}`} className="text-brand-accent underline underline-offset-4">
                {airport.name} parking prices compared →
              </Link>
            </li>
          ) : null}
        </ul>
      </section>

      <SourcesBlock
        sources={[{ label: `Official ${airport.name} drop-off page`, url: dropOff.sourceUrl, verifiedAt: dropOff.verifiedAt }]}
        method="The drop-off, free-alternative and drive-up gate-parking figures are read from the airport's official pages and date-stamped. Pre-booked Park & Ride and Meet & Greet prices come from our parking partner's live feed — we show them only when verifiable and never invent a 'from £X'."
      />
    </article>
  );
}
