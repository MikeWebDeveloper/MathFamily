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

export interface HeAirportParkingConfig {
  /** Airport-page URL with a `{slug}` placeholder, e.g. ".../{slug}-airport-parking.html". */
  urlPattern: string;
  /** Map our airport slug → HE's page slug, for airports whose HE URL differs. */
  slugOverrides: Record<string, string>;
  /** When false, dates are ignored and we deep-link to the airport page (reliable baseline). */
  datePrefill: boolean;
  /** Dated-search URL with `{slug}`/`{dropOff}`/`{returnDate}` placeholders, or null until confirmed. */
  dateUrlTemplate: string | null;
}

interface PartnerConfig {
  name: string;
  awinmid: string | null;
  active: boolean;
  landingUrl?: string;
  products?: Record<string, { url: string; label: string }>;
  airportParking?: HeAirportParkingConfig;
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

/** Name of the first active partner for an active slot, or null. Surfaces without an
 *  airport in context (e.g. the home deals strip) use this to decide affiliate framing;
 *  the tracked link is still built per-airport elsewhere via resolveSlot/buildAwinLink. */
export function activeSlotPartnerName(slotId: SlotId): string | null {
  const slot = config.slots.find((s) => s.id === slotId);
  if (!slot?.active) return null;
  for (const partnerId of slot.partnerIds) {
    const partner = config.partners[partnerId];
    if (partner?.active && partner.awinmid) return partner.name;
  }
  return null;
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

/** Resolve the `ued` destination for a parking search via the fallback ladder:
 *  dated template (datePrefill on + template set + iata + both valid ISO dates) → airport page → generic landing.
 *  Pure: config passed explicitly. Dates are raw ISO (HE's dated URL uses YYYY-MM-DD). */
export function composeParkingUed(args: {
  ap: HeAirportParkingConfig | undefined;
  airportSlug: string;
  iata?: string;
  dropOff?: string;
  returnDate?: string;
  fallbackLandingUrl?: string;
}): { ued: string; datePrefilled: boolean } {
  const { ap, airportSlug, iata, dropOff, returnDate, fallbackLandingUrl } = args;
  if (!ap) {
    return { ued: fallbackLandingUrl ?? "https://www.holidayextras.com/airport-parking.html", datePrefilled: false };
  }
  const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
  const slug = ap.slugOverrides[airportSlug] ?? airportSlug;
  if (ap.datePrefill && ap.dateUrlTemplate && iata && dropOff && returnDate && ISO_DATE.test(dropOff) && ISO_DATE.test(returnDate)) {
    const ued = ap.dateUrlTemplate
      .replace(/\{iata\}/g, iata)
      .replace(/\{dropOff\}/g, dropOff)
      .replace(/\{returnDate\}/g, returnDate);
    return { ued, datePrefilled: true };
  }
  return { ued: ap.urlPattern.replace(/\{slug\}/g, slug), datePrefilled: false };
}

/** Build a tracked AWIN deep link for a parking search: resolves the active parking partner
 *  (single best HE-group brand for the airport — currently Holiday Extras), composes the `ued`
 *  via the fallback ladder, and tags the click with a `-search` surface suffix. Returns null only
 *  if the parking slot is inactive or has no active partner. */
export function buildParkingSearchUrl(args: {
  airportSlug: string;
  iata?: string;
  dropOff?: string;
  returnDate?: string;
}): { url: string; partnerName: string; datePrefilled: boolean } | null {
  const parkingSlotId: SlotId = "parking-prebook";
  const slot = config.slots.find((s) => s.id === parkingSlotId);
  if (!slot?.active) return null;
  for (const partnerId of slot.partnerIds) {
    const partner = config.partners[partnerId];
    if (partner?.active && partner.awinmid) {
      const { ued, datePrefilled } = composeParkingUed({
        ap: partner.airportParking,
        airportSlug: args.airportSlug,
        iata: args.iata,
        dropOff: args.dropOff,
        returnDate: args.returnDate,
        fallbackLandingUrl: partner.landingUrl,
      });
      return {
        url: buildAwinLink({
          awinmid: partner.awinmid,
          publisherId: config.awin.publisherId,
          airportSlug: args.airportSlug,
          ued,
          clickrefSuffix: "search",
        }),
        partnerName: partner.name,
        datePrefilled,
      };
    }
  }
  return null;
}

/** Validate a search date range against today (all ISO `YYYY-MM-DD`). Returns an error message
 *  or null when valid. Pure — the caller passes `todayIso` so it stays deterministic/testable. */
export function validateSearchDates(dropOff: string, returnDate: string, todayIso: string): string | null {
  if (!dropOff || !returnDate) return "Pick both dates";
  if (dropOff < todayIso) return "Drop-off can't be in the past";
  if (returnDate <= dropOff) return "Return must be after drop-off";
  return null;
}
