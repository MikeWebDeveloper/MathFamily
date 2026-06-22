/**
 * PetMath app-local dataset: UK lifetime pet cost figures.
 *
 * SOURCING RULES (same as the rest of the Math family):
 *  - Every record carries a `sourceUrl` and a `verifiedAt` (ISO date) pointing at the
 *    official page the figure was read from.
 *  - All money is stored as integer PENCE (so it composes with @mathfamily/engine's formatPence).
 *  - Primary source for per-species essential-care costs is the PDSA Animal Wellbeing (PAW)
 *    "cost of owning a …" pages — they publish a minimum monthly cost, an initial set-up cost,
 *    and a minimum→typical lifetime range, calculated 2024 from current online prices.
 *  - The optional insurance ESTIMATE line uses the ABI (Association of British Insurers) 2024
 *    average annual pet-insurance premium. IMPORTANT: the PDSA monthly figure ALREADY includes a
 *    typical insurance line, so the ABI line is shown as a *standalone reference estimate only*,
 *    never added on top of the PDSA monthly (that would double-count). See INSURANCE_ESTIMATE.
 *  - PDSA does not itemise food vs vet vs insurance within its monthly figure, so we do NOT
 *    fabricate a split. We show the PDSA monthly as one verified "essential monthly care" number
 *    and break the lifetime estimate into (set-up one-offs) + (monthly care × lifespan).
 *  - Nothing here is fabricated. Where a figure could not be read from an official page offline it
 *    is labelled a placeholder with a // TODO: verify — there are currently none.
 */

export interface PetCostRecord {
  /** URL slug, e.g. "small-dog". */
  slug: string;
  /** Display name, e.g. "Small dog". */
  name: string;
  /** Broad species group for grouping/nav, e.g. "Dog". */
  species: "Dog" | "Cat" | "Rabbit";
  /** Example breed(s) PDSA used for this size band, for human context. */
  exampleBreeds: string;
  /** Minimum essential monthly care cost, in pence (PDSA). Includes a typical insurance line. */
  monthlyCarePence: number;
  /** One-off initial set-up cost, in pence (PDSA): bed, bowls, neutering, first vaccinations, etc. */
  setupPence: number;
  /** PDSA published minimum lifetime cost, in pence. */
  lifetimeMinPence: number;
  /** PDSA published upper/typical lifetime cost, in pence. */
  lifetimeMaxPence: number;
  /** Average lifespan range in years PDSA used (low, high). Drives the lifetime calculator. */
  lifespanYears: { low: number; high: number };
  /** Plain-English note on what the set-up cost covers / any caveat. */
  note: string;
  /** Official source page the figures were read from. */
  sourceUrl: string;
  /** ISO date the figures were verified against the source. */
  verifiedAt: string;
}

/**
 * ABI 2024 average annual pet-insurance premium — used ONLY for the optional standalone
 * insurance estimate line. Pet insurance is an AMBER category for affiliate purposes (FCA):
 * it may appear as a non-affiliate reference estimate or an inert "coming soon" slot, NEVER as
 * a live affiliate link. This figure is the reference estimate.
 */
export const INSURANCE_ESTIMATE = {
  annualPremiumPence: 38900, // £389 average annual premium, ABI 2024 (published May 2025)
  averageClaimPence: 68500, // £685 average claim, ABI 2024 — context only
  sourceUrl: "https://www.abi.org.uk/news/news-articles/2025/5/insurance-payouts-for-pawly-pets-top-1-billion-for-third-year-in-a-row/",
  verifiedAt: "2026-06-22",
  note: "ABI 2024 average annual pet-insurance premium across all pets. A standalone reference estimate only — the PDSA monthly care figure already includes a typical insurance line, so do not add these together.",
} as const;

const PDSA_DOG = "https://www.pdsa.org.uk/pet-help-and-advice/looking-after-your-pet/puppies-dogs/the-cost-of-owning-a-dog";
const PDSA_CAT = "https://www.pdsa.org.uk/pet-help-and-advice/looking-after-your-pet/kittens-cats/the-cost-of-owning-a-cat";
const PDSA_RABBIT = "https://www.pdsa.org.uk/pet-help-and-advice/looking-after-your-pet/rabbits/the-cost-of-owning-rabbits";
const VERIFIED = "2026-06-22";

export const PET_COST_RECORDS: PetCostRecord[] = [
  {
    slug: "small-dog",
    name: "Small dog",
    species: "Dog",
    exampleBreeds: "Jack Russell, Chihuahua, Dachshund",
    monthlyCarePence: 6900, // £69/mo
    setupPence: 41500, // £415
    lifetimeMinPence: 620000, // £6,200
    lifetimeMaxPence: 1200000, // £12,000
    lifespanYears: { low: 7.1, high: 14.2 },
    note: "Set-up covers bed, lead, collar, tag, bowls, toothbrush, grooming brush, toys, car restraint, first vaccinations, puppy wormers and neutering. Excludes the purchase price and any emergency vet treatment.",
    sourceUrl: PDSA_DOG,
    verifiedAt: VERIFIED,
  },
  {
    slug: "medium-dog",
    name: "Medium dog",
    species: "Dog",
    exampleBreeds: "Springer Spaniel, Border Collie, Bulldog",
    monthlyCarePence: 8300, // £83/mo
    setupPence: 53100, // £531
    lifetimeMinPence: 900000, // £9,000
    lifetimeMaxPence: 1400000, // £14,000
    lifespanYears: { low: 8.4, high: 13.5 },
    note: "Set-up covers essential equipment, first vaccinations, puppy wormers and neutering. Excludes the purchase price and any emergency vet treatment.",
    sourceUrl: PDSA_DOG,
    verifiedAt: VERIFIED,
  },
  {
    slug: "large-dog",
    name: "Large dog",
    species: "Dog",
    exampleBreeds: "Labrador, German Shepherd, Boxer",
    monthlyCarePence: 11600, // £116/mo
    setupPence: 56000, // £560
    lifetimeMinPence: 820000, // £8,200
    lifetimeMaxPence: 1880000, // £18,800
    lifespanYears: { low: 5.5, high: 13.1 },
    note: "Set-up covers essential equipment, first vaccinations, puppy wormers and neutering. Larger dogs eat more and cost more to insure, so the upper lifetime figure is the highest of any pet here.",
    sourceUrl: PDSA_DOG,
    verifiedAt: VERIFIED,
  },
  {
    slug: "cat",
    name: "Cat",
    species: "Cat",
    exampleBreeds: "Domestic shorthair and most breeds",
    monthlyCarePence: 7900, // £79/mo
    setupPence: 36600, // £366
    lifetimeMinPence: 1140000, // £11,400
    lifetimeMaxPence: 1360000, // £13,600
    lifespanYears: { low: 12, high: 16 },
    note: "Set-up covers carrier, litter tray, bed, bowls, scratching post, first vaccinations, microchipping and neutering. Excludes the purchase/adoption price and any emergency vet treatment.",
    sourceUrl: PDSA_CAT,
    verifiedAt: VERIFIED,
  },
  {
    slug: "indoor-rabbits",
    name: "Indoor rabbits (a pair)",
    species: "Rabbit",
    exampleBreeds: "A bonded pair — rabbits must not live alone",
    monthlyCarePence: 8000, // £80/mo
    setupPence: 98000, // £980
    lifetimeMinPence: 770000, // £7,700
    lifetimeMaxPence: 1060000, // £10,600
    lifespanYears: { low: 7, high: 10 },
    note: "Figures are for a bonded PAIR (rabbits are social and must be kept together). Set-up covers a large indoor enclosure, run, bedding, bowls, first vaccinations and neutering.",
    sourceUrl: PDSA_RABBIT,
    verifiedAt: VERIFIED,
  },
  {
    slug: "outdoor-rabbits",
    name: "Outdoor rabbits (a pair)",
    species: "Rabbit",
    exampleBreeds: "A bonded pair — rabbits must not live alone",
    monthlyCarePence: 8400, // £84/mo
    setupPence: 92200, // £922
    lifetimeMinPence: 800000, // £8,000
    lifetimeMaxPence: 1100000, // £11,000
    lifespanYears: { low: 7, high: 10 },
    note: "Figures are for a bonded PAIR. Set-up covers a large weatherproof hutch and run, bedding, bowls, first vaccinations and neutering.",
    sourceUrl: PDSA_RABBIT,
    verifiedAt: VERIFIED,
  },
];

/** Most recent verifiedAt across the dataset — used for sitemap lastmod and freshness copy. */
export const PET_COSTS_LAST_UPDATED: string = [
  ...PET_COST_RECORDS.map((r) => r.verifiedAt),
  INSURANCE_ESTIMATE.verifiedAt,
]
  .sort()
  .at(-1)!;

export function getPetCostRecord(slug: string): PetCostRecord | null {
  return PET_COST_RECORDS.find((r) => r.slug === slug) ?? null;
}
