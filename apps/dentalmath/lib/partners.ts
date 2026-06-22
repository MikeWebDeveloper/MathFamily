/**
 * DentalMath partner/affiliate config — INERT BY DESIGN.
 *
 * The dental "green rail" (affiliate revenue) is weak and compliance-sensitive: dental insurance
 * and dental-plan affiliates touch financial-promotion territory, so we keep every slot OFF until
 * The Company has explicitly reviewed and activated a specific, compliant partner. There are NO
 * live merchant IDs, deep links or tracking params in this file. `resolveDentalSlot` always returns
 * an inert "coming soon" slot today.
 */

export interface DentalSlot {
  kind: "inert";
  /** Whether a (future) affiliate link is active. Always false for now. */
  active: boolean;
  /** Short label shown in the inert placeholder. */
  label: string;
}

interface DentalPartnerConfig {
  name: string;
  active: boolean;
  /** Empty until a reviewed, compliant partner is wired. */
  deeplinkTemplate: string;
  note: string;
}

export const DENTAL_PARTNERS: Record<string, DentalPartnerConfig> = {
  "dental-plan": {
    name: "Dental plan / membership",
    active: false,
    deeplinkTemplate: "",
    // TODO: only wire after Head of Legal/Compliance signs off — dental plans can be a
    // regulated financial promotion. No live merchant ID until then.
    note: "inert until a compliant dental-plan affiliate is reviewed and approved",
  },
};

export function resolveDentalSlot(): DentalSlot {
  return { kind: "inert", active: false, label: "Compare dental plans — coming soon" };
}
