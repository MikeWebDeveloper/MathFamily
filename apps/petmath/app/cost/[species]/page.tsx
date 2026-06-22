import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, faqPageLd, JsonLd, speakableLd } from "@mathfamily/geo";
import {
  AnswerLead,
  Callout,
  EmailCaptureSlot,
  FaqAccordion,
  FeeGrid,
  FreshnessBadge,
  PageHeading,
  SourceCitation,
  SourcesBlock
} from "@mathfamily/ui";
import { PET_COST_RECORDS, INSURANCE_ESTIMATE, getPetCostRecord } from "@/lib/pet-costs";
import { petAnswer, lifetimeRangeLabel, lifetimeEstimate } from "@/lib/pet-content";
import { FoodAffiliateSlot } from "@/components/food-affiliate-slot";
import { DisclosureNote } from "@/components/disclosure-note";
import { FamilyLinks } from "@/components/family-links";

export const dynamicParams = false;

export function generateStaticParams() {
  return PET_COST_RECORDS.map((r) => ({ species: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ species: string }> }): Promise<Metadata> {
  const { species } = await params;
  const record = getPetCostRecord(species);
  if (!record) return {};
  return {
    title: `How much does a ${record.name.toLowerCase()} cost in the UK? Lifetime cost ${lifetimeRangeLabel(record)}`,
    description: `${petAnswer(record)} Figures verified against the PDSA Animal Wellbeing report.`
  };
}

export default async function PetCostPage({ params }: { params: Promise<{ species: string }> }) {
  const { species: slug } = await params;
  const record = getPetCostRecord(slug);
  if (!record) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3003";

  // Lifetime breakdown at the low and high end of the PDSA lifespan band.
  const low = lifetimeEstimate(record, record.lifespanYears.low);
  const high = lifetimeEstimate(record, record.lifespanYears.high);

  const faqs: { question: string; answer: string }[] = [
    {
      question: `How much does a ${record.name.toLowerCase()} cost over its lifetime in the UK?`,
      answer: `PDSA estimates at least ${lifetimeRangeLabel(record)} over a ${record.name.toLowerCase()}'s lifetime — about ${formatPence(record.monthlyCarePence)} a month for essential care plus ${formatPence(record.setupPence)} in one-off set-up. This is for essential welfare needs only and excludes emergency vet treatment.`
    },
    {
      question: `What does the monthly cost of a ${record.name.toLowerCase()} include?`,
      answer: `The PDSA ${formatPence(record.monthlyCarePence)} monthly figure covers food, routine vet care (yearly health check, booster vaccinations, flea and worm treatment), a typical pet-insurance line, plus consumables like poo bags or litter. It does not cover emergency vet bills, grooming, training, day care or boarding.`
    },
    {
      question: `Does the cost include pet insurance?`,
      answer: `Yes — the PDSA monthly figure already includes a typical insurance line. For reference, the ABI 2024 average pet-insurance premium was ${formatPence(INSURANCE_ESTIMATE.annualPremiumPence)} a year across all pets, but you should compare live quotes for your own pet. PetMath does not sell insurance.`
    }
  ];

  const facts = [
    `Monthly essential care: ${formatPence(record.monthlyCarePence)}`,
    `One-off set-up: ${formatPence(record.setupPence)}`,
    `Lifetime range: ${lifetimeRangeLabel(record)} (PDSA)`,
    `Average lifespan used: ${record.lifespanYears.low}–${record.lifespanYears.high} years`
  ];

  return (
    <article className="space-y-8">
      <JsonLd data={faqPageLd(faqs)} />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Pet costs", url: `${siteUrl}/cost` },
          { name: record.name, url: `${siteUrl}/cost/${record.slug}` }
        ])}
      />
      <JsonLd data={speakableLd({ url: `${siteUrl}/cost/${record.slug}` })} />

      <header className="space-y-3">
        <PageHeading>How much does a {record.name.toLowerCase()} cost in the UK?</PageHeading>
        <p className="text-sm text-ink-muted">{record.exampleBreeds}</p>
        <div className="flex flex-wrap items-center gap-3">
          <FreshnessBadge verifiedAt={record.verifiedAt} href={null} />
          <SourceCitation url={record.sourceUrl} label="PDSA cost of ownership" />
        </div>
      </header>

      <AnswerLead answer={petAnswer(record)}>{facts}</AnswerLead>

      <FeeGrid
        caption={`${record.name} lifetime cost at each end of the PDSA lifespan band (verified ${record.verifiedAt}). Set-up + monthly care × lifespan; essential care only.`}
        columns={["Lifespan", "Set-up", "Care over lifespan", "Lifetime total"]}
        numericColumns={[1, 2, 3]}
        rows={[
          [`${record.lifespanYears.low} years`, formatPence(low.setupPence), formatPence(low.carePence), formatPence(low.totalPence)],
          [`${record.lifespanYears.high} years`, formatPence(high.setupPence), formatPence(high.carePence), formatPence(high.totalPence)]
        ]}
      />

      <Callout variant="info" title="What this covers">
        {record.note}
      </Callout>

      <Callout variant="warning" title="Pet insurance is an estimate, not a quote">
        The monthly figure above already includes a typical insurance line. As a reference, the ABI 2024 average
        pet-insurance premium was {formatPence(INSURANCE_ESTIMATE.annualPremiumPence)} a year across all pets. Pet
        insurance is a regulated product — PetMath does not sell it; always compare live quotes for your own pet.
      </Callout>

      <FoodAffiliateSlot speciesSlug={record.slug} species={record.species} />

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-ink">Frequently asked questions</h2>
        <FaqAccordion items={faqs} />
      </section>

      <EmailCaptureSlot
        formAction={process.env.NEXT_PUBLIC_MAILERLITE_FORM_ACTION}
        hook="Get notified when UK pet costs change"
      />

      <p className="text-sm">
        <Link href="/cost" className="text-brand-accent underline underline-offset-4">← All pet costs</Link>
      </p>

      <SourcesBlock
        sources={[
          { label: `PDSA — cost of owning a ${record.species.toLowerCase()}`, url: record.sourceUrl, verifiedAt: record.verifiedAt },
          { label: "ABI — average pet insurance premium 2024", url: INSURANCE_ESTIMATE.sourceUrl, verifiedAt: INSURANCE_ESTIMATE.verifiedAt }
        ]}
        method="Monthly care, set-up and lifetime figures are read from the PDSA Animal Wellbeing 'cost of owning a pet' pages (calculated 2024 from current online prices, essential welfare needs only). The insurance reference line is the ABI's published 2024 average annual premium. Emergency vet treatment is excluded."
      />

      <DisclosureNote />

      <FamilyLinks />
    </article>
  );
}
