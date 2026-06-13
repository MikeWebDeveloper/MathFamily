# P2 (slice 2) — Reactive Answer-First Lounge Page

*Replicates the proven parking reactive pattern
(`docs/superpowers/specs/2026-06-13-p2-reactive-parking-pilot-design.md`,
`apps/parkmath/components/parking-answer.tsx`) onto the lounge break-even page
`apps/parkmath/app/airport-lounges/[airport]/page.tsx`. Same principle: the SSR hero answer and
the live calculator must be one reactive source of truth that can never disagree.*

## The pattern to apply
The lounge page presents a **visits-per-year → break-even** decision (pay-as-you-go vs a lounge
membership, e.g. Priority Pass tiers) with a slider. Today (like the old parking page) the SSR
answer/verdict is computed for a fixed default while a client calculator owns its own state — so
changing the slider can leave the hero verdict / tiers / recommendation frozen.

Fix: a single client component **`LoungeAnswer`** (`apps/parkmath/components/lounge-answer.tsx`,
`"use client"`) that:
- owns the `visitsPerYear` state (default = the current SSR default),
- computes ALL outputs from one call to the existing **pure** lounge engine function (in
  `packages/engine/src/lounge.ts`) on every change — no second client-only number,
- renders the hero verdict (which option wins + the saving), the pay-as-you-go vs membership tier
  comparison, and the plain-English recommendation, all from that single computation.

SSR renders at the default visits (correct, crawlable, works JS-off); the client initialises to the
same default (no hydration mismatch / CLS). Keep the page **static** (`dynamicParams=false`, no
`searchParams`). Use relative imports inside the component (the `@/` alias does NOT resolve in
config-less vitest — this bit the parking pilot).

## Out of scope
- Roaming page (next slice), URL-shareable state, the formal CWV perf gate.
- Any lounge affiliate CTA changes beyond what already exists (membership links).

## Acceptance criteria
- Moving the visits slider updates the hero verdict, the tier comparison, and the recommendation
  **together** — nothing frozen.
- The default-visits answer renders with JS off (SSR).
- Page stays static (`●`); both apps `next build`; no CLS on slider change.
- Reuse the pure lounge engine fn for both SSR and client (single computation path).

## Testing (repo conventions; never create a vitest config)
- **engine (plain vitest):** the lounge break-even fn is likely already tested — add/confirm a case
  at a couple of visit counts (below/above break-even) asserting the correct winner + saving.
- **component (renderToStaticMarkup):** `LoungeAnswer` SSR at the default visits renders the hero
  verdict + the visits control + the tier comparison.
- **e2e (Playwright):** moving the slider (or stepping it) changes the rendered verdict text.
- If a superseded `lounge-calculator.tsx` becomes unused, remove it + any test.

## Branch
`design-upgrade-p2-lounge` (stacked on `design-upgrade-p2` / PR #6). Ships as its own stacked PR.
