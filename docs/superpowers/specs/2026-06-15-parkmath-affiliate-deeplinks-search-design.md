# ParkMath — Affiliate Deep-Links + Search Handoff

**Date:** 2026-06-15
**Status:** Design approved, pending spec review → implementation plan
**Scope:** ParkMath app only (`apps/parkmath`). No other Math-family app is touched.

## Goal

Two linked improvements to how ParkMath sends users to its affiliate partner:

1. **Better affiliate links (Path A).** Today every affiliate CTA deep-links to a *generic* Holiday Extras category page (e.g. `/airport-parking.html`). Make links **airport-specific** and, where possible, **date-prefilled**, with sharper offer copy drawn from the assets we're cleared to use.
2. **A "search" handoff (Path B).** A box where the user picks an airport + drop-off/return dates and hits Search; we open the affiliate **with that search pre-filled and run** on their site. We do **not** host prices.

Both ride the same upgraded deep-link layer, so they share most of the build.

## Key constraint discovered during brainstorming

ParkMath holds **static reference data only** — annual parking tariffs and drop-off charge bands (see `packages/data/src/schemas.ts`). There is **no live, date-priced parking inventory** in the project. Therefore Path B cannot show real live prices from our own data; it is a **deep-link handoff** to the merchant. This matches the explicit product decision below.

## Decisions (locked with the user, 2026-06-15)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Path B depth | **Deep-link handoff only** — no prices hosted on ParkMath. |
| 2 | Merchants | **Single best brand per airport.** All approved AWIN merchants (Holiday Extras, Purple Parking, Airparks, BCP) are Holiday-Extras-group brands, so there is no honest "comparison" to show. One sharp CTA, brand chosen by config per airport/product. |
| 3 | Placement | **Slim search component on the home, above the bento.** Same component reused on each airport page with the airport locked. (A dedicated page and "airport-only" placements were rejected.) |
| 4 | Fields | **Airport + Drop-off + Return.** Times default to midday (matches HE's own default). No passengers, no time pickers. |
| 5 | Airport-page composition | **Merged** — the two date fields live *inside* the existing booking card, so the "search" and the "book" are one block (no competing CTAs). |
| 6 | Mobile | **Mobile-first is the bar.** Native date inputs, ≥44px tap targets, full-width buttons, single-column stack, no hover-only behaviour. |

## Architecture

### 1. Shared foundation — the deep-link layer (`apps/parkmath/lib/partners.ts` + `partners.json`)

Extend the existing, unit-tested builder; do not replace it.

- `buildAwinLink(...)` — **unchanged.** It already percent-encodes `ued` via `URLSearchParams`, so a destination carrying its own query string is safe.
- **New** `buildParkingSearchUrl({ airportSlug, dropOff, returnDate })`:
  - Resolves the active HE-group brand for that airport (config-driven; default Holiday Extras).
  - Builds the `ued` destination using the resolution ladder below.
  - Wraps it in a tracked AWIN link via `buildAwinLink`, with `clickref = parkmath-<airportSlug>-search` (the `-search` suffix lets `tools/awin transactions` attribute bookings to the search surface vs the card surface).
  - Returns `{ url, partnerName, datePrefilled: boolean }`.

- **`ued` destination resolution ladder (highest to lowest):**
  1. **Date-prefilled URL** — only when a confirmed per-merchant `dateUrlTemplate` exists *and* the `datePrefill` flag is on. Built from airport + the two dates.
  2. **Airport page** — reliable baseline, e.g. `https://www.holidayextras.com/gatwick-airport-parking.html`. Always available.
  3. **Generic category page** — last resort (today's behaviour), if no airport slug is configured.

- **`partners.json` additions:**
  - Per-airport HE page slug. Default pattern `${airportSlug}-airport-parking.html`; explicit overrides for airports whose HE URL differs (confirmed during the spike).
  - Optional `dateUrlTemplate` per merchant (string template with placeholders for airport id + dates).
  - A `datePrefill` boolean flag (default **off** until the spike confirms the contract).

- **Home "no generic affiliate click" nuance:** the existing `deals-strip.tsx` deliberately avoids the home emitting a *generic* affiliate click. The home search is different — it emits a **per-airport, user-specified** tracked click (`parkmath-<airport>-search`). This is intentional and consistent with the original principle (avoid untargeted blanket clicks), not a violation of it.

### 2. The search component — `apps/parkmath/components/parking-search.tsx` (new, shared, client component)

One component, two modes:
- **Standalone** (home): airport combobox + Drop-off + Return.
- **Locked** (airport pages): airport fixed (passed as prop), only the two date fields.

Behaviour:
- Validate: airport required; return date ≥ drop-off date; neither date in the past.
- On submit → `buildParkingSearchUrl(...)` → open the result in a new tab with `rel="sponsored noopener noreferrer" target="_blank"`.
- Airport selector: `<input>` + `<datalist>` over the airports dataset (`packages/data`) — native, touch-friendly, near-zero JS — with a `<select>` no-JS fallback.
- Dates: native `<input type="date">` (renders the phone date wheel on mobile).
- Layout: single-column stack on mobile, the two dates side-by-side from `sm:` up; full-width primary button on mobile.
- Disclosure line beneath: "Ad" pill + "opens our partner with prices · we may earn commission".

### 3. Path A surfaces

- **`apps/parkmath/components/booking-options.tsx`** (airport pages): merge the two date fields into the affiliate card; switch its CTA to the airport-/date-prefilled link from `buildParkingSearchUrl`; tighten copy (section 4). Keep the "Book direct with the airport" official card and the neutral "our ranking isn't affected by commission" line.
- **Home (`apps/parkmath/app/page.tsx`)**: place the standalone `<ParkingSearch>` in the slim slot above the bento grid. Fold the current `deals-strip.tsx` framing into the search's disclosure line to avoid two affiliate framings stacked on the home; remove the now-redundant standalone DealsStrip from the home (confirm during implementation).

### 4. Copy & compliance (only assets we're cleared for)

From the Holiday Extras AWIN welcome pack:
- **USPs (attributed):** Free cancellation to arrival (Flextras) · Best Price Guaranteed · no code needed.
- **Discount (honest framing):** "10% off most car parks — up to 25% at Gatwick (Meet & Greet North), applied automatically" + Terms link. **Never** splash "25% off" site-wide (that rate is Gatwick Meet & Greet North only).
- Always-visible **"Ad"** label (never hidden); one section-level commission disclosure; `rel="sponsored"` on every affiliate link.
- No implication that the affiliate option is the editorially "cheapest". No PPC brand-bidding on "Holiday Extras" terms (clawback risk — relevant to marketing, noted here for completeness).

### 5. Robustness + the one spike

Date-prefill is the only technical unknown — Holiday Extras' public *dated* parking-search URL is undocumented. The partner API (`api.holidayextras.co.uk`) needs ABTA auth and is not available to us; the consumer booking engine is known to accept `ArrivalDate`/`DepartDate` (DD/MM/YY) + a destination id, but the exact current parking submit URL must be captured live.

- **Build-time spike:** open the live HE parking search for 2–3 airports, capture the actual submit URL/params from the browser network tab, and encode it as the merchant `dateUrlTemplate`. Confirm the per-airport page slugs at the same time.
- **If confirmed:** turn on the `datePrefill` flag → dates ride along.
- **If not confirmed (or it later breaks):** flag stays off → everything **gracefully falls back to airport-prefill** (resolution ladder step 2), which is still a clear win over today's generic page.
- The feature ships **either way**; date-prefill is an enhancement, not a blocker.

### 6. Testing (per repo conventions)

- **URL builders** — token-free unit tests mirroring `tools/awin/lib.test.mjs`: brand routing per airport, `clickref` suffixes, date encoding, and the full fallback ladder (date → airport → generic).
- **Components** — jsdom + testing-library (per the project's test conventions): date validation (return ≥ drop-off, no past dates), locked vs standalone mode, presence of `rel="sponsored"` and the "Ad" label, and the mobile single-column stack.
- **Do not** create new vitest/vite config files (known esbuild `build()` deadlock on the TB4 volume). Use the existing test setup.

## Out of scope (YAGNI)

- Hosted or live prices on ParkMath; product feeds / merchant API integration.
- Multi-merchant comparison UI (all approved merchants are the same company).
- Passenger count or time-of-day fields.
- On-site booking / checkout.
- Activating additional merchants beyond the currently active Holiday Extras.

## Success criteria

- Every affiliate parking CTA on ParkMath resolves to at least an **airport-specific** HE page (never the bare generic category page), with per-airport click tracking intact.
- A user can pick an airport + dates on the home **or** an airport page and land on Holiday Extras with that search pre-filled (airport always; dates when the flag is on), in a new tab, with honest "Ad" labelling.
- The whole flow is fully usable on a phone: native date inputs, thumb-sized targets, no horizontal scroll, no hover-only affordances.
- All new URL-builder and component logic is covered by tests that run under the existing harness (no new config files).
