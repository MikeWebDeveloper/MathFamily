# ParkMath Automations v2 — Design Spec

**Date:** 2026-06-16
**Status:** Spec only — **build nothing yet**. Three independent units, greenlit together; each is
built on its own (spec → plan → TDD → PR) and shipped when it's ready.
**Goal:** Add three scheduled automations — a **site + deeplink watchdog**, a **weekly business
digest**, and a **daily IG/Pinterest social generator** — that slot into the existing
read-mostly + human-review automation pattern.

---

## 1. Context — the existing pattern (reuse it), with one correction

The repo runs autonomous agents as: a **Claude skill** (`.claude/skills/<name>/SKILL.md`) that reads
datasets / `tools/*` read-only and writes a **committed, human-reviewed artifact** (a PR, a
`docs/reports/*.md`, or a `tools/social/*` file). The human-review gate is the trust differentiator
and stays. Helper logic lives in `tools/<name>/*.mjs` (pure, no secrets in source; tokens in a
gitignored `.env`, like `tools/awin`).

**Correction to the prior spec's scheduling.** The earlier marketing-ops spec scheduled work via
**launchd** plists + `run-agent.sh` + headless `claude -p`. That mechanism is **broken on this
machine**: `$HOME` is on the external **TB4 volume**, so launchd refuses to bootstrap LaunchAgents
(`EIO`), and a clean headless `claude -p` is unauthenticated ("Not logged in"). All scheduling now
uses **Claude Code scheduled-tasks** (`~/.claude/scheduled-tasks/`, managed via the scheduled-tasks
tool), which run inside the authenticated runtime and avoid both problems. The four existing weekly
jobs (`parkmath-freshness-sweep`, `parkmath-news-sweep`, `parkmath-awin-digest`,
`parkmath-content-factory`) already run this way. The three units below are added the same way.

> Constraint inherited by all three: each run must **guard on the TB4 volume being mounted** (the
> repo path is under `/Volumes/TB4 Workstation/…`); if absent, report and no-op.

---

## 2. Architecture decision

**Chosen — reuse the skill + helper-script + scheduled-task pattern, review-files everywhere.** Each
unit is a `.claude/skills/<name>/SKILL.md` that calls a deterministic `tools/<name>/*.mjs` helper and
emits a reviewable artifact (a GitHub issue, a `docs/reports/*.md`, or `tools/social/*`). Zero new
standing infra, human review preserved.

Rejected:
- **Pure cloud routine** — would hit the cloud per-day run cap (Max = 15/day) and lose easy local
  filesystem/`gh` access. Local scheduled-tasks are unlimited beyond token usage.
- **One mega-skill for all three** — they have different cadences, inputs, and failure modes; keeping
  them separate keeps each understandable and testable in isolation.

---

## 3. Unit W · `parkmath-watchdog` — site + affiliate-deeplink health

- **Purpose:** catch a down page or a broken affiliate deeplink the day it happens — silent
  revenue/SEO loss is the worst-case for an affiliate site.
- **Cadence:** **daily, ~06:40 local** (Claude Code scheduled-task `parkmath-watchdog`).
- **Behaviour** (`tools/watchdog/check.mjs`):
  1. **Pages up.** Enumerate live routes from the datasets — hubs (`/drop-off-charges`,
     `/airport-parking`, `/airport-lounges`, `/news`) + each of the 25 airports across
     `/drop-off-charges/[airport]`, `/airport-parking/[airport]`,
     `/airport-parking/[airport]/[duration]` (3-/7-/14-days), `/airport-lounges/[airport]`, plus
     recent `/news/[id]`. GET each on `https://parkmath.co.uk`; assert `200` + non-empty HTML.
     (~150 requests, throttled.)
  2. **Deeplink integrity — without firing phantom clicks.** Replicate `buildAwinLink()`
     (`apps/parkmath/lib/partners.ts:49`) for every airport/surface and assert the output against the
     Holiday Extras contract: `awinmid=3496`, `awinaffid=2932035`,
     `clickref=parkmath-<airport>[-<surface>]`, `ued` present and correctly percent-encoded. Then
     resolve the **`ued` destination** (the holidayextras.com landing URLs) → expect `200`.
     **Never** request `awin1.com/cread.php` / `awclick.php` — firing the click tracker would register
     phantom affiliate clicks and risk AWIN compliance. Validation is structural + destination only.
  3. *(Light, optional)* assert each airport page still emits its Product/OG image meta (quick regex)
     — a known prior SEO concern.
- **In → out:** datasets (`packages/data/datasets/airports.json`,
  `…/parkmath/{drop-off-fees,parking-tariffs,news}.json`) + `partners.ts` →
  **on failure only:** open/update a single rolling **GitHub issue** (`gh issue`) titled
  `🔴 Watchdog <date>` listing broken URLs/links; comment + **close when green again**. All-green =
  **silent** (no file, no issue). On failure it also writes `docs/reports/watchdog-<date>.md` with the
  detail, linked from the issue.
- **Interface:** scheduled-task `parkmath-watchdog` → runs the `watchdog` skill (`/watchdog`), which
  shells `tools/watchdog/check.mjs` and handles the `gh` issue.
- **Deps/risks:** needs `gh` authed (it is, for PRs). Must throttle/parallel-cap the ~150 GETs.
  Distinguish a real 5xx/timeout from a transient blip (retry once before flagging).

---

## 4. Unit D · `parkmath-digest` — weekly business pulse

- **Purpose:** one screen answering "how's the portfolio doing?" — traffic, affiliate, indexing,
  open watchdog issues — so the numbers aren't scattered across dashboards.
- **Cadence:** **Mon ~08:50 local** (scheduled-task `parkmath-digest`), right after
  `parkmath-awin-digest` (Mon ~08:40) so it can fold in that report.
- **Behaviour** (`tools/digest/build.mjs`) — aggregate into `docs/reports/digest-<date>.md`:
  - **Affiliate:** reuse `tools/awin` lib (clicks, commission, by airport/advertiser) — or read the
    `docs/reports/awin-<date>.md` produced minutes earlier.
  - **Traffic:** **Cloudflare GraphQL Analytics** for the zone — page views, unique visitors, top
    paths, Core Web Vitals — with **▲▼ vs the prior week**. Implemented as a **token-based**
    `tools/cloudflare/analytics.mjs` (CF API token `CF_API_TOKEN` + `CF_ZONE_ID` in a **gitignored
    `tools/cloudflare/.env`**, mirroring `tools/awin`). Chosen over the interactive Cloudflare MCP
    because scheduled runs can't rely on interactive MCP auth. If the token is missing, the digest
    prints "traffic not configured" rather than failing.
  - **Indexing (light):** IndexNow last-submit status + a short Bing/GSC note (no API tooling exists;
    kept minimal, references the known Bing 403 status).
  - **Watchdog:** list any open `🔴 Watchdog` GitHub issues.
- **In → out:** `tools/awin` + `tools/cloudflare/analytics.mjs` + `gh issue list` →
  `docs/reports/digest-<date>.md` (one screen).
- **Interface:** scheduled-task `parkmath-digest` → `digest` skill (`/digest`).
- **Deps/risks (Mike-side unblocker):** a **Cloudflare API token (Analytics:Read) + zone ID**, added
  to `tools/cloudflare/.env`. Until then the digest runs but omits traffic.

---

## 5. Unit S · `parkmath-social-daily` — daily Instagram + Pinterest

- **Purpose:** a daily, image-forward IG + Pinterest draft — distinct from the **weekly**
  `content-factory` (7 mixed-platform posts). No overlap: this is daily, IG/Pinterest-only, and leads
  with rendered/visual assets.
- **Cadence:** **daily, ~07:30 local** (scheduled-task `parkmath-social-daily`).
- **Selection:** **airport-of-the-day** — deterministic rotation across the 25 airports by
  day-of-year (`airports[dayOfYear % 25]`), so coverage is even and reproducible. For that airport,
  pull: drop-off `feeSummary` + `penaltyPence` + `freeAlternative` (name + minutesFree) and the
  biggest gate-vs-pre-book parking saving from `parking-tariffs.json`.
- **Outputs** (drafts only) → `tools/social/daily-<date>/`:
  - **Instagram:** `ig-card.png` (1080×1080 branded card) + `ig.txt` caption — leads with the verified
    number, names the free alternative, ends with `parkmath.co.uk` + hashtags.
  - **Pinterest:** `pin.png` (1000×1500 vertical) + `pin.txt` (title + description) + the destination
    link to that airport's parkmath.co.uk page.
  - **AI image-gen prompt:** `image-prompt.txt` — a ready-to-paste prompt for an on-brand visual, as
    an alternative to the rendered card (the "both" option).
  - `post.json` — machine-readable bundle (airport, platform blocks, asset paths, source figures).
- **Card rendering** (`tools/social/render-card.mjs`): an HTML/CSS template → PNG via **Playwright**
  screenshot, reusing the OG-image visual language (`apps/parkmath/app/**/opengraph-image.tsx`) for
  brand consistency. Templates in `tools/social/templates/{ig,pin}.html`. Heaviest piece of the three.
- **Rules (inherited from `content-factory`):** lead with a verified number; `parkmath.co.uk` in every
  post; drop-off names the free alternative; parking uses gate-vs-pre-book as the hook; **no affiliate
  links**; no superlatives without data; **no auto-publish** — Mike reviews and posts manually.
- **Interface:** scheduled-task `parkmath-social-daily` → `social-daily` skill (`/social-daily`).
- **Deps/risks:** Playwright render in a scheduled-task context (validate it runs headless on this
  machine during build); keep the template self-contained (inline fonts/logo from
  `docs/marketing/assets/`) so rendering needs no network.

---

## 6. Recommended build sequence (by friction)

1. **W · watchdog** — mostly deterministic HTTP + a structural assert; unit-testable; protects
   revenue immediately. No Mike-side unblocker.
2. **D · digest** — reuses `tools/awin`; the only new dependency is the CF token (Mike-side). Traffic
   degrades gracefully if it's not yet set.
3. **S · social-daily** — most build (templates + Playwright render); ship after the other two.

Each is an independent greenlight with its own spec→plan→build cycle and its own scheduled-task.

---

## 7. Dependencies & Mike-side unblockers
- **Cloudflare API token (Analytics:Read) + zone ID** → `tools/cloudflare/.env` (for D's traffic).
- **`gh` authed** (present) — for W/D GitHub issues.
- **Playwright** available for headless PNG render (for S) — verify on this machine during build.
- All three registered as **Claude Code scheduled-tasks** (not launchd — see §1).

## 8. Non-goals / deferred
- Auto-publishing to IG/Pinterest/MailerLite (push instead of review-file) — a later thin layer.
- Firing real affiliate deeplinks to "test" them — explicitly out (phantom-click risk); structural +
  destination validation only.
- GA4 / Plausible / full GSC API integration — out; traffic comes from Cloudflare only.
- Per-airport affiliate overrides / additional merchants (Purple Parking, Airparks) — separate items;
  the watchdog already generalises to any active partner in `partners.json`.
