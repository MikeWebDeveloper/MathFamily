# ParkMath + RoamMath — Design Audit & Elevation Report

*Mobile-first (96% of traffic). Brief: a calm, premium, trustworthy fintech instrument — stunning yet mobile-flawless.*

---

## 1. Executive summary

The product is one good system away from feeling best-in-class. Five things matter most, in order:

1. **The shared header is broken on every mobile page.** The `SiteHeader` packs the wordmark plus 3–4 full-phrase nav links into one un-collapsing row; `Drop-off charges` / `Roaming charges` wrap mid-word and crowd the logo. This is the single most-seen element for a 96%-mobile audience and the first impression of "calm instrument" fails here. One fix to `packages/ui/src/site-header.tsx` repairs both apps and every route.

2. **The shared `FeeGrid` overflows on mobile across all four master tables.** Drop-off (6 col), parking (4 col), baggage and roaming (6 col) all render the full desktop column set inside `overflow-x-auto`, clipping `PENALTY` / `Free alternative` / `Verified` off the right edge with no scroll affordance — and the clip parent (`overflow-hidden rounded-card`) even hides the scrollbar. The comparison columns *are* the product, and they're invisible at 390px. Card-ify rows below `md` in `fee-grid.tsx` once and all four tables are fixed.

3. **Type is desktop-sized on phones.** Hero `h1`s (`text-4xl`/`text-3xl`), `AnswerCard` (`text-6xl`), `FeeStat` (`text-5xl`) and the calc result (`text-4xl`) are hard-fixed with no mobile step, so headings wrap to 3 lines and big numbers swamp the fold before the answer is reached. A fluid `clamp()` token scale in `tokens.css` is the root-cause fix and resolves the user's "fonts too big" report systemically.

4. **Touch targets fail 44px almost everywhere interactive** — header nav, footer links, inline cross-links, destination text-links, flag-chips, duration toggles. Cheap to fix, high trust/usability payoff on a thumb-driven product.

5. **`FeeGrid` mis-styles prose as numbers.** Every non-first column is forced `text-right mf-num text-ink-muted`, so `Free alternative` / `Cheapest 7-day option` / `Fair-use note` / `Notes` prose reads ragged-left and tabular, while the actual price data is the *lowest-contrast* text on the row. A per-column alignment/weight prop fixes content treatment and hierarchy at once.

The good news: the wins are concentrated in **three shared components** (`site-header.tsx`, `fee-grid.tsx`, `tokens.css`) plus a token-scale pass. Fix those and the bulk of the audit clears across both apps simultaneously.

---

## 2. Critical & high-severity bugs to fix

Prioritized, grouped by theme. Duplicate findings across surfaces are merged into one row.

### Theme A — Header / nav (shared chrome)

| Sev | Surface | Viewport | Problem | Fix | File |
|-----|---------|----------|---------|-----|------|
| **Critical** | All ParkMath + RoamMath pages (home, detail, tables) | Mobile 390px | Wordmark + 3–4 full-phrase nav links share one un-collapsing row; `Drop-off charges` / `Roaming charges` wrap to a 2nd line and crowd the logo. Reads as broken on the most-seen element. | Hide inline nav under `sm`: `<nav className="hidden gap-5 sm:flex …">`; add an `sm:hidden` disclosure button (≥44px) toggling a dropdown/sheet. Keep wordmark `shrink-0`, row `flex-nowrap min-w-0`. Also resolves ragged header height. | `packages/ui/src/site-header.tsx:17-27`; labels from `apps/parkmath/app/layout.tsx:20-25`, `apps/roammath/app/layout.tsx:20-24` |
| **High** | All pages (shared chrome) | Mobile | Header nav `<a>` are bare `text-sm` with zero vertical padding → ~18-20px tap height, under 44px; mis-taps onto adjacent links. | Per link: `-my-2 py-2 inline-flex items-center min-h-11`. If moving to dropdown, each row `min-h-12 px-4 flex items-center`. | `packages/ui/src/site-header.tsx:25` |

### Theme B — Table overflow (shared `FeeGrid`)

| Sev | Surface | Viewport | Problem | Fix | File |
|-----|---------|----------|---------|-----|------|
| **Critical** | Drop-off table, Roaming table (6 col); Parking hub table (4 col) — ParkMath + RoamMath | Mobile 390px | Full desktop column set inside `overflow-x-auto`; `PENALTY` clips mid-word (`PENALT…`), `Free alternative`/`Verified`/`Vodafone`/`Three`/`eSIM` off-screen. **No scroll affordance** — the `overflow-hidden rounded-card` wrapper even clips the scrollbar. Caption also clipped mid-word. | **Card-ify below `md`**: row-header (airport/network) as card title, remaining columns as label→value pairs; `<table className="hidden md:block">`. One change fixes drop-off, parking, baggage AND roaming. Interim: drop `overflow-hidden` on wrapper, add right-edge gradient fade + `Swipe to compare →` hint, freeze first col. | `packages/ui/src/fee-grid.tsx:16,19-47`; cols from `roaming/page.tsx:113-117`, `drop-off-charges/page.tsx:50` |
| **High** | Parking hub detail (4-col duration grid) | Mobile | 4-col grid + long row label (`Park & Ride (formerly Long Stay) — drive-up`) forces table wider than card; 14-day price clipped at card edge → silent horizontal scroll on a financial figure. (3-col 7-day grid does *not* clip — disregard that earlier citation.) | Same card-ify approach; if kept as table, demote `(formerly Long Stay) — drive-up` to a muted sub-label + add edge-fade. | `packages/ui/src/fee-grid.tsx:19-20`; `apps/parkmath/app/airport-parking/[airport]/page.tsx:86-104` |

### Theme C — Typography too big / wrapping (mobile)

| Sev | Surface | Viewport | Problem | Fix | File |
|-----|---------|----------|---------|-----|------|
| **High** | ParkMath home h1; RoamMath country/airline h1 | Mobile | ParkMath home `h1` `text-4xl` (36px) wraps to 3 lines, eats top third of fold. RoamMath country `h1` `text-3xl` no responsive step → 3 dense lines. | ParkMath home: `text-3xl … sm:text-5xl`. Detail h1s: `text-2xl font-bold tracking-tight text-balance text-ink sm:text-3xl`. (Or bind to fluid `text-h1` token — see §5.) | `apps/parkmath/app/page.tsx:41`; `apps/roammath/app/roaming/[country]/page.tsx:102`, `baggage-fees/page.tsx:39`, `baggage-fees/[airline]/page.tsx:74` |
| Medium | RoamMath home hero `h1`; FeeStat numbers; AnswerCard | Mobile | Hero `text-4xl` wraps & dominates; `FeeStat` `text-5xl` (48px) shouty stacked full-width; `£0 (O2)` / `2` compounds look unbalanced; `AnswerCard` `text-6xl` crowds the fold. | Bind to fluid tokens: hero `text-3xl sm:text-4xl`, FeeStat `text-4xl sm:text-5xl`, AnswerCard fluid display + `p-5 sm:p-7`. Split `£0` + muted `(O2)`. | `apps/roammath/app/page.tsx:72`; `packages/ui/src/fee-stat.tsx:9`; `packages/ui/src/answer-card.tsx:25,20` |

### Theme D — Chips & content-in-wrong-shape

| Sev | Surface | Viewport | Problem | Fix | File |
|-----|---------|----------|---------|-----|------|
| **High** | ParkMath drop-off detail (all airports) | All | `CaveatChip` holds a full sentence (`Pay by Midnight the day after your visit (can also pay in advance or on the day)`) → wraps 2 lines, reads as a broken tag beside terse sibling chips. | Render a short token (`Pay next day`); move the parenthetical into the `AnswerLead` bullet (already shows `Pay by:`) or a `detail` prop outside the pill. Shorten `record.paymentDeadline` in dataset. | `apps/parkmath/app/drop-off-charges/[airport]/page.tsx:67`; `packages/ui/src/caveat-chip.tsx` |
| **High** | Roaming country table | Mobile | 4-col table (Network / Daily charge / Pass name / Fair-use note) crammed into 390px; Fair-use full sentences wrap many lines + scroll off-screen on a trust-led table. | Card-ify (Theme B). If table kept: `px-3 py-3 sm:px-5`, cap Fair-use `max-w-[9rem] text-xs whitespace-normal` or footnote it on mobile. | `packages/ui/src/fee-grid.tsx:19,25,39,41`; `apps/roammath/app/roaming/[country]/page.tsx:128-137` |

### Theme E — Content treatment / hierarchy in tables

| Sev | Surface | Viewport | Problem | Fix | File |
|-----|---------|----------|---------|-----|------|
| Medium | All four tables (shared) | All | Every non-first cell forced `text-right mf-num text-ink-muted`. Prose columns (`Free alternative`, `Cheapest 7-day option`, `Fair-use note`, `Notes`) render right-aligned + tabular = ragged, awkward. | Add per-column `align`/`numeric` array prop to `FeeGrid`; price/charge cols keep `text-right mf-num`, prose cols go `text-left` normal weight. | `packages/ui/src/fee-grid.tsx:25,41` |
| Low→**fix-with-E** | All tables (shared) | All | Numeric cells use `text-ink-muted` — the *key comparison data* is the lowest-contrast text on the row, inverting hierarchy. | Numeric cells `text-ink font-medium`; reserve muted grey for qualifiers (`included`). Optionally highlight cheapest cell per row in `brand-accent`. | `packages/ui/src/fee-grid.tsx:41` |

*(Grouped E together because both live on line 41 and should be fixed in the same `FeeGrid` column-typing pass.)*

---

## 3. Medium / low polish fixes

**Touch targets (batch — apply `min-h-11`/block padding):**
- Footer links bare `text-sm` in `flex gap-4` → `py-1.5 inline-flex min-h-11 items-center` (`site-footer.tsx:5-8`).
- Inline `Compare…` / `Lounge…` cross-links → `inline-flex min-h-11 items-center`; wrapping row `gap-x-6 gap-y-2` (`parkmath/app/page.tsx:58-71`).
- Parking duration toggle pills `px-4 py-2` (~36px) → `min-h-11 px-4 py-2.5` (`parking-calculator.tsx:28-29`).
- RoamMath home destination text-links `gap-2`, no padding → `block py-2.5` (or adopt flag-chip) (`roammath/app/page.tsx:103-111`).
- Flag-chips `px-3 py-1.5` (~32px) → `py-2` / `min-h-11` (`roaming/page.tsx:100-111`).
- Network-specific link run-on row → `grid gap-2 sm:flex …` + `py-2` per link (`roaming/[country]/page.tsx:141-152`).

**Typography rhythm (mobile step-downs):**
- ParkMath lead `text-lg` → `text-base sm:text-lg` (`parkmath/app/page.tsx:44`).
- Detail/list page h1s `text-3xl` → `text-2xl font-semibold … sm:text-3xl sm:font-bold` + `text-balance`; extract a shared `PageHeading`.
- `h1` mid-word `drop-/off` split → wrap `drop-off` in `whitespace-nowrap` span.
- RoamMath `AnswerLead` `text-xl font-semibold` (2nd heavy block under h1) → `text-base font-medium leading-relaxed sm:text-lg` (`answer-lead.tsx:7`).
- `AnswerLead` bullets dense → add `leading-relaxed`; bold the network label so bullets read key:value (`answer-lead.tsx:9-15`).
- Calculator verdict `text-base font-bold` → `text-sm font-semibold` (`roaming-calculator.tsx:55`).

**Spacing / safe-area:**
- Sticky `MiniAnswerBar` ignores iOS safe-area → inner row `pb-[max(0.625rem,env(safe-area-inset-bottom))]` (`mini-answer-bar.tsx:30-35`).
- `FeeGrid` cell padding `px-5 py-3.5` not responsive (contributes to overflow) → `px-3 py-3 sm:px-5 sm:py-3.5` (`fee-grid.tsx:25,39,41`).
- RoamMath header freshness pill + dotted citation crowd one row under h1 → `gap-y-2`; hide inline citation `hidden sm:inline-flex` (duplicated in Sources block) (`roaming/[country]/page.tsx:104-109`).

**Consistency:**
- `AnswerLead` + `AnswerCard` repeat `record.feeSummary` verbatim (same fact twice in one fold) → pick one hero: drop `AnswerCard note` or shorten lead to context only (`drop-off-charges/[airport]/page.tsx:71-95`).
- RoamMath home destinations are bare underlined links vs the premium flag-chip grid on the index → unify on shared flag-chip component (`roammath/app/page.tsx:103-114` vs `roaming/page.tsx:100-111`).
- Lounge slider missing the focus-visible ring + active glow the drop-off slider has → extract a shared `<RangeSlider>` (`lounge-calculator.tsx:18-19` vs `drop-off-calculator.tsx:39`).
- Parking warnings render as 12px muted fine-print while drop-off uses amber chips → use `CaveatChip` treatment for parking caveats (`parking-calculator.tsx:60-64`, `airport-parking/[airport]/page.tsx:78-84`).
- `MiniAnswerBar` uses raw `✓` text glyph vs `FreshnessBadge`'s brand SVG tick → extract shared `<CheckTick/>` (`mini-answer-bar.tsx:34`).
- Parking calculator winner row: long `o.name` wraps 3 lines, breaks name|price baseline alignment → split bold primary + muted sub-label, `items-start`, name `min-w-0`, price `shrink-0` (`parking-calculator.tsx:49-55`).

**Low cosmetic:**
- Long airport names wrap in 2-col mobile result grid → optional `text-balance` (no functional issue) (`airport-search.tsx:24,32`).
- Search field has no leading magnifier icon → wrap `relative`, add absolute SVG, `pl-11` (`airport-search.tsx:16-23`).
- `FIRST CHECKED BAG` header wraps to 2 lines → shorten to `Checked bag`, `px-3 sm:px-5` (`baggage-fees/page.tsx:47`).
- Baggage index sparse `—` / wrapping `Not published` → consistent muted `—`, `whitespace-nowrap`; style `Free` as a positive badge (`baggage-fees/page.tsx:48-59`).
- 260px flag watermark reads as a print smudge behind mobile h1 → `hidden sm:block` or `size={180}` until `sm` (`roaming/[country]/page.tsx:95-99`).
- Ambient backdrop: two permanent 80px-blur `will-change` blobs with infinite drift → disable drift `@media (max-width:640px)`, drop blur to ~48-60px, scope `will-change` (`ambient-backdrop.tsx:7-14`, `tokens.css:179-188`). Perf hygiene only; reduced-motion guard already present.

---

## 4. Premium elevation plan

Highest-leverage ideas from the ideation lenses, phased. Every Phase-1 item also shrinks the oversized mobile fold — they pay double.

### Phase 1 — Quick wins (ship first; mostly the three shared components)

| Idea | What | Why | Effort |
|------|------|-----|--------|
| **Fluid `clamp()` type scale** | Add `--text-display/-stat/-h1/-h2/-lead` clamp tokens to `tokens.css @theme`; bind existing classes. | Root-cause fix for "too big on mobile"; reads as engineered restraint (Stripe/Linear), not media-query shrink. Makes "answer in first viewport" literally true on a phone. One edit governs both apps. | S–M |
| **Monzo-grade sticky header** | Hide inline nav on mobile, show only the `=Math` lockup + disclosure; backdrop blur, hairline border, scroll-shadow, thin accent progress line. | Fixes the worst, most-seen defect; lifts every page cheaply. | M |
| **Responsive `FeeGrid` (card-rows ↓md, table ↑md)** | CSS-only split in one file. | Kills horizontal scroll across all four tables; card-rows are the canonical mobile comparison pattern. Biggest premium win available. | M |
| **FeeStat → one 3-up strip** | Merge three full-screen navy cards into one strip with hairline dividers, `min-h-11`. | Fixes "too big", recovers ~2 viewport-heights on home. | S |
| **Answer-first AnswerCard** | Mono figure + verdict + green Verified pill + caveat chips; demote the navy FeeStat trio. | Reclaims fold; establishes a clear single hero number. | M |
| **3-tier surface + single winner glow** | Formalise `--shadow-card/-raised/-hero` + `--highlight-inner`; reserve one `brand-accent` glow for the cheapest/winner row; 2px hover-lift. | Stripe "lit-from-above" depth; the one glow does real informational work (the recommendation). Exactly one per page. | M |

### Phase 2 — Systemic (the design system hardens)

| Idea | What | Why | Effort |
|------|------|-----|--------|
| **Heading hierarchy + tighter leading/tracking** | Apply `text-h1`/`text-h2` tokens across all 8 detail h1s + every `text-xl` h2; `leading-[1.1]` on display, `leading-snug` on h2; `.mf-num-display` with +0.01em tracking. | ~1.5× h1:h2 ratio reads as designed; frees fold space; calibrates the muddy current mix. | M |
| **Per-column `FeeGrid` typing** | `numericColumns`/`align` prop; prose cols left-aligned normal weight, numeric cols `text-ink font-medium` (data gets weight). | Fixes the prose-as-number bug AND the inverted contrast hierarchy. | S |
| **Stroke icon system (16px/1.5px, currentColor)** | ~8 icons (penalty, free-alt, clock, shield-tick, savings) extending `line-glyphs.tsx`; always paired with a label. | Scannability + the "colour is never the only signal" a11y rule; lifts text-heavy pages to "crafted". | M |
| **Shared primitives** | `RangeSlider`, `CheckTick`, `PageHeading`, flag-chip → extract once, reuse. | Eliminates the calculator/slider/tick/heading inconsistencies in §3 at the source. | S–M |
| **Sticky live calculator answer** | Feed `MiniAnswerBar` the live calc output via an optional `live` slot; anchor to the calculator island; reuse `AnimatedNumber`. | The number you're tuning stays pinned (mortgage-calculator pattern); infra already exists. | S |
| **Saves verdict module** | Tinted card, bold mono `Saves £X`, plain-English winner sentence, one-time reveal; figure from dataset. | Counters reseller "% off" claims with a sourced figure; a memorable family signature. | S |
| **Density tokens + abbreviated labels** | `--space-cell-x/-y` mobile pair; `compactLabel` map for long mode names (full string in detail/sheet); zebra/hover behind `md:`. | Premium dense-but-legible tables (Wise/ONS); removes the 6-line wraps. | S |

### Phase 3 — Wow-factor (signature moments, after the system is solid)

| Idea | What | Why | Effort |
|------|------|-----|--------|
| **Hero count-up + digit odometer on AnswerCard** | Animate the page's headline number once on first paint (reuse `AnimatedNumber`, one-shot, reduced-motion → instant). | Monzo/Revolut "live computed figure" signal — trust, not salesy. One per page. | M |
| **Bottom-sheet row detail** | Tap a comparison card → native `<dialog>` sheet with full breakdown + Verified pill + source; card stays a real `<a>` (JS-off → navigation). | Compare 3-4 options in seconds without losing place; signature fintech detail pattern. | M |
| **Segmented sort / key-column control** | Slim sticky segmented control picks the one emphasised metric and re-sorts card-rows (Fee / Time / Penalty etc.); SSR keeps a no-JS default sort. | "Show one number big, let the user pick which" (Skyscanner/Revolut); turns "too many columns" into "the answer I chose". | M |
| **OptionRail swipe-snap cards** | Replace embedded mini sub-tables (per-network roaming, gate-vs-prebook) with `snap-x` rails; crown cheapest, render explicit savings string. | Deliberate & premium for small fixed option sets; the peek signals "more to the right". | M |
| **Skeleton + crossfade for search/calculator islands** | Shimmer skeleton rows for `AirportSearch`; designed at-rest empty state + 150ms opacity crossfade on slider change. | Removes the only abrupt moments; "the system is working precisely". | M |
| **SVG flags + IATA monogram tiles** | Replace emoji flags with crisp ISO-keyed SVG chips; ParkMath airport cards get a mono IATA tile or tiny UK dot-map. | Real SVG beats emoji/stock; anchors cut perceived density on long mobile lists. | M |

---

## 5. Recommended responsive type scale

Resolves "fonts too big" by replacing fixed Tailwind steps with viewport-aware `clamp()` tokens. Add to `packages/ui/src/tokens.css @theme` (mapping onto Tailwind's `--text-*` so existing classes inherit the fluid behaviour). Keep 12/14/16 body steps static.

| Element / role | Token | Mobile (~390px) | Desktop (≥1280px) | Weight / line-height | Current → replaces |
|----------------|-------|-----------------|-------------------|----------------------|--------------------|
| Hero answer number (`AnswerCard`) | `--text-display` | **36px** | **60px** | 700 / 1.0 · `-0.02em` · `mf-num` | `text-6xl` fixed |
| Supporting stat (`FeeStat`, calc result) | `--text-stat` | **32px** | **48px** | 700 / 1.05 · `-0.01em` · `mf-num` | `text-5xl` / `text-4xl` fixed |
| Page heading (`h1`) | `--text-h1` | **28–30px** | **44px** | 700 / 1.1 · `tracking-tight` · `text-balance` | `text-4xl`/`text-3xl` fixed |
| Section heading (`h2`) | `--text-h2` | **18px** | **22px** | 600 / 1.3 (`leading-snug`) | flat `text-xl` everywhere |
| Lead / intro paragraph (`AnswerLead`) | `--text-lead` | **17px** | **20px** | 500 / 1.55 (`leading-relaxed`) | `text-xl`/`text-lg` fixed |
| Body | — (static) | 16px | 16px | 400 / 1.6 | `text-base` |
| Secondary / label | — (static) | 14px | 14px | 400–500 / 1.5 | `text-sm` |
| Caption / micro / table label | — (static) | 12px | 12px | 500 / 1.4 · `tracking-wider` (caps) | `text-xs` |

**Clamp definitions:**

```css
@theme {
  --text-display: clamp(2.25rem, 1.6rem + 3.2vw, 3.75rem);  /* 36 → 60 */
  --text-display--line-height: 1.0;
  --text-stat:    clamp(2rem,    1.5rem + 2.5vw, 3rem);      /* 32 → 48 */
  --text-stat--line-height: 1.05;
  --text-h1:      clamp(1.75rem, 1.45rem + 1.9vw, 2.75rem);  /* 28 → 44 */
  --text-h1--line-height: 1.1;
  --text-h2:      clamp(1.125rem, 1rem + 0.6vw, 1.375rem);   /* 18 → 22 */
  --text-h2--line-height: 1.3;
  --text-lead:    clamp(1.0625rem, 1rem + 0.3vw, 1.25rem);   /* 17 → 20 */
  --text-lead--line-height: 1.55;
}
```

Hero/stat numbers stay IBM Plex Mono `tabular-nums` (`mf-num`) so nothing reflows during count-up. Add `.mf-num-display` (+0.01em tracking) for display-size numbers rather than touching base `.mf-num` (tables rely on 0-tracking tabular figures). Ratio is a deliberate ~1.25× between hero (display) and supporting (stat) numbers at every width, so the page reads as one hero + supporting trio, not competing heroes.

**Note (per project memory):** do not create new vitest/vite config files on the TB4 volume (they deadlock). If you add a type-specimen regression test, extend the existing `packages/ui/tests` setup — do not scaffold a new config.

---

## 6. What to do next

1. **`tokens.css` — fluid type scale.** Land the `clamp()` tokens (§5). Lowest-risk, highest-reach; unblocks every typography fix and the "too big" report.
2. **`site-header.tsx` — responsive nav + 44px targets.** Hide inline nav under `sm`, add disclosure, `shrink-0` wordmark, `flex-nowrap`. Fixes the worst defect across both apps. Verify both apps' `layout.tsx` nav arrays still fit.
3. **`fee-grid.tsx` — card-ify below `md` + per-column typing + responsive padding.** Single change clears the critical table overflow on all four tables plus the prose-as-number and inverted-contrast bugs. Visually verify drop-off (6-col), parking (4-col), baggage, roaming at 390px.
4. **Bind hero/stat/h1 components to the new tokens** — `answer-card.tsx`, `fee-stat.tsx`, the 8 detail h1s, ParkMath/RoamMath home heroes. Extract a shared `PageHeading`.
5. **Touch-target batch** (§3) — header, footer, cross-links, toggles, chips, destination links. One sweep, all to `min-h-11`.
6. **Content fixes** — terse `CaveatChip` + dataset `paymentDeadline`; de-duplicate `AnswerLead`/`AnswerCard` `feeSummary`; cap Fair-use column.
7. **Extract shared primitives** — `RangeSlider`, `CheckTick`, flag-chip — to close the consistency gaps.
8. **Then Phase-2/3 elevation** in order: surface/winner-glow + Saves module → sticky live calc → count-up + bottom-sheet → segmented sort + OptionRail.

Re-screenshot at 390 / 768 / 1280 after steps 2–4 to confirm the fold and the four tables before moving to elevation work.