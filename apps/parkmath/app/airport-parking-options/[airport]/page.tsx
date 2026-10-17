import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadAirports, loadDropOffDataset, type Airport } from "@mathfamily/data";
import { breadcrumbLd, faqPageLd, JsonLd, speakableLd, tableLd } from "@mathfamily/geo";
import { AnswerLead, AnswerPassage, FaqAccordion, FreshnessBadge, MiniAnswerBar, PageHeading, SourceCitation, SourcesBlock, EmailCaptureSlot } from "@mathfamily/ui";
import { BookingOptions } from "@/components/booking-options";
import { StickyBookingBar } from "@/components/sticky-booking-bar";
import { parkingCtaModel } from "@/lib/parking-content";
import { searchName } from "@/lib/content";
import { airportHasParkingVsDropOff } from "@/lib/parking-vs-drop-off-content";
import { buildBreakEvenModel, buildOptionRows, buildOptionsFaqs, optionsAnswer, optionsInputs, type OptionRow } from "@/lib/options-content";
import { latestDate, optionsMeta } from "@/lib/seo-meta";

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
  // Pointed at the winnable decision seam — "is it cheaper to park or get dropped off / when is each
  // option cheaper" — not the locked "compare [airport] parking" OTA fortress. A dataset
  // optionsSeoTitle/-Description override (GSC showed this page ranking for "[airport] drop off
  // charge" at Exeter / Leeds Bradford) is used verbatim — see lib/seo-meta.ts.
  return {
    ...optionsMeta(data.airport.name, data.inputs.dropOff, data.inputs.parking),
    alternates: { canonical: `/airport-parking-options/${airport}` }
  };
}

function SourceTag({ row }: { row: OptionRow }) {
  return row.source === "official" ? (
    <span className="rounded border border-positive/40 px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-positive-strong">Verified</span>
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
  const breakEven = buildBreakEvenModel(dropOff, parking, airport.name);
  const faqs = buildOptionsFaqs(dropOff, parking, airport.name);
  const answer = optionsAnswer(dropOff, parking, airport.name);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const pageUrl = `${siteUrl}/airport-parking-options/${airport.slug}`;
  const pageVerifiedAt = latestDate(dropOff.verifiedAt, parking?.verifiedAt);

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
          dateModified: pageVerifiedAt
        })}
      />
      <JsonLd data={speakableLd({ url: pageUrl, dateModified: pageVerifiedAt })} />

      <header className="space-y-3">
        <PageHeading>Is it cheaper to park or get dropped off at {sn} Airport?</PageHeading>
        <div className="flex flex-wrap items-center gap-3">
          <FreshnessBadge verifiedAt={dropOff.verifiedAt} />
          <SourceCitation url={dropOff.sourceUrl} label={`Official ${airport.name} page`} />
        </div>
        <p className="text-sm text-ink-muted">
          A neutral comparison of every way in and out of {airport.name}. The verified prices below come from the airport&apos;s
          own published pages — they decide our ranking, not commission.
        </p>
      </header>

      <AnswerLead answer={`Whether it's cheaper to park or get dropped off at ${airport.name} depends on your trip length.`}>
        {[
          dropOff.isFree ? "Drop-off is free at the forecourt" : `Quick drop-off: ${dropOff.feeSummary.split(",")[0]}`,
          ...(dropOff.freeAlternative ? [`Free alternative: ${dropOff.freeAlternative.name}`] : []),
          // Surface the verified saving figure in the FIRST extractable passage (AI Overviews pull
          // the lead block before the break-even section). Only when a real dated pre-book snapshot
          // anchors it — otherwise the honest qualitative line, never a fabricated number.
          breakEven?.hasPrebookSnapshot
            ? `Pre-booking parking can cost far less than the drive-up gate — see the dated break-even below`
            : "Longer trip: pre-booked parking usually beats the drive-up gate"
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
                  {row.costBasis ?? (
                    <a href="#mf-merchant-block" className="text-accent-strong underline underline-offset-4">
                      Pre-book price coming ↓
                    </a>
                  )}
                </td>
                <td className="py-3"><SourceTag row={row} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* The differentiated wedge: a verified trip-length break-even — which option wins by how long
          you're going. Built ONLY from figures we hold (free alternative, drop-off fee, drive-up gate
          tariff, and a dated pre-book snapshot where one exists). The Park & Ride / Meet & Greet rows
          carry NO fabricated price — they light up with a live "from £X" from the affiliate feed. The
          row no OTA publishes — recommending the FREE option when it genuinely wins — is the anchor. */}
      {breakEven ? (
        <section aria-label="Cheapest option by trip length" className="space-y-3 rounded-card border border-ink/10 bg-surface p-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-ink">Cheapest option, by how long you&apos;re going</h2>
            <p className="text-sm text-ink-muted">{breakEven.headline}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-ink/15 text-left">
                  <th scope="col" className="py-2 pr-3 font-semibold text-ink">Your trip</th>
                  <th scope="col" className="py-2 pr-3 font-semibold text-ink">Best option</th>
                  <th scope="col" className="py-2 pr-3 font-semibold text-ink">Cost</th>
                  <th scope="col" className="py-2 font-semibold text-ink">Source</th>
                </tr>
              </thead>
              <tbody>
                {breakEven.rows.map((row) => (
                  <tr key={row.id} className="border-b border-ink/10 align-top">
                    <td className="py-3 pr-3 text-ink-muted">{row.trip}</td>
                    <td className="py-3 pr-3 font-medium text-ink">{row.option}</td>
                    <td className="py-3 pr-3 text-ink">
                      {row.cost ?? (
                        <a href="#mf-merchant-block" className="text-accent-strong underline underline-offset-4">
                          Live price below ↓
                        </a>
                      )}
                    </td>
                    <td className="py-3">
                      {row.source === "official" ? (
                        <span className="rounded border border-positive/40 px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-positive-strong">Verified</span>
                      ) : (
                        <span className="rounded border border-ink-muted/40 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Ad</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-ink-muted">
            Verified figures read from {airport.name}&apos;s own published pages{breakEven.hasPrebookSnapshot ? " and a dated pre-book snapshot" : ""}, last checked {breakEven.verifiedAt}. We don&apos;t publish a Park &amp; Ride or Meet &amp; Greet price we can&apos;t verify — those show a live &quot;from&quot; price below when our parking partner has one.
          </p>
        </section>
      ) : null}

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
            <Link href={`/drop-off-charges/${airport.slug}`} className="text-accent-strong underline underline-offset-4">
              Full {airport.name} drop-off charge breakdown →
            </Link>
          </li>
          {!dropOff.isFree && dropOff.freeAlternative ? (
            <li>
              <Link href={`/avoid-drop-off-charge/${airport.slug}`} className="text-accent-strong underline underline-offset-4">
                How to avoid the {airport.name} drop-off charge →
              </Link>
            </li>
          ) : null}
          {airportHasParkingVsDropOff(airport.slug) ? (
            <li>
              <Link href={`/parking-vs-drop-off/${airport.slug}`} className="text-accent-strong underline underline-offset-4">
                Parking vs drop-off at {airport.name}: which is cheaper? →
              </Link>
            </li>
          ) : null}
          {parking ? (
            <li>
              <Link href={`/airport-parking/${airport.slug}`} className="text-accent-strong underline underline-offset-4">
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

      <StickyBookingBar airportName={airport.name} targetId="mf-merchant-block" />
    </article>
  );
}
