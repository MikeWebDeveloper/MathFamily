# P4 GEO / Schema / Extractability — implementation notes

**Branch:** `design-upgrade-p4`  
**Date:** 2026-06-14  
**Scope:** Bounded P4a slice — BreadcrumbList, ItemList, OpenDataBand, publisher signal.

---

## What was built

### 1. BreadcrumbList on all six index pages

Added `breadcrumbLd([ {Home}, {section} ])` + `<JsonLd>` to every index page that lacked it:

| Page | Path |
|---|---|
| parkmath drop-off charges | `apps/parkmath/app/drop-off-charges/page.tsx` |
| parkmath airport parking | `apps/parkmath/app/airport-parking/page.tsx` |
| parkmath airport lounges | `apps/parkmath/app/airport-lounges/page.tsx` |
| parkmath price index 2026 | `apps/parkmath/app/parking-price-index-2026/page.tsx` |
| roammath roaming | `apps/roammath/app/roaming/page.tsx` |
| roammath baggage fees | `apps/roammath/app/baggage-fees/page.tsx` |

No new builder was required — `breadcrumbLd` already existed in `packages/geo/src/builders.ts`.

### 2. ItemList on parking-price-index-2026

The index page lacked an `ItemList`. Added one pointing to the two sub-sections (drop-off charges and airport parking), matching the existing in-page `<ul>` links.

### 3. OpenDataBand component

New shared server component at `packages/ui/src/open-data-band.tsx`.

**Props:**
- `downloads: { href: string; label: string }[]` — one or more CSV download links (rendered as `<a download>`)
- `citation: string` — short copyable citation string

**Placed on:**
- `drop-off-charges/page.tsx` — single CSV (`/data/drop-off-charges.csv`)
- `parking-price-index-2026/page.tsx` — two CSVs (drop-off + parking tariffs); replaces the old `<Callout>` that had inline download links but no citation line

Exported from `packages/ui/src/index.ts`.

### 4. Publisher signal

`organizationLd` already carries `{ "@id": "…/#organization" }` and `newsArticleLd` already sets both `author` and `publisher` to that Organization node. No fabricated Person entities or fake `sameAs` URLs were added. No change needed here — existing schema is correct.

### 5. Tests

- `packages/ui/tests/open-data-band.test.tsx` — three jsdom + @testing-library tests:
  - download links rendered with correct `href` + `download` attribute
  - citation string present in output
  - single-download variant

The `breadcrumbLd` builder already has a test in `packages/geo/tests/builders.test.ts`.

---

## Deferred (P4b follow-up) — ✅ SHIPPED 2026-06-14 (branch `design-upgrade-p4b`)

- ✅ **Speakable schema** — new `speakableLd` builder (`WebPage` + `SpeakableSpecification` targeting `["h1", ".mf-speakable"]`), wired on the 5 core answer pages (parking hub, lounge, drop-off, roaming country, baggage airline). The answer passages carry `.mf-speakable`.
- ✅ **Per-page 40–75-word answer passages** — new shared `AnswerPassage` (question-form H2 + `.mf-speakable` paragraph). Factual passages built from each page's already-verified figures (no invented numbers, no marketing %), placed just after the answer-first hero so it stays the LCP.
- ✅ **Named-Person entity graph** — `personLd` builder + `Organization.founder` (site-wide via both layouts) + `NewsArticle.author` = Person (Michal Latal, "Founder & editor", **no fabricated `sameAs`**). Visible `CompiledByline` on news articles. RoamMath layout now also emits `organizationLd` (previously had none).
- ✅ **RoamMath open-data export** — new `/data/roaming-charges.csv` + `/data/baggage-fees.csv` static routes (testable `roamingCsv()`/`baggageCsv()` row builders), `OpenDataBand` on both index pages, and `datasetLd` added to the baggage index (its Dataset claim previously pointed at no downloadable file).

### Still open (P4c / later)
- **Product + Offer** per-page schema is present where it matters (`offerLd` on drop-off detail, `aggregateOfferLd` on parking detail). Lounge/baggage detail single-Offer coverage is a minor future enhancement.
- **Dataset schema** on the parkmath `/data/*.csv` raw routes themselves — Dataset JSON-LD lives on the HTML index pages that link the CSVs (correct placement); no change needed.
- Dark-variant OG images; cross-brand "going abroad by car" combined-cost answer (ParkMath↔RoamMath).

---

## Verification

- `pnpm typecheck` — 7/7 clean
- `pnpm test` — all pass (including new `open-data-band.test.tsx`)
- `pnpm --filter parkmath exec next build` — static routes ✓
- `pnpm --filter roammath exec next build` — static routes ✓
