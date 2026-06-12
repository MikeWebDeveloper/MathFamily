# ParkMath — SEO + Website-Code Audit (2026-06-12)

*Consolidated from a 7-dimension parallel audit (technical SEO, on-page, structured data,
performance/CWV, GEO/AI, accessibility, code+security) over the live site and the repo.*

**Site:** `https://www.parkmath.co.uk` · Next 16 / React 19 monorepo · 96% mobile · statically prerendered.

The site is genuinely well-built: answer-first content, a verified source per fact, lean JS, clean
a11y/perf cores. The real gaps cluster into three themes: **(1) no canonical/OG-url sitewide,
(2) missing entity & price schema (Organization, Offer, Article image/author), (3) no security
headers / no CI.** Almost everything else is polish.

## Scorecard

| Dimension | Verdict | Single biggest issue |
|---|---|---|
| Technical SEO | OK | No `<link rel="canonical">` on any page sitewide (also kills `og:url`) |
| On-Page SEO | OK | Same canonical gap + thin `/drop-off-charges` index (H1 + table, zero prose) |
| Structured Data | Needs work | No Organization entity; NewsArticle missing required `image`/`author`; no Offer schema |
| Performance / CWV | Strong | LCP `<h1>` font (Plex Sans 700) not preloaded; 3 mono weights preloaded instead |
| GEO / AI | Strong | Index/comparison pages have no answer-first sentence; FAQ answers drop the verified date |
| Accessibility | Strong | `SegmentedControl` claims `role=radiogroup` but has no keyboard model; no skip-link |
| Code / Security | Needs work | Zero security headers on every response; no CI runs the existing tests |

## Top 10 quick wins (highest impact-to-effort)

1. **Self-referencing canonicals** via `alternates.canonical` (root `"./"` + exact path per route) — also makes Next emit `og:url`. `layout.tsx` + each `generateMetadata`. *(S–M)*
2. **`openGraph` block** (root `type:website`; news `type:article` + published/modified time). Falls out of #1. *(S)*
3. **Security headers** via `next.config.ts` `headers()`: nosniff, Referrer-Policy, X-Frame-Options/frame-ancestors, Permissions-Policy, CSP (allow `dwin1.com`, `static.cloudflareinsights.com`, gstatic/googleapis fonts). *(M)*
4. **Preload the LCP H1 font** (Plex Sans 600/700); stop preloading unused mono weights. *(S)*
5. **`organizationLd()` builder** (`@id`/name/url/logo/sameAs), render once in layout; `@id`-reference from Dataset/NewsArticle. *(M)*
6. **NewsArticle schema fix** — required `image` (reuse opengraph-image route) + `author` + publisher `logo`. *(S–M)*
7. **Answer-first summary** above the index tables (drop-off/parking/lounge) — derive cheapest/dearest/free-count from `records`. Fixes thin-index + GEO citability. *(S–M)*
8. **FAQ fee answer carries verified date + source** — makes the most-cited schema unit self-citing. `lib/content.ts`. *(S)*
9. **Skip-to-content link** + `<main id>`. *(S)*
10. **Shorten overflowing `<title>`s** (87–95 → ~60 chars). *(S)*

## P0 — do first

- **P0-1 · Canonicals absent sitewide** (Technical SEO + On-Page). Live `canonical count: 0`; Next does not auto-emit them. Duplicate-URL dilution (apex/www, trailing slash, future `?utm`/`?ref`) + missing `og:url`. Fix: `alternates:{canonical}` baseline + per-route; a `canonicalFor(path)` helper. *(S–M)*
- **P0-2 · No security headers** (Code/Security). `curl -I /` returns only Vercel HSTS — no CSP/XFO/nosniff/Referrer-Policy/Permissions-Policy. Fix: `next.config.ts` `headers()`. CSP must allow `www.dwin1.com`, `static.cloudflareinsights.com`, Google Fonts. *(M)*
- **P0-3 · No Organization entity** (Structured Data + GEO). `@type:Organization` top-level = 0; only nested bare in Dataset/NewsArticle. Blocks knowledge-panel/logo eligibility; no resolvable publisher entity for AI authority. Fix: `organizationLd()` + `@id` refs. *(M)*
- **P0-4 · NewsArticle missing `image`+`author`; publisher no `logo`** (Structured Data). Disqualifies Article rich results. Fix in `newsArticleLd()`. *(S–M)*

## P1 — high value

- **P1-1** LCP H1 font not preloaded; 3 mono weights are. Preload Sans 600/700. *(S)*
- **P1-2** `/news` heading skip H1→H3 (NewsCard is `<h3>` with no `<h2>`). Make NewsCard `<h2>` or add `headingLevel`. *(S)*
- **P1-3** `/drop-off-charges` (and parking/lounge) index thin — add answer-first summary + H2 intro. *(M)*
- **P1-4** FAQ answers omit verified date + source. *(S)*
- **P1-5** `SegmentedControl` radiogroup with no keyboard model (WCAG 4.1.2). Simpler: `<button aria-pressed>` in `<div role=group>`. *(S/M)*
- **P1-6** No skip-to-content link; `<main>` has no id (WCAG 2.4.1). *(S)*
- **P1-7** Animated calculator result re-renders `aria-live` every frame (WCAG 4.1.3). Move `aria-live` to a settled-value span. *(S)*
- **P1-8** No Offer/AggregateOffer schema on parking pages despite visible prices. New `aggregateOfferLd()`. *(M–L)*
- **P1-9** Overflowing drop-off `<title>` templates. *(S)*
- **P1-10** `next`/`react`/`react-dom` pinned `"latest"` — silent-major risk with no CI. Caret-pin. *(S)*
- **P1-11** No CI runs the (strong) test suite. Add GitHub Actions: `turbo run typecheck test` + Playwright. *(M)*
- **P1-12** Lounge airport pages thinnest + largely duplicative. Add per-record notes; vary FAQ by data. *(M)*
- **P1-13** Drop-off pricing not modelled as Offer/PriceSpecification (pairs with P1-8). *(M)*

## P2 — nice-to-have (24 items, summary)

Performance: ambient-blob `contain:paint` + lower blur; preconnect for dwin1/CF; `next/script lazyOnload`.
Schema/GEO: WebSite `SearchAction` (Sitelinks Searchbox); `Airport`/`Place` entity from lat/lng/iata; per-page `WebPage` node with `dateModified` + `speakable`; richer `Dataset` (`variableMeasured`/`spatialCoverage`/`distribution`); a static JSON/CSV data export for agentic citation; explicit AI-crawler `Allow` + RSS `<lastBuildDate>`; lounge Offer.
On-Page: align index H1s to title head term; parking-duration H1 → shared `PageHeading`; trim >160-char meta descriptions; mutual airport-triplet interlinking (lounge↔drop-off).
Accessibility: global `:focus-visible` ring; FAQ chevron open-state weight (AA already met).
Code: extract shared `@mathfamily/partners`; add branded `not-found.tsx`/`error.tsx`; commit the dangling `line-glyphs.tsx` refactor; don't propagate `access-control-allow-origin:*` to future data routes.
Technical SEO: `/news` pagination (deferred — not a defect at 8 articles).

## Already excellent — do NOT touch (regression risks)

- Apex→www + trailing-slash 308 canonicalisation; sitemap/robots use `www` consistently.
- True `HTTP 404` (not soft-200); `dynamicParams=false` + `notFound()`.
- No unintended `noindex`; `<html lang="en-GB">`; **hreflang correctly absent** (single-locale — adding it would be wrong).
- Sitemap (152 URLs, per-record `lastmod`); `/privacy` intentionally omitted.
- RSS / `llms.txt` / `robots.txt` all correct; `llms.txt` is best-in-class; AI crawlers explicitly allowed.
- Existing schema (BreadcrumbList/FAQPage/ItemList/Dataset) all valid, render once, server-rendered. **No fabricated AggregateRating/Review — do not add.**
- Answer-first content + per-fact citability; unique keyword-front-loaded titles; one H1 per page (except the `/news` H3 skip).
- Performance core: 13 `"use client"` files only; `AnimatedNumber` no flash + tabular-nums (no CLS/INP); full static + ISR; no render-blocking third-party.
- Accessibility core: AA contrast on core tokens; all inputs labelled; ≥44px targets; reduced-motion respected; table `scope` + `<dl>` mobile collapse.
- Security/code hygiene: every `target=_blank` has `rel=noopener`; affiliate anchors add `sponsored`; no secrets committed; strict TS + `noUncheckedIndexedAccess`.
- **No raster images exist** (only the decorative `aria-hidden` `UkMap` SVG). "Missing alt text" was a false positive — **do not add alt/images chasing it.**

*Dropped as false positives during consolidation: missing image alt, unlabelled day-picker buttons, missing `twitter:card` (Next auto-generates from OG).*
