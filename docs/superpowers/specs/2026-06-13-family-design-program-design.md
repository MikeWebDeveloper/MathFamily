# Math Family — Design Upgrade Program ("The Verified Instrument")

*This is a **program spec**, not a single implementation plan. It sets the chosen direction
and a decomposed, phased roadmap; each phase becomes its own spec → plan → implementation
cycle (the way the home-hub redesign in PR #2 was executed).*

**Inputs (do not re-derive):**
- Research: `docs/design-audit/2026-06-13-family-redesign-research.md` (48-agent swarm — 19 page
  audits, 6 benchmarks, 20 personas/journeys, synthesis + critic). Audit averages: ux 3.0 ·
  visual 3.1 · a11y 2.8 · seo 2.9 · **conversion 2.4** · 57 high-severity findings.
- Prior design system: `DESIGN.md`, `docs/superpowers/specs/2026-06-11-visual-richness-design.md`,
  `packages/ui/src/tokens.css`.
- Validated mockups: `docs/design-audit/stitch-verified-instrument/` (3 Stitch screens, on the
  "Precision Fintech" design system).
- Decision (2026-06-13): direction = **The Verified Instrument**; whole Math family (ParkMath +
  RoamMath + shared `packages/ui`); full roadmap P0→P5 with the critic's fixes folded in.

## Direction — The Verified Instrument

Evolve the trust DNA rather than relaunch the look. The differentiator competitors can't fake:
**every number is live, sourced, dated, and shareable.** Visual register stays the existing
navy (ParkMath) / teal (RoamMath) calm-fintech identity — reuse the `Precision Fintech` tokens,
evolve, don't replace.

Principles:
1. **Answer-first is literal** — the verified figure is the LCP element, above all chrome, on every page.
2. **One reactive source of truth per page** — SSR hero and live calculator can never disagree.
3. **Freshness is confidence, not a timestamp** — deltas ("unchanged since last check"), oldest-row honesty, human-voice verification.
4. **Transparency is the brand** — full cost as line items; the affiliate price sits *beside* the verified one; disclosure *before* the CTA.
5. **Restraint** — neutral-dominant surfaces; the single accent glow reserved for the one recommendation per screen.
6. **Built for relay** — copy / share / print every answer (the dominant real-world job across the 20 journeys).

The other two researched directions are **emphases on this spine, not alternatives**: *Open Data
Pressroom* → the GEO/citation work in **P4**; *Premium Depth* → the polish layer in **P5**.

## Roadmap (each phase = its own spec → plan → implement → PR)

- **P0 — Design-system foundation (shared `packages/ui`, both brands).** Split `tokens.css` into
  brand-primitive + semantic-alias layers behind a `[data-theme]` dark block (no visual change).
  System-wide a11y + touch-target pass: SegmentedControl + all nav/cross-links → 44px, custom
  focus-visible rings, ARIA-disclosure FaqAccordion, a live-region/`role=alert` helper, `@supports`
  fence on `mf-edge-shine`. **(critic add)** introduce `loading.tsx`/Suspense boundaries per route
  (parkmath + roammath) so AT users get progressive announcement, not silence. Add ~5–8 semantic
  stroke icons; density/cell tokens; FeeGrid gains `rowHref`/`highlightRow`/`highlightColumn` +
  correct numeric-column defaults + a persistent cross-breakpoint winner; StatStrip dynamic columns;
  GlintController no-op guard. *Highest-leverage, lowest-risk; unblocks every later phase.*
- **P1 — Truth & freshness correctness (data + copy).** Kill hardcoded copy that drifts from data;
  honest empty states (gate-only parking, free-airport gotchas, null prior-year, missing
  destinations → graceful 404 with nearest alternatives); FreshnessBadge shows oldest-row/delta +
  en-GB dates; surface `verifiedAt` on news. **(critic add)** **Airalo activation is a P1 trust
  bug**, not a P3 conversion item — a dead eSIM CTA breaks the verified-instrument promise; if the
  partnership slips, suppress the slot or show "coming soon" with a direct link / substitute
  (Holafly/Saily).
- **P2 + P3 — Reactive answer-first fold + conversion/affiliate integrity (COUPLED).** *(critic:
  these share one root cause and must ship together — the calculator output must be the
  authoritative source for the affiliate CTA.)* Unify SSR hero and live calculator into one
  URL-param-driven source of truth (`?days=14`) across parking hub/duration, lounge, roaming
  country/network; the verified hero number is the LCP. Then: token-swap affiliate cards into the
  system, fix CTA hierarchy (affiliate primary, official secondary), disclosure before CTA, show a
  concrete affiliate price/saving beside the verified figure, promote BookingOptions below the
  calculator + winner-row "book this", add copy/share/print + URL-encoded state.
  **(critic add) PERFORMANCE GATE:** this phase carries a Core Web Vitals budget — LCP / CLS / INP
  acceptance thresholds, Suspense boundaries + layout-matched skeletons for the SSR→client swap.
  No sub-phase ships if it regresses CWV (the SEO channel the answer-first work is meant to win).
- **P4 — GEO / schema / editorial extractability (the Open Data emphasis).** Schema sweep on index
  pages (BreadcrumbList/FAQPage/Dataset/Product+Offer/Speakable); answer-first 40–75-word passages
  with question-form H2s; lead with the peak figure; charts embedded with accessible HTML-table
  twins + OG images; "Cite this table" + CSV bands; compiler byline + Organization/Person entity
  graph. Sequenced after correctness so cited data is accurate.
- **P5 — Premium depth & motion polish (the visual layer) + dark mode.** Layer
  elevation/winner-edge/count-up/skeleton/microstate system onto home hubs and winner moments,
  motion-safe + Safari-fenced, with mobile depth fallbacks (IATA+city pill) and the dark theme
  enabled by the P0 token split. Colour-blind-safe winner/positive cues (icon+label, not hue alone).
  Last, because it adds surface after the substance is solid; gated by CWV + reduced-motion.

## Personas to carry through every phase (critic gaps)

- **Cross-brand "going abroad by car" traveller** — needs parking + drop-off + roaming in one
  session; ParkMath/RoamMath are separate domains with no shared search or combined-cost answer.
  *Highest-value unaddressed segment* — evaluate a cross-brand link/combined answer in P2/P4.
- **Repeat / alert subscriber** — the email/news/freshness machinery targets this person but no
  journey validates the re-engagement loop; instrument it.
- **Assistive-technology-primary user** — write an AT journey to give the P0 a11y pass real
  acceptance criteria (which gaps cause task *failure* vs friction).
- **Data journalist / AI crawler** — gives P4's schema work a testable success condition (a concrete
  query/publication to win), not just an asserted "citation rate".

## Success criteria

- Lift audit dimension averages, prioritising **conversion (2.4→≥3.5)** and **accessibility
  (2.8→≥4.0, WCAG 2.2 AA / EAA)**; visual + SEO to ≥4.0.
- Core Web Vitals stay green (no LCP/CLS/INP regression) at every phase — explicit gate in P2+P3/P5.
- Per phase: a short spec, a TDD plan, subagent-driven execution, and a PR with the existing
  test/typecheck/build/e2e gates green (as the home-hub PR did).

## Out of scope (for now)

- A full pivot to the Open Data Pressroom *product* (kept strictly as the P4 emphasis).
- Net-new brands/domains; AWIN onboarding beyond Airalo activation (portfolio constraints unchanged).
- Implementing all phases at once — they ship sequentially, P0 first.

## Next step

Start **P0 (design-system foundation)** as the first sub-project: it's shared, lowest-risk,
highest-leverage, and unblocks everything. It gets its own spec → writing-plans →
subagent-driven-development → PR.
