import { goLink, goLinkMerchant, resolveAllParkingMerchants, resolveHeProduct, type HeProduct } from "../lib/partners";

function discountLine(merchant: string, product: HeProduct): string {
  if (merchant === "Holiday Extras") {
    if (product === "lounge") return "10% off airport lounges, applied automatically.";
    return "10% off most Holiday Extras car parks — up to 25% at Gatwick (Meet & Greet North). Applied automatically, no code.";
  }
  // APH (and any future merchant) — no fabricated discount; describe the honest value prop only.
  return `Compare on-airport, Park & Ride and Meet & Greet at ${merchant} — book early to save, free cancellation.`;
}

export function HolidayExtrasCard({ product, airportName, airportSlug, surface, extras, savingsHint }: {
  product: HeProduct;
  airportName: string;
  airportSlug: string;
  surface: string;
  extras?: HeProduct[];
  savingsHint?: string | null;
}) {
  const isParking = product === "parking";

  // Parking: multi-option, commission-blind. Show EVERY joined merchant that genuinely serves this
  // airport (verified per-airport link), as its own tracked option — no single primary, the traveller
  // chooses. Alphabetical by name, fail-closed (a merchant with no page here is omitted). HE-only
  // products (lounge/hotels/transfers) stay on Holiday Extras.
  const parkingMerchants = isParking ? resolveAllParkingMerchants(airportSlug, surface) : [];
  const heProduct = !isParking ? resolveHeProduct(product, airportSlug, surface) : null;
  // General "official operator pinned first" mechanism (see partners.ts isOfficialOperator doc
  // comment): any partner flagged isOfficialOperator that genuinely serves this airport is pinned
  // first, and the disclosure below names it explicitly instead of claiming pure alphabetical order.
  // A no-op for every airport without a covering official-operator partner.
  const pinnedPrimary = isParking ? (parkingMerchants.find((m) => m.isPinnedPrimary) ?? null) : null;

  if (isParking && parkingMerchants.length === 0) return null;
  if (!isParking && !heProduct) return null;

  // "Also from Holiday Extras" upsell — HE-only products (hotels/lounge/transfers). These stay on HE
  // regardless of the parking merchants, and are labelled as Holiday Extras explicitly.
  const extraLinks = (extras ?? [])
    .map((p) => {
      const r = resolveHeProduct(p, airportSlug, `${surface}-${p}`);
      return r ? { product: p, href: goLink(`${surface}-${p}`, airportSlug, p), productLabel: r.productLabel } : null;
    })
    .filter((r): r is { product: HeProduct; href: string; productLabel: string } => r !== null);

  if (isParking) {
    const multi = parkingMerchants.length > 1;
    return (
      <section aria-label={`Pre-book ${airportName} parking`} className="rounded-card border border-brand-accent/30 bg-blue-50 dark:bg-brand-accent/[0.08] dark:border-brand-accent/20 p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="rounded border border-ink-muted/40 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Ad</span>
          <span className="text-xs text-ink-muted">{multi ? "Compare our partners" : parkingMerchants[0]!.partnerName}</span>
        </div>

        {savingsHint ? (
          <p className="mb-2 text-sm font-semibold text-ink">{savingsHint}</p>
        ) : null}
        <h3 className="font-semibold text-ink">Pre-book {airportName} parking</h3>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink">
          <li>✓ Free cancellation</li>
          <li>✓ Compare every car park</li>
          <li>✓ No code needed</li>
        </ul>

        <ul className="mt-3 space-y-2">
          {parkingMerchants.map((m) => (
            <li key={m.partnerId} className="sm:flex sm:items-center sm:justify-between sm:gap-3">
              <a
                href={m.termsUrl ?? "https://www.holidayextras.com/airport-parking.html"}
                rel="noopener noreferrer"
                target="_blank"
                className="text-sm text-ink-muted underline underline-offset-4"
              >
                {m.partnerName} terms ↗
              </a>
              <a
                href={goLinkMerchant(surface, airportSlug, m.partnerId)}
                rel="sponsored noopener noreferrer"
                target="_blank"
                className="mt-2 inline-block whitespace-nowrap rounded-card bg-brand-accent px-4 py-2 text-sm font-semibold text-white sm:mt-0 sm:shrink-0"
              >
                Book parking with {m.partnerName} ↗
              </a>
            </li>
          ))}
        </ul>

        {extraLinks.length > 0 ? (
          <p className="mt-3 text-xs text-ink-muted">
            Also from Holiday Extras:{" "}
            {extraLinks.map((r, i) => (
              <span key={r.productLabel}>
                {i > 0 ? " · " : ""}
                <a href={r.href} rel="sponsored noopener noreferrer" target="_blank" className="underline underline-offset-4">
                  airport {r.productLabel}s
                </a>
              </span>
            ))}
          </p>
        ) : null}

        <p className="mt-2 text-xs text-ink-muted">
          {pinnedPrimary ? (
            <>
              Affiliate links (Ad) — we show every partner that serves {airportName}.{" "}
              {pinnedPrimary.partnerName} is shown first because it&apos;s {airportName}&apos;s own
              official operator; every other option below is ordered alphabetically. If you book through
              one, ParkMath earns a commission at no cost to you; this never affects which option we show
              as cheapest.
            </>
          ) : (
            <>
              Affiliate links (Ad) — we show every partner that serves {airportName}, ordered alphabetically.
              If you book through one, ParkMath earns a commission at no cost to you; the order is not influenced
              by payout and never affects which option we show as cheapest.
            </>
          )}
        </p>
      </section>
    );
  }

  // ── HE-only product variant (lounge / hotels / transfers) — unchanged single-merchant card ──
  const merchant = "Holiday Extras";
  const termsUrl = "https://www.holidayextras.com/airport-parking.html";
  const productLabel = heProduct!.productLabel;
  const primaryHref = goLink(surface, airportSlug, product);

  return (
    <section aria-label={`Pre-book ${productLabel} with ${merchant}`} className="rounded-card border border-brand-accent/30 bg-blue-50 dark:bg-brand-accent/[0.08] dark:border-brand-accent/20 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="rounded border border-ink-muted/40 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Ad</span>
        <span className="text-xs text-ink-muted">{merchant}</span>
      </div>

      <a
        href={primaryHref}
        rel="sponsored noopener noreferrer"
        target="_blank"
        className="flex min-h-[44px] items-center justify-between gap-3 font-semibold text-brand-accent sm:hidden"
      >
        <span>Pre-book {airportName} {productLabel} — free cancellation</span>
        <span aria-hidden="true">↗</span>
      </a>

      <div className="hidden sm:block">
        <h3 className="font-semibold text-ink">Pre-book {airportName} {productLabel}</h3>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink">
          <li>✓ Free cancellation</li>
          <li>✓ Compare every car park</li>
          <li>✓ Best Price Guaranteed</li>
        </ul>
        <p className="mt-2 text-sm text-ink-muted">
          {discountLine(merchant, product)}{" "}
          <a href={termsUrl} rel="noopener noreferrer" target="_blank" className="underline underline-offset-4">Terms ↗</a>
        </p>
        <a
          href={primaryHref}
          rel="sponsored noopener noreferrer"
          target="_blank"
          className="mt-3 inline-block rounded-card bg-brand-accent px-4 py-2 text-sm font-semibold text-white"
        >
          Book {productLabel} — free cancellation ↗
        </a>
      </div>

      <p className="mt-2 text-xs text-ink-muted">
        Affiliate links (Ad) — if you book through {merchant}, ParkMath earns a commission, at no cost to you. It
        never affects which option we show as cheapest.
      </p>
    </section>
  );
}
