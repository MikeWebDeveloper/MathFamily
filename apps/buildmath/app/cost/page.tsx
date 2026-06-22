import type { Metadata } from "next";
import Link from "next/link";
import { breadcrumbLd, datasetLd, itemListLd, JsonLd } from "@mathfamily/geo";
import { FeeGrid, FreshnessBadge, PageHeading } from "@mathfamily/ui";
import { loadDataset, latestVerified, MIDLANDS_REGION, STANDARD_FINISH, estimate, perSqmLabel } from "@/lib/content";

export const metadata: Metadata = {
  title: "UK extension & renovation build costs by project type",
  description:
    "Compare UK build costs for single-storey and double-storey extensions, loft and garage conversions, kitchens and bathrooms — regional £/m² ranges from public cost guides, date-stamped."
};

export default function CostIndexPage() {
  const { projectTypes } = loadDataset();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3004";
  const verified = latestVerified();

  const rows = projectTypes.map((p) => {
    const e = estimate({ project: p, region: MIDLANDS_REGION, finish: STANDARD_FINISH, areaSqm: p.defaultArea });
    return [
      <Link
        key="p"
        href={`/cost/${p.slug}`}
        className="font-medium text-brand-accent underline-offset-4 hover:underline"
      >
        {p.name}
      </Link>,
      p.pricing === "perSqm" ? (perSqmLabel(p, MIDLANDS_REGION, STANDARD_FINISH) ?? "—") : "Whole job",
      e.rangeLabel,
      p.category,
    ];
  });

  const itemListItems = projectTypes.map((p) => {
    const e = estimate({ project: p, region: MIDLANDS_REGION, finish: STANDARD_FINISH, areaSqm: p.defaultArea });
    return { name: `${p.name} — from ${e.lowFormatted} (UK average, standard finish)`, url: `${siteUrl}/cost/${p.slug}` };
  });

  return (
    <article className="space-y-6">
      <JsonLd data={breadcrumbLd([
        { name: "Home", url: siteUrl },
        { name: "Project costs", url: `${siteUrl}/cost` }
      ])} />
      <JsonLd data={datasetLd({
        name: "UK extension & renovation build costs by project type",
        description: "National-average build-cost ranges for UK extensions, conversions and renovations, with a regional cost index and finish multiplier — from public cost guides.",
        url: `${siteUrl}/cost`,
        dateModified: verified,
        siteUrl,
        creatorName: "BuildMath"
      })} />
      <JsonLd data={itemListLd({ name: "UK build costs by project type", items: itemListItems })} />

      <header className="space-y-3">
        <PageHeading>UK build costs, by project type</PageHeading>
        <FreshnessBadge verifiedAt={verified} />
      </header>

      <p className="text-ink-muted">
        National-average ranges at a standard finish (Midlands baseline). Open any project for the full guide
        with a regional + finish estimator. Figures exclude VAT and professional fees unless noted.
      </p>

      <FeeGrid
        caption="National-average build-cost ranges at a standard finish. Open a project to apply your region and spec."
        columns={["Project", "£/m² or basis", "Typical total (UK avg)", "Category"]}
        numericColumns={[1, 2]}
        rows={rows}
      />

      <p className="text-sm text-ink-muted">
        Sources reviewed {verified}. These are public-guide ranges — estimates only; always get itemised written quotes.
      </p>
    </article>
  );
}
