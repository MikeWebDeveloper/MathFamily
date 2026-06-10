# Math Family Foundation + ParkMath + RoamMath — Design Spec

*2026-06-10 · Approved through brainstorming with Mike (michal.latal@googlemail.com)*

## 1. Context and goals

The Math family is a portfolio of UK cost-calculator sites monetising life-event moments
(see the portfolio map and the three source documents on Google Drive: the ParkMath
operating guide, the MoveMath production-architecture PDF, and the PropTech GEO &
Affiliate Architecture doc). No code exists yet — the "Project 1 starter repo" referenced
in those documents was never built. This project therefore builds:

1. **The shared family foundation** (monorepo, calculation-engine pattern, design system,
   programmatic page generator, GEO/schema layer, data-freshness system).
2. **ParkMath** — UK airport parking, drop-off and lounge cost tracker. Built first and
   fully; it is the vehicle that creates the foundation. Summer travel peak is live now,
   so the drop-off wedge ships as early as possible.
3. **RoamMath** — roaming/baggage/holiday-extras costs. Spec'd here at structure level;
   built immediately after ParkMath as the second consumer of the template, proving the
   "new brand = data + tokens" model.

**Success criteria:** ParkMath drop-off pages live on a Vercel staging URL within the
summer window with verified, freshness-stamped data; all calculators answer instantly
client-side; pages are fully static and citable by AI answer engines; RoamMath scaffolds
from shared packages with no changes to package code; every price on the site traces to
an official source URL with a verified date.

**Decisions taken during brainstorming:**

- Scope: foundation + ParkMath fully now; RoamMath structure-level, built second.
- Data: Claude compiles initial datasets from official sources; Mike spot-checks
  5 airports against official pages before launch.
- Infrastructure reality: no domains, no Awin account, no Ltd yet. Staging-first
  deployment; affiliate layer ships with all slots inactive.
- Design DNA: **fintech clarity + data trust** — Wise/Monzo-grade polish, big friendly
  numbers, instant answer above the fold, layered with data-journalism trust signals
  (source citations, verified-date stamps, mini charts).
- Architecture: **Approach A** — Turborepo monorepo, Next.js (latest stable), fully
  static programmatic pages, data-as-code JSON reviewed via git diff. Astro and
  database-driven approaches considered and rejected (divergence from existing
  architecture docs; removal of the human price-review gate respectively).

## 2. Architecture

### 2.1 Monorepo layout (Turborepo + pnpm)

```
MathFamily/
├── apps/
│   ├── parkmath/        # Next.js app — built in P1–P2
│   └── roammath/        # Next.js app — scaffolded in P3
├── packages/
│   ├── engine/          # pure-TS calculation engines, zero runtime deps
│   ├── ui/              # design system: tokens + components (Tailwind v4, shadcn-based)
│   ├── geo/             # JSON-LD generators: ParkingFacility, Dataset, FAQPage,
│   │                    # CalculateAction, WebSite, BreadcrumbList
│   ├── data/            # Zod schemas + JSON datasets + freshness tooling
│   └── config/          # shared tsconfig / ESLint / Tailwind preset
├── docs/superpowers/specs/   # design docs (this file)
├── turbo.json
└── pnpm-workspace.yaml
```

Per-brand differences live only in the app folder: design tokens (colour, logo, fonts),
domain config, privacy/disclosure copy, and which datasets it consumes.

### 2.2 Rendering model

- Every programmatic page is fully static: `generateStaticParams` from the datasets,
  `dynamicParams = false`. Unknown params 404 at the edge.
- Data merge to main → Vercel rebuild → fresh pages. No runtime database in v1.
- Calculators are small client-side islands importing `@mathfamily/engine`. The static
  page renders the complete answer (tables, fees, FAQ) as HTML first; islands enhance,
  never gate, the content. No-JS users and AI crawlers get everything.
- All money arithmetic in integer pence (bigint where sums can exceed safe integers),
  following the MoveMath PDF engine pattern: typed inputs, banded results, typed
  warnings, formula versioning.

### 2.3 Data-as-code contract (`packages/data`)

Every dataset record carries, in addition to its values:

- `sourceUrl` — official page the value was read from (mandatory)
- `verifiedAt` — ISO date of last human-confirmed verification (mandatory)
- dataset-level `version` and `lastUpdated`

Enforcement:

- Zod schemas validate all datasets at build time; violations fail the build.
- CI freshness report: any record older than **60 days** unverified → warning; older
  than **120 days** → PR check fails. (January re-verification ritual resets the clock.)
- Every price change is a git diff reviewed before merge — "never auto-publish a price"
  implemented as workflow. This same JSON contract is the write target for the future
  n8n freshness machine (P4), which opens PRs rather than committing directly.

### 2.4 GEO / answer-engine layer (`packages/geo`)

- JSON-LD graph per page type; machine-readable `dateModified` everywhere, mirrored by
  a visible freshness badge.
- Master fee tables emit `Dataset` schema (citable asset for AI engines and press).
- `FAQPage` schema on every drop-off page.
- `llms.txt` at each site root describing the datasets and how pages are structured.
- Per-page OG images generated at build (e.g. via `next/og`) showing the actual fee
  numbers — shareable, citable, CTR-positive.

### 2.5 Family plumbing

- **Analytics:** Vercel Analytics in v1 (privacy-first, no cookie banner). One view per
  app; family-level rollup later.
- **Email capture:** a `ui` component wired for MailerLite (per-brand groups), hook copy
  tied to the freshness system: "Get notified when [airport] changes its fees."
  Degrades gracefully until the MailerLite account exists (slot pattern, as affiliates).
- **Compliance baseline in the shared layout:** affiliate-disclosure component
  (auto-renders on any page with an active affiliate card), "prices change — verify
  before you travel" disclaimer, privacy-policy page template, "Part of the Math family
  of UK cost calculators" footer with cross-links.

### 2.6 Affiliate layer

`partners.json` per app maps `slot × airport/route → { partner, deeplinkTemplate,
active }`. All slots ship **inactive** (no Ltd/Awin yet); cards fall back to
official-site links. Activating a partner is a one-line config change. Planned partners
(from the operating guide, re-verify at signup): Holiday Extras, APH, Heathrow Official,
Priority Pass via Awin; SkyParkSecure partner API later; eSIMs (Airalo/Saily/Holafly)
for RoamMath. Travel insurance is FCA-regulated (amber) and excluded from v1 of both
sites.

## 3. ParkMath product (built fully)

### 3.1 Routes (~200 static pages at launch)

| Route | Count | Content |
|---|---|---|
| `/drop-off-charges/[airport]` | ~25 | **Wedge.** Current fee, time limit, PCN penalty + payment deadline, Blue Badge rules, free alternative (always), FAQ, trend vs prior year |
| `/drop-off-charges` | 1 | Master comparison table with `Dataset` schema |
| `/airport-parking/[airport]/[duration]` | ~10 × 6 | Gate vs pre-book average vs meet & greet vs park & ride; durations 1/3/5/7/14/28 days |
| `/airport-lounges/[airport]` | ~10 | Lounge pay-per-visit vs Priority Pass break-even |
| `/` | 1 | Airport search, headline drop-off calculator, fee-rise hook |

`/getting-to/[airport]` (drive+park vs train/coach by party size) is **phase 2** —
heavier rail-fare data maintenance; wedge ships first.

### 3.2 Calculator islands (all use `@mathfamily/engine`)

1. **Drop-off cost:** airport + minutes + payment-timing scenario → fee, PCN risk.
2. **Parking comparison:** airport + dates + parking type → totals with savings bar.
3. **Lounge break-even:** flights/year + lounge spend → Priority Pass tier verdict.

Engines are pure functions: typed inputs, integer-pence outputs, typed warnings
(`PENALTY_RISK`, `FREE_ALTERNATIVE_EXISTS`, `DATA_UNVERIFIED_RECENTLY`…) rendered as
callouts. Out-of-range inputs clamp with a visible note; engines never throw on user
input.

### 3.3 UX (fintech clarity + data trust)

Above the fold on every page: the answer as one big number, freshness badge, source
citation. Signature components: FeeStat hero, fee-grid table, savings bar, freshness
badge, free-alternative callout (the trust move), FAQ accordion, email-capture block
(after the answer), cross-link cards to RoamMath. Design system generated via Stitch
from this DNA and stored as tokens in `packages/ui`; each future brand swaps tokens
only.

### 3.4 Datasets to compile (Claude compiles, Mike spot-checks 5 airports)

- `drop-off-fees.json` — ~25 UK airports: fee, time limit, penalty, payment deadline,
  Blue Badge policy, free alternative (location + minutes), prior-year fee.
- `parking-tariffs.json` — top 10 airports: gate rate and pre-book typical price per
  duration band per product type.
- `lounges.json` — top 10 airports: lounge names, walk-in price, Priority Pass
  participation; Priority Pass tier pricing.
- `airports.json` (shared, `packages/data`) — names, slugs, IATA codes, regions.

Sources: official airport tariff pages only, with RAC annual tracking cited for trend
context. Every record: `sourceUrl` + `verifiedAt`.

## 4. RoamMath product (structure level — detailed in its own plan in P3)

- Routes: `/roaming/[network]/[country]` (EE, O2, Vodafone, Three × top ~50
  destinations), `/roaming` master grid (`Dataset` schema), `/baggage-fees/[airline]`
  (~15 airlines). `/card-fees-abroad/[bank]` is phase 2 (amber-adjacent, lower wedge value).
- One calculator island: **trip cost** — destination + days + data use → network
  daily-pass total vs best eSIM bundle, side by side.
- Datasets: per-network per-zone roaming charges, fair-use caps, daily-pass prices;
  per-airline baggage/seat fee tables. Identical data contract.
- Affiliate slots: eSIMs (green) first; luggage retail later; insurance and money cards
  excluded from v1.
- Cross-links with ParkMath both ways from day one (travel cluster).
- Acceptance test of the template: RoamMath requires **no changes** to `packages/*`
  beyond additive dataset schemas — if it does, fix the template, not the app.

## 5. Quality gates

- **TDD on engines** (Vitest, table-driven fixtures — published example fees become
  test cases).
- Dataset validation runs as a test suite + CI freshness gate (§2.3).
- Playwright E2E: three ParkMath calculators, email capture, affiliate-card fallback.
- Accessibility review (web-design-guidelines skill) before launch.
- Lighthouse budget on drop-off and parking templates: LCP < 1.2 s, CLS ≈ 0.
- Launch checklist: Mike's 5-airport spot-check signed off; disclaimer + disclosure
  rendering verified; sitemap + llms.txt + JSON-LD validated.

## 6. Phasing

1. **P1 — Foundation + wedge:** monorepo; Stitch design system; `engine`/`data`/`geo`/
   `ui` packages; drop-off dataset (~25 airports); drop-off pages + master table + home;
   email-capture slot; Vercel staging deploy.
2. **P2 — ParkMath full:** parking + lounge datasets and spokes; all three calculators;
   OG image generation; domain attach when purchased.
3. **P3 — RoamMath:** scaffold app; roaming + baggage datasets; trip calculator;
   cross-links live.
4. **P4 — Freshness automation (separate spec):** n8n fetch → diff → PR workflow on the
   Mac mini; January re-verification runbook.

Each phase gets its own implementation plan; P1 is planned first.

## 7. Tooling used during the build

Stitch MCP (design system + screens), frontend-design / ui-ux-pro-max /
web-design-guidelines skills (UI + a11y), context7 MCP (current framework docs),
Playwright MCP (E2E), superpowers TDD (engines), deploy-to-vercel / vercel-optimize
skills (shipping), WebSearch/WebFetch (dataset compilation with source URLs).

## 8. Out of scope for this cycle

Travel insurance and any amber/red-zone affiliate content; `/getting-to/` and
`/card-fees-abroad/` spokes; SkyParkSecure live-pricing API integration; n8n automation
(P4 spec); the umbrella "Math network" hub site; MoveMath and all other family brands;
Ltd formation, domain purchase, Awin/MailerLite signup (Mike's real-world tasks —
the codebase ships slots that activate when they exist).
