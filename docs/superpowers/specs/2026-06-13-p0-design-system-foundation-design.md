# P0 — Design-System Foundation (Accessibility & Touch Targets)

*First sub-project of the design-upgrade program
(`docs/superpowers/specs/2026-06-13-family-design-program-design.md`). Shared `packages/ui`
work that lifts BOTH apps. Scoped to the **non-optional, lowest-risk** foundation — WCAG 2.2 AA /
EAA accessibility primitives, 44px touch targets, and route loading boundaries — because these
recur across nearly every page in the research audit (a11y avg 2.8/5) and unblock every later
phase. Heavier system work (tokens.css primitive/semantic split + dark scaffold, FeeGrid prop
expansion, StatStrip dynamic columns, new icons, density tokens) is **deferred to P0b** to keep
this PR tractable.*

**Test conventions (per repo):** `packages/ui` tests use Vitest + jsdom + `@testing-library/react`
(`// @vitest-environment jsdom` first line); the apps use `renderToStaticMarkup`. **Never create a
vitest/vite config file** (esbuild deadlocks on this volume). loading.tsx changes are verified via
`next build` + Playwright e2e, not unit tests.

## In scope

### 1. Touch targets → 44px (WCAG 2.2 AA "Target Size")
- `SegmentedControl` (`packages/ui/src/segmented-control.tsx`): each option button `min-h-9` → `min-h-11` (44px). This control is the primary affordance on the comparison/sort and duration screens; the research cites it on multiple pages. Verify pills still fit at 390px.
- Audit other shared interactive controls for sub-44px heights and bring nav/cross-link tap targets to ≥44px where they fall short (do not change visual weight beyond height/padding).

### 2. Visible focus rings on every interactive shared element
- `EmailCaptureSlot` (`packages/ui/src/email-capture-slot.tsx`): submit button gains `outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/40`; the input gains an explicit `focus:ring-2 focus:ring-brand-accent/30 focus:outline-none` (audit flagged both as missing).
- Sweep the other shared interactive components; any with `outline-none` and no `focus-visible:ring-*` replacement gets the standard 2px accent ring. Never remove focus styling.

### 3. `FaqAccordion` ARIA disclosure
- `packages/ui/src/faq-accordion.tsx`: each question is a real `<button>` with `aria-expanded` and `aria-controls`; the answer panel has a matching `id` and `role="region"` (or appropriate). Keyboard: Enter/Space toggles; visible focus ring. No `display:none` content that traps reading order.

### 4. New shared `LiveRegion` / status-announcer component
- Create `packages/ui/src/live-region.tsx` exporting a small `LiveRegion` (visually-hidden `aria-live="polite" aria-atomic="true"`) and an `alert` variant (`role="alert"`). Replaces ad-hoc patterns and gives `NearbyAirports` (and future calculators) a way to announce state changes (e.g. "3 airports found near you", "Couldn't get your location"). Export from the barrel. Wire it into `NearbyAirports` (`apps/parkmath/components/nearby-airports.tsx`): announce locating/ready/error; the error `<p>` gets `role="alert"`.

### 5. Route loading boundaries (progressive announcement)
- Add `loading.tsx` to the parkmath and roammath app route groups (at least the root `app/loading.tsx` for each, plus the dynamic answer routes) rendering a layout-matched skeleton (reuse `.mf-skeleton`), so AT users get a progressive "loading" state instead of silence-then-full-paint. Confirm roammath has an `error.tsx` boundary (parkmath has one; add to roammath if missing).

### 6. `GlintController` no-op hardening
- `packages/ui/src/glint-controller.tsx`: confirm it cleanly no-ops when zero `.mf-glint` nodes exist and under reduced motion (it already early-returns) — add a guard/test so future pages without tiles never pay observer cost. (Small; mostly a regression test.)

## Out of scope (→ P0b and later phases)
- `tokens.css` primitive/semantic-alias split + `[data-theme]` dark scaffold.
- `FeeGrid` `rowHref`/`highlightRow`/`highlightColumn`/numeric-default/persistent-winner changes; `StatStrip` dynamic columns; new line-glyph icons; density/cell tokens. (All P0b — they're enhancements, not WCAG blockers.)
- Per-page application of these primitives beyond the wiring named above (that lands in P1–P5).

## Success criteria
- All shared interactive elements meet 44px and have a visible focus-visible ring.
- `FaqAccordion` passes keyboard + screen-reader disclosure expectations.
- `LiveRegion` exported, unit-tested (jsdom), and wired into `NearbyAirports`.
- `loading.tsx` present for both apps; `next build` succeeds; existing + new tests green; Playwright e2e still passes (home-hub spec unaffected).
- No visual regression beyond intended height/focus changes.

## Testing
- **ui unit (jsdom + @testing-library):** SegmentedControl renders 44px option buttons; FaqAccordion toggles `aria-expanded` and exposes `aria-controls`; LiveRegion renders polite vs alert variants; GlintController no-ops with no nodes.
- **app (renderToStaticMarkup):** NearbyAirports renders the live-region container and `role="alert"` error node.
- **e2e:** existing `home-dashboard.spec.ts` still green; add a check that a focused interactive element shows a focus ring (or at least is focusable) on a representative page.
- Reuse existing vitest configs only.

## Branch
Continue on `design-upgrade-p0`. Ships as its own PR (stacked on / after the home-hub PR #2).
