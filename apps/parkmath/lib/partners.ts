import partnersJson from "./partners.json";

export type SlotId = "parking-prebook" | "lounge-membership";
export type HeProduct = "parking" | "lounge" | "hotels" | "transfers";

export interface ResolvedSlot {
  kind: "affiliate" | "official";
  url: string;
  label: string;
  partnerName: string | null;
  disclosureRequired: boolean;
}

interface PartnerConfig {
  name: string;
  awinmid: string | null;
  active: boolean;
  landingUrl?: string;
  products?: Record<string, { url: string; label: string }>;
}

interface SlotConfig {
  id: string;
  partnerIds: string[];
  active: boolean;
}

const config = partnersJson as unknown as {
  awin: { publisherId: string };
  partners: Record<string, PartnerConfig>;
  slots: SlotConfig[];
};

/** Build a bare, fully-tracked AWIN deep link. `clickref` tags each click with its airport (plus an
 *  optional surface suffix for per-page/product attribution). `ued` (optional) is percent-encoded by
 *  URLSearchParams, so a destination carrying its own query string can never leak into the query. */
export function buildAwinLink(args: {
  awinmid: string;
  publisherId: string;
  airportSlug: string;
  ued?: string;
  clickrefSuffix?: string;
}): string {
  const params = new URLSearchParams({
    awinmid: args.awinmid,
    awinaffid: args.publisherId,
    clickref: `parkmath-${args.airportSlug}${args.clickrefSuffix ? `-${args.clickrefSuffix}` : ""}`,
  });
  if (args.ued) params.set("ued", args.ued);
  return `https://www.awin1.com/cread.php?${params.toString()}`;
}

/** Resolve a Holiday Extras product to a tracked deep link, or null when HE is inactive or the
 *  product has no configured URL. `clickrefSuffix` distinguishes the surface (e.g. "dropoff", "lounge",
 *  "dropoff-hotels"). */
export function resolveHeProduct(
  product: HeProduct,
  airportSlug: string,
  clickrefSuffix: string,
): { url: string; productLabel: string } | null {
  const partner = config.partners["holiday-extras"];
  const entry = partner?.products?.[product];
  if (!partner?.active || !partner.awinmid || !entry) return null;
  return {
    url: buildAwinLink({
      awinmid: partner.awinmid,
      publisherId: config.awin.publisherId,
      airportSlug,
      ued: entry.url,
      clickrefSuffix,
    }),
    productLabel: entry.label,
  };
}

/** Resolve a slot to either the first active AWIN partner (affiliate mode) or the official fallback
 *  link. Signature/shape unchanged so the page call sites need no edits. */
export function resolveSlot(slotId: SlotId, airportSlug: string, officialUrl: string): ResolvedSlot {
  const slot = config.slots.find((s) => s.id === slotId);
  if (slot?.active) {
    for (const partnerId of slot.partnerIds) {
      const partner = config.partners[partnerId];
      if (partner?.active && partner.awinmid) {
        return {
          kind: "affiliate",
          url: buildAwinLink({ awinmid: partner.awinmid, publisherId: config.awin.publisherId, airportSlug, ued: partner.landingUrl }),
          label: `Pre-book & compare prices with ${partner.name}`,
          partnerName: partner.name,
          disclosureRequired: true,
        };
      }
    }
  }
  return {
    kind: "official",
    url: officialUrl,
    label: "Check live prices on the official site",
    partnerName: null,
    disclosureRequired: false,
  };
}
