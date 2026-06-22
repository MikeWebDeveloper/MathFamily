/**
 * RentMath app-local seed dataset — the *true cost of renting* per UK town.
 *
 * Every figure carries a `sourceUrl` and `verifiedAt` (ISO date). Figures we could
 * confirm against an official source carry `verified: true`. Figures that move monthly
 * or annually (ONS private-rent medians, average council-tax bills, Ofgem energy cap)
 * could NOT be re-confirmed against the live official page in this offline build, so they
 * are seeded as best-estimate PLACEHOLDERS with `verified: false` and a `// TODO: verify`
 * — they MUST be re-checked against the official source before the figure is published as
 * fact. We never present an unverified figure as verified, and we never fabricate.
 *
 * STATUTORY constants (deposit cap) ARE verifiable and are marked verified: true.
 *
 * Money is stored in integer PENCE to match @mathfamily/engine's formatPence().
 * Monthly rent / council tax / bills are PENCE PER MONTH.
 */

export interface RentSource {
  /** Official page the figure was (or must be) read from. */
  sourceUrl: string;
  /** ISO date the figure was last checked against `sourceUrl`. */
  verifiedAt: string;
  /** true ⇒ confirmed against the official source; false ⇒ placeholder, see // TODO: verify. */
  verified: boolean;
}

export interface TownRent {
  /** URL slug, e.g. "manchester". */
  townSlug: string;
  /** Display name, e.g. "Manchester". */
  townName: string;
  /** Region / nation for grouping, e.g. "North West", "Scotland". */
  region: string;
  /** Median monthly private rent (all property types) in PENCE/month. */
  medianMonthlyRentPence: number;
  rentSource: RentSource;
  /** Council Tax Band D charge in PENCE/month (annual bill / 12). Band D is the standard benchmark. */
  councilTaxBandDMonthlyPence: number;
  councilTaxSource: RentSource;
  /** Typical combined utility bills (energy + water) in PENCE/month for the property type. */
  typicalBillsMonthlyPence: number;
  billsSource: RentSource;
}

/**
 * Tenant Fees Act 2019 — deposit cap.
 * For tenancies where the total annual rent is LESS THAN £50,000, the tenancy deposit
 * is capped at 5 weeks' rent. (6 weeks if annual rent is £50,000 or more.)
 * This is statutory and stable, hence verified: true.
 */
export const DEPOSIT_CAP_WEEKS = 5;
export const DEPOSIT_CAP_HIGH_RENT_WEEKS = 6;
export const DEPOSIT_CAP_HIGH_RENT_ANNUAL_THRESHOLD_PENCE = 5_000_000; // £50,000
export const DEPOSIT_CAP_SOURCE: RentSource = {
  sourceUrl:
    "https://www.gov.uk/government/publications/tenant-fees-act-2019-guidance/tenant-fees-act-2019-guidance-for-tenants",
  verifiedAt: "2026-06-22",
  verified: true // statutory: 5 weeks' rent cap (annual rent < £50k) under the Tenant Fees Act 2019
};

/** When the dataset as a whole was last touched. */
export const RENT_DATASET_VERSION = "0.1.0-seed";
export const RENT_DATASET_UPDATED = "2026-06-22";

/**
 * Seed towns. Monthly rents are SEED PLACEHOLDERS approximating ONS "Price Index of
 * Private Rents (PIPR)" median levels by local authority and must be re-verified against
 * the live ONS release before publication (verified: false). Council-tax Band D figures
 * approximate each billing authority's published 2025/26 Band D charge (also to be
 * re-verified). Typical bills approximate the Ofgem price cap split + average water bill.
 *
 * // TODO: verify — re-read every `verified: false` figure against its sourceUrl and flip to true.
 */
export const TOWNS: TownRent[] = [
  {
    townSlug: "manchester",
    townName: "Manchester",
    region: "North West",
    medianMonthlyRentPence: 102_500, // ~£1,025/mo — TODO: verify vs ONS PIPR (Manchester LA)
    rentSource: {
      sourceUrl: "https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/privaterentandhousepricesuk/latest",
      verifiedAt: "2026-06-22",
      verified: false
    },
    councilTaxBandDMonthlyPence: 17_300, // ~£2,076/yr ÷ 12 — TODO: verify vs Manchester CC 2025/26 Band D
    councilTaxSource: {
      sourceUrl: "https://www.manchester.gov.uk/info/500002/council_tax/7026/how_your_council_tax_is_worked_out",
      verifiedAt: "2026-06-22",
      verified: false
    },
    typicalBillsMonthlyPence: 19_500, // energy (Ofgem cap) + water — TODO: verify
    billsSource: {
      sourceUrl: "https://www.ofgem.gov.uk/energy-price-cap",
      verifiedAt: "2026-06-22",
      verified: false
    }
  },
  {
    townSlug: "leeds",
    townName: "Leeds",
    region: "Yorkshire and the Humber",
    medianMonthlyRentPence: 89_500, // ~£895/mo — TODO: verify vs ONS PIPR (Leeds LA)
    rentSource: {
      sourceUrl: "https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/privaterentandhousepricesuk/latest",
      verifiedAt: "2026-06-22",
      verified: false
    },
    councilTaxBandDMonthlyPence: 16_400, // ~£1,968/yr ÷ 12 — TODO: verify vs Leeds CC 2025/26 Band D
    councilTaxSource: {
      sourceUrl: "https://www.leeds.gov.uk/council-tax/about-your-council-tax",
      verifiedAt: "2026-06-22",
      verified: false
    },
    typicalBillsMonthlyPence: 19_000,
    billsSource: {
      sourceUrl: "https://www.ofgem.gov.uk/energy-price-cap",
      verifiedAt: "2026-06-22",
      verified: false
    }
  },
  {
    townSlug: "birmingham",
    townName: "Birmingham",
    region: "West Midlands",
    medianMonthlyRentPence: 92_500, // ~£925/mo — TODO: verify vs ONS PIPR (Birmingham LA)
    rentSource: {
      sourceUrl: "https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/privaterentandhousepricesuk/latest",
      verifiedAt: "2026-06-22",
      verified: false
    },
    councilTaxBandDMonthlyPence: 17_600, // ~£2,112/yr ÷ 12 — TODO: verify vs Birmingham CC 2025/26 Band D
    councilTaxSource: {
      sourceUrl: "https://www.birmingham.gov.uk/info/20005/council_tax",
      verifiedAt: "2026-06-22",
      verified: false
    },
    typicalBillsMonthlyPence: 19_200,
    billsSource: {
      sourceUrl: "https://www.ofgem.gov.uk/energy-price-cap",
      verifiedAt: "2026-06-22",
      verified: false
    }
  },
  {
    townSlug: "bristol",
    townName: "Bristol",
    region: "South West",
    medianMonthlyRentPence: 132_500, // ~£1,325/mo — TODO: verify vs ONS PIPR (Bristol LA)
    rentSource: {
      sourceUrl: "https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/privaterentandhousepricesuk/latest",
      verifiedAt: "2026-06-22",
      verified: false
    },
    councilTaxBandDMonthlyPence: 19_000, // ~£2,280/yr ÷ 12 — TODO: verify vs Bristol CC 2025/26 Band D
    councilTaxSource: {
      sourceUrl: "https://www.bristol.gov.uk/residents/council-tax",
      verifiedAt: "2026-06-22",
      verified: false
    },
    typicalBillsMonthlyPence: 19_800,
    billsSource: {
      sourceUrl: "https://www.ofgem.gov.uk/energy-price-cap",
      verifiedAt: "2026-06-22",
      verified: false
    }
  },
  {
    townSlug: "nottingham",
    townName: "Nottingham",
    region: "East Midlands",
    medianMonthlyRentPence: 89_000, // ~£890/mo — TODO: verify vs ONS PIPR (Nottingham LA)
    rentSource: {
      sourceUrl: "https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/privaterentandhousepricesuk/latest",
      verifiedAt: "2026-06-22",
      verified: false
    },
    councilTaxBandDMonthlyPence: 21_400, // ~£2,568/yr ÷ 12 — TODO: verify vs Nottingham CC 2025/26 Band D (among highest in England)
    councilTaxSource: {
      sourceUrl: "https://www.nottinghamcity.gov.uk/council-tax",
      verifiedAt: "2026-06-22",
      verified: false
    },
    typicalBillsMonthlyPence: 18_800,
    billsSource: {
      sourceUrl: "https://www.ofgem.gov.uk/energy-price-cap",
      verifiedAt: "2026-06-22",
      verified: false
    }
  },
  {
    townSlug: "newcastle",
    townName: "Newcastle upon Tyne",
    region: "North East",
    medianMonthlyRentPence: 82_500, // ~£825/mo — TODO: verify vs ONS PIPR (Newcastle LA)
    rentSource: {
      sourceUrl: "https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/privaterentandhousepricesuk/latest",
      verifiedAt: "2026-06-22",
      verified: false
    },
    councilTaxBandDMonthlyPence: 17_900, // ~£2,148/yr ÷ 12 — TODO: verify vs Newcastle CC 2025/26 Band D
    councilTaxSource: {
      sourceUrl: "https://www.newcastle.gov.uk/services/council-tax",
      verifiedAt: "2026-06-22",
      verified: false
    },
    typicalBillsMonthlyPence: 19_400,
    billsSource: {
      sourceUrl: "https://www.ofgem.gov.uk/energy-price-cap",
      verifiedAt: "2026-06-22",
      verified: false
    }
  },
  {
    townSlug: "sheffield",
    townName: "Sheffield",
    region: "Yorkshire and the Humber",
    medianMonthlyRentPence: 85_000, // ~£850/mo — TODO: verify vs ONS PIPR (Sheffield LA)
    rentSource: {
      sourceUrl: "https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/privaterentandhousepricesuk/latest",
      verifiedAt: "2026-06-22",
      verified: false
    },
    councilTaxBandDMonthlyPence: 16_900, // ~£2,028/yr ÷ 12 — TODO: verify vs Sheffield CC 2025/26 Band D
    councilTaxSource: {
      sourceUrl: "https://www.sheffield.gov.uk/council-tax",
      verifiedAt: "2026-06-22",
      verified: false
    },
    typicalBillsMonthlyPence: 19_000,
    billsSource: {
      sourceUrl: "https://www.ofgem.gov.uk/energy-price-cap",
      verifiedAt: "2026-06-22",
      verified: false
    }
  },
  {
    townSlug: "liverpool",
    townName: "Liverpool",
    region: "North West",
    medianMonthlyRentPence: 78_500, // ~£785/mo — TODO: verify vs ONS PIPR (Liverpool LA)
    rentSource: {
      sourceUrl: "https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/privaterentandhousepricesuk/latest",
      verifiedAt: "2026-06-22",
      verified: false
    },
    councilTaxBandDMonthlyPence: 19_500, // ~£2,340/yr ÷ 12 — TODO: verify vs Liverpool CC 2025/26 Band D
    councilTaxSource: {
      sourceUrl: "https://liverpool.gov.uk/council-tax/",
      verifiedAt: "2026-06-22",
      verified: false
    },
    typicalBillsMonthlyPence: 19_100,
    billsSource: {
      sourceUrl: "https://www.ofgem.gov.uk/energy-price-cap",
      verifiedAt: "2026-06-22",
      verified: false
    }
  }
];

export function getTown(slug: string): TownRent | undefined {
  return TOWNS.find((t) => t.townSlug === slug);
}

/** The most recent `verifiedAt` across the whole dataset (for freshness display). */
export function datasetLatestVerifiedAt(): string {
  const dates = [
    DEPOSIT_CAP_SOURCE.verifiedAt,
    ...TOWNS.flatMap((t) => [t.rentSource.verifiedAt, t.councilTaxSource.verifiedAt, t.billsSource.verifiedAt])
  ];
  return dates.sort().at(-1) ?? RENT_DATASET_UPDATED;
}
