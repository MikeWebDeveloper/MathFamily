import { goLink, resolveSlot, type SlotId } from "../lib/partners";
import type { ParkingCtaModel } from "../lib/parking-content";

const PARKING_SLOT: SlotId = "parking-prebook";

export function BookingOptions({
  airportName,
  airportSlug,
  officialUrl,
  price,
  days,
  cta,
}: {
  airportName: string;
  airportSlug: string;
  officialUrl: string;
  /** Optional: cheapest pre-book price in pence, shown in the affiliate CTA.
   *  Ignored when `cta` is provided (the model decides what is honest to show). */
  price?: number;
  /** Optional: duration in days, shown beside the price figure. */
  days?: number;
  /** Honest CTA view-model. When provided, it is the single source of truth for the price and the
   *  "save £X vs gate" claim — it suppresses the price entirely in the gate-only case so we never
   *  show a drive-up gate price dressed up as a "from" pre-book figure. */
  cta?: ParkingCtaModel;
}) {
  const he = resolveSlot(PARKING_SLOT, airportSlug, officialUrl);
  const hasAffiliate = he.kind === "affiliate";
  // Merchant is resolved per-airport (Holiday Extras by default, APH on its override airports), so
  // all merchant-facing copy and the Terms link must come from the resolver, never hardcoded.
  const merchant = he.partnerName ?? "our partner";
  const termsUrl = he.termsUrl ?? officialUrl;
  // The 10%-off / "up to 25% Gatwick" promo is a Holiday Extras offer only — never claim it for APH.
  const isHolidayExtras = he.partnerName === "Holiday Extras";

  // Resolve the honest price to surface: prefer the cta model (which suppresses the gate-only
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
          <div className="rounded-card border border-brand-accent/30 bg-blue-50 dark:bg-brand-accent/[0.08] dark:border-brand-accent/20 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-ink">Pre-book &amp; save with {merchant}</h3>
              <span className="rounded border border-ink-muted/40 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Ad</span>
            </div>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink">
              <li>✓ Free cancellation (cancel to arrival)</li>
              <li>✓ No code needed</li>
              <li>✓ Compare every car park in one place</li>
            </ul>
            <p className="mt-2 text-sm text-ink-muted">
              {isHolidayExtras
                ? "10% off most Holiday Extras car parks — up to 25% at Gatwick (Meet & Greet North). Discount applied automatically, no code."
                : `Compare on-airport, Park & Ride and Meet & Greet at ${merchant} — free cancellation, no code needed.`}{" "}
              <a href={termsUrl} rel="noopener noreferrer" target="_blank" className="underline underline-offset-4">
                Terms ↗
              </a>
            </p>
            {savingStr ? (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-positive/10 px-3 py-1 text-sm font-semibold text-positive">
                <span aria-hidden>✓</span>
                {savingStr}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-ink-muted">
              We earn a commission only if you book the &ldquo;Ad&rdquo; option — it never changes our ranking or which park
              we show as cheapest.
            </p>
            <a
              href={goLink("", airportSlug, "parking-prebook")}
              rel="sponsored noopener noreferrer"
              target="_blank"
              className="mt-3 inline-block rounded-card bg-brand-accent px-4 py-2 text-sm font-semibold text-white"
            >
              Book my parking{priceStr ? ` — ${priceStr}` : ""} — free cancellation ↗
            </a>
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
