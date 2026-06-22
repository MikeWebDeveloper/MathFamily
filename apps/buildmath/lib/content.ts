import { DATASET } from "./data/dataset";
import type { FinishLevel, ProjectType, Region } from "./data/types";
import { estimate, perSqmLabel } from "./estimate";

export function loadDataset() {
  return DATASET;
}

export function getProject(slug: string): ProjectType | null {
  return DATASET.projectTypes.find((p) => p.slug === slug) ?? null;
}

export function getRegion(slug: string): Region | null {
  return DATASET.regions.find((r) => r.slug === slug) ?? null;
}

export function getFinish(slug: string): FinishLevel | null {
  return DATASET.finishLevels.find((f) => f.slug === slug) ?? null;
}

export const STANDARD_FINISH: FinishLevel =
  DATASET.finishLevels.find((f) => f.slug === "standard") ?? DATASET.finishLevels[0]!;

export const MIDLANDS_REGION: Region =
  DATASET.regions.find((r) => r.slug === "midlands") ?? DATASET.regions[0]!;

/** Latest verifiedAt across the whole dataset (regions + projects). */
export function latestVerified(): string {
  const dates = [
    ...DATASET.regions.map((r) => r.source.verifiedAt),
    ...DATASET.projectTypes.map((p) => p.source.verifiedAt),
  ];
  return dates.sort().at(-1) ?? DATASET.lastUpdated;
}

/** A one-sentence, figure-first answer for a project at the national-average / standard spec. */
export function projectAnswer(project: ProjectType): string {
  const e = estimate({
    project,
    region: MIDLANDS_REGION,
    finish: STANDARD_FINISH,
    areaSqm: project.defaultArea,
  });

  if (project.pricing === "perSqm") {
    const perSqm = perSqmLabel(project, MIDLANDS_REGION, STANDARD_FINISH);
    return `A ${project.name.toLowerCase()} in the UK typically costs ${perSqm} at a standard finish — about ${e.rangeLabel} for a ${project.defaultArea}m² project. Final cost depends on your region, spec and site.`;
  }
  return `A ${project.name.toLowerCase()} in the UK typically costs ${e.rangeLabel} at a standard finish. Final cost depends on your region, spec and the condition of the existing space.`;
}

export function buildProjectFaqs(project: ProjectType): { question: string; answer: string }[] {
  const standard = estimate({ project, region: MIDLANDS_REGION, finish: STANDARD_FINISH, areaSqm: project.defaultArea });

  const faqs: { question: string; answer: string }[] = [
    {
      question: `How much does a ${project.name.toLowerCase()} cost in the UK?`,
      answer:
        project.pricing === "perSqm"
          ? `At a standard finish, a ${project.name.toLowerCase()} runs around ${perSqmLabel(project, MIDLANDS_REGION, STANDARD_FINISH)} — roughly ${standard.rangeLabel} for a typical ${project.defaultArea}m² project. ${project.scope}`
          : `At a standard finish, a ${project.name.toLowerCase()} typically costs ${standard.rangeLabel}. ${project.scope}`,
    },
    {
      question: `Does location change the cost of a ${project.name.toLowerCase()}?`,
      answer: `Yes — London and the South East carry a premium of roughly 15–30% over the UK average, while the North, Wales and Scotland sit below it. Use the estimator above to apply your region's cost index.`,
    },
    {
      question: `What's included in this ${project.name.toLowerCase()} estimate?`,
      answer: `${project.scope} The figures are public-guide build-cost ranges and exclude VAT and professional fees (architect, structural engineer, planning) unless stated. Always get itemised written quotes before committing.`,
    },
  ];
  return faqs;
}

export { estimate, perSqmLabel };
