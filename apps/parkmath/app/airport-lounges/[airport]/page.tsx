import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadAirports, loadLoungeDataset, loadParkingDataset, loadPriorityPass, type Airport, type LoungeRecord } from "@mathfamily/data";
import { formatPence, loungeBreakEven } from "@mathfamily/engine";
import { breadcrumbLd, faqPageLd, JsonLd } from "@mathfamily/geo";
import { AnswerLead, FaqAccordion, FeeGrid, FreshnessBadge, PageHeading, SavesVerdict, SourceCitation, SourcesBlock } from "@mathfamily/ui";
import { HolidayExtrasCard } from "@/components/holiday-extras-card";
import { LoungeCalculator } from "@/components/lounge-calculator";
import { buildLoungeFaqs } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return loadLoungeDataset().records.map((r) => ({ airport: r.airportSlug }));
}

function getData(slug: string): { airport: Airport; record: LoungeRecord } | null {
  const airport = loadAirports().find((a) => a.slug === slug);
  const record = loadLoungeDataset().records.find((r) => r.airportSlug === slug);
  return airport && record ? { airport, record } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ airport: string }> }): Promise<Metadata> {
  const { airport } = await params;
  const data = getData(airport);
  if (!data) return {};
  const cheapest = data.record.lounges.filter((l) => l.walkInPence !== null).sort((a, b) => a.walkInPence! - b.walkInPence!)[0];
  return {
    title: `${data.airport.name} lounges 2026 — prices & Priority Pass break-even`,
    description: `${data.airport.name} lounge pre-book from-prices${cheapest ? ` from ${formatPence(cheapest.walkInPence!)}` : ""}, which take Priority Pass, and when membership beats paying per visit. Verified ${data.record.verifiedAt}.`,
    alternates: { canonical: `/airport-lounges/${airport}` }
  };
}

export default async function LoungePage({ params }: { params: Promise<{ airport: string }> }) {
  const { airport: slug } = await params;
  const data = getData(slug);
  if (!data) notFound();
  const { airport, record } = data;
  const pp = loadPriorityPass();
  const priced = record.lounges.filter((l) => l.walkInPence !== null);
  const cheapest = [...priced].sort((a, b) => a.walkInPence! - b.walkInPence!)[0];
  const loungeResult = cheapest ? loungeBreakEven(cheapest.walkInPence!, 3, pp.tiers) : null;
  const hasParking = loadParkingDataset().records.some((r) => r.airportSlug === airport.slug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const faqs = buildLoungeFaqs(record, airport.name, pp.tiers);

  return (
    <article className="space-y-8">
      <JsonLd data={faqPageLd(faqs)} />
      <JsonLd data={breadcrumbLd([
        { name: "Home", url: siteUrl },
        { name: "Airport lounges", url: `${siteUrl}/airport-lounges` },
        { name: airport.name, url: `${siteUrl}/airport-lounges/${airport.slug}` }
      ])} />

      <header className="space-y-3">
        <PageHeading>{airport.name} lounges: pay per visit or join?</PageHeading>
        <div className="flex flex-wrap items-center gap-3">
          <FreshnessBadge verifiedAt={record.verifiedAt} />
          <SourceCitation url={record.sourceUrl} label={`Official lounge pages`} />
        </div>
      </header>

      <AnswerLead
        answer={
          cheapest
            ? `A lounge visit at ${airport.name} costs from ${formatPence(cheapest.walkInPence!)} (operator pre-book price — walk-up rates can be higher) — frequent flyers may pay less with a membership.`
            : `${airport.name} lounge walk-in prices aren't published online — memberships may still beat on-the-day rates.`
        }
      >
        {record.lounges.map((l) => `${l.name}: ${l.walkInPence !== null ? formatPence(l.walkInPence) : "price on the day"}${l.priorityPass ? " · Priority Pass" : ""}`)}
      </AnswerLead>

      <FeeGrid
        caption={`${airport.name} lounges, verified ${record.verifiedAt}.`}
        columns={["Lounge", "From (pre-book)", "Priority Pass"]}
        rows={record.lounges.map((l) => [l.name, l.walkInPence !== null ? formatPence(l.walkInPence) : "—", l.priorityPass ? "Yes" : "No"])}
      />

      {cheapest ? <LoungeCalculator walkInPence={cheapest.walkInPence!} tiers={pp.tiers} airportName={airport.name} /> : null}

      {loungeResult ? (
        <SavesVerdict
          amount={loungeResult.verdict === "membership" && loungeResult.savingsPence > 0 ? formatPence(loungeResult.savingsPence) : undefined}
          verdict={
            loungeResult.verdict === "membership" && loungeResult.savingsPence > 0
              ? `A ${loungeResult.best?.tier} membership saves ${formatPence(loungeResult.savingsPence)}/year vs paying per visit at 3 visits — adjust the slider to match your travel frequency.`
              : `At 3 visits/year, paying per visit (${formatPence(loungeResult.payAsYouGoPence)}/yr) beats membership — use the calculator above.`
          }
        />
      ) : null}

      <HolidayExtrasCard product="lounge" surface="lounge" airportName={airport.name} airportSlug={airport.slug} />

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-ink">Frequently asked questions</h2>
        <FaqAccordion items={faqs} />
      </section>

      {hasParking ? (
        <p className="text-sm">
          <Link href={`/airport-parking/${airport.slug}`} className="text-brand-accent underline underline-offset-4">
            Parking at {airport.name} compared →
          </Link>
        </p>
      ) : null}

      <SourcesBlock
        sources={[
          { label: `Official ${airport.name} lounge pages`, url: record.sourceUrl, verifiedAt: record.verifiedAt },
          { label: "Priority Pass official pricing", url: pp.sourceUrl, verifiedAt: pp.verifiedAt }
        ]}
        method="Pre-book from-prices from the lounge operators' official pages; walk-up rates on the day may be higher. Membership pricing from Priority Pass's official site."
      />
    </article>
  );
}
