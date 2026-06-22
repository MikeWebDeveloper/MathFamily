import { goLink, resolveHeProduct, resolveParkingMerchant, type HeProduct } from "../lib/partners";

function discountLine(merchant: string, product: HeProduct): string {
  if (merchant === "Holiday Extras") {
    if (product === "lounge") return "10% off airport lounges, applied automatically.";
    return "10% off most Holiday Extras car parks — up to 25% at Gatwick (Meet & Greet North). Applied automatically, no code.";
  }
  // APH (and any future merchant) — no fabricated discount; describe the honest value prop only.
  return `Compare on-airport, Park & Ride and Meet & Greet at ${merchant} — book early to save, free cancellation.`;
}

export function HolidayExtrasCard({ product, airportName, airportSlug, surface, extras }: {
  product: HeProduct;
  airportName: string;
  airportSlug: string;
  surface: string;
  extras?: HeProduct[];
}) {
  // The primary product resolves per-airport: for "parking" this is the diversified merchant
  // (APH on its override airports, Holiday Extras elsewhere); for HE-only products (lounge etc.)
  // it stays Holiday Extras. Null ⇒ fail closed (render nothing).
  const isParking = product === "parking";
  const parkingMerchant = isParking ? resolveParkingMerchant(airportSlug, surface) : null;
  const heProduct = !isParking ? resolveHeProduct(product, airportSlug, surface) : null;

  if (isParking && !parkingMerchant) return null;
  if (!isParking && !heProduct) return null;

  const merchant = isParking ? parkingMerchant!.partnerName : "Holiday Extras";
  const termsUrl = isParking ? (parkingMerchant!.termsUrl ?? "https://www.aph.com/") : "https://www.holidayextras.com/airport-parking.html";
  const productLabel = isParking ? "parking" : heProduct!.productLabel;
  const primaryHref = goLink(surface, airportSlug, product);

  // "Also from Holiday Extras" upsell — HE-only products (hotels/lounge/transfers). These stay on HE
  // regardless of the primary parking merchant, and are labelled as Holiday Extras explicitly.
  const extraLinks = (extras ?? [])
    .map((p) => {
      const r = resolveHeProduct(p, airportSlug, `${surface}-${p}`);
      return r ? { product: p, href: goLink(`${surface}-${p}`, airportSlug, p), productLabel: r.productLabel } : null;
    })
    .filter((r): r is { product: HeProduct; href: string; productLabel: string } => r !== null);

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
        Affiliate links (Ad) — if you book through {merchant}, ParkMath earns a commission, at no cost to you. It
        never affects which option we show as cheapest.
      </p>
    </section>
  );
}
