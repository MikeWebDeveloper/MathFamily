import partnersJson from "./partners.json";

/**
 * Inert affiliate slot resolver — the GREEN rail (solar / heat-pump lead-gen +
 * energy switching). Every partner ships `active: false` with an empty deeplink,
 * so resolveSlot ALWAYS returns an inert "coming soon" slot in this MVP. No live
 * merchant IDs are present. A slot only becomes live when a partner is flipped
 * active AND given a real https deeplink (gated — a later, deliberate change).
 *
 * COMPLIANCE: only green/energy categories here — NO FCA-regulated rails
 * (mortgages, insurance, pensions, credit, funeral plans).
 */

export type PartnerCategory = "solar" | "heat-pump" | "switching";

export interface PartnerConfig {
  name: string;
  category: PartnerCategory;
  active: boolean;
  deeplinkTemplate: string;
  trackingNote: string;
}

export interface ResolvedSlot {
  kind: "affiliate" | "inert";
  /** Present only for a live affiliate slot. Inert slots have no outbound URL. */
  url: string | null;
  label: string;
  partnerName: string | null;
  category: PartnerCategory;
  disclosureRequired: boolean;
}

export function buildAffiliateUrl(template: string, regionSlug: string): string {
  const clickref = `energy-${regionSlug}`;
  return template.replaceAll("{regionSlug}", regionSlug).replaceAll("{clickref}", clickref);
}

const CATEGORIES: readonly PartnerCategory[] = ["solar", "heat-pump", "switching"];

function isCategory(value: string): value is PartnerCategory {
  return (CATEGORIES as readonly string[]).includes(value);
}

/**
 * /go deeplink resolver — wired into the shared `createGoRoute` from `@mathfamily/engine`.
 *
 * A CTA links to `/go/<category>[/<regionSlug>]?s=<surface>`. The catch-all path `parts` are
 * `[category, regionSlug?]`. We reuse the inert `resolveSlot` resolver as the single source of
 * truth, so this returns a LIVE affiliate url only once a partner is flipped active with a real
 * https deeplink. While every partner is inert it returns `null`, and `createGoRoute` then logs
 * the click intent and 302s back to an on-site fallback (never a 404 / bare affiliate link).
 *
 * `surface` is recorded by `createGoRoute` for attribution; it doesn't change the destination.
 */
export function resolveDeeplink(parts: string[], _surface: string): string | null {
  const [category, regionSlug = "london"] = parts;
  if (!category || !isCategory(category)) return null;
  const slot = resolveSlot(category, regionSlug);
  return slot.kind === "affiliate" ? slot.url : null;
}

export function resolveSlot(category: PartnerCategory, regionSlug: string): ResolvedSlot {
  const partner = (partnersJson.partners as Record<string, PartnerConfig>)[
    category === "heat-pump" ? "heatpump" : category
  ];

  const inert: ResolvedSlot = {
    kind: "inert",
    url: null,
    label: "Coming soon",
    partnerName: null,
    category,
    disclosureRequired: false
  };

  if (!partner?.active || !partner.deeplinkTemplate.startsWith("http")) {
    return inert;
  }

  return {
    kind: "affiliate",
    url: buildAffiliateUrl(partner.deeplinkTemplate, regionSlug),
    label: `Get a ${partner.name} quote`,
    partnerName: partner.name,
    category,
    disclosureRequired: true
  };
}
