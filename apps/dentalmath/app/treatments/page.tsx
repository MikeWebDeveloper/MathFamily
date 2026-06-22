import type { Metadata } from "next";
import Link from "next/link";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, datasetLd, itemListLd, JsonLd } from "@mathfamily/geo";
import { EmailCaptureSlot, FeeGrid, FreshnessBadge, OpenDataBand, PageHeading } from "@mathfamily/ui";
import { TREATMENTS, latestVerifiedAt } from "@/lib/dental-data";
import { compareTreatment, formatRange } from "@/lib/dental-content";

export const metadata: Metadata = {
  title: "NHS vs private dental treatment costs — check-ups, fillings, crowns & more",
  description:
    "Compare what each dental treatment costs on the NHS versus typical private prices in the UK — check-up, scale and polish, filling, extraction, root canal, crown, dentures and emergencies."
};

export default function TreatmentsIndexPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3003";
  const verified = latestVerifiedAt();
  const comparisons = TREATMENTS.map(compareTreatment);

  const rows = comparisons.map((c) => [
    <Link
      key="t"
      href={`/treatments/${c.treatment.slug}`}
      className="font-medium text-brand-accent underline-offset-4 hover:underline"
    >
      {c.treatment.name}
    </Link>,
    `${c.band.label} · ${formatPence(c.nhsPence)}`,
    formatRange(c.treatment.privatePrice),
    c.savingPence > 0 ? formatPence(c.savingPence) : "—"
  ]);

  const itemListItems = comparisons.map((c) => ({
    name: `${c.treatment.name} — NHS ${formatPence(c.nhsPence)} vs private ${formatRange(c.treatment.privatePrice)}`,
    url: `${siteUrl}/treatments/${c.treatment.slug}`
  }));

  return (
    <article className="space-y-6">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Treatments", url: `${siteUrl}/treatments` }
        ])}
      />
      <JsonLd
        data={datasetLd({
          name: "NHS vs private dental treatment costs (UK)",
          description:
            "England NHS band charges versus typical private prices for common dental treatments, verified against official NHS pages and public price guides.",
          url: `${siteUrl}/treatments`,
          dateModified: verified,
          siteUrl,
          creatorName: "DentalMath"
        })}
      />
      <JsonLd data={itemListLd({ name: "Dental treatment costs", items: itemListItems })} />

      <header className="space-y-3">
        <PageHeading>NHS vs private dental costs, by treatment</PageHeading>
        <FreshnessBadge verifiedAt={verified} href={null} />
      </header>

      <p className="text-ink-muted">
        Pick a treatment for the full breakdown. NHS figures are the England patient charge for the whole
        course of treatment; private figures are typical UK ranges from public price guides and will vary
        by practice and region.
      </p>

      <FeeGrid
        caption="England NHS charge vs typical private price. NHS is one flat charge per course of treatment."
        columns={["Treatment", "NHS (England)", "Typical private", "Approx. saving on NHS"]}
        numericColumns={[1, 2, 3]}
        rows={rows}
      />

      <p className="text-sm text-ink-muted">
        NHS figures verified {verified}. Not medical or financial advice — check with your dentist or NHS.
      </p>

      <EmailCaptureSlot
        brandName="DentalMath"
        hook="Get notified when NHS dental charges change"
        description="UK dental-cost update when NHS charges change"
        source="treatment"
        privacyHref="/privacy"
      />

      <OpenDataBand
        downloads={[{ href: "/data/dental-costs.csv", label: "Dental costs (CSV)" }]}
        citation={`DentalMath, "NHS vs private dental treatment costs", verified ${verified}, dentalmath.co.uk`}
      />
    </article>
  );
}
