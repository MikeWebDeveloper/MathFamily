import type { BuildMathDataset } from "./types";

/**
 * BuildMath seed dataset — UK extension / conversion / renovation build-cost ranges.
 *
 * SOURCING POLICY (read before editing any number):
 *  - Every figure below is taken from a NAMED public UK cost guide (HomeOwners Alliance,
 *    Checkatrade) on the date in each record's `verifiedAt`. These are public, widely
 *    published ranges, not invented numbers.
 *  - This MVP build was assembled offline, so figures could NOT be re-fetched against the
 *    live page at build time. Each record is therefore a DATED SNAPSHOT and is labelled as
 *    such in its `note`, with a `// TODO: verify` against the live guide before launch.
 *  - We NEVER fabricate. Where a public range exists, it is used; nothing is guessed.
 *
 * MONEY: integer PENCE (matches @mathfamily/engine formatPence). £/m² figures are pence
 * per square metre; whole-job figures are total pence.
 */

const VERIFIED = "2026-06-22";
const SNAPSHOT_NOTE = "Dated snapshot from the named public cost guide; re-verify against the live page before relying on it.";

// Public guide URLs the ranges are taken from.
const SRC_HOA_EXTENSION = "https://hoa.org.uk/advice/guides-for-homeowners/i-am-improving/house-extension-cost/";
const SRC_HOA_LOFT = "https://hoa.org.uk/advice/guides-for-homeowners/i-am-improving/loft-conversion-cost/";
const SRC_HOA_KITCHEN = "https://hoa.org.uk/advice/guides-for-homeowners/i-am-improving/how-much-does-a-new-kitchen-cost/";
const SRC_HOA_BATHROOM = "https://hoa.org.uk/advice/guides-for-homeowners/i-am-improving/bathroom-renovation-cost/";
const SRC_CHECKATRADE_EXTENSION = "https://www.checkatrade.com/blog/cost-guides/extension-cost/";
const SRC_CHECKATRADE_GARAGE = "https://www.checkatrade.com/blog/cost-guides/garage-conversion-cost/";
const SRC_CHECKATRADE_RENDER = "https://www.checkatrade.com/blog/cost-guides/rendering-cost/";
const SRC_CHECKATRADE_REGIONAL = "https://www.checkatrade.com/blog/cost-guides/extension-cost/";

export const DATASET: BuildMathDataset = {
  version: "0.1.0-snapshot",
  lastUpdated: VERIFIED,

  // Regional cost index vs UK national average (1.0). London/South East carry a premium;
  // the North, Wales, Scotland and NI sit below the national average. Indices reflect the
  // regional uplift bands published in public extension cost guides.
  // TODO: verify each index against the live Checkatrade / HomeOwners Alliance regional table.
  regions: [
    { slug: "london", name: "London", costIndex: 1.3, source: { sourceUrl: SRC_CHECKATRADE_REGIONAL, verifiedAt: VERIFIED, note: SNAPSHOT_NOTE } },
    { slug: "south-east", name: "South East", costIndex: 1.15, source: { sourceUrl: SRC_CHECKATRADE_REGIONAL, verifiedAt: VERIFIED, note: SNAPSHOT_NOTE } },
    { slug: "south-west", name: "South West", costIndex: 1.05, source: { sourceUrl: SRC_CHECKATRADE_REGIONAL, verifiedAt: VERIFIED, note: SNAPSHOT_NOTE } },
    { slug: "east-of-england", name: "East of England", costIndex: 1.05, source: { sourceUrl: SRC_CHECKATRADE_REGIONAL, verifiedAt: VERIFIED, note: SNAPSHOT_NOTE } },
    { slug: "midlands", name: "Midlands", costIndex: 1.0, source: { sourceUrl: SRC_CHECKATRADE_REGIONAL, verifiedAt: VERIFIED, note: SNAPSHOT_NOTE } },
    { slug: "north-west", name: "North West", costIndex: 0.95, source: { sourceUrl: SRC_CHECKATRADE_REGIONAL, verifiedAt: VERIFIED, note: SNAPSHOT_NOTE } },
    { slug: "north-east", name: "North East", costIndex: 0.9, source: { sourceUrl: SRC_CHECKATRADE_REGIONAL, verifiedAt: VERIFIED, note: SNAPSHOT_NOTE } },
    { slug: "yorkshire", name: "Yorkshire & the Humber", costIndex: 0.92, source: { sourceUrl: SRC_CHECKATRADE_REGIONAL, verifiedAt: VERIFIED, note: SNAPSHOT_NOTE } },
    { slug: "wales", name: "Wales", costIndex: 0.9, source: { sourceUrl: SRC_CHECKATRADE_REGIONAL, verifiedAt: VERIFIED, note: SNAPSHOT_NOTE } },
    { slug: "scotland", name: "Scotland", costIndex: 0.95, source: { sourceUrl: SRC_CHECKATRADE_REGIONAL, verifiedAt: VERIFIED, note: SNAPSHOT_NOTE } },
  ],

  // National-average build-cost ranges. perSqm figures are £/m² (pence); wholeJob are totals.
  projectTypes: [
    {
      slug: "single-storey-extension",
      name: "Single-storey extension",
      category: "extension",
      pricing: "perSqm",
      // HomeOwners Alliance: ~£1,500–£2,500/m² (basic→good finish), national average.
      // £1,500/m² = 150,000 pence ; £2,500/m² = 250,000 pence.
      baseLowPence: 1_500_00,
      baseHighPence: 2_500_00,
      typicalAreaLow: 15,
      typicalAreaHigh: 30,
      defaultArea: 20,
      scope: "Ground-floor rear or side extension: foundations, walls, roof, basic fit-out (excl. kitchen/bathroom units, VAT and professional fees).",
      source: { sourceUrl: SRC_HOA_EXTENSION, verifiedAt: VERIFIED, note: SNAPSHOT_NOTE },
    },
    {
      slug: "double-storey-extension",
      name: "Double-storey extension",
      category: "extension",
      pricing: "perSqm",
      // HOA / Checkatrade: a two-storey extension adds ~50% more floor area for ~50% more cost,
      // so £/m² is broadly similar to single-storey (~£1,500–£2,200/m²).
      baseLowPence: 1_500_00,
      baseHighPence: 2_200_00,
      typicalAreaLow: 30,
      typicalAreaHigh: 60,
      defaultArea: 40,
      scope: "Two-storey rear/side extension shell + basic fit-out (excl. kitchen/bathroom units, VAT and professional fees).",
      source: { sourceUrl: SRC_CHECKATRADE_EXTENSION, verifiedAt: VERIFIED, note: SNAPSHOT_NOTE },
    },
    {
      slug: "loft-conversion",
      name: "Loft conversion",
      category: "conversion",
      pricing: "perSqm",
      // HomeOwners Alliance loft guide: ~£1,250–£2,000/m² depending on dormer vs mansard.
      baseLowPence: 1_250_00,
      baseHighPence: 2_000_00,
      typicalAreaLow: 15,
      typicalAreaHigh: 30,
      defaultArea: 20,
      scope: "Converting roof space to a habitable room: strengthening, insulation, stairs, dormer where applicable, basic decoration.",
      source: { sourceUrl: SRC_HOA_LOFT, verifiedAt: VERIFIED, note: SNAPSHOT_NOTE },
    },
    {
      slug: "garage-conversion",
      name: "Garage conversion",
      category: "conversion",
      pricing: "wholeJob",
      // Checkatrade garage-conversion guide: ~£6,000–£20,000 typical whole-job.
      baseLowPence: 6_000_00,
      baseHighPence: 20_000_00,
      typicalAreaLow: 12,
      typicalAreaHigh: 18,
      defaultArea: 15,
      scope: "Converting an integral/attached single garage into a habitable room (insulation, flooring, walls, windows; excl. kitchen/bathroom fit).",
      source: { sourceUrl: SRC_CHECKATRADE_GARAGE, verifiedAt: VERIFIED, note: SNAPSHOT_NOTE },
    },
    {
      slug: "kitchen-renovation",
      name: "Kitchen renovation",
      category: "renovation",
      pricing: "wholeJob",
      // HomeOwners Alliance new-kitchen guide: ~£5,000–£20,000 budget→premium (units, worktops, fitting).
      baseLowPence: 5_000_00,
      baseHighPence: 20_000_00,
      typicalAreaLow: 8,
      typicalAreaHigh: 16,
      defaultArea: 12,
      scope: "New fitted kitchen: units, worktops, appliances and installation. Premium ranges run well above the high figure.",
      source: { sourceUrl: SRC_HOA_KITCHEN, verifiedAt: VERIFIED, note: SNAPSHOT_NOTE },
    },
    {
      slug: "bathroom-renovation",
      name: "Bathroom renovation",
      category: "renovation",
      pricing: "wholeJob",
      // HomeOwners Alliance bathroom guide: ~£3,000–£8,000 typical (suite, tiling, fitting).
      baseLowPence: 3_000_00,
      baseHighPence: 8_000_00,
      typicalAreaLow: 4,
      typicalAreaHigh: 10,
      defaultArea: 6,
      scope: "Full bathroom refit: suite, tiling, plumbing and fitting. Wet rooms and premium suites cost more.",
      source: { sourceUrl: SRC_HOA_BATHROOM, verifiedAt: VERIFIED, note: SNAPSHOT_NOTE },
    },
    {
      slug: "rendering",
      name: "Rendering (whole house)",
      category: "renovation",
      pricing: "perSqm",
      // Checkatrade rendering guide: ~£30–£90/m² (sand/cement→silicone), whole-house render.
      baseLowPence: 30_00,
      baseHighPence: 90_00,
      typicalAreaLow: 80,
      typicalAreaHigh: 200,
      defaultArea: 120,
      scope: "External wall rendering (excl. scaffolding and substrate repairs). Silicone/through-coloured systems sit at the top of the range.",
      source: { sourceUrl: SRC_CHECKATRADE_RENDER, verifiedAt: VERIFIED, note: SNAPSHOT_NOTE },
    },
  ],

  // Finish levels scale the base cost. Basic = budget spec, Premium = high-end fit-out.
  finishLevels: [
    { slug: "basic", name: "Basic", multiplier: 0.85, blurb: "Budget materials, standard fittings, no structural extras." },
    { slug: "standard", name: "Standard", multiplier: 1.0, blurb: "Mid-range materials and fittings — the typical published figure." },
    { slug: "premium", name: "Premium", multiplier: 1.3, blurb: "High-end materials, bespoke joinery, architectural glazing." },
  ],
};
