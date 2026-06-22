import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isPublicTransportAlt, loadAirports, loadDropOffDataset, newsForAirport, type Airport, type DropOffRecord } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, faqPageLd, howToLd, JsonLd, speakableLd } from "@mathfamily/geo";
import { AnswerLead, AnswerPassage, Callout, CaveatChip, EmailCaptureSlot, FaqAccordion, FreshnessBadge, LatestUpdates, MiniAnswerBar, PageHeading, SourceCitation, SourcesBlock } from "@mathfamily/ui";
import { HolidayExtrasCard } from "@/components/holiday-extras-card";
import { freshnessDelta } from "@/lib/content";
import { avoidAnswer, avoidLeadFacts, buildAvoidFaqs, buildAvoidSteps, qualifiesForAvoidPage } from "@/lib/avoid-content";
import { airportHasParkingVsDropOff } from "@/lib/parking-vs-drop-off-content";

export const dynamicParams = false;

/** One page per airport that BOTH charges and has a verified free alternative. Free airports
 *  and charging airports without a published free option are excluded (nothing to "avoid"). */
export function generateStaticParams() {
  return loadDropOffDataset()
    .records.filter(qualifiesForAvoidPage)
    .map((r) => ({ airport: r.airportSlug }));
}

function getData(slug: string): { airport: Airport; record: DropOffRecord } | null {
  const airport = loadAirports().find((a) => a.slug === slug);
  const record = loadDropOffDataset().records.find((r) => r.airportSlug === slug);
  if (!airport || !record || !qualifiesForAvoidPage(record)) return null;
  return { airport, record };
}

export async function generateMetadata({ params }: { params: Promise<{ airport: string }> }): Promise<Metadata> {
  const { airport } = await params;
  const data = getData(airport);
  if (!data) return {};
  const { airport: a, record } = data;
  const fee = record.bands[0]?.totalPence ?? 0;
  return {
    title: `How to avoid the ${a.name} drop-off charge 2026`,
    description: `Skip the ${formatPence(fee)} ${a.name} drop-off fee: use ${record.freeAlternative?.name}${record.freeAlternative && isPublicTransportAlt(record.freeAlternative) ? " (public transport to the terminal)" : ` (free for ${record.freeAlternative?.minutesFree} min)`}, plus Blue Badge rules — verified ${record.verifiedAt}.`,
    alternates: { canonical: `/avoid-drop-off-charge/${airport}` }
  };
}

export default async function AvoidDropOffPage({ params }: { params: Promise<{ airport: string }> }) {
  const { airport: slug } = await params;
  const data = getData(slug);
  if (!data) notFound();
  const { airport, record } = data;
  const alt = record.freeAlternative!;
  const fee = record.bands[0]?.totalPence ?? 0;

  const steps = buildAvoidSteps(record, airport.name);
  const faqs = buildAvoidFaqs(record, airport.name);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const pageUrl = `${siteUrl}/avoid-drop-off-charge/${airport.slug}`;

  const latestNews = newsForAirport(airport.slug, 1)[0];
  const pageVerifiedAt = latestNews && latestNews.verifiedAt > record.verifiedAt ? latestNews.verifiedAt : record.verifiedAt;

  return (
    <article className="space-y-8">
      <JsonLd
        data={howToLd({
          name: `How to avoid the ${airport.name} drop-off charge`,
          description: `Verified, date-stamped ways to avoid the ${formatPence(fee)} ${airport.name} forecourt drop-off charge.`,
          url: pageUrl,
          steps
        })}
      />
      <JsonLd data={faqPageLd(faqs)} />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Drop-off charges", url: `${siteUrl}/drop-off-charges` },
          { name: `${airport.name} — avoid the charge`, url: pageUrl }
        ])}
      />
      <JsonLd data={speakableLd({ url: pageUrl })} />

      <header className="space-y-3">
        <PageHeading>How to avoid the {airport.name} drop-off charge</PageHeading>
        <div className="flex flex-wrap items-center gap-3">
          <FreshnessBadge verifiedAt={pageVerifiedAt} deltaLabel={freshnessDelta(record) ?? undefined} />
          <SourceCitation url={record.sourceUrl} label={`Official ${airport.name} page`} />
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <CaveatChip>Forecourt charge: {formatPence(fee)}</CaveatChip>
        <CaveatChip>{isPublicTransportAlt(alt) ? `Free alternative: ${alt.name}` : `Free for ${alt.minutesFree} min at ${alt.name}`}</CaveatChip>
        {record.penaltyPence !== null ? <CaveatChip>{formatPence(record.penaltyPence)} penalty if unpaid</CaveatChip> : null}
      </div>

      <AnswerLead answer={avoidAnswer(record, airport.name)}>{avoidLeadFacts(record)}</AnswerLead>
      <MiniAnswerBar summary={`${airport.iata} · avoid ${formatPence(fee)} → use ${alt.name}`} verified />

      <AnswerPassage question={`How do I avoid the drop-off charge at ${airport.name}?`}>
        {airport.name} charges {formatPence(fee)} to use the terminal drop-off forecourt, but you can avoid it:{" "}
        {isPublicTransportAlt(alt) ? (
          <>arrive by the {alt.name} instead of driving up to the forecourt. {alt.details} That saves the full {formatPence(fee)} per drop-off.</>
        ) : (
          <>park in the {alt.name}, which gives you {alt.minutesFree} minutes free. {alt.details} That saves the full {formatPence(fee)} per drop-off.</>
        )}
        {record.penaltyPence !== null ? <> If you do use the forecourt and don&apos;t pay, the penalty is {formatPence(record.penaltyPence)}.</> : null} All
        figures are official, date-stamped snapshots read from the airport&apos;s own published page and verified {record.verifiedAt}.
      </AnswerPassage>

      <Callout variant="free" title={`The free alternative: ${alt.name}`}>
        {isPublicTransportAlt(alt) ? <>{alt.details}</> : <>Free for {alt.minutesFree} minutes. {alt.details}</>}
      </Callout>

      <section className="mf-reveal space-y-4">
        <h2 className="mf-underline-grow text-xl font-semibold text-ink">Step by step</h2>
        <ol className="space-y-4">
          {steps.map((step, i) => (
            <li key={step.name} className="flex gap-4">
              <span
                aria-hidden
                className="mf-num mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-accent/10 text-sm font-semibold text-brand-accent"
              >
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-ink">{step.name}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {record.paymentDeadline ? (
        <Callout variant="info" title="If you can't avoid the forecourt">
          {airport.name} lets you pay by {record.paymentDeadline}.
          {record.penaltyPence !== null ? ` Miss it and the penalty is ${formatPence(record.penaltyPence)}.` : ""}{" "}
          {record.penaltyNotes ?? ""}
        </Callout>
      ) : null}

      <HolidayExtrasCard product="parking" surface="dropoff" airportName={airport.name} airportSlug={airport.slug} extras={["hotels", "lounge", "transfers"]} />

      <section className="mf-reveal space-y-2">
        <h2 className="mf-underline-grow text-xl font-semibold text-ink">Frequently asked questions</h2>
        <FaqAccordion items={faqs} />
      </section>

      <EmailCaptureSlot
        source="avoid-drop-off-charge"
        hook={`Get notified when ${airport.name} changes its drop-off fee`}
      />

      <p>
        <Link href={`/drop-off-charges/${airport.slug}`} className="text-sm font-medium text-brand-accent underline underline-offset-4">
          Full {airport.name} drop-off charge breakdown →
        </Link>
      </p>
      {airportHasParkingVsDropOff(airport.slug) ? (
        <p>
          <Link href={`/parking-vs-drop-off/${airport.slug}`} className="text-sm font-medium text-brand-accent underline underline-offset-4">
            Parking vs drop-off at {airport.name}: which is cheaper? →
          </Link>
        </p>
      ) : null}
      <p>
        <Link href={`/blue-badge/${airport.slug}`} className="text-sm font-medium text-brand-accent underline underline-offset-4">
          Blue Badge drop-off at {airport.name}: is it free? →
        </Link>
      </p>
      <p>
        <a href="/avoid-drop-off-charge" className="text-sm font-medium text-brand-accent underline underline-offset-4">
          How to avoid the charge at every UK airport →
        </a>
      </p>

      {(() => {
        const updates = newsForAirport(airport.slug, 3);
        return updates.length ? <LatestUpdates items={updates} heading={`Latest at ${airport.name}`} /> : null;
      })()}

      <SourcesBlock
        sources={[{ label: `Official ${airport.name} drop-off page`, url: record.sourceUrl, verifiedAt: record.verifiedAt }]}
        method="Every figure — the forecourt charge, the free-alternative allowance and the penalty — is read from the airport's official page and re-verified on the date shown. We never republish unverified prices."
      />
    </article>
  );
}
