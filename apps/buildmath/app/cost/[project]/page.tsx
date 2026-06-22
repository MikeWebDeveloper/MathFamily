import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { breadcrumbLd, faqPageLd, JsonLd, speakableLd } from "@mathfamily/geo";
import {
  AnswerLead,
  AnswerPassage,
  Callout,
  EmailCaptureSlot,
  FaqAccordion,
  FeeGrid,
  FreshnessBadge,
  MiniAnswerBar,
  PageHeading,
  SourceCitation,
  SourcesBlock
} from "@mathfamily/ui";
import {
  loadDataset,
  getProject,
  latestVerified,
  projectAnswer,
  buildProjectFaqs,
  estimate,
  perSqmLabel,
  MIDLANDS_REGION,
  STANDARD_FINISH
} from "@/lib/content";
import { CostEstimator } from "@/components/cost-estimator";
import { TradesLeadSlot } from "@/components/trades-lead-slot";

export const dynamicParams = false;

export function generateStaticParams() {
  return loadDataset().projectTypes.map((p) => ({ project: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ project: string }> }): Promise<Metadata> {
  const { project: slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return {
    title: `${project.name} cost UK 2026 — by region & finish`,
    description: `${projectAnswer(project)} Sourced from public UK cost guides and date-stamped.`
  };
}

export default async function ProjectCostPage({ params }: { params: Promise<{ project: string }> }) {
  const { project: slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const { projectTypes, regions, finishLevels } = loadDataset();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3004";
  const verified = project.source.verifiedAt;

  const answer = projectAnswer(project);
  const faqs = buildProjectFaqs(project);

  // Region comparison rows for this project at a standard finish + default area.
  const regionRows = regions.map((r) => {
    const e = estimate({ project, region: r, finish: STANDARD_FINISH, areaSqm: project.defaultArea });
    return [r.name, e.rangeLabel, `×${r.costIndex.toFixed(2)}`];
  });

  // Finish comparison rows (UK-average region).
  const finishRows = finishLevels.map((f) => {
    const e = estimate({ project, region: MIDLANDS_REGION, finish: f, areaSqm: project.defaultArea });
    return [`${f.name} — ${f.blurb}`, e.rangeLabel];
  });

  const facts = [
    project.pricing === "perSqm"
      ? `UK average: ${perSqmLabel(project, MIDLANDS_REGION, STANDARD_FINISH)} at a standard finish`
      : `UK average: ${estimate({ project, region: MIDLANDS_REGION, finish: STANDARD_FINISH, areaSqm: project.defaultArea }).rangeLabel} (whole job, standard finish)`,
    `Typical size: ${project.typicalAreaLow}–${project.typicalAreaHigh} m²`,
    `Scope: ${project.scope}`,
  ];

  const miniSummary = `${project.name} · ${estimate({ project, region: MIDLANDS_REGION, finish: STANDARD_FINISH, areaSqm: project.defaultArea }).rangeLabel} (UK avg)`;

  return (
    <article className="space-y-8">
      <JsonLd data={faqPageLd(faqs)} />
      <JsonLd data={breadcrumbLd([
        { name: "Home", url: siteUrl },
        { name: "Project costs", url: `${siteUrl}/cost` },
        { name: project.name, url: `${siteUrl}/cost/${project.slug}` }
      ])} />
      <JsonLd data={speakableLd({ url: `${siteUrl}/cost/${project.slug}` })} />

      <header className="space-y-3">
        <PageHeading>{project.name} cost in the UK: what to budget</PageHeading>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <FreshnessBadge verifiedAt={verified} />
          <SourceCitation url={project.source.sourceUrl} label="Public cost guide" />
        </div>
      </header>

      <div id="mf-answer-anchor">
        <AnswerLead answer={answer}>{facts}</AnswerLead>
      </div>
      <MiniAnswerBar summary={miniSummary} verified />

      <AnswerPassage question={`How much does a ${project.name.toLowerCase()} cost?`}>
        {answer} The estimator below applies a regional cost index and a finish multiplier to the
        national-average range, so you can see a figure tuned to where you live and the spec you want.
        All figures are public-guide build-cost ranges — never a single fabricated number — and exclude
        VAT and professional fees unless noted.
      </AnswerPassage>

      <CostEstimator
        projects={projectTypes}
        regions={regions}
        finishLevels={finishLevels}
        lockedProjectSlug={project.slug}
      />

      <TradesLeadSlot projectSlug={project.slug} projectName={project.name} />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-ink">{project.name} cost by region</h2>
        <FeeGrid
          caption={`${project.name} at a standard finish, ${project.defaultArea} m² baseline. Region index applied to the UK-average range.`}
          columns={["Region", "Estimated range", "Cost index"]}
          numericColumns={[1, 2]}
          rows={regionRows}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-ink">{project.name} cost by finish level</h2>
        <FeeGrid
          caption={`${project.name} at a UK-average region, ${project.defaultArea} m² baseline.`}
          columns={["Finish", "Estimated range"]}
          numericColumns={[1]}
          rows={finishRows}
        />
      </section>

      <Callout variant="info" title="Why a range, not a price?">
        Real build costs vary with site access, ground conditions, glazing, kitchen/bathroom spec and your
        builder&apos;s workload. These figures are public-guide ranges to sanity-check a quote — not a quote
        themselves. Always get itemised written quotes from vetted local trades.
      </Callout>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-ink">Frequently asked questions</h2>
        <FaqAccordion items={faqs} />
      </section>

      <EmailCaptureSlot
        formAction={process.env.NEXT_PUBLIC_MAILERLITE_FORM_ACTION}
        hook="Get notified when UK build costs move"
      />

      <p className="text-sm">
        <Link href="/cost" className="text-brand-accent underline underline-offset-4">← All project cost guides</Link>
      </p>

      <SourcesBlock
        sources={[{ label: "Public UK cost guide (HomeOwners Alliance / Checkatrade)", url: project.source.sourceUrl, verifiedAt: verified }]}
        method="Build-cost ranges are taken from named public UK cost guides (HomeOwners Alliance, Checkatrade) on the date shown. A regional cost index and finish multiplier are applied. Figures are dated snapshots — re-verify against the live guide and get written quotes before relying on them."
      />
    </article>
  );
}
