# Math Family — News/Updates Engine & Analytics Swap — Design Spec

*Expands the Math family beyond static cost calculators into a fresh, automated,
SEO/GEO-leading **airport news & updates** product — and swaps Vercel analytics for a
privacy-first alternative. ParkMath first; built in shared packages so RoamMath inherits it.*

## Product intent

The cost calculators answer "what does this cost?" The news engine answers "what just
**changed**?" — per-airport, dated, official-sourced operational updates (fee changes,
parking/lounge changes, terminal works, drop-off-zone relocations, car-park
closures, strikes, major delays). News inherits the brand's exact trust model — every
item carries an official `sourceUrl` and a `verifiedAt` date — so it reads as authority,
not blog filler.

**Why this is the moat:** Omni, MoneySavingExpert and the parking resellers publish *no*
fresh, per-airport, official-sourced operational updates with structured before→after
data. Fresh dated sourced content is the single biggest reason Google and AI answer
engines (ChatGPT/Perplexity/Gemini) treat a site as the *current* authority. Each update
becomes an atomic, citable fact.

## Decomposition — three sub-projects (each ships working value)

The work is too large for one implementation plan. It splits into three sub-projects,
built in order; **each gets its own implementation plan**. This spec designs all three;
sub-projects 1 and 2 are detailed enough to plan immediately, sub-project 3 is designed
and planned after 2 ships.

1. **Analytics swap** (tiny, ship first) — remove Vercel analytics, add a Cloudflare Web
   Analytics seam. Clears the live console 404 today.
2. **News data model + surfaces** (the feature, no automation) — schema, seeded dataset,
   inline block + `/news` hub + per-item pages + RSS + SEO/GEO wiring. A complete feature
   fillable by hand or PR.
3. **News gathering routine** (automation) — watchlist + scheduled Claude Code agent +
   PR. Fills sub-project 2 automatically.

---

## Sub-project 1 — Analytics swap

**Remove:** `@vercel/analytics` import + `<Analytics/>` from `apps/parkmath/app/layout.tsx`
and `apps/roammath/app/layout.tsx`; drop the `@vercel/analytics` dependency from both apps'
`package.json`.

**Add:** `packages/ui/src/site-analytics.tsx` exporting `<SiteAnalytics>`. When
`process.env.NEXT_PUBLIC_CF_BEACON_TOKEN` is set, it renders the Cloudflare Web Analytics
beacon:

```html
<script defer src="https://static.cloudflareinsights.com/beacon.min.js"
        data-cf-beacon='{"token":"<TOKEN>"}'></script>
```

When the env var is unset (dev/CI/preview) it renders `null` — safe everywhere. Beacon-
script approach (not Cloudflare-proxy auto-inject) because the sites are served from
Vercel, not proxied through Cloudflare. Each app's layout renders `<SiteAnalytics/>` in
place of `<Analytics/>`.

**The seam:** `<SiteAnalytics>` is the single place analytics lives. Adding self-hosted
**Plausible** later = adding its `<script>` (and a `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` env)
inside this one component — no layout changes.

**Later (documented, not built):** `docs/engineering-notes.md` gains a short "Self-hosting
Plausible" section: a `docker compose` service (Plausible + ClickHouse + Postgres) behind
a reverse proxy, or a one-click Docker PaaS (Coolify/Dokploy-style). Decision deferred.

**Privacy:** Cloudflare Web Analytics sets **no cookies** → no cookie-consent banner
needed, reinforcing the privacy/trust story.

---

## Sub-project 2 — News data model + surfaces

### Data model

Follows the existing dataset pattern: a zod schema + JSON dataset in `packages/data`,
rendered statically, updated via git PR (identical to drop-off/parking/lounge).

```ts
// packages/data/src/news.ts
NewsItemSchema = z.strictObject({
  id: Slug,                       // e.g. "heathrow-dropoff-fee-jun-2026"
  airportSlug: Slug.nullable(),   // which airport; null = cross-airport / main news
  category: z.enum([
    "fee-change", "parking", "lounge", "terminal-works",
    "drop-off-zone", "strike", "closure", "rule-change", "delay", "other"
  ]),
  title: z.string().min(1),
  summary: z.string().min(1),     // 1–2 plain-English sentences, answer-first
  body: z.string().nullable(),    // optional longer markdown
  change: z.strictObject({        // optional structured before→after
    label: z.string(),            // e.g. "Drop-off charge"
    from: z.string(), to: z.string()
  }).nullable(),
  sourceUrl: HttpUrl,             // official source — REQUIRED (trust rule)
  sourceLabel: z.string().min(1),
  publishedAt: IsoDate,           // date the update is about
  verifiedAt: IsoDate,            // date we verified it
  supersedes: Slug.nullable()     // id of a prior item this updates
})
NewsDatasetSchema = z.strictObject({ version, lastUpdated: IsoDate, items: z.array(NewsItemSchema) })
```

- Dataset: `packages/data/datasets/parkmath/news.json`, seeded with a handful of **real**
  verified items at build time (hand-authored from official sources — no fabricated data).
- Loader: `loadNewsDataset()` + helpers `newsForAirport(slug)` (recent first),
  `recentNews(limit)`, `newsById(id)`.
- A content test (existing vitest pattern) asserts every item has an official `sourceUrl`,
  a valid `verifiedAt`, a known `category`, and a unique `id`.

### Surfaces (all generated from `news.json`)

- **Inline "Latest updates" block** on each airport page (`drop-off-charges/[airport]`,
  and reused on parking/lounge): the ≤3 most recent items for that airport — dated cards
  with a category chip, the answer-first summary, the before→after `change`, and the
  `VerifiedStamp` source link. Hidden when the airport has no items. *Side benefit:* fills
  the sparse-airport whitespace identified in the design audit.
- **`/news` hub** — the "main news": reverse-chronological feed across all airports, in the
  card-row pattern, with airport + category filters. Server-rendered default order; client
  filter as progressive enhancement (no-JS shows the full list).
- **Per-item `NewsArticle` pages** `/news/<id>` — `generateStaticParams` over all items;
  answer-first headline + date + source + structured change + body, links back to the
  airport's cost page and to related items.
- **RSS feed** `/news/feed.xml` — a route handler emitting the latest N items as RSS 2.0;
  `<link rel="alternate" type="application/rss+xml">` in the layout head.

### SEO / GEO wiring

- **`NewsArticle` JSON-LD** per item page via a new `newsArticleLd()` builder in
  `packages/geo` (`headline`, `datePublished`, `dateModified`, `publisher`, `about` the
  airport, `isBasedOn` the source). Each update = an atomic, dated, AI-citable fact.
- **Freshness signals** — each airport page's "Updated <date>" reflects its latest news
  item's `verifiedAt`; `dateModified` flows into schema; the hub shows "N updates this
  month."
- **Sitemap** — `sitemap.ts` includes `/news`, every `/news/<id>`, with accurate `lastmod`.
- **`llms.txt`** — gains a "Recent updates" section linking `/news` and the latest items so
  AI crawlers reading `llms.txt` get the fresh facts.
- **Internal linking** — cost page ↔ its updates ↔ news item ↔ hub, concentrating
  authority and circulating users/crawlers.

### Shared-package placement (for RoamMath parity)

- `packages/data`: `news.ts` schema + loader (generic, app-agnostic).
- `packages/geo`: `newsArticleLd()` builder.
- `packages/ui`: news UI components (`NewsCard`, `LatestUpdates`, `NewsArticleLayout`).
- Apps supply their own `datasets/<app>/news.json` and routes. RoamMath inherits all of it
  later via its teal `@theme` override.

---

## Sub-project 3 — News gathering routine (automation)

A direct extension of `tools/freshness` — same machinery, new target.

- **Watchlist grows.** `tools/freshness/watchlist.json` gains, per airport, its official
  newsroom / "at the airport" / travel-updates URLs (alongside the cost-source URLs already
  watched). One-time discovery: a research pass finds all 25 airports' official update
  pages (a Workflow fan-out at build time).
- **The routine.** A scheduled **local Claude Code run** (the existing `run-agent.sh`
  pattern): fetch each watched news URL → normalize + fingerprint (`contentFingerprint`) →
  diff against `hashes.json`. When a watched page genuinely changed, the agent reads the
  new content, extracts only items matching the agreed scope, drafts them into `news.json`
  (title/summary/category/change/source/dates), dedupes against existing items (sets
  `supersedes` for updates), and **opens a PR** ("news: N candidate updates — <airports>")
  with a NEEDS-HUMAN review block.
- **Trust gates reused verbatim** (from the freshness watchdog): official sources only;
  never invent; null-over-guess; date-stamp; PR-only, never push to main; single-trigger
  pending so it cannot spam PRs. **Bounded change:** the news routine may only *add* items
  and touch `news.json` — it may not edit cost datasets.
- **Cadence mirrors freshness:** daily fingerprint check (free, no LLM) + weekly extraction
  sweep + on-demand run. LLM extraction fires only when a watched page actually moved.
- **Cost saver:** the bulk page-reading/extraction can run on the configured **Gemini**
  backend (`gemini-2.5-flash` via the fallback resolver in `tools/gemini-pick-model.sh`)
  instead of Claude tokens; the routine orchestrates in Claude Code and offloads
  extraction to cheap Gemini.
- **Scheduling/ops:** rides the existing **launchd** setup
  (`com.mathfamily.freshness-sweep.plist` pattern) on the local machine — no new infra.

---

## Cross-cutting trust & UX rules

- Every news item is **answer-first** (lead with what changed + the new number) so AI
  engines extract it cleanly — same GEO discipline as the cost pages.
- Colour is never the only signal; dated/sourced/verified treatment matches the cost UI.
- News pages are **readable with JavaScript off** (server-rendered; client only enhances
  the hub filter), per the existing project rule.
- Reduced-motion respected; ≥44px touch targets; contrast ≥4.5:1 — inherits the design
  system from the mobile-elevation work.

## Testing

- `packages/data`: content test over `news.json` (sourceUrl/verifiedAt/category/unique id).
- `packages/geo`: unit test for `newsArticleLd()` output shape.
- `packages/ui`: component tests for `NewsCard`/`LatestUpdates` (configless vitest, jsdom
  docblock + `afterEach(cleanup)` — never create vitest/vite config files on this volume).
- `apps/parkmath`: Playwright — `/news` hub renders items no-JS; a `/news/<id>` page
  renders `NewsArticle` schema; an airport page shows its latest-updates block; RSS route
  returns valid XML.
- Sub-project 3: the agent's PR output is validated by the same dataset content test (a bad
  draft fails CI), and the routine has unit tests for diff/dedup like the existing watchdog.

## Out of scope (now)

- Self-hosted Plausible deployment (designed seam only; Docker self-host is a later task).
- Broad third-party / press news (scope is official operational updates only).
- Editorial cornerstone roundups (human-written; possible later).
- RoamMath news content (shared packages are built RoamMath-ready; its `news.json` + routes
  come later).
- Google News Publisher Center / `<news:news>` sitemap (standard sitemap `lastmod` first;
  revisit if pursuing Google News inclusion).

## Success criteria

- Live console error (Vercel analytics 404) gone; Cloudflare analytics collecting, no
  cookie banner.
- Every ParkMath airport page shows dated official-sourced updates when they exist; a
  `/news` hub + per-item `NewsArticle` pages + RSS are live and in the sitemap + `llms.txt`.
- The local routine reliably opens reviewable PRs of new, deduped, sourced news items on
  its schedule, touching only `news.json`.
- Measurable over time: fresher `lastmod`/`dateModified` across the site; per-item pages
  indexed and surfaced/cited in AI answers.
