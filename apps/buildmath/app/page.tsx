import type { Metadata } from "next";
import Link from "next/link";
import { webSiteLd, JsonLd } from "@mathfamily/geo";
import { EmailCaptureSlot, StatStrip } from "@mathfamily/ui";
import { loadDataset, latestVerified, snapshotNote } from "@/lib/content";
import { CostEstimator } from "@/components/cost-estimator";
import { FamilyLinks } from "@/components/family-links";

export const metadata: Metadata = {
  title: "What a UK extension or renovation really costs — BuildMath",
  description:
    "UK extension, loft, kitchen and bathroom build-cost ranges by region and finish level. Indicative £/m² figures from named public cost guides — every number sourced and date-stamped.",
  alternates: { canonical: "/" }
};

export default function HomePage() {
  const { projectTypes, regions, finishLevels } = loadDataset();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3004";

  return (
    <div className="space-y-10">
      <JsonLd data={webSiteLd({ name: "BuildMath", url: siteUrl })} />

      <section className="space-y-4">
        <h1 className="text-h1 font-bold tracking-tight text-balance text-ink">
          What does your <span className="text-brand-accent">extension</span> really cost?
        </h1>
        <p className="max-w-2xl text-lg text-ink-muted">
          UK extension, loft, kitchen and bathroom build-cost ranges by region and finish level.
          Regional £/m² figures from public cost guides — every number sourced and date-stamped,
          so you walk into a builder&apos;s quote knowing what&apos;s fair.
        </p>
      </section>

      <section>
        <CostEstimator projects={projectTypes} regions={regions} finishLevels={finishLevels} snapshotNote={snapshotNote()} />
      </section>

      <section>
        <StatStrip
          stats={[
            { label: "Project types costed", value: String(projectTypes.length), note: "extensions, conversions, renovations" },
            { label: "UK regions", value: String(regions.length), note: "regional cost index applied" },
            { label: "Finish levels", value: String(finishLevels.length), note: "basic · standard · premium" },
          ]}
        />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-ink">Browse by project</h2>
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
      </section>

      <p className="flex flex-wrap gap-6">
        <Link href="/cost" className="text-base font-semibold text-brand-accent underline underline-offset-4">
          All project cost guides →
        </Link>
        <Link href="/regions" className="text-base font-semibold text-brand-accent underline underline-offset-4">
          Costs by UK region →
        </Link>
      </p>

      <EmailCaptureSlot
        brandName="BuildMath"
        hook="Get notified when UK build costs move"
        description="occasional UK build-cost update"
        source="home"
        privacyHref="/privacy"
      />

      <p className="text-xs text-ink-muted">
        Figures are indicative build-cost ranges transcribed from named public cost guides on{" "}
        {latestVerified()} — not live-verified. Estimates only — re-check the live guide and always get
        itemised written quotes before you commit.
      </p>

      <FamilyLinks />
    </div>
  );
}
