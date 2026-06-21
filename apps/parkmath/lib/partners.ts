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

/** Holiday Extras' verified per-airport parking page (`/<slug>-airport-parking.html`). Returns null
 *  for non-airport contexts (e.g. the home page, slug "home") so callers fall back to the generic
 *  category page. Our airport slugs match HE's URL slugs (verified live for all dataset airports). */
export function heAirportParkingUrl(airportSlug: string): string | null {
  if (!airportSlug || airportSlug === "home") return null;
  return `https://www.holidayextras.com/${airportSlug}-airport-parking.html`;
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
      // Parking deep-links to the airport's own HE page; other products use the generic category page.
      ued: product === "parking" ? heAirportParkingUrl(airportSlug) ?? entry.url : entry.url,
      clickrefSuffix,
    }),
    productLabel: entry.label,
  };
}

// ─── First-party affiliate-click measurement ────────────────────────────────
// Components render a first-party `/go/...` path instead of the raw awin1.com link. The redirect
// route (app/go/[airport]/[target]/route.ts) records a lightweight click event server-side, then
// 302s to the *exact* AWIN deep link rebuilt here via the same resolvers — so awinmid/awinaffid/
// clickref/ued are byte-identical and AWIN attribution is never broken. No third-party script.

/** The set of redirect targets the /go route understands. A bare HeProduct (parking/lounge/hotels/
 *  transfers) resolves via resolveHeProduct; "parking-prebook" resolves via resolveSlot (the
 *  booking-options "Pre-book & save" CTA, which uses the slot landing URL). */
export type GoTarget = HeProduct | "parking-prebook";

/** Build the first-party redirect path a CTA links to. `surface` becomes the clickref suffix once
 *  the route rebuilds the AWIN link, so per-page/product attribution is preserved end to end.
 *  e.g. goLink("dropoff", "gatwick", "parking") → "/go/gatwick/parking?s=dropoff". */
export function goLink(surface: string, airportSlug: string, target: GoTarget): string {
  const path = `/go/${encodeURIComponent(airportSlug)}/${encodeURIComponent(target)}`;
  return surface ? `${path}?s=${encodeURIComponent(surface)}` : path;
}

/** Server-side: rebuild the exact AWIN deep link for a /go redirect, or null if the target is
 *  inactive/unknown (route then 404s — never an open redirect, never a bare awin1.com). Reuses the
 *  same resolvers the components used, so the destination is identical to the pre-route behaviour. */
export function resolveGoTarget(
  target: string,
  airportSlug: string,
  surface: string,
): { url: string } | null {
  if (target === "parking-prebook") {
    const r = resolveSlot("parking-prebook", airportSlug, "");
    return r.kind === "affiliate" ? { url: r.url } : null;
  }
  if (target === "parking" || target === "lounge" || target === "hotels" || target === "transfers") {
    const r = resolveHeProduct(target, airportSlug, surface);
    return r ? { url: r.url } : null;
  }
  return null;
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
          url: buildAwinLink({ awinmid: partner.awinmid, publisherId: config.awin.publisherId, airportSlug, ued: slotId === "parking-prebook" ? heAirportParkingUrl(airportSlug) ?? partner.landingUrl : partner.landingUrl }),
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
