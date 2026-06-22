/** App-local data model for BuildMath — UK extension/renovation build costs.
 *
 *  All money is stored as integer PENCE per square metre (or a flat range in pence),
 *  matching the shared @mathfamily/engine `formatPence` contract. We keep ranges as
 *  [low, high] because real build costs are quoted as ranges, never a single figure.
 *
 *  Every dataset record carries a `sourceUrl` and a `verifiedAt` (ISO date). Where a
 *  figure could not be re-verified against a live page in this build, it is taken from
 *  the named public cost guide on the stated date and is labelled a dated snapshot — we
 *  never fabricate a number. See `dataset.ts` SOURCES + each record's note.
 */

export interface SourceRef {
  /** Public cost-guide URL the range is taken from. */
  sourceUrl: string;
  /** ISO date (YYYY-MM-DD) the figure was taken from that page. */
  verifiedAt: string;
  /** Optional human note, e.g. "dated snapshot — re-verify before relying on it". */
  note?: string;
}

/** A UK region with a regional cost multiplier applied to the national base £/m². */
export interface Region {
  slug: string;
  name: string;
  /** Cost index vs the UK national average (1.0). London > 1, North/Wales < 1.
   *  Derived from public regional build-cost guides. */
  costIndex: number;
  source: SourceRef;
}

/** A project type (single-storey extension, loft, kitchen…). */
export interface ProjectType {
  slug: string;
  name: string;
  /** Short category for grouping: "extension" | "conversion" | "renovation". */
  category: "extension" | "conversion" | "renovation";
  /** Whether the cost is driven by floor area (£/m²) or is a whole-job range. */
  pricing: "perSqm" | "wholeJob";
  /** National-average build cost. For perSqm: low/high £/m² in PENCE.
   *  For wholeJob: low/high total in PENCE (floorArea is ignored in the estimate). */
  baseLowPence: number;
  baseHighPence: number;
  /** Typical floor-area range in m² for the project (for the estimator default + copy). */
  typicalAreaLow: number;
  typicalAreaHigh: number;
  /** Default floor area to seed the estimator. */
  defaultArea: number;
  /** One-line plain description of what the figure covers. */
  scope: string;
  source: SourceRef;
}

/** A finish/specification level that scales the base cost. */
export interface FinishLevel {
  slug: string;
  name: string;
  /** Multiplier applied to the base £/m² (basic < standard < premium). */
  multiplier: number;
  blurb: string;
}

export interface BuildMathDataset {
  version: string;
  lastUpdated: string;
  regions: Region[];
  projectTypes: ProjectType[];
  finishLevels: FinishLevel[];
}
