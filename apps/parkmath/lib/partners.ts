import partnersJson from "./partners.json";

export type SlotId = "parking-prebook" | "lounge-membership";
export type HeProduct = "parking" | "lounge" | "hotels" | "transfers";

export interface ResolvedSlot {
  kind: "affiliate" | "official";
  url: string;
  label: string;
  partnerName: string | null;
  /** Merchant terms/landing URL for the "Terms ↗" link — merchant-specific, never hardcoded. */
  termsUrl: string | null;
  disclosureRequired: boolean;
}

interface AirportParkingUrlConfig {
  /** HE-style: one URL template with a {slug} placeholder (slugs verified to match the merchant). */
  template?: string;
  /** APH-style: explicit per-airport map (APH's URL structure is irregular — some /<slug>-airport-parking.html,
   *  some /<slug>-airport/parking/ — so each is verified individually; absence ⇒ fail closed for that airport). */
  byAirport?: Record<string, string>;
}

interface PartnerConfig {
  name: string;
  awinmid: string | null;
  active: boolean;
  termsUrl?: string;
  landingUrl?: string;
  products?: Record<string, { url: string; label: string }>;
  airportParkingUrl?: AirportParkingUrlConfig;
}

interface SlotConfig {
  id: string;
  partnerIds: string[];
  active: boolean;
  /** Per-airport merchant preference order, overriding the default `partnerIds` for that airport.
   *  Lets us serve a different (e.g. higher-coverage / more reputable) merchant on specific airports
   *  while keeping the incumbent everywhere else — diversification without breaking existing links.
   *  Drives the SINGLE-merchant surfaces only (resolveParkingMerchant/resolveSlot — the comparison-hub
   *  CTA and the drop-off "bridge" CTA). Deliberately NOT consulted by resolveAllParkingMerchants (the
   *  multi-option booking block) — see the 2026-06-24 "retire single-primary" decision in
   *  company/boards/parkmath-board.md §0a. */
  airportOverrides?: Record<string, string[]>;
  /** Mike-directed, single-airport "pin to front" for the ALPHABETICAL multi-option list
   *  (resolveAllParkingMerchants only). An explicit, narrow, visible exception to the otherwise
   *  commission-blind alphabetical ordering — scoped to exactly the airport keys listed here; every
   *  airport absent from this map is fully alphabetical and completely unaffected. Added 2026-07-11:
   *  Heathrow Airport Parking (mid 2365, the official Heathrow-operated merchant) pinned first at
   *  Mike's explicit instruction. Not a reopening of commission-based ranking generally — see
   *  company/boards/parkmath-board.md 2026-07-11 "Heathrow primary" entry for the full rationale. */
  primaryOverrides?: Record<string, string>;
}

const config = partnersJson as unknown as {
  awin: { publisherId: string };
  partners: Record<string, PartnerConfig>;
  slots: SlotConfig[];
};

/** Build a bare, fully-tracked AWIN deep link. `clickref` tags each click with its airport (plus an
 *  optional surface suffix for per-page/product attribution). `ued` (optional) is percent-encoded by
 *  URLSearchParams, so a destination carrying its own query string can never leak into the query.
 *  Works for any AWIN merchant — awinmid selects the merchant, awinaffid is always our publisher id. */
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

/** Resolve a partner's verified per-airport parking landing URL, or null when the partner has no
 *  page for that airport (the fail-closed gate). HE uses a uniform {slug} template; APH uses an
 *  explicit verified map. Returns null for non-airport contexts (slug "home"/empty) so callers fall
 *  back to the merchant's generic category page. */
export function airportParkingUrl(partnerId: string, airportSlug: string): string | null {
  if (!airportSlug || airportSlug === "home") return null;
  const cfg = config.partners[partnerId]?.airportParkingUrl;
  if (!cfg) return null;
  if (cfg.byAirport) return cfg.byAirport[airportSlug] ?? null;
  if (cfg.template) return cfg.template.replace("{slug}", airportSlug);
  return null;
}

/** Back-compat: Holiday Extras' verified per-airport parking page. Thin wrapper over
 *  airportParkingUrl("holiday-extras", slug); kept so existing imports/tests keep working. */
export function heAirportParkingUrl(airportSlug: string): string | null {
  return airportParkingUrl("holiday-extras", airportSlug);
}

/** The ordered list of partner ids that may serve a slot for a given airport: the slot's
 *  airportOverrides entry if present, else the default partnerIds. */
function partnerOrderFor(slot: SlotConfig, airportSlug: string): string[] {
  return slot.airportOverrides?.[airportSlug] ?? slot.partnerIds;
}

/** Resolve a product to a tracked deep link for a *specific* partner, or null when that partner is
 *  inactive or has no configured URL for the product. `clickrefSuffix` distinguishes the surface
 *  (e.g. "dropoff", "lounge", "dropoff-hotels"). For "parking" the destination is the partner's
 *  verified per-airport page (or null ⇒ fail closed for that airport); other products use the
 *  partner's generic category page. */
export function resolvePartnerProduct(
  partnerId: string,
  product: HeProduct,
  airportSlug: string,
  clickrefSuffix: string,
): { url: string; productLabel: string; partnerName: string; termsUrl: string | null } | null {
  const partner = config.partners[partnerId];
  const entry = partner?.products?.[product];
  if (!partner?.active || !partner.awinmid || !entry) return null;
  // Parking deep-links to the airport's own page on the merchant. If the merchant has no verified
  // page for this airport, fail closed (null) rather than dump the visitor on a generic category page
  // under a per-airport CTA — except off-airport contexts (slug "home"), which intentionally use the
  // generic page.
  let ued: string;
  if (product === "parking") {
    const perAirport = airportParkingUrl(partnerId, airportSlug);
    if (!perAirport && airportSlug && airportSlug !== "home") return null;
    ued = perAirport ?? entry.url;
  } else {
    ued = entry.url;
  }
  return {
    url: buildAwinLink({ awinmid: partner.awinmid, publisherId: config.awin.publisherId, airportSlug, ued, clickrefSuffix }),
    productLabel: entry.label,
    partnerName: partner.name,
    termsUrl: partner.termsUrl ?? null,
  };
}

/** Resolve a Holiday Extras product to a tracked deep link (back-compat wrapper). Used by the
 *  HE-specific surfaces (Travel extras grid, the HE card). Returns null when HE is inactive or the
 *  product has no configured URL. */
export function resolveHeProduct(
  product: HeProduct,
  airportSlug: string,
  clickrefSuffix: string,
): { url: string; productLabel: string } | null {
  const r = resolvePartnerProduct("holiday-extras", product, airportSlug, clickrefSuffix);
  return r ? { url: r.url, productLabel: r.productLabel } : null;
}

/** Resolve the parking merchant for an airport: walk the slot's per-airport partner order and return
 *  the first active partner that has a live parking deep link for that airport. This is the
 *  diversification entry point — the airport's `airportOverrides` order if set (e.g. Heathrow Airport
 *  Parking at Heathrow, APH on its other override airports), else Holiday Extras, fail-closed if none
 *  has a live link. clickrefSuffix is the surface (e.g. "hub", "dropoff"). */
export function resolveParkingMerchant(
  airportSlug: string,
  clickrefSuffix: string,
): { url: string; partnerName: string; termsUrl: string | null; partnerId: string } | null {
  const slot = config.slots.find((s) => s.id === "parking-prebook");
  if (!slot?.active) return null;
  for (const partnerId of partnerOrderFor(slot, airportSlug)) {
    const r = resolvePartnerProduct(partnerId, "parking", airportSlug, clickrefSuffix);
    if (r) return { url: r.url, partnerName: r.partnerName, termsUrl: r.termsUrl, partnerId };
  }
  return null;
}

export interface ParkingMerchantOption {
  partnerId: string;
  partnerName: string;
  /** The exact tracked AWIN deep link (also rebuilt server-side by the /go route — byte-identical). */
  url: string;
  termsUrl: string | null;
  /** True for the one option pinned to the front by `slot.primaryOverrides` for this airport (see
   *  that field's doc comment) — false for every option on every airport without such an entry.
   *  Callers use this to phrase the on-page disclosure honestly instead of claiming pure alphabetical
   *  order on the one airport where that claim would no longer be true. */
  isPinnedPrimary: boolean;
}

/** Resolve EVERY joined, active merchant that genuinely serves this airport (has a verified per-airport
 *  parking link), each as its own tracked option — the multi-option, commission-blind presentation.
 *
 *  Honesty contract:
 *   - COVERAGE: a merchant only appears for an airport where `resolvePartnerProduct(...,"parking",...)`
 *     returns a real per-airport deep link (fail-closed). A merchant with no verified page for the
 *     airport is omitted — never a broken/misleading link.
 *   - ORDERING is commission-blind: options are sorted ALPHABETICALLY by merchant name, a neutral
 *     criterion with no relation to payout. (We do NOT consult `airportOverrides` ordering here — that
 *     was the single-primary preference order; multi-option presentation must not inherit a ranking.)
 *   - EXCEPTION (Mike-directed, 2026-07-11, Heathrow only): if `slot.primaryOverrides` names a partner
 *     for this airport, that one partner is pinned to the front; every other option keeps its
 *     alphabetical relative order. Airports absent from `primaryOverrides` are entirely unaffected —
 *     this is a no-op for every airport except the ones explicitly listed. Each returned option's
 *     `isPinnedPrimary` flag tells callers when this applies, so the on-page disclosure can say so
 *     honestly instead of claiming pure alphabetical order where that's no longer true. See
 *     company/boards/parkmath-board.md 2026-07-11 "Heathrow primary" entry for the rationale.
 *
 *  Returns [] when the slot is inactive or no merchant covers the airport (caller falls back to the
 *  official-site option only). */
export function resolveAllParkingMerchants(
  airportSlug: string,
  clickrefSuffix: string,
): ParkingMerchantOption[] {
  const slot = config.slots.find((s) => s.id === "parking-prebook");
  if (!slot?.active) return [];
  // Off-airport contexts (slug "home"/empty) have no per-airport options block — return [] so callers
  // fall back to the official/generic option rather than listing every merchant's generic page.
  if (!airportSlug || airportSlug === "home") return [];
  // Consider every partner that could ever serve the slot (default list ∪ all override lists), so a
  // merchant is shown wherever it genuinely covers the airport — not only where it was the primary.
  const candidates = new Set<string>(slot.partnerIds);
  for (const list of Object.values(slot.airportOverrides ?? {})) {
    for (const id of list) candidates.add(id);
  }
  const primaryId = slot.primaryOverrides?.[airportSlug];
  const options: ParkingMerchantOption[] = [];
  for (const partnerId of candidates) {
    const r = resolvePartnerProduct(partnerId, "parking", airportSlug, clickrefSuffix);
    if (r) options.push({ partnerId, partnerName: r.partnerName, url: r.url, termsUrl: r.termsUrl, isPinnedPrimary: partnerId === primaryId });
  }
  // Commission-blind, transparent ordering: alphabetical by merchant name.
  options.sort((a, b) => a.partnerName.localeCompare(b.partnerName));
  // Narrow, explicit, per-airport exception (see doc comment above): pin the named primary to the
  // front. A no-op unless this airport has a primaryOverrides entry AND that partner is present.
  if (primaryId) {
    const idx = options.findIndex((o) => o.partnerId === primaryId);
    if (idx > 0) {
      const primary = options.splice(idx, 1)[0]!;
      options.unshift(primary);
    }
  }
  return options;
}

// ─── First-party affiliate-click measurement ────────────────────────────────
// Components render a first-party `/go/...` path instead of the raw awin1.com link. The redirect
// route (app/go/[airport]/[target]/route.ts) records a lightweight click event server-side, then
// 302s to the *exact* AWIN deep link rebuilt here via the same resolvers — so awinmid/awinaffid/
// clickref/ued are byte-identical and AWIN attribution is never broken. No third-party script.

/** The set of redirect targets the /go route understands. A bare HeProduct (parking/lounge/hotels/
 *  transfers) resolves the per-airport merchant (parking) or HE (other products); "parking-prebook"
 *  resolves via resolveSlot (the booking-options "Pre-book & save" CTA, which uses the slot); a
 *  `parking:<partnerId>` form targets ONE specific merchant's per-airport parking deep link (the
 *  multi-option booking block — each merchant option is its own tracked redirect). */
export type GoTarget = HeProduct | "parking-prebook" | `parking:${string}`;

/** Build the first-party redirect path a CTA links to. `surface` becomes the clickref suffix once
 *  the route rebuilds the AWIN link, so per-page/product attribution is preserved end to end.
 *  e.g. goLink("dropoff", "gatwick", "parking") → "/go/gatwick/parking?s=dropoff".
 *  Per-merchant: goLink("parking", "gatwick", "parking:aph") → "/go/gatwick/parking%3Aaph?s=parking".
 *  Convenience: pass a partnerId via the `parking:` prefix to deep-link one specific merchant. */
export function goLink(surface: string, airportSlug: string, target: GoTarget): string {
  const path = `/go/${encodeURIComponent(airportSlug)}/${encodeURIComponent(target)}`;
  return surface ? `${path}?s=${encodeURIComponent(surface)}` : path;
}

/** The /go path that deep-links one specific merchant's per-airport parking page (multi-option block). */
export function goLinkMerchant(surface: string, airportSlug: string, partnerId: string): string {
  return goLink(surface, airportSlug, `parking:${partnerId}` as GoTarget);
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
  if (target === "parking") {
    // Per-airport merchant (this airport's airportOverrides order, else Holiday Extras), fail-closed.
    const r = resolveParkingMerchant(airportSlug, surface);
    return r ? { url: r.url } : null;
  }
  if (target.startsWith("parking:")) {
    // Multi-option: one specific merchant's per-airport parking deep link. Fail-closed (404) if that
    // merchant has no verified page for this airport — never a broken/misleading affiliate redirect.
    const partnerId = target.slice("parking:".length);
    const r = resolvePartnerProduct(partnerId, "parking", airportSlug, surface);
    return r ? { url: r.url } : null;
  }
  if (target === "lounge" || target === "hotels" || target === "transfers") {
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

/** Resolve a slot to either the first active AWIN partner for this airport (affiliate mode) or the
 *  official fallback link. Consults the slot's per-airport override order first, so e.g. Gatwick
 *  serves APH while everywhere else serves Holiday Extras. Fail-closed: a partner without a live
 *  per-airport parking link is skipped (→ next partner → official). */
export function resolveSlot(slotId: SlotId, airportSlug: string, officialUrl: string): ResolvedSlot {
  const slot = config.slots.find((s) => s.id === slotId);
  if (slot?.active) {
    for (const partnerId of partnerOrderFor(slot, airportSlug)) {
      const partner = config.partners[partnerId];
      if (!partner?.active || !partner.awinmid) continue;
      // For the parking slot, require a verified per-airport landing URL (fail-closed). For other
      // slots (non per-airport), fall back to the partner's landingUrl.
      const isParking = slotId === "parking-prebook";
      const perAirport = isParking ? airportParkingUrl(partnerId, airportSlug) : null;
      if (isParking && !perAirport && airportSlug && airportSlug !== "home") continue;
      const ued = perAirport ?? partner.landingUrl;
      return {
        kind: "affiliate",
        url: buildAwinLink({ awinmid: partner.awinmid, publisherId: config.awin.publisherId, airportSlug, ued }),
        label: `Pre-book & compare prices with ${partner.name}`,
        partnerName: partner.name,
        termsUrl: partner.termsUrl ?? null,
        disclosureRequired: true,
      };
    }
  }
  return {
    kind: "official",
    url: officialUrl,
    label: "Check live prices on the official site",
    partnerName: null,
    termsUrl: null,
    disclosureRequired: false,
  };
}
