/**
 * MORTGAGE SLOT — FCA-RED. INERT "coming soon" ONLY.
 *
 * // FCA-RED: requires Head of Legal introducer pre-clear before any activation
 *
 * Mortgages are an FCA-regulated product. MoveMath MUST NOT promote a mortgage product, run a
 * mortgage-broker rail, publish "best mortgage" / rate-comparison content, or capture a mortgage
 * lead. This component is a deliberately dead, non-interactive informational card. There is NO
 * affiliate URL, NO broker link, NO lead form, and NO `active` flag anywhere that could turn it on.
 *
 * Calculating the SDLT figure is fine (public gov.uk data) — but no mortgage product is offered.
 * Activation is gated on a Head of Legal introducer-permission pre-clear; do not wire anything here.
 */

// Hard invariant other modules / tests can assert against. Flipping this to true is NOT enough to
// activate anything — there is intentionally no rail to activate. It exists only to make the
// FCA-red posture explicit and testable.
export const MORTGAGE_RAIL_ACTIVE = false as const;

export function MortgageSlot() {
  return (
    <div
      data-testid="mortgage-slot"
      data-fca-red="true"
      data-rail-active={MORTGAGE_RAIL_ACTIVE ? "true" : "false"}
      className="rounded-card border border-dashed border-ink/15 bg-surface p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">Mortgage</p>
        <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
          Coming soon
        </span>
      </div>
      <p className="mt-1 text-sm text-ink-muted">
        We don&apos;t recommend or compare mortgages. Mortgages are regulated by the Financial Conduct
        Authority — speak to a qualified, FCA-authorised mortgage adviser for advice on borrowing.
      </p>
      {/* No link, no form, no CTA. Intentionally inert. */}
    </div>
  );
}
