import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, faqPageLd, JsonLd } from "@mathfamily/geo";
import {
  AnswerLead,
  AnswerPassage,
  EmailCaptureSlot,
  FaqAccordion,
  FeeGrid,
  FreshnessBadge,
  PageHeading,
  SavesVerdict,
  SourceCitation,
  SourcesBlock
} from "@mathfamily/ui";
import { AffiliateBlock } from "@/components/affiliate-block";
import { NHS_ENGLAND_HELP_URL, TREATMENTS, latestVerifiedAt, type TreatmentRecord } from "@/lib/dental-data";
import { buildTreatmentFaqs, compareTreatment, formatRange } from "@/lib/dental-content";

export const dynamicParams = false;

export function generateStaticParams() {
  return TREATMENTS.map((t) => ({ treatment: t.slug }));
}

function getTreatment(slug: string): TreatmentRecord | null {
  return TREATMENTS.find((t) => t.slug === slug) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ treatment: string }> }): Promise<Metadata> {
  const { treatment: slug } = await params;
  const treatment = getTreatment(slug);
  if (!treatment) return {};
  const c = compareTreatment(treatment);
  return {
    title: `${treatment.name} cost: NHS vs private in the UK`,
    description: `${c.answer} Verified against official NHS pages and public price guides.`
  };
}

export default async function TreatmentPage({ params }: { params: Promise<{ treatment: string }> }) {
  const { treatment: slug } = await params;
  const treatment = getTreatment(slug);
  if (!treatment) notFound();

  const c = compareTreatment(treatment);
  const verified = latestVerifiedAt();
  const faqs = buildTreatmentFaqs(treatment);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3003";

  const facts = [
    `${treatment.summary}`,
    `NHS England: ${c.band.label} — ${formatPence(c.nhsPence)} for the whole course of treatment.`,
    `Typical private price: ${formatRange(treatment.privatePrice)}. ${treatment.privateNote}`,
    `NHS band ${c.band.label} covers: ${c.band.covers}`
  ];

  const sources = [
    { label: "NHS — NHS dental charges (England)", url: NHS_ENGLAND_HELP_URL, verifiedAt: verified },
    { label: treatment.privateSource.label, url: treatment.privateSource.sourceUrl, verifiedAt: treatment.privateSource.verifiedAt }
  ];

  return (
    <article className="space-y-8">
      <JsonLd data={faqPageLd(faqs)} />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Treatments", url: `${siteUrl}/treatments` },
          { name: treatment.name, url: `${siteUrl}/treatments/${treatment.slug}` }
        ])}
      />

      <header className="space-y-3">
        <PageHeading>{treatment.name} cost: NHS vs private</PageHeading>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <FreshnessBadge verifiedAt={verified} href={null} />
          <span className="hidden sm:inline-flex">
            <SourceCitation url={NHS_ENGLAND_HELP_URL} label="NHS dental charges" />
          </span>
        </div>
      </header>

      <div id="mf-answer-anchor">
        <AnswerLead answer={c.answer}>{facts}</AnswerLead>
      </div>

      <AnswerPassage question={`How much does ${treatment.name.toLowerCase()} cost in the UK?`}>
        On the NHS in England it falls under {c.band.label}, a flat charge of {formatPence(c.nhsPence)} for the
        whole course of treatment however many appointments it takes. Privately it typically costs{" "}
        {formatRange(treatment.privatePrice)}, depending on the practice, region and complexity. NHS treatment
        is free if you qualify for an exemption.
      </AnswerPassage>

      <SavesVerdict
        amount={c.savingPence > 0 ? formatPence(c.savingPence) : undefined}
        verdict={
          c.savingPence > 0
            ? `Going NHS saves roughly ${formatPence(c.savingPence)} versus a mid-range private price for ${treatment.name.toLowerCase()} — though private care can mean shorter waits and more appointment choice.`
            : `The NHS charge for ${treatment.name.toLowerCase()} is broadly in line with private fees here; people still choose private for shorter waits or more choice.`
        }
      />

      <AffiliateBlock />

      <FeeGrid
        caption={`${treatment.name}: NHS England charge vs typical private price (verified ${verified}).`}
        columns={["Route", "Cost", "What it covers / notes"]}
        numericColumns={[1]}
        rows={[
          [`NHS (England, ${c.band.label})`, formatPence(c.nhsPence), c.band.covers],
          ["Private (typical)", formatRange(treatment.privatePrice), treatment.privateNote]
        ]}
      />

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-ink">Frequently asked questions</h2>
        <FaqAccordion items={faqs} />
      </section>

      <p className="rounded-card bg-surface p-4 text-sm text-ink-muted">
        This page is general information, <strong className="font-semibold text-ink">not medical or financial advice</strong>.
        Costs and clinical suitability vary — always check with your dentist or NHS for your own situation.
      </p>

      <EmailCaptureSlot
        brandName="DentalMath"
        hook="Get notified when NHS dental charges change"
        description="UK dental-cost update when NHS charges change"
        source="treatment"
        privacyHref="/privacy"
      />

      <p className="text-sm">
        <Link href="/treatments" className="text-brand-accent underline underline-offset-4">← All treatments</Link>
      </p>

      <SourcesBlock
        sources={sources}
        method="NHS band charges are taken directly from the official NHS England dental costs page. Private prices are indicative typical ranges from public price guides — never a single authoritative quote; they vary by practice, region and complexity."
      />
    </article>
  );
}
