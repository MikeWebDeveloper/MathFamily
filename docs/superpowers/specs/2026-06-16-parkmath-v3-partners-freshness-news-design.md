# ParkMath v3 — Multi-partner parking, daily freshness, news pipeline + homepage — Design

**Date:** 2026-06-16
**Status:** Draft for review
**Author:** Michal Latal (with Claude)

Derived from the 11-agent research workflow (`w8u3gn17o`) + four owner decisions. Dark-mode
contrast (the 4th original ask) is **already shipped** via PR #15 (bento home + `--color-brand-strong`
token + component sweep) and is therefore out of scope here, except as the baseline the news UI builds on.

## Locked decisions

1. **Baseline:** PR #15 merged — production is the **bento homepage** with the adaptive brand-text token. New brand-colored UI MUST use `text-brand-strong` for foreground text (never raw `text-brand` on dark surfaces).
2. **Parking coverage:** **CTA for all 25 airports now, backfill verified pricing over time.** Every airport gets a parking page with a booking CTA; price comparison renders only where we have verified data.
3. **News rumours:** **Official-sourced only.** No rumour/unverified field; every item keeps a real `sourceUrl`. Preserves the "never fabricate" rule.
4. **Scheduler:** **Claude Code scheduled-tasks for everything.** n8n is not wired to anything (only `tools/freshness/n8n-workflow.json` + docs reference it; no skill/script invokes it) — retire it.

## External blocker (one)

**APH activation** is gated on Mike confirming, in his logged-in AWIN dashboard, that APH = **merchant 1478**, that he is **joined + approved**, and that **deep-linking to per-airport `/parking/` pages is permitted**. Until `active:true` + a real joined mid are set, APH resolves to its official site (no tracking). All APH code lands behind that gate (inert until activated), exactly like the Purple Parking / Airparks pattern.

---

## Spec A — Retire n8n + consolidate scheduling on Claude Code scheduled-tasks

**Goal:** one scheduling substrate; no dead n8n references.

- Delete `tools/freshness/n8n-workflow.json`. Update `tools/freshness/watchdog.md`, `docs/launch-checklist.md`, and `CLAUDE.md` to state the live mechanism is Claude Code **scheduled-tasks** (the `docs/launchd/*.plist` remain non-installed templates).
- Define the scheduled-tasks (staggered, early-morning UK, to avoid hammering the same official sites at once):
  - `watchdog` (site + deeplink health) — daily ~06:40 (existing).
  - `freshness check` (daily, idempotent — Spec B) — daily ~06:55.
  - `news-watch sweep` (Spec C) — every 3 days ~07:10.
  - `loop-digest` (reels) — weekly Mon ~08:50 (existing).
- Each task runs the existing `tools/freshness/run-agent.sh <mode>` / skill; no new runner.

**Verification:** `grep -rn n8n` returns only historical plan/spec docs (not active config); the scheduled-tasks list shows the four jobs.

---

## Spec B — Daily idempotent freshness (silent when nothing changed)

**Goal:** re-verify official sources **every day**, but do **nothing** (no PR, no commit, no noise) when nothing changed — the watchdog's "green is quiet" behavior.

**Current state (verified):** `tools/freshness/src/watchdog.ts` already hash-checks watchlist URLs, stores `{hash, checkedAt, pendingSince?}`, is silent on no-change, opens one PR on change, and single-triggers via `pendingSince` (won't re-open while a change is already pending). Auto-clears `pendingSince` when a page reverts to its prior hash.

**Changes:**
- Add `lastNotified` (ISO date) to the `HashRecord` in `watchdog.ts`. When a change is detected: if `lastNotified` is set and `today − lastNotified < N` days, stay silent (only update `checkedAt`); else set `lastNotified = today` and trigger. Clear `lastNotified` when the agent lands the new hash. **N = 7 days** (matches the weekly sweep cadence; airport pages are low-volatility).
- Re-specify the full state machine **with** the existing `pendingSince` auto-clear so a page that flaps back-and-forth can't re-trigger inside the cooldown.
- Document the **idempotence guarantee**: two identical runs the same day produce zero side effects.
- This file is **shared with Spec C** (news runs through the same `runWatchdog` via `--news`); the `HashRecord` change and any cadence logic are **co-designed**, not specced twice.

**Files:** `tools/freshness/src/watchdog.ts`, `tools/freshness/hashes.json` (+`news-hashes.json`) gain the field on next write, `tools/freshness/watchdog.md` (document idempotence + cooldown), `CLAUDE.md` (freshness cadence). **Tests:** `tools/freshness/*.test.mjs` (node:test) covering: no-change silent, change→trigger, within-cooldown silent, cooldown-expired→trigger, flap auto-clear.

---

## Spec C — News pipeline: featured flag + every-3-days cadence (official-only)

**Goal:** flag one story as featured/important; gather official news on a cadence; keep PR-gated + official-sourced.

**Current state (verified):** `packages/data/src/news.ts` defines `NewsItemSchema` (id, airportSlug, category, title, summary, body, change, sourceUrl https-only, sourceLabel, publishedAt, verifiedAt, supersedes) — **no featured flag**. Pipeline: `news-watch` skill → `mergeNewsItems` → PR touching only `news.json`, never auto-merged. `/news`, `/news/[id]`, `/news/feed.xml` render it.

**Changes:**
- Extend `NewsItemSchema` with **`importance: "headline" | "standard"`** (default `"standard"`; Zod `.default`). At most one `headline` item is the homepage featured story (loader picks the most recent `headline`, else the most recent item). **No rumour/sourceType field** (decision 3). Bump `news.json` `version`.
- Loader additions in `news.ts`: `featuredNews()` (most-recent headline-or-latest) and `carouselNews(n)` (next N excluding the featured one).
- `importance` is **editorial**: Mike sets it when reviewing the news PR (documented in the `news-watch` skill); the skill never auto-promotes.
- Cadence: `news-watch sweep` runs **every 3 days** as a scheduled-task (Spec A). Still PR-gated; reuses `watchdog.ts` `--news`.

**Files:** `packages/data/src/news.ts` (+ schema/loaders), `packages/data/datasets/parkmath/news.json` (version bump, backfill `importance` defaults), `.claude/skills/news-watch/SKILL.md` (document setting `importance` at review), `packages/data/tests/news.test.ts` (schema default, `featuredNews`/`carouselNews`). **Test convention:** data tests are plain vitest in `tests/`.

---

## Spec D — News on the homepage: featured card + carousel

**Goal:** one prominent featured news card + a compact carousel of recent items, on the **bento** home, SSR-first, working with JS off.

**Design:** **Stacked** layout (mobile-first): a full-width `FeaturedNewsCard` (headline + summary + optional fee-change diff + source/date) above a horizontal **CSS scroll-snap** carousel of 3–4 `NewsCard`s. No JS required to render or scroll (native scroll-snap); `prefers-reduced-motion` respected; keyboard scroll is native. Placed as a bento cell after the hero/stat row, before the family-links band.

- New `FeaturedNewsCard` (uses `text-brand-strong`, `.mf-card-lg`/`.mf-soft-lift` from the merged bento tokens). Reuse existing `NewsCard` for carousel items (already dark-safe after #15's `news-card.tsx` fix).
- New `NewsCarousel` wrapper (`overflow-x-auto`, `snap-x snap-mandatory`, `snap-start` items, no-scrollbar utility).
- Home view-model (`apps/parkmath/lib/home-content.ts` or `page.tsx`) calls `featuredNews()` + `carouselNews(4)`.

**Files:** `packages/ui/src/featured-news-card.tsx` + `news-carousel.tsx` (+ `index.ts` export), `apps/parkmath/app/page.tsx` (insert section), content lib. **Tests:** `packages/ui/tests/featured-news-card.test.tsx` + `news-carousel.test.tsx` (`// @vitest-environment jsdom`, testing-library); app test asserts the section renders server-side.

---

## Spec E — Multi-partner parking + APH (gated on AWIN approval)

**Goal:** add APH as a second active parking partner alongside Holiday Extras, preserving disclosure + commission-blind ranking.

**Design (research Option B — primary card + secondary):**
- `partners.json`: add `aph` (name "APH", `awinmid: "1478"` once confirmed, `active:false` until approved, landingUrl `https://www.aph.com/`, products). Add `aph` to the `parking-prebook` slot's `partnerIds`.
- `partners.ts`: add `aphAirportParkingUrl(slug)` → `https://www.aph.com/<slug>-airport/parking/` **with a verified-slug allowlist + generic `https://www.aph.com/airport-parking/` fallback** (Belfast-International 404'd — never emit a 404 deep-link). Generalize resolution so a slot can yield a **primary** affiliate + **secondary** affiliates (ranked by an explicit `rank` field in `partners.json`, NOT by commission — keep ranking commission-blind/manual).
- **Clickref gets a partner token:** `parkmath-he-<slug>` / `parkmath-aph-<slug>` so AWIN + the `awin-digest` tool can split traffic by partner. (Migration note: existing HE clickrefs become `-he-`.)
- UI: `booking-options.tsx` renders the primary affiliate card + an "Also available" secondary line for the other active partner; both keep `rel="sponsored"` + the "Ad" pill + the commission-blind disclosure. Preserve dark-mode parity (post-#15).

**Files:** `apps/parkmath/lib/partners.json`, `partners.ts`, `components/booking-options.tsx` (+ maybe a small `AffiliatePartnerCard`), `tests/partners.test.ts` + `booking-options.test.tsx`. **Pre-ship probe:** a one-off (or watchdog-integrated) live check of `aph.com/<slug>-airport/parking/` for all 25 slugs to build the allowlist.

## Spec F — Parking page for all 25 airports (CTA now, backfill pricing)

**Goal:** every tracked airport has a `/airport-parking/<airport>` page with a booking CTA, even the 16 with no pricing data.

**Design (research Option B — graceful landing):**
- Relax `apps/parkmath/app/airport-parking/[airport]/page.tsx`: `generateStaticParams` over **all 25 airports** (from `airports.json`), not just the 9 with tariffs. Where a parking-tariffs record exists → full price-comparison page (unchanged). Where it doesn't → a lightweight landing page: headline + the booking CTA (`BookingOptions` with the partner deep-link + official fallback) + "pricing coming soon" note, no fabricated numbers.
- Need an **official parking URL per airport**: add `officialParkingUrl` to `airports.json` (or a small `official-parking-urls.json`), sourced + `verifiedAt`, for the 16 (and reuse for all 25). The booking CTA's official fallback uses it.
- Backfill: each new verified tariff record upgrades that airport from landing → full comparison automatically.
- `/airport-parking` index lists all 25 (covered + "CTA only").
- Sitemap/IndexNow: `indexnow.mjs` + `sitemap.ts` will enumerate 16 new routes — confirm they're included; Crawler Hints will pick them up.

**Files:** `airport-parking/[airport]/page.tsx` (+ `[duration]` guard), `apps/parkmath/lib/parking-content.ts`, `packages/data` (official-parking-urls dataset + schema + loader), `packages/data/tests/parking-coverage.test.ts` (update the 9→25 coverage assertion; document any genuinely-unbookable airport). Depends on Spec E's per-airport URL allowlist so we never ship a 404-ing affiliate link.

---

## Sequencing

1. **Spec A** (retire n8n) — trivial, do first.
2. **Spec B** (freshness daily) ‖ **Spec E** (APH, inert until approval) — independent, parallel.
3. **Spec C** (news schema+cadence) → **Spec D** (news homepage UI) — D depends on C's loaders + the merged bento home.
4. **Spec F** (all-airports coverage) — after Spec E's URL allowlist so affiliate links never 404.

Specs A, B, C are pure internal/data/tooling (no external blocker). Spec E waits on the AWIN confirmation; Spec F follows E.

## Test + governance guardrails (apply to every spec)

- No `vitest.config.*` anywhere (esbuild deadlock). UI tests: `// @vitest-environment jsdom` + testing-library. App tests: `renderToStaticMarkup`. Data/engine: plain vitest in `tests/`. Tools: `node --test`.
- Integer pence; `formatPence` only at the edge. Every dataset record keeps `sourceUrl` + `verifiedAt`.
- Affiliate: `buildAwinLink` only; `rel="sponsored"` + "Ad" pill + commission-blind ranking copy; partner live only when `active:true` AND `awinmid` set. No affiliate links in any social/news copy.
- Nothing auto-publishes: freshness + news open PRs with a NEEDS-HUMAN block; a human merges.
