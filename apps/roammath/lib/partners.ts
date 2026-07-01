import partnersJson from "./partners.json";

export interface ResolvedSlot {
  kind: "affiliate" | "official";
  url: string;
  label: string;
  partnerName: string | null;
  disclosureRequired: boolean;
}

interface PartnerConfig {
  name: string;
  active: boolean;
  deeplinkTemplate: string;
  trackingNote: string;
}

interface PartnersJson {
  esim: Record<string, PartnerConfig>;
  "car-hire": Record<string, PartnerConfig>;
  "travel-insurance": Record<string, PartnerConfig>;
}

const partners = partnersJson as unknown as PartnersJson;

export function buildAffiliateUrl(template: string, countrySlug: string, clickrefPrefix = "esim"): string {
  const clickref = `${clickrefPrefix}-${countrySlug}`;
  return template
    .replaceAll("{countrySlug}", countrySlug)
    .replaceAll("{clickref}", clickref);
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
// Car hire slot — tries discoverCars, falls back to rentalCars, then nothing
// ---------------------------------------------------------------------------

export function resolveCarHireSlot(countrySlug: string): ResolvedSlot {
  const carHire = partners["car-hire"];

  for (const key of ["discoverCars", "rentalCars"] as const) {
    const partner = carHire[key];
    if (partner?.active && partner.deeplinkTemplate.startsWith("http")) {
      return {
        kind: "affiliate",
        url: buildAffiliateUrl(partner.deeplinkTemplate, countrySlug, "car-hire"),
        label: "Compare car hire prices",
        partnerName: partner.name,
        disclosureRequired: true,
      };
    }
  }

  return { ...OFFICIAL_FALLBACK };
}

// ---------------------------------------------------------------------------
// Travel insurance slot — tries coverForYou, falls back to holidayExtras
// ---------------------------------------------------------------------------

export function resolveTravelInsuranceSlot(countrySlug: string): ResolvedSlot {
  const travelInsurance = partners["travel-insurance"];

  for (const key of ["coverForYou", "holidayExtras"] as const) {
    const partner = travelInsurance[key];
    if (partner?.active && partner.deeplinkTemplate.startsWith("http")) {
      return {
        kind: "affiliate",
        url: buildAffiliateUrl(partner.deeplinkTemplate, countrySlug, "travel-insurance"),
        label: "Get a travel insurance quote",
        partnerName: partner.name,
        disclosureRequired: true,
      };
    }
  }

  return { ...OFFICIAL_FALLBACK };
}
