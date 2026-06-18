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

export function buildAffiliateUrl(template: string, countrySlug: string): string {
  const clickref = `esim-${countrySlug}`;
  return template
    .replaceAll("{countrySlug}", countrySlug)
    .replaceAll("{clickref}", clickref);
}

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
  const partner = (partnersJson.partners as Record<string, PartnerConfig>)[key];

  if (!partner?.active || !partner.deeplinkTemplate.startsWith("http")) {
    return fallback;
  }

  return {
    kind: "affiliate",
    url: buildAffiliateUrl(partner.deeplinkTemplate, countrySlug),
    label: `Buy with ${partner.name}`,
    partnerName: partner.name,
    disclosureRequired: true,
  };
}
