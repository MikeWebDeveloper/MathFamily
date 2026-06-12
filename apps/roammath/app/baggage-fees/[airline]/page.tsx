import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadBaggageDataset, type BaggageRecord } from "@mathfamily/data";
import { breadcrumbLd, faqPageLd, JsonLd } from "@mathfamily/geo";
import { AnswerLead, Callout, FaqAccordion, FeeGrid, FreshnessBadge, SourceCitation, SourcesBlock } from "@mathfamily/ui";
import { baggageAnswer, feeRangeLabel } from "@/lib/baggage-content";

export const dynamicParams = false;

export function generateStaticParams() {
  return loadBaggageDataset().records.map((r) => ({ airline: r.airlineSlug }));
}

function getData(slug: string): BaggageRecord | null {
  return loadBaggageDataset().records.find((r) => r.airlineSlug === slug) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ airline: string }> }): Promise<Metadata> {
  const { airline } = await params;
  const record = getData(airline);
  if (!record) return {};
  return {
    title: `${record.airlineName} baggage fees 2026 — cabin & checked bag prices`,
    description: `${baggageAnswer(record)} Verified against official ${record.airlineName} fee pages.`
  };
}

export default async function AirlineBaggagePage({ params }: { params: Promise<{ airline: string }> }) {
  const { airline: slug } = await params;
  const record = getData(slug);
  if (!record) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

  const cabin = record.fees.find((f) => f.item.toLowerCase().includes("cabin"));
  const checked = record.fees.find(
    (f) => f.item.toLowerCase().includes("checked") || /\b\d{2}kg\b/.test(f.item)
  );

  const faqs: { question: string; answer: string }[] = [
    {
      question: `How much is a cabin bag on ${record.airlineName}?`,
      answer: cabin
        ? `${record.airlineName} charges ${feeRangeLabel(cabin)} for a ${cabin.item.toLowerCase()}${cabin.note ? ` (${cabin.note})` : ""}.`
        : `${record.airlineName} does not publish a separate cabin bag fee — check the official fee page.`
    },
    {
      question: `How do I avoid bag fees on ${record.airlineName}?`,
      answer: (() => {
        const freeFees = record.fees.filter((f) => f.minPence === 0 && f.maxPence === 0);
        if (freeFees.length > 0) {
          return `${record.airlineName} includes ${freeFees.map((f) => f.item.toLowerCase()).join(" and ")} free with every fare — travelling with only the free allowance avoids additional bag fees.`;
        }
        return `Check the ${record.airlineName} fee page for the current free allowance — travelling with only the included allowance avoids extra charges.`;
      })()
    }
  ];

  const facts = record.fees.map((f) => `${f.item}: ${feeRangeLabel(f)}`);

  return (
    <article className="space-y-8">
      <JsonLd data={faqPageLd(faqs)} />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Baggage fees", url: `${siteUrl}/baggage-fees` },
          { name: record.airlineName, url: `${siteUrl}/baggage-fees/${record.airlineSlug}` }
        ])}
      />

      <header className="space-y-3">
        <h1 className="text-h1 font-bold tracking-tight text-balance text-ink">{record.airlineName} baggage fees: official published charges</h1>
        <div className="flex flex-wrap items-center gap-3">
          <FreshnessBadge verifiedAt={record.verifiedAt} />
          <SourceCitation url={record.sourceUrl} label={`Official ${record.airlineName} fee page`} />
        </div>
      </header>

      <AnswerLead answer={baggageAnswer(record)}>{facts}</AnswerLead>

      <FeeGrid
        caption={`${record.airlineName} baggage fees (verified ${record.verifiedAt}). Ranges reflect official published min–max charges.`}
        columns={["Item", "Price", "Notes"]}
        rows={record.fees.map((f) => [f.item, feeRangeLabel(f), f.note ?? "—"])}
      />

      {record.dynamicPricingNote ? (
        <Callout variant="info" title="Why a range?">
          {record.dynamicPricingNote}
        </Callout>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-ink">Frequently asked questions</h2>
        <FaqAccordion items={faqs} />
      </section>

      <p className="text-sm">
        <Link href="/baggage-fees" className="text-brand-accent underline underline-offset-4">
          ← All airlines
        </Link>
      </p>

      <SourcesBlock
        sources={[{ label: `Official ${record.airlineName} fee page`, url: record.sourceUrl, verifiedAt: record.verifiedAt }]}
        method="Bag fees are taken from the airline's own published fee schedule or help centre. Ranges reflect the official published min–max charges — exact prices vary by route, date and booking channel."
      />
    </article>
  );
}
