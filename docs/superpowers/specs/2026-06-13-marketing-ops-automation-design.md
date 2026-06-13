# Marketing Ops Automation — Design Spec

**Date:** 2026-06-13
**Status:** Spec only — **build nothing yet**. Each unit below is greenlit and built on its own
(spec → plan → TDD → PR) when Mike chooses.
**Goal:** Triage the "ParkMath Marketing Operations — Mike's Guide v2" into who-does-what, and
design the agent workflows worth building so they slot into the existing automation pattern.

---

## 1. Context — the existing pattern (reuse it)

The repo already runs autonomous agents this way, and every new workflow here copies it:

- A **Claude skill** at `.claude/skills/<name>/SKILL.md` (today: `freshness`, `news-watch`).
- A **mode** in `tools/freshness/run-agent.sh` that runs `claude -p "/<skill> …" --max-turns 200
  --dangerously-skip-permissions` headless.
- A **launchd** agent (`docs/launchd/*.plist`) firing it on a schedule.
- Output is a **committed, human-reviewed artifact** — a PR (data/news) or a file. The human review
  gate is the product's trust differentiator; it stays.

`run-agent.sh` is now portable (`#!/usr/bin/env bash`, repo root derived from `${BASH_SOURCE[0]}`)
and CI-gated, so adding modes is safe.

**Integration reality (confirmed with Mike):** no Postiz / n8n / Telegram API is live. Therefore
**every workflow writes a committed review-file** (PR, `docs/reports/*.md`, or `tools/social/*.json`)
that Mike actions manually. No external API dependency. When Postiz/Telegram land later, a thin
push layer can be added without redesigning the skills.

---

## 2. Architecture decision

**Chosen — Approach A: reuse the freshness pattern, review-files everywhere.** New skills emit PRs
(code/data), `docs/reports/*.md` (digests), or `tools/social/queue-*.json` (content). Zero new infra,
zero external deps, human review preserved. Matches the "none live yet" reality.

Rejected:
- **B — stand up Postiz/n8n/Telegram first, push directly.** Blocks all value on plumbing Mike
  doesn't have; more fragile.
- **C — build only CSV + AWIN digest, defer the rest.** Just Approach A with a shorter list; folded
  into the build sequence (§6) instead.

---

## 3. The triage — every point in the guide

Categories: **(a)** Claude builds directly now · **(b)** Claude + Chrome extension assists (gated by
Mike's logins/permission, blocked by CAPTCHAs) · **(c)** agent workflow to develop → review-file ·
**(d)** Mike-only (identity, accounts, money, phone, sends, merges).

### (a) Claude builds directly now — pure code/content, no external setup
| Item | Guide |
|---|---|
| `/data/drop-off-charges.csv` (+ parking) export route — the link magnet | 7 |
| `/parking-price-index-2026` page + downloadable CSV | 2.3 |
| SVG infographic price charts (image-SEO + social assets) | 8.2 |
| Draft the journalist pitch email(s), per-journalist personalisable | 2.1 |
| Draft MSE / Reddit reply templates from live data | 3.2 / 3.3 |
| Draft all directory-submission copy (Product Hunt, AlternativeTo, Uneed, …) | 5 |
| Draft resource-page + Sheffield/local-press outreach emails | 7 |
| Draft MailerLite welcome + weekly-digest email bodies from `news.json` | 1.3 / 6 |
| One-line `partners.json` activation when a merchant approves | 8.4 |

### (c) Agent workflows for me to develop → review-file
| Workflow | Output | Status |
|---|---|---|
| **AWIN weekly digest** (uses `tools/awin`) | `docs/reports/awin-*.md` | unblocked — top ROI |
| **Content factory** (posts + TikTok scripts) | `tools/social/queue-*.json` (+ email digest) | unblocked |
| **Forum-scout drafts** (flagged keywords → replies) | `tools/social/forum-drafts-*.md` | partial — F5Bot feed is Mike's paste |
| **AI-citation monitor** (monthly) | `docs/reports/ai-citations-*.md` | Chrome-dependent (b+c hybrid) |

### (b) Claude + Chrome extension assists
Drive GSC/Bing once Mike is logged in (submit sitemap, AI-referral segment) · set up F5Bot alerts ·
monitor `#journorequest`/`#PRrequest` on X (read) · find live MSE/Reddit threads · competitor intel
(Purple Parking rankings, HE image-search share, "useful links" resource pages) · run the AI-citation
checks. All gated by Mike's logins; CAPTCHAs and "publish/submit" clicks remain Mike's.

### (d) Mike-only — identity, accounts, money, phone, sends, merges
Create GSC / Bing / MailerLite / social / Postiz accounts + DNS-verify + set Vercel env · film
TikToks · send pitches / post forum replies / final-submit directories · review+merge PRs, approve
queues, read dashboards.
*Exception:* the launchd install (`cp` + `launchctl load`) — Claude **can** run it on Mike's Mac via
Bash if asked; it's only "Mike-only" because it's persistent system config.

---

## 4. Agent-workflow designs (the `(c)` skills)

Each follows the pattern in §1: `.claude/skills/<name>/SKILL.md` + a `run-agent.sh` mode + (optional)
launchd + a committed review-file. Skills are **read-mostly**: they read datasets/`tools/awin`, never
touch affiliate ranking, and never include affiliate links in social/forum copy.

### C1 · `awin-digest` (unblocked, top ROI)
- **Purpose:** weekly AWIN performance + merchant-status digest, and an activation trigger.
- **Behaviour:** run `tools/awin programmes --watch` (detects `pending→joined` flips) and
  `tools/awin transactions --since <today-7d>`; summarise clicks/earnings by airport (from
  `parkmath-<airport>` clickRefs) + advertiser. When a higher-EPC merchant joins (e.g. Heathrow
  Airport Parking, ID 2365, EPC £1.48), emit a ready-to-paste `partners.json` ACTIVATE snippet.
- **In → out:** `tools/awin/.env` (Mike's token, gitignored, present on his Mac) →
  `docs/reports/awin-YYYY-MM-DD.md` (≤10 lines).
- **Interface:** `run-agent.sh awin-digest` → `claude -p "/awin-digest"`; launchd **Mon 08:00**.
- **Dep/risk:** the headless launchd run needs `tools/awin/.env` populated; the skill must `--env-file`
  it. If the token is missing, the digest notes "AWIN token not configured" rather than failing.

### C2 · `content-factory` (unblocked, biggest social lever)
- **Purpose:** a week of social posts + the email digest, from live data.
- **Behaviour:** read the last 7 `news.json` items + `drop-off-fees.json` + `parking-tariffs.json`;
  generate 7 posts — 2 TikTok scripts (screen-record format), 2 X, 1 Threads, 1 Pinterest, 1 LinkedIn
  — under the rules: lead with a verified number; always include `parkmath.co.uk`; **no affiliate
  links in social**; drop-off posts always name the free alternative; parking posts use the
  gate-vs-pre-book saving as the hook. **Also** emit the MailerLite weekly-digest body (last 5–7 news
  items, plain text + source links) — folds in the former "C3," so it's one skill, two artifacts.
- **In → out:** datasets → `tools/social/queue-YYYY-MM-DD.json` (array of
  `{day, platform, format, text, hashtags, sourceAirport}`) + `tools/social/email-digest-YYYY-MM-DD.md`.
- **Interface:** `run-agent.sh content-factory` → `claude -p "/content-factory"`; launchd **Sun 09:00**.
- **Review model:** Mike reads the JSON, pastes approved posts into Postiz; pastes the digest into
  MailerLite. (A future Postiz push layer replaces the paste, not the skill.)

### C4 · `forum-scout` (partial — Mike's F5Bot feed)
- **Purpose:** draft data-backed forum replies for flagged opportunities.
- **Behaviour:** read `tools/social/forum-leads.md` (Mike pastes F5Bot alert lines / thread URLs +
  the airport in question); for each, draft a reply citing live figures for that airport (gate vs
  pre-book, free alternative, recent change from `news.json`), citing the site as an **independent**
  source, **never** with an affiliate link, and never claiming authorship in the first reply.
- **In → out:** `tools/social/forum-leads.md` → `tools/social/forum-drafts-YYYY-MM-DD.md`.
- **Interface:** `run-agent.sh forum-scout` → `claude -p "/forum-scout"`; **on-demand** (Mike runs it
  when alerts arrive); optional daily launchd that no-ops on an empty leads file.

### C5 · `ai-citation-check` (Chrome-dependent, lowest priority)
- **Purpose:** track whether AI answer engines cite ParkMath.
- **Behaviour:** Claude drives the Chrome extension to ask a fixed question set (e.g. "How much to
  drop off at Heathrow?", "Cheapest 7-day parking at Manchester?") to ChatGPT / Perplexity / Gemini,
  recording cited?/quote per engine × question.
- **Out:** `docs/reports/ai-citations-YYYY-MM.md` (engine × question table).
- **Interface:** **monthly, interactive** — needs Mike's logged-in browser, so it cannot be headless
  launchd. Run on request. This is the most "assisted" workflow and the lowest priority.

---

## 5. Direct code builds (the `(a)` units)

### A1 · CSV export routes — *the link magnet*
- **Files:** `apps/parkmath/app/data/drop-off-charges.csv/route.ts`,
  `apps/parkmath/app/data/parking-tariffs.csv/route.ts`.
- **Behaviour:** read the loaders, emit CSV with a date-stamp + `sourceUrl` column per row;
  `Content-Type: text/csv`, `Content-Disposition: attachment`, cache headers. Drop-off columns:
  airport, iata, feeSummary, maxStayMinutes, penaltyPence, freeAlternative, verifiedAt, sourceUrl.
  Parking columns: airport, product, price3d, price7d, price14d, verifiedAt, sourceUrl.
- **Discovery:** link from `/drop-off-charges` + `/airport-parking` + footer + `llms.txt`.
- **Test:** a pure CSV-serialiser unit test (handles commas/quotes per RFC 4180).

### A2 · `/parking-price-index-2026` page
- Aggregate page: all airports × durations × product types; YoY change sourced from `news.json`
  history; UK-vs-Europe drop-off comparison (data already in the dataset). Dataset JSON-LD, canonical,
  sitemap entry, answer-first summary, embeds the A1 CSV links. **Timed for pre-14-July** PR window.

### A3 · SVG infographic charts
- A chart component (gate-vs-pre-book bars / drop-off comparison) rendered as inline SVG, plus a
  dynamic `apps/parkmath/app/charts/[airport].svg/route.ts` returning a standalone SVG for image-SEO
  and social. Scope lean: one chart type first.

### A4 · Draft library (content, not app code)
- `docs/marketing/{pitch-emails,forum-templates,directory-copy,outreach-emails,email-bodies}.md` —
  templates with `{placeholders}` filled from live data, regenerated when a campaign runs.

---

## 6. Recommended build sequence (by friction)

1. **A1 CSV export** — pure code, immediate backlink value, unit-testable.
2. **C1 `awin-digest`** — unblocked (`tools/awin` exists), highest ongoing ROI, owns the
   Heathrow-Airport-Parking activation trigger.
3. **C2 `content-factory`** — unblocked, biggest social lever; review-file output.
4. **A2 price-index + A3 charts** — PR-timed for mid-July holiday stories.
5. **A4 draft library** — produced when the PR/outreach push runs.
6. **C4 `forum-scout`** — once the `forum-leads.md` convention is in use.
7. **C5 `ai-citation-check`** — Chrome-dependent, monthly, lowest priority.

Each is an independent greenlight with its own spec→plan→build cycle.

---

## 7. Dependencies & Mike-side unblockers
- **launchd install** of the existing freshness/news plists (Task 1) before any scheduled workflow
  fires. Claude can run it on request.
- **`tools/awin/.env`** populated (done) for `awin-digest`.
- **Vercel `NEXT_PUBLIC_SITE_URL`** (done) for the CSV/price-index absolute URLs.
- **MailerLite** account + `NEXT_PUBLIC_MAILERLITE_FORM_ACTION` env for the email path to be useful
  (the digest can be drafted regardless).

## 8. Non-goals / deferred
- Postiz / n8n / Telegram **API** integration (push instead of review-file) — a later thin layer.
- The marketing **execution** itself (sending pitches, posting, filming, account creation) — Mike's.
- Per-airport affiliate `airportOverrides` — separate deferred item (waits on Heathrow Airport
  Parking joining; `awin-digest` will surface the trigger).
