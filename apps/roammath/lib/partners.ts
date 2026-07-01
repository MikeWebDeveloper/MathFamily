import partnersJson from "./partners.json";

export interface ResolvedSlot {
  kind: "affiliate" | "official";
  url: string;
  label: string;
  partnerName: string | null;
  disclosureRequired: boolean;
}

interface EsimPartnerConfig {
  name: string;
  active: boolean;
  deeplinkTemplate: string;
  trackingNote: string;
}

// AWIN-network partners (car hire + travel insurance) store their AWIN merchant id and a raw
// (unencoded) destination template. The cread.php wrapper link is built by buildAwinLink() below —
// never hand-templated — so the destination's own query string can never corrupt the AWIN redirect.
interface AwinPartnerConfig {
  name: string;
  active: boolean;
  awinmid: string;
  destinationTemplate: string;
  trackingNote: string;
}

interface PartnersJson {
  esim: Record<string, EsimPartnerConfig>;
  awin: { publisherId: string };
  "car-hire": Record<string, AwinPartnerConfig>;
  "travel-insurance": Record<string, AwinPartnerConfig>;
}

const partners = partnersJson as unknown as PartnersJson;

export function buildAffiliateUrl(template: string, countrySlug: string, clickrefPrefix = "esim"): string {
  const clickref = `${clickrefPrefix}-${countrySlug}`;
  return template
    .replaceAll("{countrySlug}", countrySlug)
    .replaceAll("{clickref}", clickref);
}

/**
 * Builds a bare, fully-tracked AWIN deep link (cread.php) with the destination ("ued") percent-encoded
 * via URLSearchParams. A destination that itself carries a query string (e.g.
 * ".../SearchResults.do?country=spain&pickupDate=2026-08-01") would otherwise leak its own "&"/"="
 * into the outer AWIN query string if hand-templated as a plain string — the exact bug class this
 * avoids. Mirrors ParkMath's lib/partners.ts buildAwinLink (same family, same AWIN pattern, same fix).
 */
export function buildAwinLink(args: {
  awinmid: string;
  publisherId: string;
  clickref: string;
  destinationUrl?: string;
}): string {
  const params = new URLSearchParams({
    awinmid: args.awinmid,
    awinaffid: args.publisherId,
    clickref: args.clickref,
  });
  if (args.destinationUrl) params.set("ued", args.destinationUrl);
  return `https://www.awin1.com/cread.php?${params.toString()}`;
}

const OFFICIAL_FALLBACK: ResolvedSlot = {
  kind: "official",
  url: "",
  label: "",
  partnerName: null,
  disclosureRequired: false,
};

// ---------------------------------------------------------------------------
// eSIM slot (existing behaviour — reads from partners.esim)
// ---------------------------------------------------------------------------

export function resolveSlot(
  providerName: string | null,
  countrySlug: string,
  officialUrl: string
): ResolvedSlot {
  const fallback: ResolvedSlot = {
    kind: "official",
    url: officialUrl,
    label: "Check live eSIM prices",
    partnerName: null,
    disclosureRequired: false,
  };

  if (!providerName) return fallback;

  const key = providerName.toLowerCase();
  const partner = partners.esim[key];

  if (!partner?.active || !partner.deeplinkTemplate.startsWith("http")) {
    return fallback;
  }

  return {
    kind: "affiliate",
    url: buildAffiliateUrl(partner.deeplinkTemplate, countrySlug, "esim"),
    label: `Buy with ${partner.name}`,
    partnerName: partner.name,
    disclosureRequired: true,
  };
}

// ---------------------------------------------------------------------------
// Shared AWIN slot resolver — car hire + travel insurance both read from an AWIN-network partner
// list and share fail-closed + link-building logic. Tries each candidate in priority order; renders
// nothing (OFFICIAL_FALLBACK, kind: "official", empty url) if none are active — callers (TravelRailBlock)
// return null for kind !== "affiliate", so an inactive rail renders no card at all.
// ---------------------------------------------------------------------------

function resolveAwinSlot(
  candidates: (AwinPartnerConfig | undefined)[],
  countrySlug: string,
  clickrefPrefix: string,
  label: string
): ResolvedSlot {
  for (const partner of candidates) {
    if (partner?.active && partner.awinmid && partner.destinationTemplate.startsWith("http")) {
      const destinationUrl = buildAffiliateUrl(partner.destinationTemplate, countrySlug, clickrefPrefix);
      const clickref = `${clickrefPrefix}-${countrySlug}`;
      return {
        kind: "affiliate",
        url: buildAwinLink({
          awinmid: partner.awinmid,
          publisherId: partners.awin.publisherId,
          clickref,
          destinationUrl,
        }),
        label,
        partnerName: partner.name,
        disclosureRequired: true,
      };
    }
  }

  return { ...OFFICIAL_FALLBACK };
}

// ---------------------------------------------------------------------------
// Car hire slot — tries discoverCars, falls back to rentalCars, then nothing
// ---------------------------------------------------------------------------

export function resolveCarHireSlot(countrySlug: string): ResolvedSlot {
  const carHire = partners["car-hire"];
  return resolveAwinSlot(
    [carHire.discoverCars, carHire.rentalCars],
    countrySlug,
    "car-hire",
    "Compare car hire prices"
  );
}

// ---------------------------------------------------------------------------
// Travel insurance slot — tries coverForYou, falls back to holidayExtras
// ---------------------------------------------------------------------------

export function resolveTravelInsuranceSlot(countrySlug: string): ResolvedSlot {
  const travelInsurance = partners["travel-insurance"];
  return resolveAwinSlot(
    [travelInsurance.coverForYou, travelInsurance.holidayExtras],
    countrySlug,
    "travel-insurance",
    "Get a travel insurance quote"
  );
}
