# P2 (slice 3) — Reactive Answer-First Roaming Page

*Final calculator-page slice of P2/P3. Mirrors the shipped parking + lounge reactive pattern
(`apps/parkmath/components/parking-answer.tsx`, `apps/parkmath/components/lounge-answer.tsx`) onto
the RoamMath roaming-vs-eSIM network page `apps/roammath/app/roaming/[country]/[network]/page.tsx`.*

## Problem (scouted)
The page computes the hero answer + eSIM verdict callout once server-side at hardcoded `days=7,
dataGb=5` (`roamingTripCost([networkData], …, 7, 5)`), while `RoamingCalculator` owns its own
`useState(7)/useState(5)` and updates only its own result block — so moving the sliders leaves the
hero, verdict, and eSIM affiliate CTA frozen. (The calculator is also run against all four networks
while the hero uses the single URL network — they can disagree on the winner.)

## Design
New `apps/roammath/components/roaming-answer.tsx` (`"use client"`): owns `days` (7) + `dataGb` (5)
state; makes ONE `roamingTripCost([networkOption], esimBundles, days, dataGb)` call per render;
renders the hero answer, the your-network-vs-eSIM comparison, and the eSIM CTA all from that single
result — one source of truth. Props are all serializable (`networkOption`, `esimBundles`,
`networkLabel`, `countryName`, `countrySlug`, `esimSlot: ResolvedSlot`, default days/data). SSR
renders at the defaults (crawlable, JS-off). Keep the page **static** (`dynamicParams=false`, no
`searchParams`). The page keeps its JSON-LD / FAQ / breadcrumb / SourcesBlock scaffolding server-side.

eSIM CTA (reuses the P1 `resolveSlot("esim", …)` wiring, passed in as a resolved slot): affiliate
primary + disclosure BEFORE the CTA when `kind==="affiliate"`, else a quiet official-site link;
shown only when `esimChoice !== null && !networkOption.included`.

**Roaming gotcha:** when `networkOption.included` is true the network cost is £0 — the hero says
"roaming included at no extra charge" and the eSIM CTA is suppressed (don't sell an eSIM when it's
free).

Use RELATIVE imports inside the component (`@/` doesn't resolve in config-less vitest).

## Out of scope (defer)
- The country-level page (`roaming/[country]/page.tsx`, all-four-networks) — separate slice.
- URL-shareable state; flipping Airalo `active:true` (a one-line config PR once AWIN approves — the
  component already handles both affiliate/official).

## Acceptance
- Sliders update hero + verdict + eSIM CTA together (no frozen element).
- `included` network → "included" hero + no eSIM CTA.
- Route stays static (`●`); `next build` passes; SSR renders defaults JS-off.

## Testing (roammath uses `renderToStaticMarkup`; never create a vitest config)
- `apps/roammath/tests/roaming-answer.test.tsx`: SSR hero at defaults; disclosure-before-CTA when the
  slot is affiliate; CTA absent when the network is `included`; warnings render.
- Engine `roaming-trip.test.ts` already covers `roamingTripCost`.
- Keep `roaming-calculator.tsx` (still used by the country page).

## Branch
`design-upgrade-p2-roaming` off `main`. PR → merge to main when green.
