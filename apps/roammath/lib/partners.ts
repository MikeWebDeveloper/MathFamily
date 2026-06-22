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

/** Build the first-party `/go` href for an eSIM affiliate CTA. The CTA links to this on-site path;
 *  the shared `/go` route logs the (surface-tagged) click, then resolves it via `resolveDeeplink`
 *  below and 302s to the real deeplink — or, while inert, fails closed back on-site.
 *  Shape: `/go/esim/<providerSlug>/<countrySlug>?s=<surface>`. */
export function buildGoHref(providerName: string, countrySlug: string, surface: string): string {
  const provider = encodeURIComponent(providerName.toLowerCase());
  const country = encodeURIComponent(countrySlug);
  const query = surface ? `?s=${encodeURIComponent(surface)}` : "";
  return `/go/esim/${provider}/${country}${query}`;
}

/** Resolve the `/go` catch-all path parts (+ surface) to an exact eSIM affiliate deeplink, or null
 *  when there is no live deal yet (the inert case → the /go route fails closed to an on-site page).
 *  Parts shape: ["esim", "<providerSlug>", "<countrySlug>"]. Surface is currently informational —
 *  it is logged by the /go route for per-page attribution but does not change the deeplink.
 *
 *  All eSIM partners are gated off in partners.json (`active: false`), so this returns null today;
 *  the wiring is in place so the moment a partner is activated + its deeplinkTemplate filled, the
 *  /go redirect goes live with zero further code change. */
export function resolveDeeplink(parts: string[], _surface: string): string | null {
  const [kind, providerSlug, countrySlug] = parts;
  if (kind !== "esim" || !providerSlug || !countrySlug) return null;

  const partner = (partnersJson.partners as Record<string, PartnerConfig>)[providerSlug.toLowerCase()];
  if (!partner?.active || !partner.deeplinkTemplate.startsWith("http")) return null;

  return buildAffiliateUrl(partner.deeplinkTemplate, countrySlug);
}
