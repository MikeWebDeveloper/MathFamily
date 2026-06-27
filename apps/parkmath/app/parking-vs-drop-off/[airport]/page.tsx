import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isPublicTransportAlt, loadAirports, loadDropOffDataset, loadParkingDataset, newsForAirport, type Airport, type DropOffRecord, type ParkingRecord } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, faqPageLd, howToLd, JsonLd, speakableLd } from "@mathfamily/geo";
import { AnswerLead, AnswerPassage, Callout, CaveatChip, EmailCaptureSlot, FaqAccordion, FeeGrid, FreshnessBadge, LatestUpdates, MiniAnswerBar, PageHeading, SavesVerdict, SourceCitation, SourcesBlock, StatStrip } from "@mathfamily/ui";
import { HolidayExtrasCard } from "@/components/holiday-extras-card";
import {
  REFERENCE_DAYS,
  buildParkingVsDropOffFaqs,
  buildParkingVsDropOffHowToSteps,
  parkingEquivalenceLine,
  parkingVsDropOffAnswer,
  parkingVsDropOffDecisionDescription,
  parkingVsDropOffDecisionH1,
  parkingVsDropOffDecisionTitle,
  parkingVsDropOffLeadFacts,
  parkingVsDropOffModel,
  qualifiesForParkingVsDropOff
} from "@/lib/parking-vs-drop-off-content";

export const dynamicParams = false;

/** One page per airport that has BOTH a real (charged) drop-off fee AND a verified drive-up gate
 *  parking price for the reference duration. Free-drop-off airports and airports without a gate
 *  tariff are excluded — there is nothing honest to compare. */
export function generateStaticParams() {
  const parking = loadParkingDataset().records;
  return loadDropOffDataset()
    .records.filter((dropOff) => {
      const p = parking.find((r) => r.airportSlug === dropOff.airportSlug);
      return p ? qualifiesForParkingVsDropOff({ dropOff, parking: p }) : false;
    })
    .map((r) => ({ airport: r.airportSlug }));
}

function getData(slug: string): { airport: Airport; dropOff: DropOffRecord; parking: ParkingRecord } | null {
  const airport = loadAirports().find((a) => a.slug === slug);
  const dropOff = loadDropOffDataset().records.find((r) => r.airportSlug === slug);
  const parking = loadParkingDataset().records.find((r) => r.airportSlug === slug);
  if (!airport || !dropOff || !parking || !qualifiesForParkingVsDropOff({ dropOff, parking })) return null;
  return { airport, dropOff, parking };
}

export async function generateMetadata({ params }: { params: Promise<{ airport: string }> }): Promise<Metadata> {
  const { airport } = await params;
  const data = getData(airport);
  if (!data) return {};
  const model = parkingVsDropOffModel({ dropOff: data.dropOff, parking: data.parking })!;
  return {
    title: parkingVsDropOffDecisionTitle(data.airport.name),
    description: parkingVsDropOffDecisionDescription(model, data.airport.name),
    alternates: { canonical: `/parking-vs-drop-off/${airport}` },
    // Per-page Open Graph: override the layout's site-root og:url and mark the page as an article with
    // the verified date as modified_time (matching the drop-off page pattern).
    openGraph: {
      type: "article",
      url: `/parking-vs-drop-off/${airport}`,
      modifiedTime: `${model.verifiedAt}T00:00:00Z`
    }
  };
}

export default async function ParkingVsDropOffPage({ params }: { params: Promise<{ airport: string }> }) {
  const { airport: slug } = await params;
  const data = getData(slug);
  if (!data) notFound();
  const { airport, dropOff, parking } = data;

  const model = parkingVsDropOffModel({ dropOff, parking })!;
  const faqs = buildParkingVsDropOffFaqs(model, dropOff, airport.name);
  const equivalence = parkingEquivalenceLine(model, airport.name);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const pageUrl = `${siteUrl}/parking-vs-drop-off/${airport.slug}`;

  const latestNews = newsForAirport(airport.slug, 1)[0];
  const pageVerifiedAt = latestNews && latestNews.verifiedAt > model.verifiedAt ? latestNews.verifiedAt : model.verifiedAt;

  // Covered durations for the reference grid — only durations the gate product actually prices.
  const gate = parking.products.find((p) => p.productType === "gate")!;
  const coveredDays = [3, 7, 14].filter((d) => gate.prices.some((pr) => pr.days === d));

  return (
    <article className="space-y-8">
      <JsonLd data={faqPageLd(faqs)} />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Drop-off charges", url: `${siteUrl}/drop-off-charges` },
          { name: "Parking vs drop-off", url: `${siteUrl}/parking-vs-drop-off` },
          { name: `${airport.name} — park or drop off`, url: pageUrl }
        ])}
      />
      <JsonLd data={speakableLd({ url: pageUrl })} />
      <JsonLd
        data={howToLd({
          name: parkingVsDropOffDecisionH1(airport.name),
          description: parkingVsDropOffAnswer(model, airport.name),
          url: pageUrl,
          steps: buildParkingVsDropOffHowToSteps(model, dropOff, airport.name)
        })}
      />

      <header className="space-y-3">
        <PageHeading>{parkingVsDropOffDecisionH1(airport.name)}</PageHeading>
        <div className="flex flex-wrap items-center gap-3">
          <FreshnessBadge verifiedAt={pageVerifiedAt} />
          <SourceCitation url={dropOff.sourceUrl} label={`Official ${airport.name} drop-off`} />
          <SourceCitation url={parking.sourceUrl} label={`Official ${airport.name} parking`} />
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <CaveatChip>Drop-off: {formatPence(model.dropOffFeePence)} per visit</CaveatChip>
        <CaveatChip>Drive-up parking: {formatPence(model.parkingPence)} / {model.parkingDays} days</CaveatChip>
      </div>

      <div id="mf-answer-anchor">
        <AnswerLead answer={parkingVsDropOffAnswer(model, airport.name)}>{parkingVsDropOffLeadFacts(model)}</AnswerLead>
      </div>
      <MiniAnswerBar summary={`${airport.iata} · drop-off ${formatPence(model.dropOffFeePence)} vs ${model.parkingDays}-day park ${formatPence(model.parkingPence)}`} verified />

      <StatStrip
        stats={[
          { label: "One drop-off", value: formatPence(model.dropOffFeePence), note: "Forecourt, per visit" },
          { label: `Park ${model.parkingDays} days`, value: formatPence(model.parkingPence), note: "Drive-up gate rate" },
          { label: "Gate rate", value: `${formatPence(model.perDayPence)}/day`, note: "Implied per 24h" }
        ]}
      />

      {equivalence ? <SavesVerdict verdict={equivalence} /> : null}

      <AnswerPassage question={`Should I park or get dropped off at ${airport.name}?`}>
        It depends on the trip. {airport.name} charges {formatPence(model.dropOffFeePence)} for a single forecourt drop-off, while
        drive-up parking is {formatPence(model.parkingPence)} for {model.parkingDays} days — about {formatPence(model.perDayPence)} per 24
        hours.{" "}
        {model.cheaperToday === "drop-off" ? (
          <>For a quick airport run where you&apos;re not leaving the car, the drop-off charge is the smaller outlay. But if you&apos;re flying yourself and need to leave the car for the trip, parking is what you pay — and a single drop-off only buys about {model.parkingMinutesPerDropOff} minutes of that drive-up parking.</>
        ) : model.cheaperToday === "parking" ? (
          <>Here, {model.parkingDays}-day drive-up parking actually costs less than one forecourt drop-off, so even a quick drop-off is no cheaper than parking.</>
        ) : (
          <>Here the two happen to cost the same.</>
        )}{" "}
        Both figures are official, date-stamped snapshots read from the airport&apos;s own pages and verified {model.verifiedAt}. We never republish unverified prices.
      </AnswerPassage>

      <div>
        <FeeGrid
          caption={`${airport.name}: one forecourt drop-off vs the official drive-up gate parking price by duration. Verified ${model.verifiedAt}.`}
          columns={["", ...coveredDays.map((d) => `${d} days`)]}
          numericColumns={coveredDays.map((_, i) => i + 1)}
          rows={[
            ["Drive-up parking (gate)", ...coveredDays.map((d) => formatPence(gate.prices.find((pr) => pr.days === d)!.totalPence))],
            ["One drop-off", ...coveredDays.map(() => formatPence(model.dropOffFeePence))]
          ]}
        />
      </div>

      {dropOff.freeAlternative ? (
        <Callout variant="free" title={`Want to avoid both? Use the ${dropOff.freeAlternative.name}`}>
          {isPublicTransportAlt(dropOff.freeAlternative) ? "" : `Free for ${dropOff.freeAlternative.minutesFree} minutes. `}{dropOff.freeAlternative.details}{" "}
          <Link href={`/avoid-drop-off-charge/${airport.slug}`} className="font-medium text-brand-accent underline underline-offset-4">
            See how to avoid the {airport.name} drop-off charge →
          </Link>
        </Callout>
      ) : null}

      <HolidayExtrasCard product="parking" surface="parkvsdropoff" airportName={airport.name} airportSlug={airport.slug} extras={["lounge", "transfers"]} />

      <section className="mf-reveal space-y-2">
        <h2 className="mf-underline-grow text-xl font-semibold text-ink">Frequently asked questions</h2>
        <FaqAccordion items={faqs} />
      </section>

      <EmailCaptureSlot
        source="parking-vs-drop-off"
        hook={`Get notified when ${airport.name} changes its parking or drop-off prices`}
      />

      <nav aria-label="Related pages" className="space-y-2">
        <p>
          <Link href={`/airport-parking/${airport.slug}`} className="text-sm font-medium text-brand-accent underline underline-offset-4">
            Full {airport.name} parking comparison — gate vs pre-book →
          </Link>
        </p>
        <p>
          <Link href={`/drop-off-charges/${airport.slug}`} className="text-sm font-medium text-brand-accent underline underline-offset-4">
            Full {airport.name} drop-off charge breakdown →
          </Link>
        </p>
        <p>
          <Link href="/parking-vs-drop-off" className="text-sm font-medium text-brand-accent underline underline-offset-4">
            Park or drop off? Compare every UK airport →
          </Link>
        </p>
      </nav>

      {(() => {
        const updates = newsForAirport(airport.slug, 3);
        return updates.length ? <LatestUpdates items={updates} heading={`Latest at ${airport.name}`} /> : null;
      })()}

      <SourcesBlock
        sources={[
          { label: `Official ${airport.name} drop-off page`, url: dropOff.sourceUrl, verifiedAt: dropOff.verifiedAt },
          { label: `Official ${airport.name} parking page`, url: parking.sourceUrl, verifiedAt: parking.verifiedAt }
        ]}
        method="The drop-off fee and the drive-up gate parking price are read from the airport's own official pages and re-verified on the dates shown. The per-day rate and minutes-equivalence are exact arithmetic from those two figures. We never republish unverified prices."
      />
    </article>
  );
}
