/** Contextual "moment of intent" bridge — a single line that appears right after a page's main
 *  answer/verdict and points onward to the existing merchant block on the SAME page (an in-page
 *  anchor, never a new ranked list). One shared component so `/parking-vs-drop-off/[airport]`,
 *  `/avoid-drop-off-charge/[airport]` and `/blue-badge/[airport]` render the identical honest,
 *  low-key pattern the `/drop-off-charges/[airport]` template already proved out
 *  (`DropOffParkingBridge`) — see company board `parkmath-cro-review-2026-08-02.md`, rec #1/#6.
 *
 *  Deliberately terse: one sentence of factual framing + one link, no invented prices or savings
 *  percentages (guardrail from the brief this shipped against: "factual tone, no invented prices").
 *  Plain `<a href="#id">` (not next/link) — it's an in-page jump, not a route change, so it works
 *  with JS off and needs no client boundary. */
export function BookingBridge({
  text,
  href,
  linkLabel,
}: {
  /** One factual sentence — every number in it must trace to a value already shown on the page. */
  text: string;
  /** In-page anchor, e.g. "#mf-merchant-block". */
  href: string;
  linkLabel: string;
}) {
  return (
    <p className="mf-reveal rounded-card border border-brand-accent/25 bg-brand-accent/5 px-4 py-3 text-sm leading-relaxed text-ink">
      {text}{" "}
      <a href={href} className="font-semibold text-brand-accent underline underline-offset-4 whitespace-nowrap">
        {linkLabel}
      </a>
    </p>
  );
}
