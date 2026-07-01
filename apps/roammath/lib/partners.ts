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

// ---------------------------------------------------------------------------
// First-party affiliate-click measurement (/go route) — ported pattern from ParkMath/LoungeMath.
// Components link to a first-party `/go/<countrySlug>/<target>` path instead of the raw affiliate
// URL; the redirect route (app/go/[country]/[target]/route.ts) rebuilds the exact destination here
// via resolveGoTarget, so awinmid/awinaffid/clickref/destination stay byte-identical to what the
// component would have linked to directly.
//
// Unlike ParkMath's per-airport /go (which 404s when no merchant serves that specific airport —
// there is genuinely nothing to link to), RoamMath's categories (eSIM/car-hire/travel-insurance) are
// generic across every country. So resolveGoTarget only returns null for a *malformed/unknown*
// target (the open-redirect guard) — a recognized category with no active partner falls back to a
// real, non-tracked "official site" destination instead, matching the task brief's fail-closed
// philosophy: never a fabricated/broken affiliate link, but also never a dead end.
// ---------------------------------------------------------------------------

/** The set of redirect targets the /go route understands. `esim:<id>` picks one eSIM provider;
 *  a bare "car-hire"/"travel-insurance" resolves the first active partner in priority order (mirrors
 *  resolveCarHireSlot/resolveTravelInsuranceSlot); `car-hire:<id>`/`travel-insurance:<id>` target one
 *  specific AWIN partner (for a future multi-option UI, same shape as ParkMath's `parking:<id>`). */
export type GoTarget =
  | `esim:${string}`
  | "car-hire"
  | `car-hire:${string}`
  | "travel-insurance"
  | `travel-insurance:${string}`;

/** Build the first-party redirect path a CTA links to. `surface` becomes the click log's surface
 *  field once the route resolves the target (page-placement attribution, e.g. "hub").
 *  e.g. goLink("hub", "spain", "esim:airalo") -> "/go/spain/esim%3Aairalo?s=hub". */
export function goLink(surface: string, countrySlug: string, target: GoTarget): string {
  const path = `/go/${encodeURIComponent(countrySlug)}/${encodeURIComponent(target)}`;
  return surface ? `${path}?s=${encodeURIComponent(surface)}` : path;
}

// Plain, non-tracked homepages used ONLY as the /go fallback destination when a category is
// recognized but has no active partner right now (true for every partner as of 2026-07 — all are
// `active: false` in partners.json pending AWIN/Impact approval, per lib/partners.json's trackingNotes).
const ESIM_OFFICIAL_HOMEPAGE: Record<string, string> = {
  airalo: "https://www.airalo.com",
  saily: "https://saily.com",
  holafly: "https://esim.holafly.com",
};

const AWIN_CATEGORY_HOMEPAGE: Record<"car-hire" | "travel-insurance", Record<string, string>> = {
  "car-hire": { discoverCars: "https://www.discovercars.com", rentalCars: "https://www.rentalcars.com" },
  "travel-insurance": {
    coverForYou: "https://www.coverforyou.com",
    holidayExtras: "https://www.holidayextras.com/travel-insurance.html",
  },
};

// Same priority order as resolveCarHireSlot/resolveTravelInsuranceSlot, so a bare "car-hire" or
// "travel-insurance" /go target lands on the identical partner those functions would pick.
const AWIN_CATEGORY_ORDER: Record<"car-hire" | "travel-insurance", string[]> = {
  "car-hire": ["discoverCars", "rentalCars"],
  "travel-insurance": ["coverForYou", "holidayExtras"],
};

/** Resolve one AWIN category (car-hire / travel-insurance), optionally pinned to one partner id.
 *  Returns null only for a genuinely unknown partner id (the open-redirect guard) — a known,
 *  inactive partner (or an inactive bare category) falls back to that partner's plain homepage. */
function resolveAwinCategoryTarget(
  category: "car-hire" | "travel-insurance",
  partnerId: string | null,
  countrySlug: string
): { url: string; isAffiliate: boolean } | null {
  const group = partners[category];
  const order = partnerId ? [partnerId] : AWIN_CATEGORY_ORDER[category];
  for (const id of order) {
    const partner = group[id as keyof typeof group];
    if (partner?.active && partner.awinmid && partner.destinationTemplate.startsWith("http")) {
      const destinationUrl = buildAffiliateUrl(partner.destinationTemplate, countrySlug, category);
      const clickref = `${category}-${countrySlug}`;
      return {
        url: buildAwinLink({ awinmid: partner.awinmid, publisherId: partners.awin.publisherId, clickref, destinationUrl }),
        isAffiliate: true,
      };
    }
  }
  const fallbackId = partnerId ?? AWIN_CATEGORY_ORDER[category][0];
  const homepage = fallbackId ? AWIN_CATEGORY_HOMEPAGE[category][fallbackId] : undefined;
  if (!homepage) return null; // unknown partner id — reject rather than open-redirect
  return { url: homepage, isAffiliate: false };
}

/** Server-side: rebuild the exact destination for a /go redirect. Returns null only when `target`
 *  doesn't match any known shape (route then 404s) — reused by the /go route so the destination is
 *  identical to what the CTA components would have linked to directly. */
export function resolveGoTarget(
  target: string,
  countrySlug: string
): { url: string; isAffiliate: boolean } | null {
  if (target.startsWith("esim:")) {
    const providerId = target.slice("esim:".length);
    const partner = partners.esim[providerId];
    if (!partner) return null; // unknown provider id — reject rather than open-redirect
    const officialUrl = ESIM_OFFICIAL_HOMEPAGE[providerId] ?? "";
    if (!officialUrl && !(partner.active && partner.deeplinkTemplate.startsWith("http"))) return null;
    const slot = resolveSlot(partner.name, countrySlug, officialUrl);
    return { url: slot.url, isAffiliate: slot.kind === "affiliate" };
  }
  if (target === "car-hire" || target.startsWith("car-hire:")) {
    const partnerId = target === "car-hire" ? null : target.slice("car-hire:".length);
    return resolveAwinCategoryTarget("car-hire", partnerId, countrySlug);
  }
  if (target === "travel-insurance" || target.startsWith("travel-insurance:")) {
    const partnerId = target === "travel-insurance" ? null : target.slice("travel-insurance:".length);
    return resolveAwinCategoryTarget("travel-insurance", partnerId, countrySlug);
  }
  return null;
}
