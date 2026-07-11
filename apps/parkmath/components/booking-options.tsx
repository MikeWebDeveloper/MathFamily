import { goLinkMerchant, resolveAllParkingMerchants } from "../lib/partners";
import type { ParkingCtaModel } from "../lib/parking-content";

export function BookingOptions({
  airportName,
  airportSlug,
  officialUrl,
  price,
  days,
  cta,
  surface = "parking",
}: {
  airportName: string;
  airportSlug: string;
  officialUrl: string;
  /** Optional: cheapest pre-book price in pence, shown once above the options (a guide figure).
   *  Ignored when `cta` is provided (the model decides what is honest to show). */
  price?: number;
  /** Optional: duration in days, shown beside the price figure. */
  days?: number;
  /** Honest CTA view-model. When provided, it is the single source of truth for the price and the
   *  "save £X vs gate" claim — it suppresses the price entirely in the gate-only case so we never
   *  show a drive-up gate price dressed up as a "from" pre-book figure. */
  cta?: ParkingCtaModel;
  /** Attribution surface for this CTA — flows into BOTH the /go click-log line AND the AWIN
   *  `clickref` suffix (parkmath-{airport}-{surface}) so parking-spoke clicks are distinguishable
   *  from hub / drop-off / options clicks. Defaults to "parking" (this is the parking surface);
   *  the options page passes "options". Never "" — an empty surface makes every booking-options
   *  click attribution-blind. */
  surface?: string;
}) {
  // Multi-option, commission-blind presentation: every joined merchant that GENUINELY serves this
  // airport (verified per-airport link) becomes its own tracked option. Ordering is alphabetical by
  // merchant name — never by commission. A merchant with no verified page here is omitted (fail-closed),
  // so we never render a broken/misleading affiliate link.
  const merchants = resolveAllParkingMerchants(airportSlug, surface);
  const hasAffiliate = merchants.length > 0;
  // General "official operator pinned first" mechanism (see partners.ts isOfficialOperator doc
  // comment): any partner flagged isOfficialOperator that genuinely serves this airport is pinned
  // first, and the disclosure below names it explicitly instead of claiming pure alphabetical order.
  // A no-op for every airport without a covering official-operator partner.
  const pinnedPrimary = merchants.find((m) => m.isPinnedPrimary) ?? null;

  // A 10%-off / "up to 25% Gatwick" promo is a Holiday Extras offer only — never claim it for others.
  const HE_DISCOUNT_NOTE =
    "10% off most Holiday Extras car parks — up to 25% at Gatwick (Meet & Greet North). Discount applied automatically, no code.";

  // Resolve the honest guide price to surface ONCE (not per-merchant — the figure is from our own
  // dataset, not a specific merchant's quote): prefer the cta model (which suppresses the gate-only
  // price), and fall back to the legacy price/days props for callers that don't pass a model.
  const ctaPrice = cta ? cta.pricePence ?? undefined : price;
  const ctaDays = cta ? cta.days : days;
  const savingPence = cta?.state === "saving" ? cta.savingVsGatePence : null;

  const priceStr =
    ctaPrice !== undefined && ctaDays !== undefined
      ? `from £${(ctaPrice / 100).toFixed(2)} for ${ctaDays} day${ctaDays === 1 ? "" : "s"}`
      : ctaPrice !== undefined
        ? `from £${(ctaPrice / 100).toFixed(2)}`
        : null;

  // Honest saving line: only when a real pre-book price beats the drive-up gate for this duration.
  const savingStr =
    savingPence !== null && savingPence !== undefined && cta?.gatePence
      ? `Save £${(savingPence / 100).toFixed(2)} vs the £${(cta.gatePence / 100).toFixed(2)} drive-up gate price`
      : null;

  return (
    <section aria-label="Your booking options" className="space-y-4 rounded-card border border-ink/10 bg-surface p-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-ink">Your booking options</h2>
        <p className="text-sm text-ink-muted">
          Our ranking above uses only the airport&apos;s own published prices — it isn&apos;t affected by commission.
        </p>
      </div>

      {hasAffiliate ? (
        <>
          <div className="rounded-card border border-brand-accent/30 bg-blue-50 dark:bg-brand-accent/[0.08] dark:border-brand-accent/20 p-4 space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-ink">
                  Pre-book &amp; save{merchants.length > 1 ? " — compare our partners" : ` with ${merchants[0]!.partnerName}`}
                </h3>
                <span className="rounded border border-ink-muted/40 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Ad</span>
              </div>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink">
                <li>✓ Free cancellation (cancel to arrival)</li>
                <li>✓ No code needed</li>
                <li>✓ Compare every car park in one place</li>
              </ul>
              {savingStr ? (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-positive/10 px-3 py-1 text-sm font-semibold text-positive">
                  <span aria-hidden>✓</span>
                  {savingStr}
                </p>
              ) : null}
              {/* Affiliate disclosure — calm, honest, BEFORE the links; states the ordering truthfully.
                  Alphabetical by default; when an official-operator pin is in effect (see
                  `pinnedPrimary` above), names it explicitly and says why, rather than claiming pure
                  alphabetical order on the one airport where that would no longer be true. */}
              <p className="mt-2 text-xs text-ink-muted">
                {pinnedPrimary ? (
                  <>
                    We earn a commission if you book through these links. We show every partner that
                    serves {airportName}. {pinnedPrimary.partnerName} is shown first because it&apos;s{" "}
                    {airportName}&apos;s own official operator; every other option below is ordered
                    alphabetically — never by payout — and this never changes our ranking or which park
                    we show as cheapest.
                  </>
                ) : (
                  <>
                    We earn a commission if you book through these links. We show every partner that serves{" "}
                    {airportName}, ordered alphabetically — the order is not influenced by payout, and it
                    never changes our ranking or which park we show as cheapest.
                  </>
                )}
              </p>
            </div>

            <ul className="space-y-3">
              {merchants.map((m) => {
                const isHolidayExtras = m.partnerName === "Holiday Extras";
                return (
                  <li
                    key={m.partnerId}
                    className="rounded-card border border-ink/10 bg-card p-3 sm:flex sm:items-center sm:justify-between sm:gap-4"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{m.partnerName}</p>
                      <p className="mt-0.5 text-sm text-ink-muted">
                        {isHolidayExtras
                          ? HE_DISCOUNT_NOTE
                          : `Compare on-airport, Park & Ride and Meet & Greet at ${m.partnerName} — free cancellation, no code needed.`}{" "}
                        <a
                          href={m.termsUrl ?? officialUrl}
                          rel="noopener noreferrer"
                          target="_blank"
                          className="underline underline-offset-4"
                        >
                          Terms ↗
                        </a>
                      </p>
                    </div>
                    <a
                      href={goLinkMerchant(surface, airportSlug, m.partnerId)}
                      rel="sponsored noopener noreferrer"
                      target="_blank"
                      className="mt-3 inline-block whitespace-nowrap rounded-card bg-brand-accent px-4 py-2 text-sm font-semibold text-white sm:mt-0 sm:shrink-0"
                    >
                      Book parking with {m.partnerName} ↗
                    </a>
                  </li>
                );
              })}
            </ul>

            {priceStr ? (
              <p className="text-xs text-ink-muted">
                Our cheapest tracked pre-book price for {airportName} is {priceStr} — actual prices vary by
                partner and date.
              </p>
            ) : null}
          </div>

          <div className="rounded-card border border-ink/10 bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-ink">Book direct with the airport</h3>
              <span className="rounded border border-ink-muted/40 px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">Official site</span>
            </div>
            <p className="mt-1 text-sm text-ink-muted">{airportName} official car parks.</p>
            <a
              href={officialUrl}
              rel="noopener noreferrer"
              target="_blank"
              className="mt-3 inline-block rounded-card border border-brand-accent px-4 py-2 text-sm font-semibold text-brand-accent"
            >
              Go to airport site ▸
            </a>
          </div>
        </>
      ) : (
        <div className="rounded-card border border-ink/10 bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-ink">Book direct with the airport</h3>
            <span className="rounded border border-ink-muted/40 px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">Official site</span>
          </div>
          <p className="mt-1 text-sm text-ink-muted">{airportName} official car parks.</p>
          <a
            href={officialUrl}
            rel="noopener noreferrer"
            target="_blank"
            className="mt-3 inline-block rounded-card border border-brand-accent px-4 py-2 text-sm font-semibold text-brand-accent"
          >
            Go to airport site ▸
          </a>
        </div>
      )}
    </section>
  );
}
