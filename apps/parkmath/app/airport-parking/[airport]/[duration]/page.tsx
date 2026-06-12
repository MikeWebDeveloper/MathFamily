import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadAirports, loadParkingDataset, type Airport, type ParkingRecord } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, faqPageLd, JsonLd } from "@mathfamily/geo";
import { AnswerLead, Callout, FaqAccordion, FeeGrid, FreshnessBadge, SourcesBlock } from "@mathfamily/ui";
import { BookingOptions } from "@/components/booking-options";
import { DURATION_SLUGS, buildParkingFaqs, durationFromSlug, parkingPageModel } from "@/lib/parking-content";

export const dynamicParams = false;

export function generateStaticParams() {
  return loadParkingDataset().records.flatMap((r) =>
    DURATION_SLUGS.map((duration) => ({ airport: r.airportSlug, duration }))
  );
}

function getData(slug: string): { airport: Airport; record: ParkingRecord } | null {
  const airport = loadAirports().find((a) => a.slug === slug);
  const record = loadParkingDataset().records.find((r) => r.airportSlug === slug);
  return airport && record ? { airport, record } : null;
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ airport: string; duration: string }>;
}): Promise<Metadata> {
  const { airport, duration } = await params;
  const data = getData(airport);
  const days = durationFromSlug(duration);
  if (!data || days === null) return {};
  const m = parkingPageModel(data.record, days);
  return {
    title: `${days}-day parking at ${data.airport.name} — cheapest verified price`,
    description: `${m.answer} Gate vs pre-book for ${days} days at ${data.airport.name}, verified ${data.record.verifiedAt}.`
  };
}

export default async function DurationPage({
  params
}: {
  params: Promise<{ airport: string; duration: string }>;
}) {
  const { airport: slug, duration } = await params;
  const data = getData(slug);
  const days = durationFromSlug(duration);
  if (!data || days === null) notFound();
  const { airport, record } = data;
  const m = parkingPageModel(record, days);
  const faqs = buildParkingFaqs(record, airport.name, days);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <article className="space-y-8">
      <JsonLd data={faqPageLd(faqs)} />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Airport parking", url: `${siteUrl}/airport-parking` },
          { name: airport.name, url: `${siteUrl}/airport-parking/${airport.slug}` },
          { name: `${days} days`, url: `${siteUrl}/airport-parking/${airport.slug}/${duration}` }
        ])}
      />

      <header className="space-y-3">
        <h1 className="text-3xl font-bold text-ink">
          {days}-day parking at {airport.name}
        </h1>
        <FreshnessBadge verifiedAt={record.verifiedAt} />
      </header>

      <AnswerLead answer={m.answer}>
        {m.options.map(
          (o) =>
            `${o.name}: ${formatPence(o.totalPence)}${o.snapshotDate ? ` (snapshot ${o.snapshotDate})` : " (published gate rate)"}`
        )}
      </AnswerLead>

      {m.savingsVsGatePence && m.cheapest && m.gate ? (
        <Callout variant="free" title={`Pre-booking saves ${formatPence(m.savingsVsGatePence)}`}>
          Turning up and paying the gate rate ({m.gate.name}, {formatPence(m.gate.totalPence)}) costs{" "}
          {formatPence(m.savingsVsGatePence)} more than the cheapest verified option ({m.cheapest.name},{" "}
          {formatPence(m.cheapest.totalPence)}) for {days} days.
        </Callout>
      ) : null}

      <FeeGrid
        caption={`${airport.name} options priced for exactly ${days} days.`}
        columns={["Option", "Type", `${days}-day total`]}
        rows={m.options.map((o) => [
          o.name,
          o.productType === "gate" ? "Drive-up" : o.productType === "prebook" ? "Pre-book" : o.productType,
          formatPence(o.totalPence)
        ])}
      />

      {m.warnings.length > 0 ? (
        <ul className="space-y-1 text-xs text-ink-muted">
          {m.warnings.map((w) => (
            <li key={w.code}>{w.message}</li>
          ))}
        </ul>
      ) : null}

      <BookingOptions airportName={airport.name} airportSlug={airport.slug} officialUrl={record.sourceUrl} />

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-ink">Frequently asked questions</h2>
        <FaqAccordion items={faqs} />
      </section>

      <p className="text-sm">
        <Link href={`/airport-parking/${airport.slug}`} className="text-brand-accent underline underline-offset-4">
          All durations and options at {airport.name} →
        </Link>
      </p>

      <SourcesBlock
        sources={[{ label: `Official ${airport.name} parking pages`, url: record.sourceUrl, verifiedAt: record.verifiedAt }]}
        method="Gate tariffs are official published prices; pre-book figures are dated official-portal snapshots."
      />
    </article>
  );
}
