import partnersJson from "./partners.json";

export type SlotId = "esim";

export interface ResolvedSlot {
  kind: "affiliate" | "official";
  url: string;
  label: string;
  partnerName: string | null;
  disclosureRequired: boolean;
}

interface SlotConfig {
  id: string;
  partnerId: string;
  deeplinkTemplate: string;
  active: boolean;
}

export function resolveSlot(slotId: SlotId, airportSlug: string, officialUrl: string): ResolvedSlot {
  const slot = (partnersJson.slots as SlotConfig[]).find((s) => s.id === slotId);
  const partner = slot ? (partnersJson.partners as Record<string, { name: string; active: boolean }>)[slot.partnerId] : undefined;
  if (slot?.active && partner?.active && slot.deeplinkTemplate.startsWith("http")) {
    return {
      kind: "affiliate",
      url: slot.deeplinkTemplate.replaceAll("{airportSlug}", airportSlug).replaceAll("{officialUrl}", officialUrl),
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
