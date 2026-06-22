/**
 * INERT commercial slot — deliberately non-functional.
 *
 * COMPLIANCE (hard rule for RentMath):
 *  - There is no strong, clean affiliate "green rail" in UK renting, so this slot ships
 *    INERT: it renders a quiet "coming soon" placeholder with NO outbound link, NO affiliate
 *    URL, and NO tracking. It is a layout reservation, not a live ad.
 *  - Contents / tenant insurance is an AMBER category (FCA-regulated general insurance). It is
 *    therefore mentioned ONLY as inert, informational text — never as a live affiliate link,
 *    never a quote form, never an FCA-red rail. Do NOT wire any insurance affiliate here without
 *    Legal/Compliance sign-off and the proper FCA introducer permissions.
 *
 * This component takes no link props on purpose — there is nothing to click.
 */

interface InertAffiliateSlotProps {
  /** Optional context line, e.g. the town name, for copy only. No link is produced. */
  context?: string;
}

export function InertAffiliateSlot({ context }: InertAffiliateSlotProps) {
  return (
    <aside
      aria-label="Commercial slot (coming soon)"
      className="rounded-card border border-dashed border-ink/15 bg-surface p-4 text-sm text-ink-muted"
    >
      <p className="font-medium text-ink">Tools &amp; offers — coming soon</p>
      <p className="mt-1">
        We&apos;re building independent, clearly-labelled tools to help renters
        {context ? ` in ${context}` : ""} budget — never an ad dressed up as advice.
      </p>
      <p className="mt-2 text-xs">
        Note: contents insurance and similar products are regulated and are not yet offered here.
        Nothing on this page is a recommendation to buy any financial product, and nothing here is
        financial advice.
      </p>
    </aside>
  );
}
