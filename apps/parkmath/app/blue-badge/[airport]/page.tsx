import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isPublicTransportAlt, loadAirports, loadDropOffDataset, newsForAirport, type Airport, type DropOffRecord } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, faqPageLd, howToLd, JsonLd, speakableLd } from "@mathfamily/geo";
import { AnswerLead, AnswerPassage, Callout, CaveatChip, EmailCaptureSlot, FaqAccordion, FreshnessBadge, LatestUpdates, MiniAnswerBar, PageHeading, SourceCitation, SourcesBlock } from "@mathfamily/ui";
import { HolidayExtrasCard } from "@/components/holiday-extras-card";
import { freshnessDelta } from "@/lib/content";
import {
  blueBadgeAnswer,
  blueBadgeHasProcess,
  blueBadgeLeadFacts,
  blueBadgeStatusLabel,
  buildBlueBadgeFaqs,
  buildBlueBadgeSteps,
  classifyBlueBadge,
  qualifiesForBlueBadgePage
} from "@/lib/blue-badge-content";
import { airportHasParkingVsDropOff } from "@/lib/parking-vs-drop-off-content";

export const dynamicParams = false;

/** One page per airport that carries a verified Blue Badge drop-off policy. The dataset populates
 *  `blueBadgePolicy` for all 25 airports, so all 25 qualify — but the guard keeps us honest if a
 *  record ever ships without one. */
export function generateStaticParams() {
  return loadDropOffDataset()
    .records.filter(qualifiesForBlueBadgePage)
    .map((r) => ({ airport: r.airportSlug }));
}

function getData(slug: string): { airport: Airport; record: DropOffRecord } | null {
  const airport = loadAirports().find((a) => a.slug === slug);
  const record = loadDropOffDataset().records.find((r) => r.airportSlug === slug);
  if (!airport || !record || !qualifiesForBlueBadgePage(record)) return null;
  return { airport, record };
}

export async function generateMetadata({ params }: { params: Promise<{ airport: string }> }): Promise<Metadata> {
  const { airport } = await params;
  const data = getData(airport);
  if (!data) return {};
  const { airport: a, record } = data;
  const status = blueBadgeStatusLabel(record).toLowerCase();
  return {
    title: `Blue Badge drop-off at ${a.name} 2026 — is it free?`,
    description: `Blue Badge drop-off at ${a.name}: ${status}. The exact policy, how to claim it, and the free option for everyone — read from the official ${a.name} page, verified ${record.verifiedAt}.`,
    alternates: { canonical: `/blue-badge/${airport}` }
  };
}

export default async function BlueBadgePage({ params }: { params: Promise<{ airport: string }> }) {
  const { airport: slug } = await params;
  const data = getData(slug);
  if (!data) notFound();
  const { airport, record } = data;
  const kind = classifyBlueBadge(record.blueBadgePolicy);
  const fee = record.isFree ? null : record.bands[0]?.totalPence ?? null;

  const steps = buildBlueBadgeSteps(record, airport.name);
  const faqs = buildBlueBadgeFaqs(record, airport.name);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const pageUrl = `${siteUrl}/blue-badge/${airport.slug}`;

  const latestNews = newsForAirport(airport.slug, 1)[0];
  const pageVerifiedAt = latestNews && latestNews.verifiedAt > record.verifiedAt ? latestNews.verifiedAt : record.verifiedAt;

  const calloutVariant = kind === "exempt" ? "free" : kind === "none" ? "warning" : "info";

  return (
    <article className="space-y-8">
      {steps.length > 0 ? (
        <JsonLd
          data={howToLd({
            name: `How Blue Badge holders claim the ${airport.name} drop-off concession`,
            description: `Verified, date-stamped steps for the ${airport.name} Blue Badge drop-off concession, read from the airport's official page.`,
            url: pageUrl,
            steps
          })}
        />
      ) : null}
      <JsonLd data={faqPageLd(faqs)} />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Blue Badge & accessibility", url: `${siteUrl}/blue-badge` },
          { name: `${airport.name} Blue Badge drop-off`, url: pageUrl }
        ])}
      />
      <JsonLd data={speakableLd({ url: pageUrl })} />

      <header className="space-y-3">
        <PageHeading>Blue Badge drop-off at {airport.name}</PageHeading>
        <div className="flex flex-wrap items-center gap-3">
          <FreshnessBadge verifiedAt={pageVerifiedAt} deltaLabel={freshnessDelta(record) ?? undefined} />
          <SourceCitation url={record.sourceUrl} label={`Official ${airport.name} page`} />
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <CaveatChip>Blue Badge: {blueBadgeStatusLabel(record)}</CaveatChip>
        {fee !== null ? <CaveatChip>Standard charge: {formatPence(fee)}</CaveatChip> : null}
        {record.freeAlternative ? <CaveatChip>Free for all: {record.freeAlternative.name}</CaveatChip> : null}
      </div>

      <AnswerLead answer={blueBadgeAnswer(record, airport.name)}>{blueBadgeLeadFacts(record)}</AnswerLead>
      <MiniAnswerBar summary={`${airport.iata} · Blue Badge: ${blueBadgeStatusLabel(record)}`} verified />

      <AnswerPassage question={`Is drop-off free for Blue Badge holders at ${airport.name}?`}>
        {record.isFree ? (
          <>Dropping off at {airport.name} is free for everyone, so there is no forecourt charge for a Blue Badge holder to be exempt from. {record.blueBadgePolicy}.</>
        ) : kind === "exempt" ? (
          <>Yes — {airport.name} waives the{fee !== null ? <> {formatPence(fee)}</> : null} forecourt drop-off charge for Blue Badge holders, provided the exemption is registered as the airport requires. {record.blueBadgePolicy}.</>
        ) : kind === "none" ? (
          <>No — {airport.name} publishes no Blue Badge concession for the{fee !== null ? <> {formatPence(fee)}</> : null} drop-off forecourt. {record.blueBadgePolicy}.</>
        ) : (
          <>Not outright — {airport.name} does not waive the{fee !== null ? <> {formatPence(fee)}</> : null} forecourt charge for Blue Badge holders, but it publishes a concession. {record.blueBadgePolicy}.</>
        )}{" "}
        Every figure here is an official, date-stamped snapshot read from the airport&apos;s own published page and verified {record.verifiedAt}. We never invent a policy the airport doesn&apos;t publish.
      </AnswerPassage>

      <Callout variant={calloutVariant} title={`The official ${airport.name} Blue Badge policy`}>
        {record.blueBadgePolicy}.
      </Callout>

      {steps.length > 0 ? (
        <section className="mf-reveal space-y-4">
          <h2 className="mf-underline-grow text-xl font-semibold text-ink">How to claim it</h2>
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
      ) : (
        <Callout variant="info" title="No specific process is published">
          {airport.name}&apos;s official page doesn&apos;t describe a Blue Badge claim process for the drop-off forecourt.
          {record.freeAlternative ? (isPublicTransportAlt(record.freeAlternative) ? <> If you need a free option, any traveller can arrive by the {record.freeAlternative.name} instead of the forecourt.</> : <> If you need a free option, any driver can use the {record.freeAlternative.name} (free for {record.freeAlternative.minutesFree} minutes).</>) : <> Contact the airport directly to ask about assistance.</>}
        </Callout>
      )}

      {record.freeAlternative ? (
        <Callout variant="free" title={`Free for everyone: ${record.freeAlternative.name}`}>
          {isPublicTransportAlt(record.freeAlternative) ? <>Open to any traveller — Blue Badge or not. {record.freeAlternative.details}</> : <>Free for {record.freeAlternative.minutesFree} minutes for any driver — Blue Badge or not. {record.freeAlternative.details}</>}
        </Callout>
      ) : null}

      {!record.isFree && record.paymentDeadline ? (
        <Callout variant="info" title="If a charge still applies">
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
        brandName="ParkMath"
        source="blue-badge"
        hook={`Get notified when ${airport.name} changes its Blue Badge or drop-off policy`}
      />

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-ink">More at this airport</h2>
        <ul className="space-y-1 text-sm">
          <li>
            <Link href={`/drop-off-charges/${airport.slug}`} className="text-brand-accent underline underline-offset-4">
              Full {airport.name} drop-off charge breakdown →
            </Link>
          </li>
          {!record.isFree && record.freeAlternative ? (
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
          <li>
            <a href="/blue-badge" className="text-brand-accent underline underline-offset-4">
              Blue Badge drop-off at every UK airport →
            </a>
          </li>
        </ul>
      </section>

      {(() => {
        const updates = newsForAirport(airport.slug, 3);
        return updates.length ? <LatestUpdates items={updates} heading={`Latest at ${airport.name}`} /> : null;
      })()}

      <SourcesBlock
        sources={[{ label: `Official ${airport.name} drop-off page`, url: record.sourceUrl, verifiedAt: record.verifiedAt }]}
        method="The Blue Badge policy, the forecourt charge and any free alternative are read verbatim from the airport's official page and re-verified on the date shown. We classify the outcome (exempt, free window, concession or none) only from that published wording — we never invent a concession the airport doesn't publish."
      />
    </article>
  );
}
