import partnersJson from "./partners.json";

export interface ResolvedSlot {
  /** "inert" until a partner is approved + activated; "affiliate" once a live deeplink exists. */
  kind: "inert" | "affiliate";
  url: string | null;
  partnerName: string | null;
  disclosureRequired: boolean;
}

interface PartnerConfig {
  name: string;
  active: boolean;
  deeplinkTemplate: string;
  trackingNote: string;
}

export function buildAffiliateUrl(template: string, projectSlug: string): string {
  const clickref = `lead-${projectSlug}`;
  return template.replaceAll("{projectSlug}", projectSlug).replaceAll("{clickref}", clickref);
}

/**
 * Resolve the trades-lead slot for a project. EVERY partner is currently inactive (no live
 * merchant IDs — gated), so this always returns an INERT slot: the UI shows a "Coming soon"
 * sponsored placeholder, never a live affiliate link. When a partner is approved, set
 * `active: true` + a real `deeplinkTemplate` in partners.json and this flips to "affiliate".
 */
export function resolveSlot(projectSlug: string): ResolvedSlot {
  const inert: ResolvedSlot = { kind: "inert", url: null, partnerName: null, disclosureRequired: false };

  const partners = partnersJson.partners as Record<string, PartnerConfig>;
  const firstActive = Object.values(partners).find(
    (p) => p.active && p.deeplinkTemplate.startsWith("http")
  );
  if (!firstActive) return inert;

  return {
    kind: "affiliate",
    url: buildAffiliateUrl(firstActive.deeplinkTemplate, projectSlug),
    partnerName: firstActive.name,
    disclosureRequired: true,
  };
}

/**
 * Resolve a `/go/<...parts>?s=<surface>` catch-all path to a live trades-lead affiliate deeplink,
 * or `null` when no partner is wired yet. Used by the shared `createGoRoute` handler.
 *
 * The first path part is the project slug (e.g. `/go/single-storey-extension?s=spoke`). Every
 * partner is currently INERT (no live merchant IDs — gated), so this returns `null` and the shared
 * go route fail-closes by 302-ing back to an on-site page (never a 404, never a bare affiliate
 * link). When a partner is approved, flip `active: true` + a real `deeplinkTemplate` in
 * partners.json and this starts returning a live deeplink with no other code change.
 */
export function resolveDeeplink(parts: string[], _surface: string): string | null {
  const projectSlug = parts[0] ?? "";
  if (!projectSlug) return null;
  const slot = resolveSlot(projectSlug);
  return slot.kind === "affiliate" && slot.url ? slot.url : null;
}
