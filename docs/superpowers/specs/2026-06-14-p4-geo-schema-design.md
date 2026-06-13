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

## Deferred (P4b follow-up)

- **Dataset / Speakable schema** — defer; needs content strategy for `speakable` CSS selectors
- **Product + Offer** per-page schema — defer; each airport detail page is a separate task
- **Per-page 40–75-word answer rewrites** — content work, out of scope for this slice
- **Named-Person entity graph** — not built; authorship kept at brand/Organization level only (no fabricated persons)
- **RoamMath open-data band** — roammath does not yet have `/data/*.csv` routes; defer until open-data export is added for roaming/baggage datasets
- **`organizationLd` publisher on non-NewsArticle pages** — the Organization `@id` is already referenced by `datasetLd.creator`; adding a top-level `publisher` property on WebPage/Dataset is a minor enhancement deferred to P4b

---

## Verification

- `pnpm typecheck` — 7/7 clean
- `pnpm test` — all pass (including new `open-data-band.test.tsx`)
- `pnpm --filter parkmath exec next build` — static routes ✓
- `pnpm --filter roammath exec next build` — static routes ✓
