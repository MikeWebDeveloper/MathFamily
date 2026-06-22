import { formatPence } from "@mathfamily/engine";
import type { FinishLevel, ProjectType, Region } from "./data/types";

export interface EstimateInput {
  project: ProjectType;
  region: Region;
  finish: FinishLevel;
  /** Floor area in m² — used only for `perSqm` projects. */
  areaSqm: number;
}

export interface EstimateResult {
  lowPence: number;
  highPence: number;
  midPence: number;
  /** Pre-formatted GBP strings for direct render. */
  lowFormatted: string;
  highFormatted: string;
  midFormatted: string;
  rangeLabel: string;
}

/** Round to the nearest £100 (10,000 pence) so we never imply false precision. */
function roundToHundredPounds(pence: number): number {
  return Math.round(pence / 10_000) * 10_000;
}

/**
 * Core BuildMath estimate: regional cost index × finish multiplier applied to the
 * project's national-average range. For `perSqm` projects the range is multiplied by
 * floor area; `wholeJob` projects ignore area. Returns an integer-pence low/high range,
 * never a single fabricated figure.
 */
export function estimate({ project, region, finish, areaSqm }: EstimateInput): EstimateResult {
  const factor = region.costIndex * finish.multiplier;
  const areaMultiplier = project.pricing === "perSqm" ? Math.max(0, areaSqm) : 1;

  const lowPence = roundToHundredPounds(project.baseLowPence * factor * areaMultiplier);
  const highPence = roundToHundredPounds(project.baseHighPence * factor * areaMultiplier);
  const midPence = roundToHundredPounds((lowPence + highPence) / 2);

  return {
    lowPence,
    highPence,
    midPence,
    lowFormatted: formatPence(lowPence),
    highFormatted: formatPence(highPence),
    midFormatted: formatPence(midPence),
    rangeLabel: `${formatPence(lowPence)}–${formatPence(highPence)}`,
  };
}

/** Plain-English £/m² label for a perSqm project after region+finish adjustment. */
export function perSqmLabel(project: ProjectType, region: Region, finish: FinishLevel): string | null {
  if (project.pricing !== "perSqm") return null;
  const factor = region.costIndex * finish.multiplier;
  const low = roundToHundredPounds(project.baseLowPence * factor);
  const high = roundToHundredPounds(project.baseHighPence * factor);
  return `${formatPence(low)}–${formatPence(high)}/m²`;
}
