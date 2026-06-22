import type { Metadata } from "next";
import Link from "next/link";
import { breadcrumbLd, itemListLd, JsonLd } from "@mathfamily/geo";
import { FeeGrid, FreshnessBadge, PageHeading } from "@mathfamily/ui";
import { loadDataset, latestVerified, STANDARD_FINISH, estimate } from "@/lib/content";

export const metadata: Metadata = {
  title: "UK extension & renovation costs by region",
  description:
    "How build costs vary across the UK — London and the South East carry a premium; the North, Wales and Scotland sit below the national average. Regional cost index from public cost guides."
};

export default function RegionsIndexPage() {
  const { regions, projectTypes } = loadDataset();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3004";
  const verified = latestVerified();

  // Use the single-storey extension as the reference project for the region table.
  const reference = projectTypes.find((p) => p.slug === "single-storey-extension") ?? projectTypes[0]!;

  const rows = regions.map((r) => {
    const e = estimate({ project: reference, region: r, finish: STANDARD_FINISH, areaSqm: reference.defaultArea });
    return [r.name, `×${r.costIndex.toFixed(2)}`, e.rangeLabel];
  });

  const itemListItems = regions.map((r) => ({
    name: `${r.name} — build cost index ×${r.costIndex.toFixed(2)} vs UK average`,
    url: `${siteUrl}/regions`
  }));

  return (
    <article className="space-y-6">
      <JsonLd data={breadcrumbLd([
        { name: "Home", url: siteUrl },
        { name: "Costs by region", url: `${siteUrl}/regions` }
      ])} />
      <JsonLd data={itemListLd({ name: "UK build costs by region", items: itemListItems })} />

      <header className="space-y-3">
        <PageHeading>UK build costs, by region</PageHeading>
        <FreshnessBadge verifiedAt={verified} />
      </header>

      <p className="text-ink-muted">
        Where you build changes the bill. The cost index below is applied to every estimate on the site.
        It&apos;s shown here against a {reference.defaultArea} m² {reference.name.toLowerCase()} at a standard
        finish so you can see the spread in pounds.
      </p>

      <FeeGrid
        caption={`Regional cost index applied to a ${reference.defaultArea} m² ${reference.name.toLowerCase()} (standard finish).`}
        columns={["Region", "Cost index", `${reference.name} estimate`]}
        numericColumns={[1, 2]}
        rows={rows}
      />

      <p className="text-sm text-ink-muted">
        Indices reviewed {verified}. Pick a project to apply your region in the live estimator:
      </p>

      <nav aria-label="Project types" className="mf-reveal flex flex-wrap gap-2">
        {projectTypes.map((p) => (
          <Link
            key={p.slug}
            href={`/cost/${p.slug}`}
            className="mf-press inline-flex min-h-11 items-center rounded-full border border-ink/10 bg-card px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-brand-accent/40 hover:bg-brand-accent/5"
          >
            {p.name}
          </Link>
        ))}
      </nav>
    </article>
  );
}
