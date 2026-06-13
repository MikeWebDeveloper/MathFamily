# P2 (pilot) — Reactive Answer-First Parking Page

*First slice of P2+P3 (reactive answer-first fold + conversion/affiliate integrity), piloted on
ONE page — the airport parking gate-vs-pre-book hub
(`apps/parkmath/app/airport-parking/[airport]/page.tsx`) — to establish the pattern before
replicating to the lounge + roaming calculators. Renders the Stitch mockup #2 screen.*

**Inputs:** the program spec `docs/superpowers/specs/2026-06-13-family-design-program-design.md`
(P2+P3 bullet), the research doc, and the architecture scout (the divergence + the engine + the
`dynamicParams=false` constraint + the Option-A design are captured in the implementing prompt).

## The problem (verified by scout)
On the parking hub, `ParkingCalculator` is a client component with its own `useState(7)`; changing
duration updates only its own option list, while the SSR `AnswerLead` hero, `SavesVerdict`, the
FeeGrid winner, and `BookingOptions` (affiliate CTA, which shows no price at all) stay frozen at 7
days. The calculator also offers 1/28-day options the data doesn't cover. This is the
answer-first/verified-data contradiction the research flagged.

## Design — one reactive source of truth (Option A, no server `searchParams`)

The page stays **static** (`dynamicParams=false`, no `searchParams`). Server-side, pre-compute the
model for each **covered** duration (the days present in the data — `3, 7, 14`) using the existing
pure `parkingPageModel(record, days)` / `compareParking`. Pass those serializable models into a new
client component that holds the selected duration in state and renders everything from the selected
model.

- **New client component `ParkingAnswer`** (`apps/parkmath/components/parking-answer.tsx`,
  `"use client"`): props include the array of `{ days, model }` for covered durations, `defaultDays`
  (7), the airport `slug`, and the `officialUrl`. State: `useState(defaultDays)`. It renders, all
  from `models[selectedDays]`:
  1. a `SegmentedControl` of the covered durations (3 / 7 / 14 only — drops the uncovered 1/28),
  2. the answer/hero (the `AnswerLead`-style line + the gate-vs-pre-book figures + a `SavesVerdict`),
  3. the ranked option cards (cheapest crowned) from the model's comparison options,
  4. `BookingOptions` with the selected duration's `price` + `days`.
  Because every part reads the same `models[selectedDays]`, the hero, saves, cards and affiliate CTA
  can never disagree. SSR renders at `defaultDays` (correct + crawlable + works JS-off); hydration
  starts at the same default ⇒ no CLS; toggling re-renders the whole unit together.

- **Page change** (`[airport]/page.tsx`): replace the current
  `AnswerLead + SavesVerdict + ParkingCalculator + BookingOptions` block with the pre-computed
  `models` + `<ParkingAnswer …/>`. Keep the full all-durations `FeeGrid` table below as the
  reference grid. Keep `dynamicParams=false`; do NOT add `searchParams`. (`ParkingCalculator` is
  superseded on this page; leave the file if used elsewhere, otherwise remove it + its test.)

- **Affiliate hierarchy fix** (`apps/parkmath/components/booking-options.tsx`): accept optional
  `price?: number; days?: number`; show the affiliate offer "from £X for N days" beside the verified
  figure; reorder so the **affiliate CTA is primary and first**, the official-site link is
  secondary; move the **disclosure to immediately *before* the affiliate CTA**.

## Out of scope (this pilot)
- URL-shareable `?days=` persistence (a deep-link cosmetic flash trade-off) — add after the core is
  stable.
- Replicating the pattern to the lounge + roaming calculators — identical approach, separate PRs.
- Swapping `BookingOptions` for `HolidayExtrasCard` (token/cosmetic — P5).
- CWV instrumentation tooling — this pilot verifies CLS=0 by construction (SSR==hydration default)
  + a Playwright check; the formal perf gate is set up before the broader P2 rollout.

## Acceptance criteria
- Changing the duration updates the hero figure, saves verdict, option cards AND the affiliate CTA
  price **together** — no element stays frozen.
- The duration control offers only data-covered durations (3/7/14); no "No published price".
- With JS off, the 7-day answer renders correctly (SSR).
- `BookingOptions`: affiliate first/primary, disclosure before the CTA, affiliate price shown.
- Static generation preserved (`dynamicParams=false`, no `searchParams`); both apps `next build`.
- No CLS on toggle (numbers present at first paint; only re-render, no layout reflow).

## Testing (repo conventions; never create a vitest config)
- **engine (plain vitest):** `compareParking` already tested — add a 14-day case asserting the
  covered-duration path.
- **apps/lib (plain vitest):** a pure resolver — e.g. `coveredParkingDurations(tariff)` and/or
  `parkingPageModel(record, days)` for 3/7/14 — mapping duration → model; unit-test the mapping incl.
  that uncovered durations are excluded.
- **component (renderToStaticMarkup):** `ParkingAnswer` SSR at default 7 renders the 7-day hero + the
  duration control + a `BookingOptions` whose disclosure precedes the CTA and whose price is shown.
- **booking-options (renderToStaticMarkup):** assert affiliate-first ordering + disclosure-before-CTA
  (index of "Ad"/disclosure < index of the affiliate CTA) + the price string appears.
- **e2e (Playwright):** on a real airport page, toggling the duration updates the hero £ and the
  affiliate CTA together; the 7-day answer is present on load.

## Branch
`design-upgrade-p2` (stacked on `design-upgrade-p1` / PR #5 — foundation not yet merged to main).
Ships as its own stacked PR.
