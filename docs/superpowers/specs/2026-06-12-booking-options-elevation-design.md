# ParkMath Booking-Options Elevation — Design Spec

*Replace the single Holiday Extras affiliate link on parking pages with a two-route
**"Your booking options"** module — a non-affiliate **official-airport** route plus an elevated,
honest **Holiday Extras** route — so the booking stands out and converts while protecting the
commission-blind-ranking trust asset. ParkMath parking pages only; RoamMath and the lounge slot
untouched.*

## Intent

The cost comparison answers "what's cheapest?"; the booking module answers "how do I book it?".
Today that's one underlined affiliate link. We elevate it into a **two-route choice** — official
direct vs. Holiday Extras (with free cancellation, auto-discount, our own verified saving) — leading
with the official route so the affiliate route is *earned*, not pushed. Every persuasion lever is a
real benefit and every claim is ASA/CMA-clean. No dark patterns.

## Decisions locked (owner-approved)

- **Full two-route block** (official + elevated HE), official route first/co-equal.
- **Text-only HE v1**; licensed HE logo is a fast-follow (avoids the download/host/audited-asset step
  blocking the build).
- **Button:** "Book my parking — free cancellation ↗".
- **£-saving stays in `SavesVerdict`** above; the HE card carries benefits + the discount line.
- **No reviews chip** (no real review source — we won't invent one).
- **Official route reuses the airport's own parking URL** we already store (`record.sourceUrl`).
- **Purple Parking / Airparks stay inactive.** They're Pending in AWIN, low-EPC (£0.09/£0.08 vs HE
  £0.17), and same-parent — listing them as rival "providers" would be fake competition (DMCC/CMA).
- **Deep-link HE to its parking page** (`holidayextras.com/airport-parking.html`) via the existing
  `ued` param, so users land on parking, not the homepage.

## CAN / CAN'T (compliance guardrails baked into the copy)

| ✅ CAN | ❌ CAN'T |
|---|---|
| "**10% off** most Holiday Extras car parks — **up to 25% at Gatwick** (Meet & Greet North)", qualifier inline, terms linked | A bare "**Up to 25% off**" headline (one Gatwick product hits 25% → fails ASA/CAP "significant proportion" test) |
| Lead with **our own verified `SavesVerdict` £-figure** | Repeat HE's "save up to 75%" as ParkMath's own claim (joint liability) |
| "**Discount applied automatically — no code needed**" (literally true) | Imply the discount is exclusive/unconditional |
| "**Free cancellation** with Flextras — cancel up to arrival" | Present free cancellation as universal/unscoped |
| "**Ad**" chip, upfront, adjacent, before engagement; `rel="sponsored"` | "Aff", "*", footer-only, or "may earn" |
| Official route first, **equal-weight button**, no Ad label | Bury/demote the official route to plain text (CMA "sludge") |
| HE name/logo **only on the HE route card** | HE branding on the official card or near the editorial `SavesVerdict` |
| State ranking is "commission-blind, from the airport's own prices" | Let commission reorder or visually bury the cheaper/official route |

## Architecture

ParkMath-scoped. No shared-package changes. RoamMath's copies and the lounge `AffiliateBlock` are untouched.

### 1. `partners.json` — add a landing URL for the HE parking deep-link

Add an optional `landingUrl` to the partner, threaded into the AWIN link's `ued`:

```json
"holiday-extras": { "name": "Holiday Extras", "awinmid": "3496", "active": true, "landingUrl": "https://www.holidayextras.com/airport-parking.html" }
```

### 2. `apps/parkmath/lib/partners.ts` — thread `landingUrl` → `ued`

`resolveSlot` passes the partner's `landingUrl` (if set) as `ued` to `buildAwinLink` (already
percent-encodes it). `ResolvedSlot` shape and signature are otherwise unchanged. When `landingUrl` is
absent, behaviour is identical to today (bare link). The official fallback path is unchanged.

### 3. `apps/parkmath/components/booking-options.tsx` — new two-route module

`BookingOptions({ airportName, airportSlug, officialUrl })` (server component). It calls
`resolveSlot("parking-prebook", airportSlug, officialUrl)`:

- **Always renders Route ① — official.** Heading "Book direct with the airport", neutral "Official
  site" tag (no Ad), subtext "{airportName} official car parks", button "Go to airport site ▸"
  (`rel="noopener noreferrer"`, new tab) → `officialUrl`.
- **If `resolveSlot` returns `kind:"affiliate"`, renders Route ② — the elevated HE card:**
  - "**Ad**" chip (top-left); HE name (text v1; logo slot reserved).
  - Trust chips: `✓ Free cancellation (cancel to arrival)` · `✓ No code needed` · `✓ Best Price Guaranteed`.
  - Discount line: "10% off most Holiday Extras car parks — up to 25% at Gatwick (Meet & Greet North). Discount applied automatically, no code." + a "Terms ↗" link.
  - Button "**Book my parking — free cancellation ↗**" (`rel="sponsored noopener noreferrer"`, new tab) → the resolved AWIN link (with `clickref=parkmath-<slug>` + HE-parking `ued`).
  - If `resolveSlot` returns `kind:"official"` (no active affiliate), Route ② is omitted — the block degrades to the single official route.
- **Container chrome:** title "Your booking options"; intro "Our ranking above uses only the airport's own published prices — it isn't affected by commission."; footer "We earn a commission only if you book the 'Ad' option — it never changes our ranking or which park we show as cheapest."

**Terms link:** points to Holiday Extras' parking page (where the live offer + full terms display).
Default `https://www.holidayextras.com/airport-parking.html`; the inline qualifier already carries the
material limitation, so the link is corroboration, not the sole disclosure.

### 4. Page wiring

In `apps/parkmath/app/airport-parking/[airport]/page.tsx` and
`apps/parkmath/app/airport-parking/[airport]/[duration]/page.tsx`, replace
`<AffiliateBlock slotId="parking-prebook" airportSlug=… officialUrl=record.sourceUrl/>` with
`<BookingOptions airportName={airport.name} airportSlug={airport.slug} officialUrl={record.sourceUrl}/>`
in the same position (after the fee grid / savings hook, above the FAQ). No reordering.

The lounge page keeps its existing `<AffiliateBlock slotId="lounge-membership" …/>` unchanged.

## Testing

Configless vitest; `BookingOptions` is a static server component → `renderToStaticMarkup` (no jsdom, no new deps), per `affiliate-block.test.tsx`.

- **`apps/parkmath/tests/booking-options.test.tsx`** (new):
  - Two-route render (HE active): contains "Your booking options"; the official route — "Go to airport site", `href="<officialUrl>"`, and that anchor is **not** `rel="sponsored"`; the HE route — `>Ad<`, "Free cancellation", "Discount applied automatically", "up to 25% at Gatwick", the `cread.php` link with `awinmid=3496` + `clickref=parkmath-gatwick` + `ued=` (encoded HE parking URL), button "Book my parking — free cancellation"; the commission-blind footer; and **not** `>Up to 25% off<` as a standalone headline, **not** "may earn", **not** "up to 75%".
- **`apps/parkmath/tests/partners.test.ts`** (extend): when the active partner has a `landingUrl`, `resolveSlot("parking-prebook", "gatwick", …)` → `url` contains `ued=https%3A%2F%2Fwww.holidayextras.com%2Fairport-parking.html`; lounge unchanged (official, no `ued`).
- Full gate: `pnpm --filter parkmath test && pnpm --filter parkmath typecheck && pnpm --filter @mathfamily/ui test`.

## Scope

**In scope:** the `landingUrl`→`ued` thread; the `BookingOptions` two-route component (compliant copy);
swapping it into the two parking page templates; tests.

**Out of scope (now):**
- HE logo asset (fast-follow — download licensed asset, host, audited use).
- Sticky mobile booking bar (later enhancement).
- Per-airport HE deep URLs (the generic parking page is the v1 `ued`).
- Lounge changes (Priority Pass not approved).
- A/B test harness for button copy (ship the recommended default first).

**Future direction (designed-for):** per-airport / highest-commission routing. The AWIN dashboard now
shows **Heathrow Airport Parking at EPC £1.48 (~9× HE)** and **APH £0.23** — both Pending. When
approved, add a per-airport override so Route ② resolves to the higher-EPC merchant for that airport
(e.g. Heathrow → Heathrow Airport Parking) via an `airportOverrides` map on the slot, reusing this
same module. Grab their `awinmid`s when they flip to Joined.

## Success criteria

- Every ParkMath parking page shows a "Your booking options" block: official route first (no Ad,
  equal-weight button) + an elevated, **Ad**-labelled HE route with free-cancellation/auto-discount
  benefits, the compliant "10% (up to 25% Gatwick)" line, and the `cread.php` link landing on HE's
  parking page with `clickref=parkmath-<airport>`.
- No bare "up to 25% off", no "may earn", no dark patterns; ranking stays commission-blind.
- Full gate green; RoamMath and lounge unaffected.
