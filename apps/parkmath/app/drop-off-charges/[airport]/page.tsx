import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadAirports, loadDropOffDataset, loadParkingDataset, loadLoungeDataset, newsForAirport, type Airport, type DropOffRecord } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, faqPageLd, JsonLd, offerLd, speakableLd } from "@mathfamily/geo";
import { AnswerCard, AnswerLead, AnswerPassage, CaveatChip, Callout, FaqAccordion, FreshnessBadge, LatestUpdates, MiniAnswerBar, PageHeading, SourceCitation, SourcesBlock, EmailCaptureSlot, UkMap, VerifiedStamp } from "@mathfamily/ui";
import { DropOffCalculator } from "@/components/drop-off-calculator";
import { DropOffParkingBridge } from "@/components/drop-off-bridge";
import { HolidayExtrasCard } from "@/components/holiday-extras-card";
import { buildDropOffFaqs, freshnessDelta, isPerEntryTariff, paymentDeadlineChip, trendNote } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return loadDropOffDataset().records.map((r) => ({ airport: r.airportSlug }));
}

function getData(slug: string): { airport: Airport; record: DropOffRecord } | null {
  const airport = loadAirports().find((a) => a.slug === slug);
  const record = loadDropOffDataset().records.find((r) => r.airportSlug === slug);
  return airport && record ? { airport, record } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ airport: string }> }): Promise<Metadata> {
  const { airport } = await params;
  const data = getData(airport);
  if (!data) return {};
  return {
    title: `${data.airport.name} drop-off charge 2026 — fee, limit & free alternative`,
    description: `${data.airport.name} drop-off: ${data.record.feeSummary}. Penalty, payment deadline, Blue Badge rules and how to avoid the fee — verified ${data.record.verifiedAt}.`,
    alternates: { canonical: `/drop-off-charges/${airport}` }
  };
}

export default async function DropOffPage({ params }: { params: Promise<{ airport: string }> }) {
  const { airport: slug } = await params;
  const data = getData(slug);
  if (!data) notFound();
  const { airport, record } = data;
  const faqs = buildDropOffFaqs(record, airport.name);
  const trend = trendNote(record);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const hasParking = loadParkingDataset().records.some((r) => r.airportSlug === slug);
  const hasLounge = loadLoungeDataset().records.some((r) => r.airportSlug === slug);
  const latestNews = newsForAirport(airport.slug, 1)[0];
  const pageVerifiedAt = latestNews && latestNews.verifiedAt > record.verifiedAt ? latestNews.verifiedAt : record.verifiedAt;
  const priceValidUntil = new Date(new Date(`${record.verifiedAt}T00:00:00Z`).getTime() + 60 * 86_400_000)
    .toISOString()
    .slice(0, 10);

  return (
    <article className="space-y-8">
      <JsonLd data={faqPageLd(faqs)} />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Drop-off charges", url: `${siteUrl}/drop-off-charges` },
          { name: airport.name, url: `${siteUrl}/drop-off-charges/${airport.slug}` }
        ])}
      />
      {!record.isFree && record.bands[0] ? (
        <JsonLd
          data={offerLd({
            name: `${airport.name} drop-off charge`,
            description: `${airport.name} drop-off forecourt charge — ${record.feeSummary}. Official, date-stamped price verified ${record.verifiedAt}.`,
            image: `${siteUrl}/drop-off-charges/${airport.slug}/opengraph-image`,
            url: `${siteUrl}/drop-off-charges/${airport.slug}`,
            pricePence: record.bands[0].totalPence,
            priceValidUntil,
            brand: airport.name
          })}
        />
      ) : null}
      <JsonLd data={speakableLd({ url: `${siteUrl}/drop-off-charges/${airport.slug}` })} />

      <header className="space-y-3">
        <PageHeading>{airport.name} drop-off charge</PageHeading>
        <div className="flex flex-wrap items-center gap-3">
          <FreshnessBadge verifiedAt={pageVerifiedAt} deltaLabel={freshnessDelta(record) ?? undefined} />
          <SourceCitation url={record.sourceUrl} label={`Official ${airport.name} page`} />
        </div>
      </header>

      {!record.isFree ? (
        <div className="flex flex-wrap gap-2">
          {record.maxStayMinutes !== null ? <CaveatChip>Max stay {record.maxStayMinutes} min</CaveatChip> : null}
          {record.penaltyPence !== null ? <CaveatChip>{formatPence(record.penaltyPence)} penalty if unpaid</CaveatChip> : null}
          {paymentDeadlineChip(record) ? <CaveatChip>{paymentDeadlineChip(record)}</CaveatChip> : null}
        </div>
      ) : null}

      <AnswerLead
        answer={
          record.isFree
            ? `Dropping off at ${airport.name} is free at the forecourt.`
            : `Dropping off at ${airport.name} costs ${record.feeSummary.charAt(0).toLowerCase()}${record.feeSummary.slice(1)}.`
        }
      >
        {[
          ...(record.penaltyPence !== null ? [`Penalty if unpaid: ${formatPence(record.penaltyPence)}`] : []),
          ...(record.freeAlternative ? [`Free alternative: ${record.freeAlternative.name} (${record.freeAlternative.minutesFree} min)`] : []),
          ...(record.paymentDeadline ? [`Pay by: ${record.paymentDeadline}`] : [])
        ]}
      </AnswerLead>

      <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto]">
        <AnswerCard
          label="Current drop-off charge"
          value={record.isFree ? "Free" : formatPence(record.bands[0]?.totalPence ?? 0)}
          note={record.isFree ? "No forecourt charge" : record.bands[0] ? `for up to ${record.bands[0].upToMinutes} min` : undefined}
          footer={
            <span className="inline-block rounded bg-white/90 dark:bg-card/90 px-1.5">
              <VerifiedStamp verifiedAt={record.verifiedAt} sourceUrl={record.sourceUrl} sourceLabel={`Official ${airport.name} page`} />
            </span>
          }
        />
        <UkMap markers={[{ lat: airport.lat, lng: airport.lng, active: true }]} className="hidden h-[160px] w-auto self-center text-brand-strong sm:block" />
      </div>
      <MiniAnswerBar
        summary={`${airport.iata} drop-off · ${record.isFree ? "Free" : record.feeSummary}`}
        verified
      />

      <AnswerPassage question={`What does it cost to drop someone off at ${airport.name}?`}>
        {record.isFree
          ? <>Dropping off at {airport.name} is free at the forecourt — no charge applies when using the designated drop-off zone. This is an official, date-stamped snapshot read directly from the airport's published page and verified {record.verifiedAt}.{record.freeAlternative ? <> The {record.freeAlternative.name} also provides free waiting for up to {record.freeAlternative.minutesFree} minutes.</> : " Always check the airport's own page for any changes before you travel."}</>
          : <>{airport.name} levies a charge to use the drop-off forecourt: {record.feeSummary.charAt(0).toLowerCase()}{record.feeSummary.slice(1)}{record.bands[0] ? <> ({formatPence(record.bands[0].totalPence)} for up to {record.bands[0].upToMinutes} minutes)</> : ""}{record.penaltyPence !== null ? <>; unpaid visits incur a {formatPence(record.penaltyPence)} penalty charge</> : ""}. {record.freeAlternative ? <>A free alternative, {record.freeAlternative.name}, is available for {record.freeAlternative.minutesFree} minutes.</> : <>No published free-forecourt alternative is available.</>} All figures are official, date-stamped snapshots read from the airport's own published page and verified {record.verifiedAt}.</>}
      </AnswerPassage>

      {trend ? <p className="text-sm font-medium text-warning">{trend}</p> : null}

      {record.freeAlternative ? (
        <Callout variant="free" title={`The free alternative: ${record.freeAlternative.name}`}>
          Free for {record.freeAlternative.minutesFree} minutes. {record.freeAlternative.details}
        </Callout>
      ) : null}

      {/* Decision bridge: keep the free-alternative message above intact (trust + ranking asset);
          ADD an honest, in-flow path for the segment that will actually park for the trip. */}
      <DropOffParkingBridge slug={airport.slug} airportName={airport.name} />

      {!record.isFree && !isPerEntryTariff(record) ? (
        <DropOffCalculator tariff={record} airportName={airport.name} buildDate={new Date().toISOString()} />
      ) : null}
      {isPerEntryTariff(record) ? (
        <Callout variant="info" title="Flat charge per entry">
          {airport.name} charges {formatPence(record.bands[0]?.totalPence ?? 0)} each time a vehicle enters the
          drop-off zone — the fee doesn&apos;t depend on how long you stop. {record.feeSummary}
        </Callout>
      ) : null}

      {!record.isFree ? (
        <section className="mf-reveal space-y-2">
          <h2 className="mf-underline-grow text-xl font-semibold text-ink">If you don&apos;t pay</h2>
          <p className="text-sm text-ink-muted">
            {record.penaltyPence !== null ? `Penalty: ${formatPence(record.penaltyPence)}. ` : ""}
            {record.penaltyNotes ?? ""} {record.paymentDeadline ? `Payment deadline: ${record.paymentDeadline}.` : ""}
          </p>
        </section>
      ) : null}

      <HolidayExtrasCard product="parking" surface="dropoff" airportName={airport.name} airportSlug={airport.slug} extras={["hotels", "lounge", "transfers"]} />
      <section className="mf-reveal space-y-2">
        <h2 className="mf-underline-grow text-xl font-semibold text-ink">Frequently asked questions</h2>
        <FaqAccordion items={faqs} />
      </section>

      {(hasParking || hasLounge) ? (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-ink">More at this airport</h2>
          <ul className="space-y-1 text-sm">
            {hasParking ? (
              <li>
                <Link href={`/airport-parking/${airport.slug}`} className="text-brand-accent underline underline-offset-4">
                  Parking at {airport.name} compared →
                </Link>
              </li>
            ) : null}
            {hasLounge ? (
              <li>
                <Link href={`/airport-lounges/${airport.slug}`} className="text-brand-accent underline underline-offset-4">
                  Lounges at {airport.name} — prices &amp; Priority Pass →
                </Link>
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}

      <EmailCaptureSlot
        formAction={process.env.NEXT_PUBLIC_MAILERLITE_FORM_ACTION}
        hook={`Get notified when ${airport.name} changes its fees`}
      />

      {!record.isFree && record.freeAlternative ? (
        <p>
          <Link href={`/avoid-drop-off-charge/${airport.slug}`} className="text-sm font-medium text-brand-accent underline underline-offset-4">
            How to avoid the {airport.name} drop-off charge →
          </Link>
        </p>
      ) : null}
      <p>
        <a href="/drop-off-charges" className="text-sm font-medium text-brand-accent underline underline-offset-4">
          Compare drop-off charges at all UK airports →
        </a>
      </p>
      <p>
        <Link href={`/abroad/${airport.slug}`} className="text-sm font-medium text-brand-accent underline underline-offset-4">
          Going abroad from {airport.name}? See the full travel cost →
        </Link>
      </p>
      {(() => {
        const updates = newsForAirport(airport.slug, 3);
        return updates.length ? <LatestUpdates items={updates} heading={`Latest at ${airport.name}`} /> : null;
      })()}
      <SourcesBlock
        sources={[{ label: `Official ${airport.name} drop-off page`, url: record.sourceUrl, verifiedAt: record.verifiedAt }]}
        method="Every figure is read from the airport's official page and re-verified on the date shown. We never republish unverified prices."
      />
    </article>
  );
}
