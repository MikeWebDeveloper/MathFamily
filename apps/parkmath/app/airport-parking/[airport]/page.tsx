import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadAirports, loadParkingDataset, type Airport, type ParkingRecord } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, faqPageLd, JsonLd } from "@mathfamily/geo";
import { AnswerLead, FaqAccordion, FeeGrid, FreshnessBadge, SourceCitation, SourcesBlock, EmailCaptureSlot } from "@mathfamily/ui";
import { AffiliateBlock } from "@/components/affiliate-block";
import { ParkingCalculator } from "@/components/parking-calculator";
import { DURATION_SLUGS, buildParkingFaqs, parkingPageModel } from "@/lib/parking-content";

export const dynamicParams = false;

export function generateStaticParams() {
  return loadParkingDataset().records.map((r) => ({ airport: r.airportSlug }));
}

function getData(slug: string): { airport: Airport; record: ParkingRecord } | null {
  const airport = loadAirports().find((a) => a.slug === slug);
  const record = loadParkingDataset().records.find((r) => r.airportSlug === slug);
  return airport && record ? { airport, record } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ airport: string }> }): Promise<Metadata> {
  const { airport } = await params;
  const data = getData(airport);
  if (!data) return {};
  const m = parkingPageModel(data.record, 7);
  return {
    title: `${data.airport.name} parking prices 2026 — gate vs pre-book, verified`,
    description: `${data.airport.name} parking compared for 3, 7 and 14 days. ${m.answer} Verified ${data.record.verifiedAt}.`
  };
}

export default async function ParkingHubPage({ params }: { params: Promise<{ airport: string }> }) {
  const { airport: slug } = await params;
  const data = getData(slug);
  if (!data) notFound();
  const { airport, record } = data;
  const m7 = parkingPageModel(record, 7);
  const faqs = buildParkingFaqs(record, airport.name, 7);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const sevenDayPrices = record.products.map((p) => p.prices.find((x) => x.days === 7)?.totalPence ?? Number.POSITIVE_INFINITY);
  const winnerIndex = sevenDayPrices.indexOf(Math.min(...sevenDayPrices));

  return (
    <article className="space-y-8">
      <JsonLd data={faqPageLd(faqs)} />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Airport parking", url: `${siteUrl}/airport-parking` },
          { name: airport.name, url: `${siteUrl}/airport-parking/${airport.slug}` }
        ])}
      />

      <header className="space-y-3">
        <h1 className="text-3xl font-bold text-ink">{airport.name} parking: gate vs pre-book</h1>
        <div className="flex flex-wrap items-center gap-3">
          <FreshnessBadge verifiedAt={record.verifiedAt} />
          <SourceCitation url={record.sourceUrl} label={`Official ${airport.name} parking`} />
        </div>
      </header>

      <AnswerLead answer={m7.answer}>
        {DURATION_SLUGS.map((s) => {
          const days = Number(s.split("-")[0]);
          const m = parkingPageModel(record, days);
          return m.cheapest
            ? `${days} days: from ${formatPence(m.cheapest.totalPence)} (${m.cheapest.name})`
            : `${days} days: see official site`;
        })}
      </AnswerLead>

      <ParkingCalculator tariff={record} airportName={airport.name} buildDate={new Date().toISOString()} />

      {m7.warnings.length > 0 ? (
        <ul className="space-y-1 text-xs text-ink-muted">
          {m7.warnings.map((w) => (
            <li key={w.code}>{w.message}</li>
          ))}
        </ul>
      ) : null}

      <FeeGrid
        caption={`All published ${airport.name} options by duration. Pre-book figures are dated snapshots from the official portal.`}
        columns={["Option", "3 days", "7 days", "14 days"]}
        highlightRow={winnerIndex >= 0 ? winnerIndex : undefined}
        rows={record.products.map((p, i) => [
          i === winnerIndex ? (
            <span key="w" className="inline-flex items-center gap-2">
              {p.name}
              <span className="rounded-full bg-brand-accent/15 px-2 py-0.5 text-[11px] font-bold text-brand-accent">Cheapest 7-day</span>
            </span>
          ) : (
            p.name
          ),
          ...[3, 7, 14].map((d) => {
            const price = p.prices.find((x) => x.days === d);
            return price ? formatPence(price.totalPence) : "—";
          })
        ])}
      />

      <AffiliateBlock slotId="parking-prebook" airportSlug={airport.slug} officialUrl={record.sourceUrl} />

      <nav aria-label="Duration pages" className="flex gap-3 text-sm">
        {DURATION_SLUGS.map((s) => (
          <Link key={s} href={`/airport-parking/${airport.slug}/${s}`} className="font-medium text-brand-accent underline underline-offset-4">
            {s.replace("-", " ")} guide →
          </Link>
        ))}
      </nav>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-ink">Frequently asked questions</h2>
        <FaqAccordion items={faqs} />
      </section>

      <p className="text-sm">
        <Link href={`/drop-off-charges/${airport.slug}`} className="text-brand-accent underline underline-offset-4">
          Just dropping someone off at {airport.name}? See the drop-off charge →
        </Link>
      </p>

      <EmailCaptureSlot formAction={process.env.NEXT_PUBLIC_MAILERLITE_FORM_ACTION} hook={`Get notified when ${airport.name} parking prices change`} />

      <SourcesBlock
        sources={[{ label: `Official ${airport.name} parking pages`, url: record.sourceUrl, verifiedAt: record.verifiedAt }]}
        method="Gate tariffs are the airport's official published prices. Pre-book figures are dated quote snapshots taken on the airport's own booking portal — never scraped from third-party aggregators."
      />
    </article>
  );
}
