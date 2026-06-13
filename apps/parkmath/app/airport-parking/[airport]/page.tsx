import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadAirports, loadParkingDataset, type Airport, type ParkingRecord } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { aggregateOfferLd, breadcrumbLd, faqPageLd, JsonLd } from "@mathfamily/geo";
import { AnswerLead, FaqAccordion, FeeGrid, FreshnessBadge, PageHeading, SavesVerdict, SourceCitation, SourcesBlock, EmailCaptureSlot } from "@mathfamily/ui";
import { BookingOptions } from "@/components/booking-options";
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
    description: `${data.airport.name} parking compared for 3, 7 and 14 days. ${m.answer} Verified ${data.record.verifiedAt}.`,
    alternates: { canonical: `/airport-parking/${airport}` }
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
  const cheapestSevenDay = Math.min(...sevenDayPrices);
  const winnerIndex = Number.isFinite(cheapestSevenDay) ? sevenDayPrices.indexOf(cheapestSevenDay) : -1;
  const validSevenDay = record.products
    .map((p) => p.prices.find((x) => x.days === 7)?.totalPence)
    .filter((p): p is number => p !== undefined);
  const priceValidUntil = new Date(new Date(`${record.verifiedAt}T00:00:00Z`).getTime() + 60 * 86_400_000)
    .toISOString()
    .slice(0, 10);

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
      {validSevenDay.length > 0 ? (
        <JsonLd
          data={aggregateOfferLd({
            name: `${airport.name} airport parking`,
            description: `Gate vs pre-book parking at ${airport.name} for 3, 7 and 14 days — verified prices.`,
            url: `${siteUrl}/airport-parking/${airport.slug}`,
            lowPricePence: Math.min(...validSevenDay),
            highPricePence: Math.max(...validSevenDay),
            offerCount: validSevenDay.length,
            priceValidUntil
          })}
        />
      ) : null}

      <header className="space-y-3">
        <PageHeading>{airport.name} parking: gate vs pre-book</PageHeading>
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

      <SavesVerdict
        amount={m7.savingsVsGatePence ? formatPence(m7.savingsVsGatePence) : undefined}
        verdict={
          m7.savingsVsGatePence && m7.cheapest
            ? `Pre-booking saves ${formatPence(m7.savingsVsGatePence)} vs the drive-up gate price for 7 days (${m7.cheapest.name}).`
            : `Compare options above to find the best price for your dates.`
        }
      />

      {m7.gate && m7.cheapest ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/charts/${airport.slug}.svg`}
          alt={`${airport.name} airport parking: drive-up gate vs cheapest pre-book price for 7 days`}
          width={1200}
          height={630}
          loading="lazy"
          className="mf-edge w-full max-w-2xl rounded-card"
        />
      ) : null}

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
        numericColumns={[1, 2, 3]}
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

      <BookingOptions airportName={airport.name} airportSlug={airport.slug} officialUrl={record.sourceUrl} />

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
