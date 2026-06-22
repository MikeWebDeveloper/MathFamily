import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, faqPageLd, speakableLd, JsonLd } from "@mathfamily/geo";
import {
  AnswerLead,
  AnswerPassage,
  EmailCaptureSlot,
  FaqAccordion,
  FeeGrid,
  FreshnessBadge,
  MiniAnswerBar,
  PageHeading,
  SourceCitation,
  SourcesBlock
} from "@mathfamily/ui";
import { TrueCostCalculator } from "../../../components/true-cost-calculator";
import { InertAffiliateSlot } from "../../../components/inert-affiliate-slot";
import { FamilyLinks } from "../../../components/family-links";
import { TOWNS, getTown, DEPOSIT_CAP_SOURCE, type TownRent } from "../../../lib/rent-data";
import { trueCostOfRenting, townToInput, townAnswer, buildTownFaqs } from "../../../lib/rent-content";

export const dynamicParams = false;

export function generateStaticParams() {
  return TOWNS.map((t) => ({ town: t.townSlug }));
}

function model(town: TownRent) {
  return trueCostOfRenting(townToInput(town));
}

export async function generateMetadata({ params }: { params: Promise<{ town: string }> }): Promise<Metadata> {
  const { town: slug } = await params;
  const town = getTown(slug);
  if (!town) return {};
  const result = model(town);
  return {
    title: `True cost of renting in ${town.townName} 2026 — rent, council tax, bills & deposit`,
    description: `${townAnswer(town, result, formatPence)}`
  };
}

export default async function TownPage({ params }: { params: Promise<{ town: string }> }) {
  const { town: slug } = await params;
  const town = getTown(slug);
  if (!town) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
  const result = model(town);
  const answer = townAnswer(town, result, formatPence);
  const faqs = buildTownFaqs(town, result, formatPence);

  const latestVerified = [town.rentSource.verifiedAt, town.councilTaxSource.verifiedAt, town.billsSource.verifiedAt]
    .sort()
    .at(-1)!;

  const facts = [
    `Median rent: ${formatPence(town.medianMonthlyRentPence)}/mo`,
    `Council tax (Band D): ${formatPence(town.councilTaxBandDMonthlyPence)}/mo`,
    `Typical bills: ${formatPence(town.typicalBillsMonthlyPence)}/mo`,
    `Real cost: ${formatPence(result.annualTrueCostPence)}/yr (≈ ${formatPence(result.effectiveMonthlyPence)}/mo)`,
    `Move-in: ${formatPence(result.moveInCostPence)} (first month + ${result.depositCapWeeks}-week deposit ${formatPence(result.depositPence)})`
  ];

  const miniSummary = `${town.townName} · ${formatPence(result.annualTrueCostPence)}/yr all in`;

  return (
    <article className="space-y-8">
      <JsonLd data={faqPageLd(faqs)} />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Towns", url: `${siteUrl}/towns` },
          { name: town.townName, url: `${siteUrl}/towns/${town.townSlug}` }
        ])}
      />
      <JsonLd data={speakableLd({ url: `${siteUrl}/towns/${town.townSlug}` })} />

      <header className="space-y-3">
        <PageHeading>True cost of renting in {town.townName}</PageHeading>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <FreshnessBadge verifiedAt={latestVerified} href={null} />
          <span className="hidden sm:inline-flex">
            <SourceCitation url={town.rentSource.sourceUrl} label="ONS private rent" />
          </span>
          <span className="text-xs text-ink-muted">{town.region}</span>
        </div>
      </header>

      <div id="mf-answer-anchor">
        <AnswerLead answer={answer}>{facts}</AnswerLead>
      </div>
      <MiniAnswerBar summary={miniSummary} verified />

      <AnswerPassage question={`How much does it really cost to rent in ${town.townName}?`}>
        {answer} The deposit is refundable and is shown separately from the yearly cost. All figures
        carry a source and a date in the Sources section below.
      </AnswerPassage>

      <TrueCostCalculator towns={TOWNS} />

      <FeeGrid
        caption={`What a year of renting in ${town.townName} adds up to (seed estimates, verified ${latestVerified}).`}
        columns={["Item", "Per month", "Per year"]}
        numericColumns={[1, 2]}
        rows={[
          ["Rent (median)", formatPence(town.medianMonthlyRentPence), formatPence(result.annualRentPence)],
          ["Council tax (Band D)", formatPence(town.councilTaxBandDMonthlyPence), formatPence(result.annualCouncilTaxPence)],
          ["Typical bills", formatPence(town.typicalBillsMonthlyPence), formatPence(result.annualBillsPence)],
          ["Real total", formatPence(result.effectiveMonthlyPence), formatPence(result.annualTrueCostPence)]
        ]}
      />

      <FeeGrid
        caption="Upfront to move in (the deposit is refundable, so it is not part of the yearly cost)."
        columns={["Item", "Amount"]}
        numericColumns={[1]}
        rows={[
          ["First month's rent", formatPence(town.medianMonthlyRentPence)],
          [`Deposit (capped at ${result.depositCapWeeks} weeks' rent)`, formatPence(result.depositPence)],
          ["Total to move in", formatPence(result.moveInCostPence)]
        ]}
      />

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-ink">Frequently asked questions</h2>
        <FaqAccordion items={faqs} />
      </section>

      <InertAffiliateSlot context={town.townName} />

      <EmailCaptureSlot
        brandName="RentMath"
        hook={`Get notified when ${town.townName} rent and council-tax figures change`}
        description="monthly UK renting-cost update"
        source="town"
        privacyHref="/privacy"
      />

      <p className="text-sm">
        <Link href="/towns" className="text-brand-accent underline underline-offset-4">
          ← Compare all towns
        </Link>
      </p>

      <SourcesBlock
        sources={[
          { label: `ONS private rent — ${town.townName}`, url: town.rentSource.sourceUrl, verifiedAt: town.rentSource.verifiedAt },
          { label: `Council tax (Band D) — ${town.townName}`, url: town.councilTaxSource.sourceUrl, verifiedAt: town.councilTaxSource.verifiedAt },
          { label: "Typical bills — Ofgem energy price cap", url: town.billsSource.sourceUrl, verifiedAt: town.billsSource.verifiedAt },
          { label: "Tenant Fees Act 2019 — 5-week deposit cap", url: DEPOSIT_CAP_SOURCE.sourceUrl, verifiedAt: DEPOSIT_CAP_SOURCE.verifiedAt }
        ]}
        method="Rent is the ONS median private rent for the local authority; council tax is the billing authority's Band D charge; bills approximate the Ofgem energy price cap plus a typical water bill. The deposit cap is statutory (Tenant Fees Act 2019). Seed estimates are re-verified against the official source before being published as confirmed figures."
      />

      <p className="text-xs text-ink-muted">
        Information only — RentMath is not a letting agent, landlord or financial adviser, and
        nothing here is financial advice. Confirm rent, council-tax band and bills with the landlord
        and {town.townName}&apos;s billing authority before you sign.
      </p>

      <FamilyLinks />
    </article>
  );
}
