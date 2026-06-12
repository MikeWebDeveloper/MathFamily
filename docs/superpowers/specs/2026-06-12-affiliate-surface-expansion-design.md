# ParkMath Affiliate-Surface Expansion — Design Spec

*Put an honest Holiday Extras booking CTA on the high-traffic pages that currently earn nothing —
**drop-off** (cross-sell parking, with a compact "also: hotels · lounges · transfers" line) and
**lounge** (a real HE lounge CTA replacing the dead Priority-Pass link) — via one reusable,
responsive card. ParkMath only; RoamMath untouched; the editorial answer stays primary.*

## Intent

The parking pages now convert (shipped `BookingOptions`), but the **drop-off** pages — the headline
product and the bulk of traffic — have no booking CTA, and the **lounge** pages show a Priority-Pass
"official" link that isn't even an approved affiliate (earns £0). Holiday Extras (the only Joined
merchant, mid 3496) sells parking, lounges, hotels and transfers, each deep-linkable with a 10%
auto-discount. We surface a tasteful, Ad-labelled HE card on drop-off and lounge pages — genuinely
useful (a drop-off visitor often needs parking; a lounge visitor can pre-book a lounge) — without
ad-walling the editorial content.

## Decisions locked (owner-approved)

- **Scope = drop-off + lounge** (parking already done).
- **Drop-off = parking-primary + a compact "also: airport hotels · lounges · transfers" line** (each
  deep-linked, all under one Ad label).
- **Lounge = an HE lounge CTA** replacing the dead Priority-Pass `AffiliateBlock`; the Priority-Pass
  membership break-even editorial above it stays.
- **Responsive:** desktop = a fuller card; mobile = a compact single-line CTA.
- **One reusable component** (`HolidayExtrasCard`); parking keeps the richer two-route `BookingOptions`.
- **Per-airport official-parking affiliate is deferred** (advertisers still Pending; would force the
  "official" route to carry an Ad label).
- **The airport's own info links stay plain/unaffiliated** — not an affiliate, won't fake it.

## Architecture (ParkMath-only)

### 1. HE products config — `apps/parkmath/lib/partners.json`

Add a `products` map to the `holiday-extras` partner (keep `landingUrl` for `BookingOptions`):

```json
"holiday-extras": {
  "name": "Holiday Extras", "awinmid": "3496", "active": true,
  "landingUrl": "https://www.holidayextras.com/airport-parking.html",
  "products": {
    "parking":   { "url": "https://www.holidayextras.com/airport-parking.html",  "label": "parking"  },
    "lounge":    { "url": "https://www.holidayextras.com/airport-lounges.html",   "label": "lounge"   },
    "hotels":    { "url": "https://www.holidayextras.com/airport-hotels.html",    "label": "hotel"    },
    "transfers": { "url": "https://www.holidayextras.com/airport-transfers.html", "label": "transfer" }
  }
}
```

(The parking URL intentionally appears in both `landingUrl` and `products.parking` — two surfaces,
two resolvers; unifying later is optional.)

### 2. Resolver + clickref — `apps/parkmath/lib/partners.ts`

- Extend `buildAwinLink` with an optional `clickrefSuffix?: string`; `clickref` becomes
  ``parkmath-${airportSlug}${clickrefSuffix ? `-${clickrefSuffix}` : ""}``. Existing callers
  (`resolveSlot`) pass no suffix → unchanged (`parkmath-<airport>`).
- Add `resolveHeProduct(product, airportSlug, clickrefSuffix): { url, productLabel } | null`. Returns
  `null` when HE is inactive or the product url is missing; otherwise builds the AWIN link via
  `buildAwinLink({ awinmid, publisherId, airportSlug, ued: products[product].url, clickrefSuffix })`
  and returns it with the product label. `HeProduct = "parking" | "lounge" | "hotels" | "transfers"`.

**clickref scheme** (per-page+product attribution, all ≤50 chars, safe charset):
`parkmath-<airport>-dropoff` (drop-off parking), `parkmath-<airport>-dropoff-<product>` (drop-off
extras), `parkmath-<airport>-lounge` (lounge card).

### 3. `HolidayExtrasCard` — `apps/parkmath/components/holiday-extras-card.tsx`

`HolidayExtrasCard({ product, airportName, airportSlug, surface, extras? })` — sync server component,
RELATIVE import `"../lib/partners"` (config-less vitest). Calls `resolveHeProduct(product, airportSlug, surface)`;
renders `null` if that returns `null` (HE inactive). Otherwise:

- **Desktop (`sm:` and up) — full card:** "**Ad**" chip; headline *"Pre-book {product} at {airportName}"*;
  benefit chips (`✓ Free cancellation` · `✓ 10% off, applied automatically` · `✓ Best Price Guaranteed`);
  the compliant discount line *"10% off most Holiday Extras car parks — up to 25% at Gatwick (Meet &
  Greet North). Applied automatically, no code."* + a "Terms ↗" link; primary button
  *"Book {product} — free cancellation ↗"* (`rel="sponsored noopener noreferrer"`, new tab) → the
  resolved AWIN link. *(The "10% / 25% Gatwick" parking-discount wording is shown for the **parking**
  product; the lounge card uses the lounge-appropriate line "10% off airport lounges, applied
  automatically".)*
- **Mobile (base) — compact line:** the "**Ad**" chip + one line *"Pre-book {airportName} {product} —
  10% off, free cancellation"* + "↗", the whole row a ≥44px tap target linking to the same AWIN link.
- **`extras` (drop-off only):** a quiet line *"Also from Holiday Extras: airport hotels · lounges ·
  transfers"* — each word a deep-link via `resolveHeProduct(<product>, slug, "dropoff-<product>")`,
  rendered under the single Ad label (no second Ad chip).
- **Disclosure footer:** *"Affiliate links (Ad) — if you book through Holiday Extras, ParkMath earns a
  commission, at no cost to you. It never affects which option we show as cheapest."*

### 4. Placement

- **Drop-off** `apps/parkmath/app/drop-off-charges/[airport]/page.tsx`: insert
  `<HolidayExtrasCard product="parking" surface="dropoff" airportName={airport.name} airportSlug={airport.slug} extras={["hotels","lounges","transfers"]} />`
  **after** the free-alternative `Callout` / `DropOffCalculator` block and **before** the FAQ section —
  editorial answer first, cross-sell second.
- **Lounge** `apps/parkmath/app/airport-lounges/[airport]/page.tsx`: **replace**
  `<AffiliateBlock slotId="lounge-membership" …/>` (line 106) with
  `<HolidayExtrasCard product="lounge" surface="lounge" airportName={airport.name} airportSlug={airport.slug} />`.

### 5. Remove dead `AffiliateBlock`

After the lounge swap, **no ParkMath page imports `apps/parkmath/components/affiliate-block.tsx`**
(parking → `BookingOptions`, drop-off/lounge → `HolidayExtrasCard`). Delete it and
`apps/parkmath/tests/affiliate-block.test.tsx`. (RoamMath's *separate* `affiliate-block.tsx` is
untouched.) Verify with `grep -rn "AffiliateBlock" apps/parkmath` → no matches.

## Compliance (unchanged guardrails)

- "**Ad**" chip on every card, upfront/adjacent; `rel="sponsored"`; plain-words commission disclosure.
- Discount accuracy: never a bare "up to 25% off"; "10% … up to 25% at Gatwick" + Terms for parking;
  lounge uses "10% off airport lounges".
- Editorial primary (drop-off answer, free alternative, membership break-even) — card is secondary.
- The airport's own info links stay plain; ranking stays commission-blind.

## Testing

Configless vitest; `renderToStaticMarkup` (node env, no jsdom/new deps). Never create a vitest/vite config.

- **`apps/parkmath/tests/holiday-extras-card.test.tsx`** (new):
  - Drop-off parking card: contains "Ad", "Book parking", `cread.php` with `awinmid=3496` +
    `clickref=parkmath-gatwick-dropoff` + the encoded parking `ued`; the extras line renders deep-links
    for hotels/lounges/transfers (e.g. `clickref=parkmath-gatwick-dropoff-hotels`); guards:
    **not** `>Up to 25% off<`, **not** "may earn".
  - Lounge card: "Ad", "Book lounge", `clickref=parkmath-gatwick-lounge`, the lounges `ued`.
- **`apps/parkmath/tests/partners.test.ts`** (extend): `resolveHeProduct("lounge","gatwick","lounge")`
  → link contains `ued=<encoded lounges url>` + `clickref=parkmath-gatwick-lounge`; `clickrefSuffix`
  omitted still yields `parkmath-gatwick` (BookingOptions regression guard).
- Full gate: `pnpm --filter parkmath test && pnpm --filter parkmath typecheck && pnpm --filter @mathfamily/ui test`.

## Scope

**In scope:** HE `products` config; `resolveHeProduct` + `buildAwinLink` `clickrefSuffix`;
`HolidayExtrasCard` (responsive); drop-off + lounge placement; delete dead `AffiliateBlock` + test.

**Out of scope (now):** homepage placement; hotels/transfers as a *primary* product; per-airport
official-parking affiliate (deferred until those advertisers approve — see [[awin-affiliate-ids]]);
the licensed HE logo (text-only, as on the parking card); RoamMath.

## Success criteria

- Every drop-off page shows an Ad-labelled HE parking card (with the extras line) below the editorial
  answer; every lounge page shows an Ad-labelled HE lounge card; both responsive (full card desktop,
  one-line mobile).
- Links are `cread.php?awinmid=3496&awinaffid=2932035&clickref=parkmath-<airport>-<surface>[…]&ued=<HE product page>`.
- No bare "up to 25% off", no "may earn"; editorial stays primary; ranking commission-blind.
- Dead `AffiliateBlock` removed; full gate green; RoamMath unaffected.
