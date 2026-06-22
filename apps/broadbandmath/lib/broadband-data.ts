import type { BroadbandDataset, BroadbandPlan, SpeedTier } from "./broadband-types";

/**
 * App-local seed dataset for BroadbandMath (UK broadband true cost).
 *
 * IMPORTANT — verification status:
 * This is a SCAFFOLD build assembled offline. Exact current monthly prices change
 * frequently and could NOT be confirmed against live provider pages at build time, so
 * every plan is marked `verified: false` and carries a `// TODO: verify` against the
 * provider's official source URL. The figures below are REPRESENTATIVE of each provider's
 * publicly published structure (advertised price, 24-month term, fixed annual £-rise under
 * Ofcom's 2025 rules, and out-of-contract price) — NOT fabricated precision. Before launch,
 * each row must be re-checked against the sourceUrl and flipped to `verified: true` with a
 * fresh `verifiedAt`.
 *
 * Key regulatory anchor (stable, verifiable): Ofcom banned CPI/RPI-linked mid-contract
 * price rises for broadband/mobile contracts entered into on or after 17 January 2025;
 * providers must instead state any in-contract rise up front in pounds and pence.
 *   Source: https://www.ofcom.org.uk/phones-and-broadband/saving-money/inflation-linked-price-rises
 *
 * Money is integer pence throughout.
 */

const OFCOM_PRICE_RISE_SOURCE =
  "https://www.ofcom.org.uk/phones-and-broadband/saving-money/inflation-linked-price-rises";

export const SPEED_TIERS: SpeedTier[] = [
  {
    slug: "essential",
    name: "Essential (under 40 Mbps)",
    minMbps: 0,
    maxMbps: 39,
    blurb: "Entry-level ADSL or part-fibre lines for light browsing and a couple of devices."
  },
  {
    slug: "fast",
    name: "Fast (40–99 Mbps)",
    minMbps: 40,
    maxMbps: 99,
    blurb: "Standard fibre-to-the-cabinet (FTTC) — fine for HD streaming and a typical household."
  },
  {
    slug: "superfast",
    name: "Superfast (100–299 Mbps)",
    minMbps: 100,
    maxMbps: 299,
    blurb: "Full-fibre and cable entry tiers — comfortable for 4K streaming and remote work."
  },
  {
    slug: "ultrafast",
    name: "Ultrafast (300–899 Mbps)",
    minMbps: 300,
    maxMbps: 899,
    blurb: "Full-fibre mid tiers for busy households and heavy uploaders."
  },
  {
    slug: "gigabit",
    name: "Gigabit (900 Mbps+)",
    minMbps: 900,
    maxMbps: null,
    blurb: "Full-fibre top tiers around 1 Gbps for the most demanding homes."
  }
];

/**
 * Representative plans across the major UK providers and across speed tiers.
 * verifiedAt is the date the structure/source was last reviewed; verified=false until a
 * human confirms the live figure.
 */
export const PLANS: BroadbandPlan[] = [
  {
    slug: "bt-fibre-essential",
    provider: "BT",
    providerSlug: "bt",
    planName: "Fibre Essential",
    speedMbps: 36,
    speedTier: "essential",
    advertisedMonthlyPence: 2899, // TODO: verify
    contractMonths: 24,
    outOfContractMonthlyPence: 4199, // TODO: verify
    upfrontPence: 0,
    exitFeePence: 0, // TODO: verify — BT charges remaining-months on early exit; representative single figure
    priceRise: {
      type: "fixed_pence",
      fixedPencePerMonth: 300, // TODO: verify — BT's stated annual £/month in-contract rise (each March/April)
      summary: "Fixed annual in-contract rise stated up front in £ (Ofcom 2025 rules)."
    },
    sourceUrl: "https://www.bt.com/broadband/deals",
    verifiedAt: "2026-06-22",
    verified: false,
    notes: "BT FTTC entry tier. Figures representative pending live verification."
  },
  {
    slug: "bt-fibre-2",
    provider: "BT",
    providerSlug: "bt",
    planName: "Fibre 2",
    speedMbps: 74,
    speedTier: "fast",
    advertisedMonthlyPence: 3499, // TODO: verify
    contractMonths: 24,
    outOfContractMonthlyPence: 4799, // TODO: verify
    upfrontPence: 0,
    exitFeePence: 0, // TODO: verify
    priceRise: {
      type: "fixed_pence",
      fixedPencePerMonth: 300, // TODO: verify
      summary: "Fixed annual in-contract rise stated up front in £ (Ofcom 2025 rules)."
    },
    sourceUrl: "https://www.bt.com/broadband/deals",
    verifiedAt: "2026-06-22",
    verified: false
  },
  {
    slug: "bt-full-fibre-500",
    provider: "BT",
    providerSlug: "bt",
    planName: "Full Fibre 500",
    speedMbps: 500,
    speedTier: "ultrafast",
    advertisedMonthlyPence: 4999, // TODO: verify
    contractMonths: 24,
    outOfContractMonthlyPence: 6499, // TODO: verify
    upfrontPence: 0,
    exitFeePence: 0, // TODO: verify
    priceRise: {
      type: "fixed_pence",
      fixedPencePerMonth: 300, // TODO: verify
      summary: "Fixed annual in-contract rise stated up front in £ (Ofcom 2025 rules)."
    },
    sourceUrl: "https://www.bt.com/broadband/deals",
    verifiedAt: "2026-06-22",
    verified: false
  },
  {
    slug: "skybroadband-superfast",
    provider: "Sky",
    providerSlug: "sky",
    planName: "Superfast",
    speedMbps: 61,
    speedTier: "fast",
    advertisedMonthlyPence: 2700, // TODO: verify
    contractMonths: 18,
    outOfContractMonthlyPence: 4300, // TODO: verify
    upfrontPence: 0,
    exitFeePence: 0, // TODO: verify
    priceRise: {
      type: "fixed_pence",
      fixedPencePerMonth: 300, // TODO: verify — Sky's stated annual £/month rise
      summary: "Fixed annual in-contract rise stated up front in £ (Ofcom 2025 rules)."
    },
    sourceUrl: "https://www.sky.com/shop/broadband-talk/broadband",
    verifiedAt: "2026-06-22",
    verified: false
  },
  {
    slug: "skybroadband-full-fibre-150",
    provider: "Sky",
    providerSlug: "sky",
    planName: "Full Fibre 150",
    speedMbps: 145,
    speedTier: "superfast",
    advertisedMonthlyPence: 3200, // TODO: verify
    contractMonths: 18,
    outOfContractMonthlyPence: 4800, // TODO: verify
    upfrontPence: 0,
    exitFeePence: 0, // TODO: verify
    priceRise: {
      type: "fixed_pence",
      fixedPencePerMonth: 300, // TODO: verify
      summary: "Fixed annual in-contract rise stated up front in £ (Ofcom 2025 rules)."
    },
    sourceUrl: "https://www.sky.com/shop/broadband-talk/broadband",
    verifiedAt: "2026-06-22",
    verified: false
  },
  {
    slug: "virgin-m125",
    provider: "Virgin Media",
    providerSlug: "virgin-media",
    planName: "M125 Fibre",
    speedMbps: 132,
    speedTier: "superfast",
    advertisedMonthlyPence: 2799, // TODO: verify
    contractMonths: 18,
    outOfContractMonthlyPence: 4900, // TODO: verify
    upfrontPence: 0,
    exitFeePence: 0, // TODO: verify
    priceRise: {
      type: "fixed_pence",
      fixedPencePerMonth: 350, // TODO: verify — Virgin Media's stated annual £/month rise
      summary: "Fixed annual in-contract rise stated up front in £ (Ofcom 2025 rules)."
    },
    sourceUrl: "https://www.virginmedia.com/broadband",
    verifiedAt: "2026-06-22",
    verified: false
  },
  {
    slug: "virgin-gig1",
    provider: "Virgin Media",
    providerSlug: "virgin-media",
    planName: "Gig1 Fibre",
    speedMbps: 1130,
    speedTier: "gigabit",
    advertisedMonthlyPence: 4499, // TODO: verify
    contractMonths: 18,
    outOfContractMonthlyPence: 6500, // TODO: verify
    upfrontPence: 0,
    exitFeePence: 0, // TODO: verify
    priceRise: {
      type: "fixed_pence",
      fixedPencePerMonth: 350, // TODO: verify
      summary: "Fixed annual in-contract rise stated up front in £ (Ofcom 2025 rules)."
    },
    sourceUrl: "https://www.virginmedia.com/broadband",
    verifiedAt: "2026-06-22",
    verified: false
  },
  {
    slug: "vodafone-fibre-2",
    provider: "Vodafone",
    providerSlug: "vodafone",
    planName: "Fibre 2",
    speedMbps: 73,
    speedTier: "fast",
    advertisedMonthlyPence: 2700, // TODO: verify
    contractMonths: 24,
    outOfContractMonthlyPence: 3800, // TODO: verify
    upfrontPence: 0,
    exitFeePence: 0, // TODO: verify
    priceRise: {
      type: "fixed_pence",
      fixedPencePerMonth: 300, // TODO: verify — Vodafone's stated annual £/month rise
      summary: "Fixed annual in-contract rise stated up front in £ (Ofcom 2025 rules)."
    },
    sourceUrl: "https://www.vodafone.co.uk/broadband",
    verifiedAt: "2026-06-22",
    verified: false
  },
  {
    slug: "vodafone-full-fibre-900",
    provider: "Vodafone",
    providerSlug: "vodafone",
    planName: "Full Fibre 900",
    speedMbps: 910,
    speedTier: "gigabit",
    advertisedMonthlyPence: 3500, // TODO: verify
    contractMonths: 24,
    outOfContractMonthlyPence: 5200, // TODO: verify
    upfrontPence: 0,
    exitFeePence: 0, // TODO: verify
    priceRise: {
      type: "fixed_pence",
      fixedPencePerMonth: 300, // TODO: verify
      summary: "Fixed annual in-contract rise stated up front in £ (Ofcom 2025 rules)."
    },
    sourceUrl: "https://www.vodafone.co.uk/broadband",
    verifiedAt: "2026-06-22",
    verified: false
  },
  {
    slug: "talktalk-fibre-65",
    provider: "TalkTalk",
    providerSlug: "talktalk",
    planName: "Fibre 65",
    speedMbps: 67,
    speedTier: "fast",
    advertisedMonthlyPence: 2595, // TODO: verify
    contractMonths: 18,
    outOfContractMonthlyPence: 3795, // TODO: verify
    upfrontPence: 0,
    exitFeePence: 0, // TODO: verify
    priceRise: {
      type: "fixed_pence",
      fixedPencePerMonth: 300, // TODO: verify — TalkTalk's stated annual £/month rise
      summary: "Fixed annual in-contract rise stated up front in £ (Ofcom 2025 rules)."
    },
    sourceUrl: "https://www.talktalk.co.uk/broadband/deals",
    verifiedAt: "2026-06-22",
    verified: false
  },
  {
    slug: "community-fibre-150",
    provider: "Community Fibre",
    providerSlug: "community-fibre",
    planName: "150 Mbps Full Fibre",
    speedMbps: 150,
    speedTier: "superfast",
    advertisedMonthlyPence: 2300, // TODO: verify
    contractMonths: 24,
    outOfContractMonthlyPence: 2300, // TODO: verify — some altnets hold price; confirm
    upfrontPence: 0,
    exitFeePence: 0, // TODO: verify
    priceRise: {
      type: "none",
      summary: "Marketed as no mid-contract price rises — verify the current contract terms."
    },
    sourceUrl: "https://communityfibre.co.uk/broadband",
    verifiedAt: "2026-06-22",
    verified: false,
    notes: "Altnet (London). Some altnets advertise fixed-price / no-rise contracts; confirm before relying on it."
  },
  {
    slug: "legacy-cpi-example",
    provider: "Legacy contract (illustrative)",
    providerSlug: "legacy-cpi-example",
    planName: "Pre-2025 CPI-linked deal",
    speedMbps: 67,
    speedTier: "fast",
    advertisedMonthlyPence: 3000,
    contractMonths: 24,
    outOfContractMonthlyPence: 4500,
    upfrontPence: 0,
    exitFeePence: 0,
    priceRise: {
      type: "cpi_plus",
      plusPercent: 3.9, // the once-common "CPI + 3.9%" term on contracts signed before 17 Jan 2025
      assumedIndexPercent: 4.0, // illustrative assumed CPI for projection; labelled as an assumption
      summary:
        "Legacy CPI + 3.9% annual in-contract rise (illustrative). Banned for contracts signed on/after 17 Jan 2025; shown to demonstrate why those deals cost more."
    },
    sourceUrl: OFCOM_PRICE_RISE_SOURCE,
    verifiedAt: "2026-06-22",
    verified: false,
    notes:
      "Illustrative, not a live deal. Demonstrates the old inflation-linked model so users can compare against today's fixed-£ rises. CPI assumption is labelled as an assumption."
  }
];

export const BROADBAND_DATASET: BroadbandDataset = {
  version: "0.1.0-scaffold",
  lastUpdated: "2026-06-22",
  plans: PLANS,
  speedTiers: SPEED_TIERS
};

export function loadBroadbandDataset(): BroadbandDataset {
  return BROADBAND_DATASET;
}

export function plansByProvider(providerSlug: string): BroadbandPlan[] {
  return PLANS.filter((p) => p.providerSlug === providerSlug);
}

export function plansBySpeedTier(tier: string): BroadbandPlan[] {
  return PLANS.filter((p) => p.speedTier === tier);
}

/** Distinct providers in dataset order of first appearance. */
export function listProviders(): { slug: string; name: string }[] {
  const seen = new Map<string, string>();
  for (const p of PLANS) if (!seen.has(p.providerSlug)) seen.set(p.providerSlug, p.provider);
  return [...seen.entries()].map(([slug, name]) => ({ slug, name }));
}
