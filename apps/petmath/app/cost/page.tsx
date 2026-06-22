import type { Metadata } from "next";
import Link from "next/link";
import { breadcrumbLd, datasetLd, itemListLd, JsonLd } from "@mathfamily/geo";
import { FeeGrid, PageHeading } from "@mathfamily/ui";
import { PET_COST_RECORDS, PET_COSTS_LAST_UPDATED } from "@/lib/pet-costs";
import { lifetimeRangeLabel } from "@/lib/pet-content";
import { formatPence } from "@mathfamily/engine";
import { DisclosureNote } from "@/components/disclosure-note";

export const metadata: Metadata = {
  title: "UK pet costs compared — dogs, cats & rabbits over a lifetime",
  description:
    "Lifetime cost of every common UK pet compared in one table — small, medium and large dogs, cats and rabbits — from PDSA figures, with monthly care, set-up and lifetime ranges."
};

export default function CostIndexPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3003";
  const records = PET_COST_RECORDS;

  return (
    <article className="space-y-8">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Pet costs", url: `${siteUrl}/cost` }
        ])}
      />
      <JsonLd
        data={datasetLd({
          name: "UK lifetime pet costs",
          description: "Lifetime, monthly and set-up costs for common UK pets — PDSA essential-care figures, date-stamped.",
          url: `${siteUrl}/cost`,
          dateModified: PET_COSTS_LAST_UPDATED,
          siteUrl,
          creatorName: "PetMath"
        })}
      />
      <JsonLd
        data={itemListLd({
          name: "UK lifetime pet costs",
          items: records.map((r) => ({
            name: `${r.name} — ${lifetimeRangeLabel(r)} over a lifetime`,
            url: `${siteUrl}/cost/${r.slug}`
          }))
        })}
      />

      <header className="space-y-3">
        <PageHeading>UK pet costs compared</PageHeading>
        <p className="text-ink-muted">
          Minimum essential-care costs for {records.length} common UK pets, verified {PET_COSTS_LAST_UPDATED}. Click a
          pet for the full breakdown and an interactive lifetime calculator.
        </p>
      </header>

      <FeeGrid
        caption={`Lifetime pet costs — PDSA essential-care figures, verified ${PET_COSTS_LAST_UPDATED}. Excludes emergency vet treatment.`}
        columns={["Pet", "Monthly care", "Set-up", "Lifetime"]}
        numericColumns={[1, 2, 3]}
        rowHref={(i) => {
          const r = records[i];
          return r ? `/cost/${r.slug}` : undefined;
        }}
        rows={records.map((r) => [
          r.name,
          formatPence(r.monthlyCarePence),
          formatPence(r.setupPence),
          lifetimeRangeLabel(r)
        ])}
      />

      <nav aria-label="Pet cost pages">
        <h2 className="mb-3 text-xl font-semibold text-ink">Full breakdowns</h2>
        <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {records.map((r) => (
            <li key={r.slug}>
              <Link href={`/cost/${r.slug}`} className="font-medium text-brand-accent underline underline-offset-4">
                {r.name} costs →
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <DisclosureNote />
    </article>
  );
}
