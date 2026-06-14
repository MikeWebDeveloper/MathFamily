# Cross-brand "Going abroad by car" — ParkMath combined-cost hub (design)

**Date:** 2026-06-14
**Brand:** ParkMath (pilot). RoamMath gets a mirrored per-destination version in a **separate future spec**, once ParkMath is polished.
**Primary goal (user-chosen):** SEO/GEO capture — static, crawlable answer pages that win/get cited for "drive to the airport + go abroad" long-tail queries.

---

## Problem

The design critic flagged the "going abroad by car" traveller (parking/drop-off **and** roaming/baggage in one journey) as the highest-value unaddressed segment. The two brands are separate domains with only a basic reciprocal text cross-link (`FamilyLinks`). There is no page that answers the combined-cost question.

## Decisions locked in brainstorming

1. **ParkMath first**, per-airport. RoamMath mirror is a later, separate spec.
2. **Page model = per-airport hub pages, one axis.** ~27 `/abroad/[airport]` pages + one `/abroad` index. **NOT** the full airport×destination matrix (~1,080 pages = thin/doorway-page penalty risk on a YMYL site).
3. **Airport-anchored content to avoid duplicate-content penalty.** Roaming cost does **not** vary by departure airport, so a per-airport destinations-roaming *table* would be duplicate content across all 27 pages. Each page's unique substance is the **airport's parking/drop-off figures**; roaming is a **compact summary** + a CTA into RoamMath (which owns the per-destination axis).
4. **Home hub gains a 4th primary card = "Price index & data"** (promoted from the secondary row). "Going abroad" is **not** a top hub card; it surfaces via links (see §4).

---

## §1 — `/abroad/[airport]` page (the combined answer)

**Route:** `apps/parkmath/app/abroad/[airport]/page.tsx`, SSG, `dynamicParams = false`.
**`generateStaticParams`:** every airport that has a parking **or** drop-off record (so a headline figure exists). Hero number = cheapest 7-day pre-book parking if the airport has parking data, else the drop-off charge.

**Content order:**
1. `PageHeading`: "Going abroad from {Airport}? The full travel cost" + `FreshnessBadge` (latest verifiedAt across the sources used).
2. **Answer passage** (`AnswerPassage`, question-form H2, 40–75 words, `.mf-speakable`), built from verified figures. Template (values filled from data; omit clauses with no data):
   > "How much to drive to {Airport} and go abroad? A week's parking is **{cheapestParking}** (cheapest verified pre-book) — or **{dropOff}** to be dropped off. Using your phone abroad is **included** on the major UK networks for {includedCount} of our tracked destinations, or **from {rowDailyFrom}/day** where it isn't. One cabin bag adds **{cabinRange}**. Figures are official, date-stamped."

   *Region wording note: the roaming dataset tags `included` per network/destination but does not label EU vs rest-of-world, so copy must derive from the `included` flag ("included on the major networks for N destinations") and must NOT assert "EU roaming is free" as a verified claim.*
3. **Parking & drop-off mini-panel** — reuses existing parking/drop-off numbers for this airport (cheapest pre-book 7-day, drive-up gate, drop-off charge). Links to the full `/airport-parking/{airport}` and `/drop-off-charges/{airport}` pages.
4. **Compact roaming summary** (NOT a per-destination table): two bands derived live from `loadRoamingDataset()` — (a) destinations where the major networks include roaming at no extra cost (counted from the `included` flag); (b) where it isn't, the typical daily-pass range (min/representative `dailyPassPence` among non-included). One sentence each. Prominent CTA: **"See the exact cost for your destination → RoamMath"** (`${NEXT_PUBLIC_ROAMMATH_URL}/roaming`), `rel="… noopener"`.
5. **Baggage note** — typical cabin + checked range across the baggage dataset, one line, link to RoamMath baggage.
6. **Affiliate** — Holiday Extras parking card for this airport (existing `HolidayExtrasCard`/`resolveHeProduct`), surface `abroad`.
7. **FAQ** (`FaqAccordion`, `faqPageLd`): 3–4 Qs ("Is EU roaming free from {Airport}?", "What's the cheapest way to park at {Airport} for a week abroad?", etc.) answered from the data.
8. `SourcesBlock` (official parking/drop-off + network sources) + `EmailCaptureSlot`.

**Totals discipline (YMYL):** any "typical total" must state its assumptions inline ("7-day trip · EU destination with included roaming · one cabin bag"). No invented numbers; every figure traces to a dataset.

## §2 — `/abroad` index page

`apps/parkmath/app/abroad/page.tsx` (static). H1 "Going abroad by car — what the whole trip costs". Short intro + a table/list of all covered airports, each row showing the **airport-specific** headline (cheapest 7-day parking) linking to `/abroad/{airport}`. `breadcrumbLd` + `itemListLd`. Unique per row → crawlable hub, no duplication.

## §3 — Uniqueness / anti-penalty (acceptance-critical)

- Hero figure is airport-specific (parking ranges ~£45–£150/week → genuinely different pages).
- Roaming/baggage shown as **summary bands**, never a per-airport destinations table.
- Index rows differ by airport figure.
- Each page cross-links to RoamMath for the per-destination detail rather than duplicating it.

## §4 — Entry points (going-abroad is not a hub card)

1. A "Going abroad from {Airport}?" link block on each existing **parking** and **drop-off** airport page → `/abroad/{airport}`.
2. Upgrade the reciprocal `FamilyLinks` to point at `/abroad` (still a simple, honest cross-link).
3. A "Going abroad by car" entry in the home **secondary "Explore more" row** → `/abroad` index.

## §5 — Home 4-card hub change (small, bundled)

Promote **Price index & data** to a 4th primary `NavTile` so the home hub reads: **Drop-off · Parking · Lounges · Price index & data**. The secondary "Explore more" row then carries Travel news, Open data CSV, and the new "Going abroad by car" link. Pure composition change in `apps/parkmath/app/page.tsx` (+ a tile icon if needed); no new data.

## Data / engine / schema / performance

- **Data (all shared, no new datasets):** `loadParkingDataset`, `loadDropOffDataset`, `loadBaggageDataset`, `loadRoamingDataset`, `loadAirports`.
- **Engine (reuse):** `compareParking` / parking model for cheapest pre-book; `quoteDropOff` for drop-off; roaming summary derived from the dataset (count EU-included destinations + RoW daily-pass range); `formatPence`.
- **New code:** `apps/parkmath/lib/abroad-content.ts` — pure builder `abroadModel(airportSlug)` returning the serializable combined model (parking figs, drop-off, roaming bands, baggage range, totals + assumptions, FAQs). Unit-tested. Page is a thin server component over the model. Optionally a small `AbroadAnswer` presentational piece, or compose existing `AnswerPassage` + `FeeGrid`.
- **Schema:** `breadcrumbLd`, `speakableLd`, `faqPageLd` on detail pages; `breadcrumbLd` + `itemListLd` on the index. (Parking `aggregateOfferLd` already lives on the parking pages; not duplicated here.)
- **Performance/SEO:** all routes `●` SSG, `dynamicParams=false`, no `searchParams`, no client JS beyond existing shared widgets. LCP = the answer heading/figure.

## Testing (existing conventions)

- `apps/parkmath/tests/abroad-content.test.ts` — plain vitest, **relative imports**: `abroadModel` returns correct parking/drop-off figures for a known airport; roaming bands derived correctly; total states assumptions; handles a parking-less (drop-off-only) airport.
- Page render: `renderToStaticMarkup` smoke test (no jsdom) — heading, answer passage with `.mf-speakable`, RoamMath CTA present, `speakableLd`/`faqPageLd` emitted.
- `next build` shows `/abroad` + `/abroad/[airport]` as static; typecheck clean.

## Out of scope (future / separate specs)

- **RoamMath per-destination mirror** (`/abroad/[country]`) — separate spec after ParkMath is polished.
- Full airport×destination matrix; route-popularity weighting (no dataset for it).
- Live currency conversion for non-GBP roaming (RoamMath already handles eSIM conversion with a caveat).

## Acceptance

- `/abroad` index + one `/abroad/[airport]` per covered airport, all static; each detail page leads with an airport-specific verified figure and a 40–75-word `.mf-speakable` answer.
- No per-airport duplicate roaming table; roaming/baggage are compact summaries with a RoamMath CTA.
- Home hub shows 4 primary cards (4th = Price index & data); "Going abroad" reachable from parking/drop-off pages, `FamilyLinks`, and the home secondary row.
- Every figure traces to a dataset; totals state assumptions inline.
- `pnpm test` + typecheck green; both unaffected apps still build; routes static.
