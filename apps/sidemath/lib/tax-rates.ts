/**
 * SideMath app-local tax dataset — UK self-employed / sole-trader figures.
 *
 * App-local on purpose (NOT in packages/data): these rates belong to this app and
 * change every UK tax year. Every figure carries a sourceUrl + verifiedAt so a
 * reviewer can re-check it against gov.uk, exactly like the rest of the Math family.
 *
 * Tax year: 2026/27 (6 April 2026 – 5 April 2027).
 * All money is held as integer PENCE to stay exact (no float drift). A whole-pound
 * threshold like £12,570 is therefore 1_257_000 pence.
 *
 * NOT TAX ADVICE — these are estimates to two-decimal precision of the headline
 * Self Assessment maths (income tax + Class 2/4 NIC + trading allowance). They
 * deliberately ignore: payments on account, the High Income Child Benefit Charge,
 * student loan repayments, pension relief, Gift Aid, Scottish/Welsh income tax
 * rates (this models rUK England/NI/Wales bands), Marriage Allowance, capital
 * allowances and any other adjustment. Always check gov.uk or an accountant.
 */

export interface RateSource {
  sourceUrl: string;
  verifiedAt: string; // ISO date the figure was last checked against the official page
}

export interface TaxYear {
  label: string; // e.g. "2026/27"
  startsOn: string;
  endsOn: string;
}

export const TAX_YEAR: TaxYear = {
  label: "2026/27",
  startsOn: "2026-04-06",
  endsOn: "2027-04-05"
};

// ── Income tax (rUK: England, Wales & Northern Ireland) ───────────────────────
// Source: https://www.gov.uk/income-tax-rates (verified 2026-06-22)
export const PERSONAL_ALLOWANCE_PENCE = 1_257_000; // £12,570
export const PERSONAL_ALLOWANCE_TAPER_FROM_PENCE = 10_000_000; // £100,000 — PA reduces £1 per £2 above this
export const BASIC_RATE_LIMIT_PENCE = 5_027_000; // £50,270 — top of the 20% band (taxable income above the PA threshold sits here)
export const HIGHER_RATE_LIMIT_PENCE = 12_514_000; // £125,140 — top of the 40% band; 45% applies above

export const BASIC_RATE = 0.2;
export const HIGHER_RATE = 0.4;
export const ADDITIONAL_RATE = 0.45;

export const INCOME_TAX_SOURCE: RateSource = {
  sourceUrl: "https://www.gov.uk/income-tax-rates",
  verifiedAt: "2026-06-22"
};

// ── National Insurance — self-employed (Class 2 & Class 4) ────────────────────
// Source: https://www.gov.uk/self-employed-national-insurance-rates (verified 2026-06-22)
//
// Class 2: since 2024/25 there is NO Class 2 bill for self-employed people whose
// profits are at or above the Small Profits Threshold — those contributions are
// "treated as paid" (you still get the qualifying year for State Pension). The
// £3.65/week rate only applies if you VOLUNTARILY pay below the threshold. SideMath
// therefore charges £0 Class 2 for profits >= SPT and shows the voluntary rate as
// information only.
export const CLASS2_SMALL_PROFITS_THRESHOLD_PENCE = 710_500; // £7,105
export const CLASS2_WEEKLY_RATE_PENCE = 365; // £3.65/week (voluntary, below SPT) — informational
export const CLASS2_WEEKS_PER_YEAR = 52;

// Class 4: 6% on profits between the Lower Profits Threshold and the Upper Profits
// Limit, then 2% above the UPL.
export const CLASS4_LOWER_PROFITS_THRESHOLD_PENCE = 1_257_000; // £12,570
export const CLASS4_UPPER_PROFITS_LIMIT_PENCE = 5_027_000; // £50,270
export const CLASS4_MAIN_RATE = 0.06; // 6%
export const CLASS4_UPPER_RATE = 0.02; // 2%

export const NIC_SOURCE: RateSource = {
  sourceUrl: "https://www.gov.uk/self-employed-national-insurance-rates",
  verifiedAt: "2026-06-22"
};

// ── Trading allowance ─────────────────────────────────────────────────────────
// Source: https://www.gov.uk/guidance/tax-free-allowances-on-property-and-trading-income (verified 2026-06-22)
// Full relief if gross trading income <= £1,000 (nothing to declare). Otherwise you
// may deduct the £1,000 allowance INSTEAD OF actual expenses (partial relief).
export const TRADING_ALLOWANCE_PENCE = 100_000; // £1,000

export const TRADING_ALLOWANCE_SOURCE: RateSource = {
  sourceUrl: "https://www.gov.uk/guidance/tax-free-allowances-on-property-and-trading-income",
  verifiedAt: "2026-06-22"
};

/** Every source behind the figures above — rendered in the footer SourcesBlock. */
export const ALL_SOURCES: { label: string; url: string; verifiedAt: string }[] = [
  { label: "Income Tax rates and Personal Allowance (gov.uk)", url: INCOME_TAX_SOURCE.sourceUrl, verifiedAt: INCOME_TAX_SOURCE.verifiedAt },
  { label: "Self-employed National Insurance rates (gov.uk)", url: NIC_SOURCE.sourceUrl, verifiedAt: NIC_SOURCE.verifiedAt },
  { label: "Tax-free trading allowance (gov.uk)", url: TRADING_ALLOWANCE_SOURCE.sourceUrl, verifiedAt: TRADING_ALLOWANCE_SOURCE.verifiedAt }
];

/** The newest verifiedAt across the dataset — used for sitemap lastModified + freshness. */
export const DATASET_VERIFIED_AT = ALL_SOURCES.map((s) => s.verifiedAt).sort().at(-1)!;
