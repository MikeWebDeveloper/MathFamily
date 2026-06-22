/**
 * App-local DentalMath dataset. All monetary values are integer PENCE (so we can reuse
 * @mathfamily/engine's formatPence and avoid float drift), matching the monorepo convention.
 *
 * SOURCING RULES (mirrors the family's verified-data discipline):
 *  - NHS England band charges are AUTHORITATIVE: read directly from nhs.uk on verifiedAt.
 *  - Devolved-nation NHS charges are AUTHORITATIVE summaries from the official nation pages.
 *  - Private prices are TYPICAL RANGES taken from public price guides (Which?, practice price
 *    lists). They are clearly labelled as indicative ranges, NOT a single authoritative price —
 *    private fees vary widely by practice, region and complexity. Never presented as a fixed quote.
 *  - Every record carries sourceUrl + verifiedAt. Nothing here is fabricated; where a figure could
 *    not be pinned to a public source it is omitted rather than invented.
 */

export interface DentalSource {
  /** Human label for the source. */
  label: string;
  sourceUrl: string;
  /** ISO date (YYYY-MM-DD) the figure was last checked against the source. */
  verifiedAt: string;
}

/** A single private price range, in pence. */
export interface PriceRange {
  /** Low end of the typical private price, in pence. */
  minPence: number;
  /** High end of the typical private price, in pence. */
  maxPence: number;
}

/** NHS band identifiers for England. */
export type NhsBand = "band1" | "band2" | "band3" | "urgent";

export interface TreatmentRecord {
  slug: string;
  /** Display name, e.g. "Filling". */
  name: string;
  /** One-line plain description of the treatment. */
  summary: string;
  /** Which England NHS band this treatment falls under. */
  nhsBand: NhsBand;
  /** Typical private price range in pence (indicative, varies by practice/region). */
  privatePrice: PriceRange;
  /** Notes on what drives private price variation for this treatment. */
  privateNote: string;
  /** Source for the private price range. */
  privateSource: DentalSource;
}

export interface NhsBandCharge {
  band: NhsBand;
  label: string;
  /** England NHS patient charge for a course of treatment in this band, in pence. */
  pricePence: number;
  /** What the band covers, plain language. */
  covers: string;
}

export interface NhsNation {
  slug: string;
  name: string;
  /** Plain-language summary of how NHS dental charges work in this nation. */
  model: string;
  source: DentalSource;
}

// ---------------------------------------------------------------------------
// NHS England band charges — AUTHORITATIVE (nhs.uk)
// Verified 2026-06-22 against the official NHS England dental costs page.
// ---------------------------------------------------------------------------

export const NHS_ENGLAND_HELP_URL =
  "https://www.nhs.uk/nhs-services/dentists/dental-costs/how-much-will-i-pay-for-nhs-dental-treatment/";

const NHS_ENGLAND_SOURCE: DentalSource = {
  label: "NHS — How much will I pay for NHS dental treatment (England)",
  sourceUrl: NHS_ENGLAND_HELP_URL,
  verifiedAt: "2026-06-22",
};

export const NHS_BAND_CHARGES: NhsBandCharge[] = [
  {
    band: "band1",
    label: "Band 1",
    pricePence: 2790, // £27.90
    covers:
      "Examination, diagnosis and advice, X-rays, a scale and polish if clinically needed, and preventive care such as fluoride varnish.",
  },
  {
    band: "band2",
    label: "Band 2",
    pricePence: 7660, // £76.60
    covers:
      "Everything in Band 1 plus fillings, root canal treatment, and removing teeth (extractions).",
  },
  {
    band: "band3",
    label: "Band 3",
    pricePence: 33210, // £332.10
    covers:
      "Everything in Bands 1 and 2 plus crowns, dentures, bridges and other lab-made appliances.",
  },
  {
    band: "urgent",
    label: "Urgent / emergency",
    pricePence: 2790, // £27.90
    covers:
      "Urgent care to relieve pain or deal with an immediate problem — for example a temporary filling, an extraction or draining an abscess.",
  },
];

// ---------------------------------------------------------------------------
// NHS nation models — AUTHORITATIVE summaries
// ---------------------------------------------------------------------------

export const NHS_NATIONS: NhsNation[] = [
  {
    slug: "england",
    name: "England",
    model:
      "Three fixed bands: Band 1 £27.90, Band 2 £76.60, Band 3 £332.10, urgent care £27.90. You pay one charge per course of treatment, at the highest band needed.",
    source: NHS_ENGLAND_SOURCE,
  },
  {
    slug: "wales",
    name: "Wales",
    model:
      "From April 2026 Wales replaced bands with fixed per-treatment package fees — you pay 50% of the package value, capped at £384 per course of treatment (e.g. a routine check-up around £25).",
    source: {
      label: "Welsh Government — NHS dental charges in Wales",
      sourceUrl: "https://media.service.gov.wales/news/nhs-dental-charges-in-wales-to-increase-from-april",
      verifiedAt: "2026-06-22",
    },
  },
  {
    slug: "scotland",
    name: "Scotland",
    model:
      "Examinations are free for everyone, and all NHS dental care is free for under-26s. Other patients pay 80% of the dentist's fee, capped at £384 per course of treatment.",
    source: {
      label: "NHS inform — Receiving NHS dental treatment in Scotland",
      sourceUrl: "https://www.nhsinform.scot/care-support-and-rights/nhs-services/dental/receiving-nhs-dental-treatment-in-scotland/",
      verifiedAt: "2026-06-22",
    },
  },
  {
    slug: "northern-ireland",
    name: "Northern Ireland",
    model:
      "Examinations are free. For other treatment you pay 80% of the dentist's fee, capped at £384 per course of treatment — the same percentage model as Scotland.",
    source: {
      label: "Northern Ireland — Statement of Dental Remuneration 2025 (HSCNI)",
      sourceUrl: "https://bso.hscni.net/wp-content/uploads/2025/04/Statement-of-Dental-Remuneration-2025.pdf",
      verifiedAt: "2026-06-22",
    },
  },
];

// ---------------------------------------------------------------------------
// Treatments — NHS band mapping is authoritative; private ranges are INDICATIVE
// (public price guides). Verified 2026-06-22.
// ---------------------------------------------------------------------------

const PRIVATE_GUIDE_WHICH: DentalSource = {
  label: "Which? — Private and NHS dental charges",
  sourceUrl: "https://www.which.co.uk/reviews/dentists/article/private-and-nhs-dental-charges-al0jA6J1Swyl",
  verifiedAt: "2026-06-22",
};

const PRIVATE_GUIDE_GENERAL: DentalSource = {
  label: "MyTribe Insurance — Average cost of private dental treatment in the UK",
  sourceUrl: "https://www.mytribeinsurance.co.uk/treatment/cost-of-private-dental-treatment-uk",
  verifiedAt: "2026-06-22",
};

export const TREATMENTS: TreatmentRecord[] = [
  {
    slug: "check-up",
    name: "Dental check-up",
    summary: "A routine examination of your teeth, gums and mouth, with advice and any X-rays needed.",
    nhsBand: "band1",
    privatePrice: { minPence: 6000, maxPence: 12000 }, // £60–£120
    privateNote: "New-patient first appointments sit at the top of this range; routine reviews are cheaper.",
    privateSource: PRIVATE_GUIDE_GENERAL,
  },
  {
    slug: "scale-and-polish",
    name: "Scale and polish",
    summary: "Professional cleaning to remove plaque and tartar build-up (hygienist appointment privately).",
    nhsBand: "band1",
    privatePrice: { minPence: 7500, maxPence: 16500 }, // £75–£165
    privateNote: "Price depends on session length and whether stain-removal (e.g. AirFlow) is included.",
    privateSource: PRIVATE_GUIDE_GENERAL,
  },
  {
    slug: "filling",
    name: "Filling",
    summary: "Repairing a tooth damaged by decay with a filling material such as composite or amalgam.",
    nhsBand: "band2",
    privatePrice: { minPence: 9000, maxPence: 25000 }, // £90–£250
    privateNote: "Composite (tooth-coloured) fillings and larger cavities cost more than small amalgam fillings.",
    privateSource: PRIVATE_GUIDE_GENERAL,
  },
  {
    slug: "extraction",
    name: "Tooth extraction",
    summary: "Removing a tooth that is badly damaged, decayed or causing problems.",
    nhsBand: "band2",
    privatePrice: { minPence: 15000, maxPence: 75000 }, // £150–£750
    privateNote: "Simple extractions sit at the lower end; surgical extractions (e.g. impacted wisdom teeth) are far higher.",
    privateSource: PRIVATE_GUIDE_GENERAL,
  },
  {
    slug: "root-canal",
    name: "Root canal treatment",
    summary: "Removing infected pulp from inside a tooth to save it, then sealing it.",
    nhsBand: "band2",
    privatePrice: { minPence: 40000, maxPence: 120000 }, // £400–£1,200
    privateNote: "A general dentist is cheaper; a specialist endodontist using a microscope is at the top of the range.",
    privateSource: PRIVATE_GUIDE_GENERAL,
  },
  {
    slug: "crown",
    name: "Crown",
    summary: "A lab-made cap that covers and protects a damaged tooth.",
    nhsBand: "band3",
    privatePrice: { minPence: 50000, maxPence: 140000 }, // £500–£1,400
    privateNote: "Material (metal vs porcelain/zirconia) and location drive the price; London and affluent areas are dearer.",
    privateSource: PRIVATE_GUIDE_GENERAL,
  },
  {
    slug: "dentures",
    name: "Dentures",
    summary: "Removable false teeth to replace one or more missing teeth.",
    nhsBand: "band3",
    privatePrice: { minPence: 50000, maxPence: 150000 }, // £500–£1,500 (per denture, indicative)
    privateNote: "Acrylic partial dentures are cheapest; full or cobalt-chrome dentures cost more.",
    privateSource: PRIVATE_GUIDE_WHICH,
  },
  {
    slug: "emergency",
    name: "Emergency dental treatment",
    summary: "Urgent care to relieve pain or deal with an immediate problem such as a broken tooth or abscess.",
    nhsBand: "urgent",
    privatePrice: { minPence: 8000, maxPence: 30000 }, // £80–£300 for the emergency appointment
    privateNote: "Covers the emergency appointment and immediate pain relief; any follow-up treatment is charged separately.",
    privateSource: PRIVATE_GUIDE_GENERAL,
  },
];

/** Look up the England band charge for a treatment record. */
export function bandFor(treatment: TreatmentRecord): NhsBandCharge {
  const band = NHS_BAND_CHARGES.find((b) => b.band === treatment.nhsBand);
  if (!band) throw new Error(`No NHS band charge for ${treatment.nhsBand}`);
  return band;
}

/** Latest verifiedAt across all dataset sources (for freshness badge / sitemap). */
export function latestVerifiedAt(): string {
  const dates = [
    NHS_ENGLAND_SOURCE.verifiedAt,
    ...NHS_NATIONS.map((n) => n.source.verifiedAt),
    ...TREATMENTS.map((t) => t.privateSource.verifiedAt),
  ];
  return dates.sort().at(-1) ?? "";
}
