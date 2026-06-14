import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadAirports, loadParkingDataset, type Airport, type ParkingRecord } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { aggregateOfferLd, breadcrumbLd, faqPageLd, JsonLd, speakableLd } from "@mathfamily/geo";
import { AnswerPassage, FaqAccordion, FeeGrid, FreshnessBadge, PageHeading, SourceCitation, SourcesBlock, EmailCaptureSlot } from "@mathfamily/ui";
import { ParkingAnswer } from "@/components/parking-answer";
import { DURATION_SLUGS, buildParkingFaqs, coveredParkingDurations, parkingPageModel } from "@/lib/parking-content";

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

  // Pre-compute the model for each covered duration (3, 7, 14 days) — passed to the
  // client component as serializable props so the page stays fully static.
  // coveredParkingDurations() is the single source of truth for which durations have data.
  const entries = coveredParkingDurations(record).map((days) => ({
    days,
    model: parkingPageModel(record, days),
  }));

  // Clamp the default selected duration to one that actually has data.
  // Prefer 7 days (the canonical "hero" duration), fall back to the first covered duration.
  const defaultDays = entries.some((e) => e.days === 7) ? 7 : (entries[0]?.days ?? 7);

  // Fallback to the 7-day model for metadata / JSON-LD / FAQs even if it's not "covered"
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
    <article className="space-y-6">
      <JsonLd data={faqPageLd(faqs)} />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Airport parking", url: `${siteUrl}/airport-parking` },
          { name: airport.name, url: `${siteUrl}/airport-parking/${airport.slug}` }
        ])}
      />
      <JsonLd data={speakableLd({ url: `${siteUrl}/airport-parking/${airport.slug}` })} />
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

      {/* Above the fold — NO mf-reveal: header + LCP hero must render instantly */}
      <header className="space-y-3">
        <PageHeading>{airport.name} parking: gate vs pre-book</PageHeading>
        <div className="flex flex-wrap items-center gap-3">
          <FreshnessBadge verifiedAt={record.verifiedAt} />
          <SourceCitation url={record.sourceUrl} label={`Official ${airport.name} parking`} />
        </div>
      </header>

      {/* Reactive answer-first block: duration control + hero + saves + option cards + booking CTA.
          All parts read the same pre-computed model so they can never disagree. SSR renders at
          defaultDays=7 (crawlable, JS-off correct). No CLS on hydration (same default). */}
      <ParkingAnswer
        entries={entries}
        defaultDays={defaultDays}
        slug={airport.slug}
        airportName={airport.name}
        officialUrl={record.sourceUrl}
      />

      <AnswerPassage question={`How much is parking at ${airport.name}?`}>
        {m7.cheapest
          ? <>For a 7-day stay, {m7.cheapest.name} is the cheapest verified option at {formatPence(m7.cheapest.totalPence)}{m7.gate && m7.savingsVsGatePence ? <>, saving {formatPence(m7.savingsVsGatePence)} against the drive-up gate price of {formatPence(m7.gate.totalPence)}</> : ""}. These are official, date-stamped snapshots taken directly from the airport's own booking portal — not estimates from third-party sites. Always confirm prices on the official portal before travelling.</>
          : <>No pre-book prices are published for {airport.name} parking across all durations — check the official booking portal for current gate and pre-book rates before your trip.</>}
      </AnswerPassage>

      {/* ── Below-the-fold sections — scroll-reveal with gentle stagger ── */}

      {m7.gate && m7.cheapest ? (
        /* Chart SVG uses literal light colours — wrap in a fixed-light plate so it reads as
           an intentional chart card in both light and dark mode, not a broken bright island. */
        <div
          className="mf-reveal w-full max-w-2xl rounded-card bg-white p-3"
          style={{ colorScheme: "light", "--mf-delay": "0ms" } as React.CSSProperties}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/charts/${airport.slug}.svg`}
            alt={`${airport.name} airport parking: drive-up gate vs cheapest pre-book price for 7 days`}
            width={1200}
            height={630}
            loading="lazy"
            className="w-full rounded"
          />
        </div>
      ) : null}

      {/* All-durations reference grid — kept as a static, always-visible summary table. */}
      <div className="mf-reveal" style={{ "--mf-delay": "40ms" } as React.CSSProperties}>
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
      </div>

      <nav
        aria-label="Duration pages"
        className="mf-reveal flex gap-3 text-sm"
        style={{ "--mf-delay": "80ms" } as React.CSSProperties}
      >
        {DURATION_SLUGS.map((s) => (
          <Link key={s} href={`/airport-parking/${airport.slug}/${s}`} className="font-medium text-brand-accent underline underline-offset-4">
            {s.replace("-", " ")} guide →
          </Link>
        ))}
      </nav>

      <section
        id="faq"
        className="mf-reveal space-y-3 scroll-mt-20"
        style={{ "--mf-delay": "0ms" } as React.CSSProperties}
      >
        <h2 className="mf-underline-grow text-xl font-semibold text-ink">Frequently asked questions</h2>
        <FaqAccordion items={faqs} />
      </section>

      <p className="mf-reveal text-sm" style={{ "--mf-delay": "0ms" } as React.CSSProperties}>
        <Link href={`/drop-off-charges/${airport.slug}`} className="text-brand-accent underline underline-offset-4">
          Just dropping someone off at {airport.name}? See the drop-off charge →
        </Link>
      </p>

      <div className="mf-reveal" style={{ "--mf-delay": "0ms" } as React.CSSProperties}>
        <EmailCaptureSlot formAction={process.env.NEXT_PUBLIC_MAILERLITE_FORM_ACTION} hook={`Get notified when ${airport.name} parking prices change`} />
      </div>

      <div className="mf-reveal" style={{ "--mf-delay": "40ms" } as React.CSSProperties}>
        <SourcesBlock
          sources={[{ label: `Official ${airport.name} parking pages`, url: record.sourceUrl, verifiedAt: record.verifiedAt }]}
          method="Gate tariffs are the airport's official published prices. Pre-book figures are dated quote snapshots taken on the airport's own booking portal — never scraped from third-party aggregators."
        />
      </div>
    </article>
  );
}
