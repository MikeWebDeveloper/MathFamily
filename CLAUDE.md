# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A UK cost-calculator **portfolio monorepo** answering "what does this actually cost?" with
verified, date-stamped numbers from official sources. Two brands share one engine/data/UI stack:

- **ParkMath** (`apps/parkmath`) — airport drop-off charges, parking tariffs, lounge break-even. Flagship; live at parkmath.co.uk.
- **RoamMath** (`apps/roammath`) — roaming, eSIM, baggage fees.

Stack: pnpm workspaces + Turborepo, Next.js 16 (App Router, React 19, React Compiler), Tailwind v4, TypeScript strict, Zod, Vitest, Playwright. Hosted on Vercel, proxied through Cloudflare. Node ≥22, pnpm ≥10 (pinned `pnpm@11.5.1`).

The product spec lives in `docs/superpowers/specs/2026-06-10-parkmath-roammath-design.md`; the design system in `DESIGN.md`.

## Commands

Run from the repo root (Turborepo fans out to all workspaces):

```bash
pnpm install                 # install (CI uses --frozen-lockfile)
pnpm build                   # turbo run build — Next builds + parkmath pings IndexNow post-build
pnpm test                    # turbo run test — all vitest suites
pnpm typecheck               # turbo run typecheck — tsc --noEmit everywhere
pnpm dev                     # turbo run dev — runs both Next dev servers (persistent)
```

Scope to one workspace with `pnpm --filter`:

```bash
pnpm --filter @mathfamily/engine test        # one package's vitest suite
pnpm --filter parkmath dev                    # just the ParkMath dev server
pnpm --filter parkmath build
```

Run a **single test file / single test**, from inside the package dir (uses vitest's default config-less discovery):

```bash
cd packages/engine && pnpm exec vitest run tests/drop-off.test.ts
cd packages/ui && pnpm exec vitest run -t "FeeStat renders the big number"
```

End-to-end (Playwright, needs a running/live URL — **not** in CI):

```bash
cd apps/parkmath && pnpm e2e
```

`tools/*` are plain Node ESM helpers, **not** Turbo packages — they have `node:test` suites run directly:

```bash
node --test tools/watchdog/*.test.mjs tools/awin/*.test.mjs   # glob form required (dir form no-ops on Node 22)
```

## Architecture

A strict dependency layering — data and math are pure and framework-free; apps are thin view layers over them.

```
packages/data  →  packages/engine  →  packages/geo  →  apps/{parkmath,roammath}
   (Zod + JSON)     (pure calculators)   (JSON-LD)        (Next.js App Router)
                          packages/ui  ───────────────────────↑  (shared React components + tokens)
```

- **`packages/data`** — the single source of truth. JSON datasets in `datasets/` (`airports.json`, `parkmath/*`, `roammath/*`), each record carrying `sourceUrl` + `verifiedAt`. Every dataset is parsed through a Zod `strictObject` schema (`src/schemas.ts`) at load time, so a malformed or stale record fails loudly. Helpers in `src/zod-helpers.ts` (`IsoDate`, `Slug`, `HttpUrl`) enforce shared invariants. Exported loaders (`loadAirports`, `loadDropOffDataset`, …) are the only way apps touch data.
- **`packages/engine`** — pure TypeScript calculators (`drop-off`, `parking`, `lounge`, `roaming-trip`, `geo-distance`). **All money is integer pence**; floats never represent currency. `formatPence()` in `src/money.ts` is the only place pence becomes a `£` string, and it throws on non-integer/negative input. Calculators return results plus *typed warnings* rather than throwing.
- **`packages/geo`** — JSON-LD `<script>` builders (`src/builders.ts`, `src/jsonld.tsx`) for answer engines (GEO = Generative Engine Optimization). Product/Dataset/FAQ schema, never fabricated review/shipping/return data for a parking fee.
- **`packages/ui`** — shared React components (FeeStat, FeeGrid, FreshnessBadge, SourcesBlock, calculators' sliders, maps, etc.) and the design tokens in `src/tokens.css`. The fintech-clarity design system; RoamMath re-skins it to teal via a `@theme` token override. See `DESIGN.md`.
- **`apps/{parkmath,roammath}`** — Next.js App Router. Each route's `lib/*-content.ts` builds a typed view-model from data+engine, which the matching `components/*-answer.tsx` renders. The page's headline answer must render with JS off; calculators are progressive enhancement (client islands). GEO routes per app: `llms.txt/route.ts`, `sitemap.ts`, `robots.ts`, `news/feed.xml`, and `data/*.csv` open-data downloads.

### Non-negotiable data rules

- **Never auto-publish a price.** Dataset values change *only* through a reviewed git diff (typically a PR from the freshness/news routines with a NEEDS-HUMAN block). No script writes a price into a dataset and ships it unattended.
- Integer pence everywhere; format only at the UI edge via `formatPence`.
- Every dataset record needs a real `sourceUrl` and `verifiedAt` — the schema rejects records that don't.
- Honest trends only: sparklines/trend chips render only from real `priorYearFeePence`, never fabricated history.

## Testing conventions (important — there are no vitest config files, by design)

esbuild's `build()` API **deadlocks** on this external APFS volume (`/Volumes/TB4 Workstation`, mounted `noowners`). Vitest only calls `build()` to bundle a `vitest.config.*` file, so **any vitest/vite config file makes the suite hang forever**. Full diagnosis in `docs/engineering-notes.md`. Consequences:

- **Do not add `vitest.config.*` or `vite.config.*` anywhere.** Rely on vitest's default discovery.
- Tests live in each package's `tests/**/*.test.ts(x)` directory (not co-located with `src`).
- **`packages/ui`** components need a DOM: each such test file's first line is the docblock `// @vitest-environment jsdom`, and they use `@testing-library/react` (`render` + `cleanup`). jsdom stays a devDependency, opt-in per file.
- **App tests** render server components with `renderToStaticMarkup` from `react-dom/server` (no jsdom) and assert on the HTML string.
- `apps/*` test script is `vitest run tests` — the positional `tests` filter keeps vitest from picking up Playwright's `e2e/*.spec.ts`.
- Config-less vitest can't resolve the `@/` path alias (apps' tsconfig `paths`); tests import via relative paths instead.

## Affiliate / monetization rules

Monetization is AWIN affiliate links, configured per app in `lib/partners.json` and resolved by `lib/partners.ts`.

- `buildAwinLink()` is the only deep-link builder: it emits `awin1.com/cread.php` with `awinmid`/`awinaffid`/`clickref` (clickref tags every click with its airport + surface) and a percent-encoded `ued` destination. `resolveSlot()` / `resolveHeProduct()` fall back to the official site when no partner is active.
- A partner only goes live when both its `active: true` and a non-null `awinmid` are set in `partners.json`. **Current state:** Holiday Extras (mid 3496) is **live**; Purple Parking (12028) and Airparks (3494) are configured but `active: false` (pending); Priority Pass has no programme yet. AWIN publisher id `2932035`.
- **Affiliate links never appear in social/forum/email copy** — only on the site, with disclosure. The watchdog and content tools enforce this.
- Holiday Extras has compliance constraints (no PPC brand bidding, image-audit rules); see `docs/affiliate/` and the booking-options design spec.

## Tools & automations (`tools/`)

These are operated as **Claude Code agent skills** (in `.claude/skills/`), most driven by `tools/freshness/run-agent.sh <mode>`. They are review-first: they open PRs or write review files; a human approves before anything publishes.

- **`tools/watchdog`** (`check.mjs`, skill `watchdog`) — daily site + deeplink health check against parkmath.co.uk. **Never requests `cread.php`/`awclick.php`** (firing the tracker registers phantom clicks); it validates deeplinks structurally and probes only the merchant *destination*. On failure writes `docs/reports/watchdog-<date>.md` and updates one rolling GitHub issue; silent when green.
- **`tools/awin`** (`awin.mjs`, skill `awin-digest`) — zero-dep, **read-only** AWIN Publisher API client. Token in `tools/awin/.env` (gitignored), sent only as a Bearer header. Weekly digest → `docs/reports/awin-<date>.md`.
- **`tools/freshness`** (`src/`, skills `freshness` + `news-watch`) — re-verifies datasets against official sources (`freshness`) and gathers airport news into `news.json` (`news-watch`). Both open PRs touching only data, with a NEEDS-HUMAN block. Modes: targeted `check <refs>` (watchdog-triggered) and scheduled `sweep`.
- **`tools/social`** (skills `content-factory`, `forum-scout`) — generate-then-paste-by-hand only; **nothing auto-publishes**. Holds only the README, lead-format example, and gitignored dated outputs (queue/email-digest/forum-drafts). The Canva image/video pipeline is **not built yet**. Postiz/Buffer are used to schedule the human-approved posts.
- **`tools/design-assets`** (`generate.mjs`) — generates the map SVG paths baked into `packages/ui/src/generated/`.

**Scheduling:** the `docs/launchd/*.plist` files are **templates that are NOT installed** — launchd can't load LaunchAgents from this external home volume. The live weekly jobs run as Claude Code **scheduled-tasks** instead. Run any routine manually via `tools/freshness/run-agent.sh` (add `PRINT_CMD=1` to dry-run).

## Environment variables

`.env*` is gitignored (`!.env.example`). App `NEXT_PUBLIC_*` vars are build-time inlined → changing one needs a redeploy. Real production values live in Vercel project settings, **not** in source.

- `NEXT_PUBLIC_SITE_URL` — production origin; gates IndexNow submission (no-ops for localhost/CI/preview) and canonical URLs.
- `NEXT_PUBLIC_PARKMATH_URL` / `NEXT_PUBLIC_ROAMMATH_URL` — cross-brand family links.
- `NEXT_PUBLIC_CF_BEACON_TOKEN` — Cloudflare Web Analytics beacon (set in Vercel; do not commit — high-entropy string trips secret scanners).
- `NEXT_PUBLIC_MAILERLITE_FORM_ACTION` — email-capture form endpoint. **Not yet set**, so the capture form is inert until configured.
- `tools/awin/.env`: `AWIN_API_TOKEN`, `AWIN_PUBLISHER_ID`, optional `AWIN_FEED_API_KEY`.

Note: IndexNow uses a **public, committed** key (hardcoded in `apps/parkmath/indexnow.mjs`, also served at `/<KEY>.txt` for verification) — it is **not** an env var/secret. The outstanding IndexNow item is manual Bing Webmaster Tools verification (Bing 403s), not a code change.

## CI

`.github/workflows/ci.yml` on PR/push to `main`: `pnpm install --frozen-lockfile` → `turbo typecheck` → `turbo test` → tools' `node:test` suites → `turbo build`. CI runs on Ubuntu, so the esbuild deadlock doesn't apply there. Playwright e2e is intentionally excluded (needs a live URL).

## Knowledge graph

`graphify-out/` holds a persistent graphify knowledge graph of this repo. Hooks may prompt you to run `graphify query "<question>"` to orient before broad code exploration. The graph can drift from the code — verify any file/symbol it names before relying on it.

## Contact & accounts

- Email: `parkmath.uk@gmail.com` (directory/contact alias `hello@parkmath.co.uk` → Gmail).
- Social: `@parkmathuk` on TikTok, X, Instagram, Threads, Bluesky, Pinterest. Buffer connected for Bluesky/X/Threads scheduling; Canva (free) for assets.
