import partnersJson from "./partners.json";

export type SlotId = "parking-prebook" | "lounge-membership";

/** Build a bare, fully-tracked AWIN deep link. `clickref` tags every click with its airport
 *  for per-airport reporting. `ued` (optional) is percent-encoded by URLSearchParams, so a
 *  destination carrying its own query string can never leak into the cread.php query. */
export function buildAwinLink(args: {
  awinmid: string;
  publisherId: string;
  airportSlug: string;
  ued?: string;
}): string {
  const params = new URLSearchParams({
    awinmid: args.awinmid,
    awinaffid: args.publisherId,
    clickref: `parkmath-${args.airportSlug}`,
  });
  if (args.ued) params.set("ued", args.ued);
  return `https://www.awin1.com/cread.php?${params.toString()}`;
}

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
