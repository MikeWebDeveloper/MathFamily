# ParkMath Home — Navigation Hub Redesign

*Reworks the ParkMath home page (`apps/parkmath/app/page.tsx`) from a hero + stat-strip +
bare text-links layout into a calm **topic-tile navigation hub**: answer-first hero with
airport search and a "find airports near me" action, three premium-depth navigation tiles
(drop-off / parking / lounges), a quieter secondary row, a single subtle partner deals
strip, email alerts, and the family cross-link.*

*This spec **extends**, and must stay consistent with, two existing specs — it does not
re-define the visual system:*
- *`docs/superpowers/specs/2026-06-11-visual-richness-design.md` — the depth/motion/brand
  kit (gradient-border cards, sheen, count-up, scroll reveal, ambient backdrop, `=Math`
  logo). Already built in `packages/ui` (`tokens.css`, `animated-number`, `answer-card`,
  `scroll-reveal`, `scroll-progress`, `ambient-backdrop`, `site-header`, `site-footer`).*
- *`docs/superpowers/specs/2026-06-12-affiliate-surface-expansion-design.md` /
  `2026-06-12-affiliate-activation-design.md` — the partner/AWIN model
  (`apps/parkmath/lib/partners.ts`, `partners.json`).*

## Goal (decided in brainstorm, 2026-06-13)

The home page's primary job is **routing — get the visitor into the right answer page
faster** (drop-off / parking / lounges), not converting on the home page itself. The heavy
affiliate conversion stays on the detail pages, where there is an airport in context for
clean per-airport attribution (`clickref=parkmath-<airport>`). The home page therefore stays
trust-first and calm; the partner presence is a **single, subtle, neutral-voice** strip, not
a storefront.

### Locked decisions

| Decision | Choice |
|---|---|
| Navigation model | **A — topic-tile hub** (keep answer-first hero; tiles for the core jobs) |
| Offer prominence | **Subtle deals strip** below the navigation, one offer only |
| Card visual language | **Premium depth** (glass-light depth via existing `.mf-edge` + shadows + hover `.mf-sheen`) |
| "Shine" | **Slow, occasional, randomised glint** on the 3 primary tiles only — *not* a constant sweep |
| Nearest airports | **Button-triggered browser geolocation**, computed client-side (no auto-prompt, no IP geo) |
| Deals-strip CTA target | Routes to `/airport-parking` (the parking hub), **not** a raw affiliate link |

## Page structure (top → bottom)

1. **Site header** — unchanged (`SiteHeader`, already in `layout.tsx`).
2. **Hero** — unchanged headline ("What does it cost to *drop someone off* at a UK
   airport?") + lead copy + `AirportSearch`. Keeps the existing faint `UkMap` watermark.
   **New:** a "Find airports near me" action directly under the search (see §Nearest
   airports). The answer-first content is server-rendered and works with JS off.
3. **Stat strip** — keep the three live numbers (`StatStrip`): most-expensive drop-off,
   airports charging, still-free. Numbers count up via `AnimatedNumber`. This is how the
   page keeps "live data" energy *without* loading numbers onto the tiles (which is why
   plain tiles read well here).
4. **Primary navigation tiles (×3)** — `NavTileGrid` of three `NavTile`s:
   - Drop-off charges → `/drop-off-charges` — "Compare every UK airport in one table"
   - Airport parking → `/airport-parking` — "Gate price vs pre-book — what you save"
   - Airport lounges → `/airport-lounges` — "Pay-per-visit or membership break-even"
   Each: line-art/Tabler-style icon + title + one-line descriptor + arrow. Premium-depth
   styling + the slow glint (§Visual language).
5. **Secondary row (×3)** — quieter, smaller link tiles (no glint, lighter elevation):
   Price index 2026 → `/parking-price-index-2026`, Travel news → `/news`, Open data (CSV)
   → `/data`. Signals breadth without competing with the primary tiles.
6. **Deals strip (×1)** — single subtle partner band (§Deals strip).
7. **Email alerts** — `EmailCaptureSlot`, unchanged hook ("Get notified when any UK airport
   changes its drop-off fees").
8. **Family cross-link** — `FamilyLinks` / footer "Part of the =Math family", unchanged.

Net change vs. today: the bare underlined text links become real navigable tiles; a
secondary breadth row and one deals strip are added; the hero gains a near-me action.

## Visual language — "premium depth"

Reuse the existing kit; **do not** introduce a parallel card style.

- **Resting tile:** white surface, `--shadow-card`, `--radius-card` (12px), `.mf-edge`
  (gradient hairline — lit-from-above).
- **Hover/focus:** lift to `--shadow-raised` + 2px translateY, `.mf-sheen` one-shot sweep,
  `.mf-press` scale on touch, visible 2px accent focus ring.
- **Slow glint (new):** a low-brightness diagonal sweep on the **3 primary tiles only**,
  fired on a **randomised interval** so it never feels metronomic. Tuned defaults from the
  brainstorm tuner: **interval ~10s ±35% jitter, sweep ~1.8s, peak opacity ~0.14**, plus a
  glint on hover. These are the starting values and live as CSS variables for easy tuning.
  - New token `.mf-glint` in `packages/ui/src/tokens.css` (diagonal-sweep keyframe; distinct
    from the one-shot `.mf-sheen` and the once-per-page conic `.mf-edge-shine`).
  - New client controller `GlintController` (`packages/ui`), sibling to `ScrollReveal`:
    selects `.mf-glint` nodes, schedules randomised sweeps, **pauses off-screen** via
    IntersectionObserver, and is fully inert under `prefers-reduced-motion`.
  - **Consistency note:** the visual-richness kit reserves the heavy conic `.mf-edge-shine`
    for *one* element per page (the answer card). The home page has no single answer card,
    so it uses the lighter ambient `.mf-glint` across the three primary tiles instead —
    keeping "one ambient shine treatment per page" in spirit, not three competing effects.
- **Backdrop (so depth reads):** the page already renders inside `AmbientBackdrop`
  (masked dot-grid + drifting blobs) from `layout.tsx`; the primary-tile band sits on a
  subtle brand-tinted surface so the depth/glint refract against something rather than
  floating on flat white. No new heavy `backdrop-filter` layers (mobile LCP guard).

## Components

**Reuse (no change):** `AirportSearch`, `StatStrip`, `FeeStat`, `EmailCaptureSlot`,
`FamilyLinks`, `UkMap`, `AnimatedNumber`, `ScrollReveal`, `ScrollProgress`,
`AmbientBackdrop`, `SiteHeader`, `SiteFooter`, `LatestUpdates`/`NewsCard` (if the news
secondary tile wants a teaser later — not required for v1), `partners.ts`
(`resolveSlot`/`buildAwinLink`), `formatPence`, `webSiteLd`/`JsonLd`.

**New — shared (`packages/ui`):**
- `NavTile` — presentational server component: `{ href, icon, title, descriptor }`. Renders
  an `<a>` (crawlable) with premium-depth classes. RoamMath can reuse it.
- `NavTileGrid` — responsive grid wrapper; applies `.mf-reveal` stagger + the `.mf-glint`
  marker to its children.
- `GlintController` — client controller for the slow glint (above).
- `.mf-glint` token added to `tokens.css`.

**New — ParkMath (`apps/parkmath/components`):**
- `NearbyAirports` — client component (§Nearest airports).
- `DealsStrip` — partner band (§Deals strip).

**New — pure util (`packages/engine`, TDD):**
- `haversineKm(a, b)` + `nearestAirports(lat, lng, airports, n)` in
  `packages/engine/src/geo-distance.ts`. Pure, no DOM, unit-tested alongside the existing
  engine tests. (Lives in `engine`, not `geo` — `packages/geo` is structured-data/JSON-LD,
  not geography.)

## Nearest airports (button-triggered)

- A **"Find airports near me"** button sits under the airport search. It does **not**
  auto-prompt — it triggers `navigator.geolocation.getCurrentPosition` only on tap, which
  fits the trust brand and the `/privacy` stance.
- On success: compute the nearest **3** airports with `nearestAirports()` against the
  `lat`/`lng` already stored per airport (the same fields `UkMap` consumes), and reveal
  small "near you" rows: **airport name · distance (mi) · drop-off fee · open →**, each
  linking to that airport's drop-off page.
- **Privacy:** position is read and the distance computed **in the browser**; coordinates
  are never sent to a server. State this inline near the button.
- **Fallbacks:** permission denied, geolocation unavailable, or JS off → the button hides
  itself (or is never rendered) and the user keeps the normal `AirportSearch`. Nothing about
  the answer-first page depends on it.
- **Out of scope:** IP-based / Vercel-edge geo guessing (less accurate, adds a server hop) —
  revisit later if button uptake is low.

## Deals strip (compliant copy + attribution)

⚠️ **Copy correction vs. the brainstorm mockups.** The mockups showed *"save up to 25%"*.
That **violates** the visual-richness brand rules, which list *"discount-percentage
anchoring"* among patterns **explicitly avoided** (it is the parking-reseller move; ParkMath
always shows **absolute £** in a neutral-referee voice with `*`-marked affiliate links). The
deals strip must therefore **not** anchor on a percentage.

- **Voice:** neutral referee, not promotional. Frame as the do-nothing-baseline insight the
  brand already uses elsewhere ("pre-booked usually beats the gate"), without a % or a
  fabricated home-page £ (the figure is airport-specific, and there is no airport in context
  on the home page).
- **Proposed copy:** headline *"Pre-booking parking usually costs less than the gate price"*;
  sub-line with the affiliate disclosure *"\*We may earn commission. We show absolute prices
  and stay neutral."*; CTA *"Compare parking \*"* → `/airport-parking`.
- **Routing, not raw link:** the CTA goes to `/airport-parking`, where the visitor picks an
  airport and the **tracked, per-airport** affiliate CTA fires (clean attribution). The home
  page never emits a generic `parkmath-home` affiliate click.
- **Partner source:** the active partner/slot comes from `partners.ts` (`resolveSlot`); if no
  partner slot is active the strip renders the same neutral "compare parking" routing line
  without affiliate framing or disclosure (graceful, config-driven).
- **Single instance:** exactly one deals strip on the page.

## Responsive

- Primary tiles: 3-col desktop → 2-col tablet → 1-col mobile. Secondary row likewise.
- Mobile-first (most traffic is mobile): hero search full-width; "near me" button and tiles
  are ≥44px touch targets; stat strip wraps to 3-up / stacked.
- The `UkMap` watermark stays desktop-only (already the case); ambient backdrop unchanged.

## Accessibility & performance guardrails

- WCAG AA contrast (≥4.5:1) preserved, including text over the tinted tile band — verify the
  descriptor text against the tint.
- Visible 2px accent focus rings on tiles, the near-me button, and the deals CTA; never
  removed. Icon-only elements get `aria-label`; decorative icons `aria-hidden`.
- `prefers-reduced-motion`: count-up → instant, glint/sheen/reveal off (handled by the
  existing kit + the new `.mf-glint` rule).
- Performance: no new heavy `backdrop-filter` layers; glint and reveals are
  transform/opacity only and pause off-screen; tiles are real `<a>` links (crawlable, SSR'd);
  LCP stays the server-rendered hero text; CLS 0. Geolocation + count-up + glint are all
  progressive enhancements.
- SEO/GEO: keep `webSiteLd` JSON-LD; headline and tile links server-rendered.

## Micro-animation summary (all reuse the kit)

| Animation | Where | Mechanism |
|---|---|---|
| Count-up | stat strip | `AnimatedNumber` |
| Stagger reveal | tile rows, sections | `.mf-reveal` + `ScrollReveal` |
| Hover sheen + lift + press | primary tiles | `.mf-sheen` + `--shadow-raised` + `.mf-press` |
| Slow occasional glint | 3 primary tiles | **new** `.mf-glint` + `GlintController` |
| Scroll progress | page | `ScrollProgress` (already in layout) |
| Deals strip slide-in | deals strip | `.mf-rise-in` |
| Near-me results reveal | nearby list | `.mf-reveal` stagger after geolocation resolves |

## Testing

- **Pure unit (TDD):** `haversineKm` (known-distance pairs) and `nearestAirports` (ordering,
  `n` bound, ties) in `packages/engine/tests`.
- **Component:** `NavTile`/`NavTileGrid` render crawlable `<a>`s with correct hrefs;
  `DealsStrip` renders the disclosure and routes to `/airport-parking` when a partner is
  active, and the neutral non-affiliate variant when none is active (no `%` anywhere in
  output); `NearbyAirports` renders nothing destructive without geolocation.
- **Constraint:** reuse the **existing** vitest config — **never create a new vitest/vite
  config file on this volume** (esbuild `build()` deadlocks on the TB4 volume).
- **Playwright e2e:** tiles navigate to the right routes; `prefers-reduced-motion` disables
  glint/sheen; deals CTA lands on `/airport-parking`; near-me button is keyboard-operable.

## Out of scope (YAGNI)

- IP-based / edge geolocation.
- A per-airport aggregate page (the "everything for your airport" promise of brainstorm
  option B).
- Dark mode (still a later phase).
- Activating additional AWIN partners (Airparks / Purple Parking toggles, APH / Heathrow
  Parking onboarding) — config-only, handled by the affiliate specs.
- RoamMath home-page changes (it inherits `NavTile`/`NavTileGrid` if/when wanted; no fork).
- The `=Math` logo / header work (owned by the visual-richness spec).
