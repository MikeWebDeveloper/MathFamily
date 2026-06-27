import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isPublicTransportAlt, loadAirports, loadDropOffDataset, loadParkingDataset, loadLoungeDataset, newsForAirport, type Airport, type DropOffRecord } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, faqPageLd, JsonLd, speakableLd } from "@mathfamily/geo";
import { AnswerCard, AnswerLead, AnswerPassage, CaveatChip, Callout, FaqAccordion, FreshnessBadge, LatestUpdates, MiniAnswerBar, PageHeading, SourceCitation, SourcesBlock, EmailCaptureSlot, UkMap, VerifiedStamp } from "@mathfamily/ui";
import { DropOffCalculator } from "@/components/drop-off-calculator";
import { DropOffParkingBridge } from "@/components/drop-off-bridge";
import { HolidayExtrasCard } from "@/components/holiday-extras-card";
import { bandPriceParenthetical, buildDropOffFaqs, dropOffTimeLimitNote, freshnessDelta, isPerEntryTariff, paymentDeadlineChip, searchName, trendNote } from "@/lib/content";
import { airportHasParkingVsDropOff } from "@/lib/parking-vs-drop-off-content";

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
  // Lead the title/description with the searched token + "Airport" + plural "charges & fees"
  // (the literal GSC queries: "stansted drop off charges", "stansted airport drop off fees").
  const sn = searchName(data.airport.name);
  const headlineFee = data.record.isFree ? "free" : formatPence(data.record.bands[0]?.totalPence ?? 0);
  const structureWord = data.record.isFree ? "rules" : isPerEntryTariff(data.record) ? "per entry" : "time limit";
  // Per-airport SEO override (CTR fix on page-1 quick-win pages): when the dataset carries an
  // explicit seoTitle/seoDescription for this airport, use it verbatim to front-match the literal
  // searched query; otherwise fall back to the generated template. These fields NEVER affect any
  // price/policy — they only relabel the SERP entry.
  const title =
    data.record.seoTitle ??
    `${sn} Airport drop-off charges 2026 — ${data.record.isFree ? "free" : `${headlineFee} fee`}, ${structureWord} & how to avoid it`;
  const description =
    data.record.seoDescription ??
    `${sn} Airport drop-off charges: ${data.record.feeSummary}. How much it costs, the time limit, penalty, payment deadline, Blue Badge rules and how to avoid the fee. Current for 2026 — verified ${data.record.verifiedAt} against the official ${data.airport.name} page.`;
  return {
    title,
    description,
    alternates: { canonical: `/drop-off-charges/${airport}` }
  };
}

export default async function DropOffPage({ params }: { params: Promise<{ airport: string }> }) {
  const { airport: slug } = await params;
  const data = getData(slug);
  if (!data) notFound();
  const { airport, record } = data;
  const sn = searchName(airport.name);
  const faqs = buildDropOffFaqs(record, airport.name);
  const timeLimitNote = dropOffTimeLimitNote(record);
  const trend = trendNote(record);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const hasParking = loadParkingDataset().records.some((r) => r.airportSlug === slug);
  const hasLounge = loadLoungeDataset().records.some((r) => r.airportSlug === slug);
  const hasCompare = airportHasParkingVsDropOff(slug);
  const latestNews = newsForAirport(airport.slug, 1)[0];
  const pageVerifiedAt = latestNews && latestNews.verifiedAt > record.verifiedAt ? latestNews.verifiedAt : record.verifiedAt;

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
      {/* Product+Offer JSON-LD removed (2026-06-26 SEO audit): a government/airport access fee is not
          a purchasable Product/Offer, so modelling it as InStock gave no rich-result benefit on an
          independent data site and was the page's one genuine schema-misuse/quality risk. FAQPage +
          BreadcrumbList do all the SERP work. */}
      <JsonLd data={speakableLd({ url: `${siteUrl}/drop-off-charges/${airport.slug}` })} />

      <header className="space-y-3">
        <PageHeading>{sn} Airport drop-off charges</PageHeading>
        {sn !== airport.name ? (
          <p className="text-sm text-ink-muted">Official name: {airport.name} ({airport.iata}).</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <FreshnessBadge verifiedAt={pageVerifiedAt} deltaLabel={freshnessDelta(record) ?? undefined} />
          <SourceCitation url={record.sourceUrl} label={`Official ${airport.name} page`} />
        </div>
        {/* Freshness moat, above the fold: answers the ranked "is this current information" query
            and matches the verified-against-official-page snippet intent (intel §1, content spec §0). */}
        <p className="text-sm text-ink-muted">
          Yes, this is current information: {sn} Airport&apos;s drop-off charge was verified on{" "}
          {new Date(`${pageVerifiedAt}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}{" "}
          against the official {airport.name} page.
        </p>
      </header>

      {!record.isFree ? (
        <div className="flex flex-wrap gap-2">
          {record.maxStayMinutes !== null ? <CaveatChip>Max stay {record.maxStayMinutes} min</CaveatChip> : null}
          {record.penaltyPence !== null ? <CaveatChip>{formatPence(record.penaltyPence)} penalty if unpaid</CaveatChip> : null}
          {record.paymentDeadline && /online/i.test(record.paymentDeadline) ? <CaveatChip>Pay online — no barrier</CaveatChip> : null}
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
          ...(record.freeAlternative ? [`Free alternative: ${record.freeAlternative.name}${isPublicTransportAlt(record.freeAlternative) ? " (public transport)" : ` (${record.freeAlternative.minutesFree} min)`}`] : []),
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
        <UkMap markers={[{ lat: airport.lat, lng: airport.lng, active: true }]} className="hidden h-[160px] w-auto self-center text-brand-strong sm:block" aria-hidden />
      </div>

      {/* Penalty stat chip — inline pair: charge tile + penalty tile, visible at a glance */}
      {!record.isFree && record.penaltyPence !== null ? (
        <div className="flex flex-wrap gap-3" role="region" aria-label="Charge and penalty at a glance">
          <div className="flex items-center gap-2 rounded-lg border border-ink/10 bg-surface-muted px-3 py-2 text-sm">
            <span className="font-bold text-ink">{formatPence(record.bands[0]?.totalPence ?? 0)}</span>
            {record.bands[0] ? <span className="text-ink-muted">· {record.bands[0].upToMinutes} min</span> : null}
            <span className="text-xs text-ink-muted/70 ml-1">charge</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/8 px-3 py-2 text-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span className="font-bold text-warning">{formatPence(record.penaltyPence)}</span>
            <span className="text-xs text-ink-muted/80">penalty if unpaid</span>
          </div>
        </div>
      ) : null}

      <MiniAnswerBar
        summary={`${airport.iata} drop-off · ${record.isFree ? "Free" : record.feeSummary}`}
        verified
      />

      {/* Decision bridge, promoted to body level right after the answer (P0): a person reading the
          drop-off fee is deciding HOW to access the airport = a parking buyer at the decision point.
          This is the highest-visibility honest funnel point — it routes the drop-off moat audience
          to the parking comparison / tracked /go affiliate. De-gated: fires for every charging airport
          that resolves a parking link, not only the 8 with a full tariff. The free-alternative callout
          (the trust + ranking asset) stays intact below. */}
      <DropOffParkingBridge slug={airport.slug} airportName={airport.name} />

      <AnswerPassage question={`What does it cost to drop someone off at ${airport.name}?`}>
        {record.isFree
          ? <>Dropping off at {airport.name} is free at the forecourt — no charge applies when using the designated drop-off zone. This is an official, date-stamped snapshot read directly from the airport's published page and verified {record.verifiedAt}.{record.freeAlternative ? <> The {record.freeAlternative.name} also provides free waiting for up to {record.freeAlternative.minutesFree} minutes.</> : " Always check the airport's own page for any changes before you travel."}</>
          : <>{airport.name} levies a charge to use the drop-off forecourt: {record.feeSummary.charAt(0).toLowerCase()}{record.feeSummary.slice(1)}{bandPriceParenthetical(record) ? <> ({bandPriceParenthetical(record)})</> : ""}{record.penaltyPence !== null ? <>; unpaid visits incur a {formatPence(record.penaltyPence)} penalty charge</> : ""}. {record.freeAlternative ? (isPublicTransportAlt(record.freeAlternative) ? <>A free alternative is to arrive by the {record.freeAlternative.name}, which reaches the terminal without using the forecourt.</> : <>A free alternative, {record.freeAlternative.name}, is available for {record.freeAlternative.minutesFree} minutes.</>) : <>No published free-forecourt alternative is available.</>} All figures are official, date-stamped snapshots read from the airport's own published page and verified {record.verifiedAt}.</>}
      </AnswerPassage>

      {trend ? <p className="text-sm font-medium text-warning">{trend}</p> : null}

      {timeLimitNote ? (
        <AnswerPassage question={`Is there a time limit on the ${sn} drop-off zone?`}>
          {timeLimitNote}{record.paymentDeadline ? <> Payment is barrier-free: you can settle online by {record.paymentDeadline}.</> : null} This {sn} drop-off charge is sometimes called the {sn} drop-off levy, the {sn} airport levy charge, or the kiss-and-fly charge — they all refer to the same forecourt fee. These figures are read from the official {airport.name} page and verified {record.verifiedAt}.
        </AnswerPassage>
      ) : null}

      {record.freeAlternative ? (
        <Callout variant="free" title={`The free alternative: ${record.freeAlternative.name}`}>
          {isPublicTransportAlt(record.freeAlternative) ? <>{record.freeAlternative.details}</> : <>Free for {record.freeAlternative.minutesFree} minutes. {record.freeAlternative.details}</>}
        </Callout>
      ) : null}

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

      {(
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-ink">More at this airport</h2>
          <ul className="space-y-1 text-sm">
            <li>
              <Link href={`/airport-parking-options/${airport.slug}`} className="text-brand-accent underline underline-offset-4">
                Cheapest way to park or drop off at {airport.name}: all options compared →
              </Link>
            </li>
            {hasCompare ? (
              <li>
                <Link href={`/parking-vs-drop-off/${airport.slug}`} className="text-brand-accent underline underline-offset-4">
                  Parking vs drop-off at {airport.name}: which is cheaper? →
                </Link>
              </li>
            ) : null}
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
            <li>
              <Link href={`/blue-badge/${airport.slug}`} className="text-brand-accent underline underline-offset-4">
                Blue Badge drop-off at {airport.name}: is it free? →
              </Link>
            </li>
          </ul>
        </section>
      )}

      <EmailCaptureSlot
        source="drop-off-charges"
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
        <Link href="/drop-off-charges/price-index" className="text-sm font-medium text-brand-accent underline underline-offset-4">
          See where {sn} ranks in the UK Airport Drop-Off Price Index →
        </Link>
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
