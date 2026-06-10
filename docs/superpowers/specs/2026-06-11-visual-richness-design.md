# Math Family — Visual Richness & Brand Identity Design

*Second elevation pass. The first pass (DESIGN.md, commit 7260ea0) added IBM Plex, layered
shadows, hover lifts and scroll reveals — but the pages still read as white cards on an
off-white background: clear, not stunning. This pass adds atmosphere, graphic identity,
shining edges, a microanimation kit, and the family logo, while keeping the trust-first
"calm instrument" positioning. Target level: **premium fintech** (Stripe/Linear polish),
not bold-and-showy.*

## Goals

1. Pages no longer look empty — every screen has atmosphere and at least one
   data-graphic decoration (map, flag, glyph), all at low opacity behind content.
2. A distinctive, shared **=Math logo system** that carries across ParkMath, RoamMath
   and every future {Prefix}Math brand.
3. Cards with depth and "shining edge" treatments; a consistent microanimation kit.
4. Information clarity measurably better than the competitive set (Omni Calculator,
   MoneySavingExpert, parking resellers, eSIM comparison sites) — researched 11 Jun 2026.
5. Zero cost to the product's trust signals, SEO/GEO performance, or accessibility.

## Competitive grounding (what we beat, specifically)

- **Omni Calculator** buries the answer in a form row → we celebrate it as the page's
  largest element and keep it on screen permanently (sticky mini-answer bar).
- **MoneySavingExpert** has gold-standard data but buries caveats in footnotes and
  date-stamps only the page → we render caveats as inline chips and verify per figure.
- **Parking resellers** (SkyParkSecure et al.) anchor on "up to 70% off", stock beach
  photos, badge clusters → we always show absolute £, use line-art not photos, and hold
  a neutral-referee voice with `*`-marked affiliate links.
- **eSIM sites** (esimdb, Airalo) prove the flag-chip country grid; none compute the
  do-nothing baseline → we show "your network's default cost vs best alternative" on
  every RoamMath calculation.
- **Stripe/Linear** supply the polish techniques (CSS-only approximations below).

Patterns explicitly avoided: discount-percentage anchoring, discount-code fields,
trust-badge clusters, stock photography, urgency framing, competing CTAs.

## 1. Atmosphere & page graphics

- **UK map watermark (ParkMath).** Airport pages: single-colour UK outline SVG, navy at
  6–8% opacity, right-of-hero on desktop / behind-hero on mobile. The airport's location
  is an accent dot with a slow radar-pulse ring (2s loop, opacity+scale only). Home page:
  same map with all tracked airports as faint dots ("we cover the whole country").
- **Region map + flag watermark (RoamMath).** Country pages: faint world outline map
  with the destination country filled at low opacity, plus the country flag as a large
  ~5% opacity hero watermark. Country selector uses full-colour small **flag chips**.
- **No photography.** Custom line-art glyph set in brand style (plane silhouette, runway
  chevrons, control tower, luggage, SIM/globe) used sparingly at low opacity as section
  accents (e.g. runway-dash section dividers on ParkMath).
- **Ambient background.** Site-wide masked dot-grid texture (navy ~4%) fading out below
  the hero. Heroes add 2–3 large blurred radial-gradient blobs (brand/accent, low alpha)
  drifting on a 60–90s transform loop — CSS stand-in for Stripe's WebGL mesh. All
  decorative layers: `pointer-events: none`, `aria-hidden`, paused under
  `prefers-reduced-motion`, never behind body text.

## 2. Cards & shining edges

- **Resting cards:** keep two-stop soft shadow; replace flat hairline with a **gradient
  hairline border** (brighter top edge, fading bottom — mask-composite technique). Cards
  read as lit from above.
- **Answer card (one per page):** deep navy surface, inner top highlight, the big IBM
  Plex Mono number, and a **conic-gradient shining edge** — a soft accent highlight
  travelling the perimeter on an ~8s loop. Used exactly once per page.
- **Winner card** (cheapest option / best plan): static brand-tinted ring + faint outer
  glow + small crown label.
- **Hover sheen:** interactive cards keep the 2px lift and add a one-shot diagonal light
  sweep (~500ms, transform/opacity). Touch devices skip the sheen; press state scales
  to 0.99.
- **Tables:** zebra + row hover stay; row hover adds a 2px brand left-rule slide-in.

## 3. The =Math logo system

- **Glyph:** a rounded-square tile (a single calculator key) carrying a bold equals
  sign — "the moment you get the answer". Reads at 16px favicon; scales to app icon and
  OG stamp.
- **Per-brand encoding:** top bar of the `=` takes the brand colour (ParkMath navy/blue,
  RoamMath teal); bottom bar constant ink. One SVG, CSS-variable swap.
- **Wordmark:** `[=] ParkMath` — glyph tile + prefix in brand colour (700) + "Math" in
  ink (700), IBM Plex Sans, tightened tracking.
- **Motion:** one-time bar slide-in on load (~400ms, once per session); header hover
  tilts the tile 3°. Nothing else.
- **Placement:** header lockup, favicon, OG images (existing `opengraph-image.tsx`
  templates), footer "Part of the =Math family" cross-link block.

## 4. Microanimation kit

| Animation | Trigger | Spec |
|---|---|---|
| Count-up answer | calculator input change | ~250ms numeric roll, mono tabular figures, no layout shift |
| Verified pill | first reveal | fade in, then green tick draws itself, 300ms total, once |
| Slider feedback | drag | accent glow on thumb; output crossfades |
| Warning chip | threshold crossed | 8px slide-in |
| Stagger reveal | scroll into view | 40ms stagger, 16px rise; section headings grow a short accent underline |
| Button press | press | scale 0.98; primary CTA hover shifts its gradient |
| Email success | submit | drawn tick + "you're on the list" |
| Map radar pulse | ambient | 2s loop |
| Answer-card edge shine | ambient | ~8s loop |

**Hard rules:** interaction feedback ≤300ms; one-time entrances (logo slide-in, scroll
reveals, hover sheen) ≤500ms; only the two ambient loops run continuously and both
pause off-screen (IntersectionObserver); transform/opacity only; everything off under
`prefers-reduced-motion`; nothing animates layout.

## 5. Information clarity

- **Sticky mini-answer bar:** after the answer card scrolls away, a slim sticky bar
  shows "LGW drop-off · £7 / 10 min · ✓ verified".
- **Caveats as chips:** time limits, penalties, fair-use caps, auto-disconnects render
  as amber chips on the result line — never footnotes.
- **Per-number verification:** every price carries its own "✓ <date>" micro-stamp;
  tapping reveals the official source link (data already maintained by the freshness
  watchdog).
- **Do-nothing baseline:** calculators always show the cost of inaction next to the
  best option ("EE default: £33.60 — best eSIM: £8.50"; "Drive-up £430 — pre-booked
  £51"). Absolute £ always.
- **One verdict:** every comparison ends with a highlighted plain-English sentence
  ("Pre-book — it saves £37").
- **Referee block:** "Sources & method" gains an independence statement and `*`-marked
  affiliate links (MSE convention).

## 6. Architecture

- **`packages/ui` new components:** `answer-card`, `mini-answer-bar`, `caveat-chip`,
  `brand-logo`, `uk-map` / `region-map`, `ambient-backdrop`; new tokens/keyframes in
  `tokens.css` (gradient borders, sheen, edge shine, radar pulse).
- **Assets:** UK outline + world single-path SVGs; line-art glyph set; vendored SVG
  flags from the MIT-licensed circle-flags set, tracked countries only. No runtime
  dependencies.
- **Data:** `packages/data/datasets/airports.json` gains `lat`/`lng` per airport.
- **Branding:** RoamMath inherits via the existing teal `@theme` override; no forks.
- **Performance budget:** no WebGL, no animation libraries, no new JS deps; ambient
  layers are absolutely-positioned CSS behind content; LCP remains the server-rendered
  answer text; CLS 0; nothing decorative loads before the answer; answer readable with
  JS off (unchanged rule).
- **Accessibility:** decorative layers `aria-hidden`; text contrast unchanged; focus
  rings untouched; reduced-motion disables all animation including ambient loops.

## 7. Testing

- Component tests via the existing vitest setups (constraint: never create new
  vitest/vite config files on this volume — reuse existing configs only).
- Playwright e2e additions: sticky mini-answer bar appears after scrolling past the
  answer card; `prefers-reduced-motion` disables animations; caveat chips render for
  penalty cases; logo renders in header/footer.
- Existing content/partner tests untouched.

## Out of scope

- Dark mode (still a later phase).
- Animated/flip-digit "departure board" numbers (approach B element — revisit only if
  the count-up feels flat in practice).
- Photography of any kind.
- New domains, Awin onboarding, Ltd setup (portfolio constraints unchanged).
