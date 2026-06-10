---
name: freshness
description: Re-verify Math family datasets against official sources and open a PR with corrections. Modes: "check <refs...>" (targeted, watchdog-triggered) and "sweep [--full]" (scheduled). Use when asked to run a freshness check/sweep on the datasets.
---

# Freshness agent playbook

You are maintaining the Math family's verified datasets (`packages/data/datasets/`).
Stale or wrong prices destroy this brand. Work calmly, verify properly, and put
everything in ONE pull request for Mike to review. NEVER push to main.

## Modes

- `check <refs...>` — refs look like `drop-off:gatwick`, `roaming:ee`, `esim:spain`,
  `baggage:ryanair`, `parking:bristol`, `lounges:manchester`, `priority-pass:tiers`.
  Re-verify ONLY those records.
- `sweep` — re-verify: (a) every record whose `verifiedAt` is older than 46 days
  (i.e. within 14 days of the 60-day warning); (b) ALL eSIM bundles (fresh quotes,
  new `snapshotDate`); (c) the standing hard-blocked targets: London City drop-off
  (`drop-off:london-city`) and Newcastle parking (currently EXCLUDED from the
  parking dataset — if you finally obtain official prices, add the record back and
  update the coverage test's expected list); (d) anything `pendingSince` in
  `tools/freshness/hashes.json`.
- `sweep --full` — every record in every dataset (the January ritual).
- `--no-pr` (any mode) — do everything except push/PR; leave the branch local.

## Verification rules (non-negotiable)

1. Official sources only: the airport's/network's/provider's/airline's own pages,
   portals and price-guide PDFs. Aggregators and news are never citable.
2. Transport ladder: WebFetch → `curl https://r.jina.ai/<url>` (plain, then
   `-H "X-Return-Format: html"`, then `-H "X-Engine: browser"`) → Wayback Machine
   snapshot of the official page → official PDFs (fetch + read).
3. Never invent. Arithmetic on official per-day/per-unit rates is allowed and must
   be stated in the record's `notes`/research notes. Unverifiable → keep the old
   value if its `verifiedAt` stands, or null/exclude + flag in the PR if the source
   contradicts or vanished.
4. Currency conversions carry "(converted)" in the name + the rate in the notes file.
5. Update `verifiedAt` ONLY for values you actually confirmed today. Bump the
   dataset `version` (patch) when records change.
6. Append what you did per dataset to the matching
   `docs/verification/*-research-notes.md` (date-stamped section).

## Bounded change rules

You MAY edit: dataset JSON files; `docs/verification/*`; `tools/freshness/watchlist.json`
(regenerate via `pnpm --filter @mathfamily/freshness-tools generate` if sourceUrls
changed) and `tools/freshness/hashes.json` (store the new hash + clear `pendingSince`
for every page you verified); additive dataset schema modules
(`packages/data/src/{roaming,esim,baggage,parking,lounges}.ts`) and their tests when
a published structure genuinely changed; app content helpers
(`apps/*/lib/*-content.ts`) and their tests when rendering must follow a structure
change. TDD for any code change.

You MUST NOT edit: `packages/engine|ui|geo` source, `packages/data/src/schemas.ts`,
`zod-helpers.ts`, any `partners.json`, page/route files, configs, workflows, this
skill. If a needed change is out of bounds, write a "## NEEDS-HUMAN" section in the
PR body describing exactly what and why.

## Procedure

1. `git checkout main && git pull`, then branch `freshness/YYYY-MM-DD` (append
   `-<slug>` for single-ref checks). If that branch name already exists and
   `$FRESHNESS_RUN_ID` is set, suffix the branch with `-$FRESHNESS_RUN_ID` to avoid a
   same-day collision.
2. Verify per the rules above. Datasets validate via the strict Zod schemas — run
   the data tests after every dataset edit: from `packages/data`:
   `./node_modules/.bin/vitest run --reporter=basic`. NEVER create vitest config
   files (see docs/engineering-notes.md).
3. Full gate before any push: `pnpm test && pnpm typecheck && pnpm build` from root.
4. If the gate fails because of YOUR changes: fix or revert; if it fails for reasons
   you cannot fix within bounds: `gh issue create` with the output, commit nothing,
   stop.
5. Unless `--no-pr`: push the branch and `gh pr create` with title
   `freshness: <date> — <n> records re-verified, <m> changed` and a body containing:
   a change table (record | field | old | new | source URL), the staleness report
   (sweep mode), flagged/unverifiable items, and NEEDS-HUMAN if any.
6. Print a one-paragraph summary as your final output.
