import type { Metadata } from "next";
import Link from "next/link";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, faqPageLd, JsonLd } from "@mathfamily/geo";
import { AnswerLead, AnswerPassage, Callout, EmailCaptureSlot, FaqAccordion, FeeGrid, FreshnessBadge, PageHeading, SourcesBlock } from "@mathfamily/ui";
import { NHS_BAND_CHARGES, NHS_NATIONS, latestVerifiedAt } from "@/lib/dental-data";

export const metadata: Metadata = {
  title: "NHS dental charges 2026 — Band 1, 2 and 3 costs across the UK",
  description:
    "Current NHS dental charges in England (Band 1 £27.90, Band 2 £76.60, Band 3 £332.10) plus how charges work in Scotland, Wales and Northern Ireland — verified against official sources."
};

export default function NhsDentalChargesPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3003";
  const verified = latestVerifiedAt();

  const answer =
    `NHS dental treatment in England has three fixed bands: Band 1 ${formatPence(NHS_BAND_CHARGES[0]!.pricePence)}, ` +
    `Band 2 ${formatPence(NHS_BAND_CHARGES[1]!.pricePence)} and Band 3 ${formatPence(NHS_BAND_CHARGES[2]!.pricePence)}, with urgent care ${formatPence(NHS_BAND_CHARGES[3]!.pricePence)}. ` +
    `You pay one charge per course of treatment, at the highest band you need. Scotland, Wales and Northern Ireland use different models.`;

  const faqs = [
    {
      question: "How much is an NHS check-up?",
      answer: `In England a check-up falls under Band 1: ${formatPence(NHS_BAND_CHARGES[0]!.pricePence)}. In Scotland and Northern Ireland examinations are free; Wales charges around £25.`
    },
    {
      question: "Do I pay separately for each appointment?",
      answer: "No. In England you pay one band charge per course of treatment, no matter how many appointments it takes. You pay the highest band that applies."
    },
    {
      question: "Can I get free NHS dental treatment?",
      answer: "Yes if you qualify for an exemption — for example if you are under 18 (or under 19 in full-time education), pregnant or have had a baby in the last 12 months, or receive certain benefits. In Scotland all under-26s get free NHS dental care."
    }
  ];

  return (
    <article className="space-y-8">
      <JsonLd data={faqPageLd(faqs)} />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "NHS dental charges", url: `${siteUrl}/nhs-dental-charges` }
        ])}
      />

      <header className="space-y-3">
        <PageHeading>NHS dental charges across the UK</PageHeading>
        <FreshnessBadge verifiedAt={verified} href={null} />
      </header>

      {/* LEGAL (required on this NHS-named page): make the disaffiliation explicit and prominent. */}
      <Callout variant="warning" title="Independent service — not the NHS">
        DentalMath is an <strong>independent</strong> information service. It is{" "}
        <strong>not affiliated with, endorsed by, or run by the NHS</strong>. For official guidance and
        to book treatment, go to the NHS directly.
      </Callout>

      <div id="mf-answer-anchor">
        <AnswerLead answer={answer}>
          {NHS_BAND_CHARGES.map((b) => `${b.label}: ${formatPence(b.pricePence)} — ${b.covers}`)}
        </AnswerLead>
      </div>

      <AnswerPassage question="How much are NHS dental charges in England?">
        England uses three fixed bands. Band 1 ({formatPence(NHS_BAND_CHARGES[0]!.pricePence)}) covers check-ups
        and prevention; Band 2 ({formatPence(NHS_BAND_CHARGES[1]!.pricePence)}) adds fillings, root canals and
        extractions; Band 3 ({formatPence(NHS_BAND_CHARGES[2]!.pricePence)}) adds crowns, dentures and bridges.
        You pay once per course of treatment, at the highest band needed.
      </AnswerPassage>

      <FeeGrid
        caption={`NHS England dental band charges (verified ${verified}).`}
        columns={["Band", "Charge", "What it covers"]}
        numericColumns={[1]}
        rows={NHS_BAND_CHARGES.map((b) => [b.label, formatPence(b.pricePence), b.covers])}
      />

      <Callout variant="info" title="Charges differ across the UK">
        The band system above is for <strong>England</strong>. Scotland, Wales and Northern Ireland set their
        own NHS dental charges — see the breakdown below.
      </Callout>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-ink">How NHS dental charges work in each nation</h2>
        <div className="space-y-3">
          {NHS_NATIONS.map((n) => (
            <div key={n.slug} className="rounded-card border border-ink/10 bg-card p-4">
              <h3 className="font-semibold text-ink">{n.name}</h3>
              <p className="mt-1 text-sm text-ink-muted">{n.model}</p>
              <a
                href={n.source.sourceUrl}
                rel="noopener noreferrer"
                target="_blank"
                className="mt-2 inline-block text-xs underline decoration-dotted underline-offset-4 hover:text-brand-accent"
              >
                {n.source.label} — verified {n.source.verifiedAt}
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-ink">Frequently asked questions</h2>
        <FaqAccordion items={faqs} />
      </section>

      <p className="rounded-card bg-surface p-4 text-sm text-ink-muted">
        General information only — <strong className="font-semibold text-ink">not medical or financial advice</strong>.
        Check with your dentist or NHS for your own situation. See{" "}
        <Link href="/treatments" className="text-brand-accent underline underline-offset-4">NHS vs private costs by treatment →</Link>
      </p>

      <EmailCaptureSlot
        brandName="DentalMath"
        hook="Get notified when NHS dental charges change"
        description="UK dental-cost update when NHS charges change"
        source="nhs-charges"
        privacyHref="/privacy"
      />

      <SourcesBlock
        sources={[
          { label: NHS_NATIONS[0]!.source.label, url: NHS_NATIONS[0]!.source.sourceUrl, verifiedAt: NHS_NATIONS[0]!.source.verifiedAt },
          { label: NHS_NATIONS[1]!.source.label, url: NHS_NATIONS[1]!.source.sourceUrl, verifiedAt: NHS_NATIONS[1]!.source.verifiedAt },
          { label: NHS_NATIONS[2]!.source.label, url: NHS_NATIONS[2]!.source.sourceUrl, verifiedAt: NHS_NATIONS[2]!.source.verifiedAt },
          { label: NHS_NATIONS[3]!.source.label, url: NHS_NATIONS[3]!.source.sourceUrl, verifiedAt: NHS_NATIONS[3]!.source.verifiedAt }
        ]}
        method="NHS band charges are read from the official NHS England dental costs page; devolved-nation figures are summarised from each nation's official NHS page."
      />
    </article>
  );
}
