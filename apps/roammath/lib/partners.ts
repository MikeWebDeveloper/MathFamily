import partnersJson from "./partners.json";

export type ProviderId = "airalo" | "saily" | "holafly";

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

export function resolveProvider(providerId: ProviderId, countrySlug: string, clickref: string, officialUrl: string): ResolvedSlot {
  const partner = (partnersJson.partners as Record<string, PartnerConfig>)[providerId];
  if (partner?.active && partner.deeplinkTemplate.startsWith("http")) {
    return {
      kind: "affiliate",
      url: partner.deeplinkTemplate.replaceAll("{countrySlug}", countrySlug).replaceAll("{clickref}", clickref),
      label: `Check prices with ${partner.name}`,
      partnerName: partner.name,
      disclosureRequired: true
    };
  }
  return {
    kind: "official",
    url: officialUrl,
    label: "Check live prices on the official site",
    partnerName: null,
    disclosureRequired: false
  };
}
