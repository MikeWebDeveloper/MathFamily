import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadAirports, loadDropOffDataset, type Airport, type DropOffRecord } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, faqPageLd, JsonLd } from "@mathfamily/geo";
import { AnswerLead, Callout, FaqAccordion, FeeStat, FreshnessBadge, SourceCitation, SourcesBlock, EmailCaptureSlot } from "@mathfamily/ui";
import { DropOffCalculator } from "@/components/drop-off-calculator";
import { buildDropOffFaqs, isPerEntryTariff, trendNote } from "@/lib/content";

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
    title: `${data.airport.name} drop-off charge 2026 — fee, time limit & the free alternative`,
    description: `${data.airport.name} drop-off: ${data.record.feeSummary}. Penalty, payment deadline, Blue Badge rules and how to avoid the fee — verified ${data.record.verifiedAt}.`
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

      <header className="space-y-3">
        <h1 className="text-3xl font-bold text-ink">{airport.name} drop-off charge</h1>
        <div className="flex flex-wrap items-center gap-3">
          <FreshnessBadge verifiedAt={record.verifiedAt} />
          <SourceCitation url={record.sourceUrl} label={`Official ${airport.name} page`} />
        </div>
      </header>

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

      <FeeStat
        label="Current drop-off charge"
        value={record.isFree ? "Free" : formatPence(record.bands[0]?.totalPence ?? 0)}
        note={record.isFree ? "No forecourt charge" : record.feeSummary}
      />

      {trend ? <p className="text-sm font-medium text-warning">{trend}</p> : null}

      {record.freeAlternative ? (
        <Callout variant="free" title={`The free alternative: ${record.freeAlternative.name}`}>
          Free for {record.freeAlternative.minutesFree} minutes. {record.freeAlternative.details}
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
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-ink">If you don&apos;t pay</h2>
          <p className="text-sm text-ink-muted">
            {record.penaltyPence !== null ? `Penalty: ${formatPence(record.penaltyPence)}. ` : ""}
            {record.penaltyNotes ?? ""} {record.paymentDeadline ? `Payment deadline: ${record.paymentDeadline}.` : ""}
          </p>
        </section>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-ink">Frequently asked questions</h2>
        <FaqAccordion items={faqs} />
      </section>

      <EmailCaptureSlot
        formAction={process.env.NEXT_PUBLIC_MAILERLITE_FORM_ACTION}
        hook={`Get notified when ${airport.name} changes its fees`}
      />

      <p>
        <a href="/drop-off-charges" className="text-sm font-medium text-brand-accent underline underline-offset-4">
          Compare drop-off charges at all UK airports →
        </a>
      </p>
      <SourcesBlock
        sources={[{ label: `Official ${airport.name} drop-off page`, url: record.sourceUrl, verifiedAt: record.verifiedAt }]}
        method="Every figure is read from the airport's official page and re-verified on the date shown. We never republish unverified prices."
      />
    </article>
  );
}
