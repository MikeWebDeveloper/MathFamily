import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, faqPageLd, JsonLd, speakableLd } from "@mathfamily/geo";
import { AnswerCard, AnswerLead, EmailCaptureSlot, FaqAccordion, FeeGrid, FreshnessBadge, PageHeading, SourcesBlock } from "@mathfamily/ui";
import { AffiliateSlot } from "@/components/affiliate-slot";
import { MortgageSlot } from "@/components/mortgage-slot";
import { AdviceDisclaimer } from "@/components/disclaimer";
import { FamilyLinks } from "@/components/family-links";
import { SPOKES, buildSpokeModel, buildSpokeFaqs } from "@/lib/spokes";
import { ALL_SOURCES, VERIFIED_AT } from "@/lib/dataset";

export const dynamicParams = false;

export function generateStaticParams() {
  return SPOKES.map((s) => ({ slug: s.slug }));
}

function getSpoke(slug: string) {
  return SPOKES.find((s) => s.slug === slug) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const spoke = getSpoke(slug);
  if (!spoke) return {};
  return { title: spoke.metaTitle, description: spoke.metaDescription };
}

export default async function SpokePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const spoke = getSpoke(slug);
  if (!spoke) notFound();

  const m = buildSpokeModel(spoke);
  const faqs = buildSpokeFaqs(m);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002";

  const answer = `The estimated total cost of moving for this example is ${m.totalFormatted}, including ${m.sdltFormatted} of Stamp Duty (England & Northern Ireland).`;

  const facts = m.cost.lines.map((line) =>
    `${line.label}: ${formatPence(line.pence)}${line.note ? ` (${line.note})` : ""}`
  );

  return (
    <article className="space-y-8">
      <JsonLd data={faqPageLd(faqs)} />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Worked examples", url: `${siteUrl}/buying` },
          { name: m.priceBandLabel, url: `${siteUrl}/buying/${m.slug}` }
        ])}
      />
      <JsonLd data={speakableLd({ url: `${siteUrl}/buying/${m.slug}` })} />

      <header className="space-y-3">
        <PageHeading>{m.heading}</PageHeading>
        <FreshnessBadge verifiedAt={VERIFIED_AT} />
      </header>

      <AdviceDisclaimer />

      <div id="mf-answer-anchor">
        <AnswerLead answer={answer}>{facts}</AnswerLead>
      </div>

      <p className="text-ink-muted">{m.intro}</p>

      <AnswerCard
        label="Stamp Duty (SDLT) — England & NI estimate"
        value={m.sdltFormatted}
        note={`On a ${m.priceBandLabel} purchase as a ${m.buyerLabel.toLowerCase()}. Effective rate ${(m.cost.sdlt.effectiveRate * 100).toFixed(2)}%.`}
        footer={`Estimated total cost to move: ${m.totalFormatted}`}
      />

      <FeeGrid
        caption={`Estimated cost to move — ${m.buyerLabel.toLowerCase()}, ${m.priceBandLabel} (verified ${VERIFIED_AT}).`}
        columns={["Cost", "Amount"]}
        numericColumns={[1]}
        rows={[
          ...m.cost.lines.map((line) => [
            line.note ? `${line.label} (${line.note})` : line.label,
            formatPence(line.pence)
          ]),
          ["Total", formatPence(m.cost.totalPence)]
        ]}
        highlightRow={m.cost.lines.length}
      />

      {/* SDLT band breakdown — shows the marginal-band working (public gov.uk rates). */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-ink">How the Stamp Duty is worked out</h2>
        <FeeGrid
          caption="Marginal Stamp Duty bands applied to this price (England & Northern Ireland)."
          columns={["Rate", "Taxed slice", "Tax"]}
          numericColumns={[1, 2]}
          rows={m.cost.sdlt.breakdown.map((b) => [
            `${(b.rate * 100).toFixed(0)}%`,
            formatPence(b.slicePence),
            formatPence(b.taxPence)
          ])}
        />
        {m.cost.sdlt.ftbReliefLost ? (
          <p className="text-sm text-ink-muted">
            First-time-buyer relief is unavailable above £500,000, so standard rates apply to the whole price here.
          </p>
        ) : null}
      </section>

      {/* Conversion surfaces — GREEN rails inert, mortgage FCA-red + inert. */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">Get quotes for your move</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AffiliateSlot category="removals" surface={m.slug} />
          <AffiliateSlot category="conveyancing" surface={m.slug} />
          <AffiliateSlot category="surveys" surface={m.slug} />
          <MortgageSlot />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-ink">Frequently asked questions</h2>
        <FaqAccordion items={faqs} />
      </section>

      <EmailCaptureSlot
        brandName="MoveMath"
        hook="Get notified when Stamp Duty rules or moving costs change"
        description="UK moving-cost & Stamp Duty updates"
        source={m.slug}
        privacyHref="/privacy"
      />

      <p className="text-sm">
        <Link href="/buying" className="text-brand-accent underline underline-offset-4">
          ← All worked examples
        </Link>
      </p>

      <SourcesBlock
        sources={ALL_SOURCES}
        method="Stamp Duty is calculated from the public gov.uk residential SDLT bands for England & Northern Ireland. Removals, conveyancing and survey figures are typical estimates from public consumer guides (HomeOwners Alliance, Compare My Move) — not quotes. Scotland (LBTT) and Wales (LTT) use different systems and are not covered."
      />

      <FamilyLinks />
    </article>
  );
}
