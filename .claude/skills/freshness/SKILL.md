---
name: freshness
description: Re-verify Math family datasets against official sources and open a PR with corrections. Modes: "check <refs...>" (targeted, watchdog-triggered) and "sweep [--full]" (scheduled). Use when asked to run a freshness check/sweep on the datasets.
---

# Freshness agent playbook

You are maintaining the Math family's verified datasets (`packages/data/datasets/`).
Stale or wrong prices destroy this brand. Work calmly, verify properly, and put
everything in the ONE rolling pull request for Mike to review (see **Branch and PR**).
NEVER push to main.

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

## Branch and PR: one rolling PR

Every data routine (this skill in any mode, and `news-watch`) adds to **one open rolling PR**
and never opens a PR of its own. Mike merges the rolling PR about weekly, and the next run starts
a fresh cycle. Branching off `main` for every run produced 40+ duplicate, mutually conflicting PRs
twice (Aug–Oct and Nov 2026), so don't.

1. **Lock.** From the repo root, take the lock:
   `mkdir "$(git rev-parse --git-common-dir)/freshness-rolling.lock"`.
   If that fails, read the lock's age (`stat -f %m <dir>` on macOS). Younger than 4 hours means
   another data run is in progress: print `Skipped: another data run holds the lock` and STOP.
   Older means it's stale, so `rmdir` it and take it again. **Always release it** (`rmdir`) when
   you finish, including after a failure or an early stop.
2. **Find this cycle's branch.** Run `git fetch origin`, then:
   `gh pr list --state open --limit 100 --json number,headRefName --jq '.[] | select(.headRefName | startswith("freshness/rolling-")) | "\(.number) \(.headRefName)"'`
   - One result: that is the branch, and the PR to update.
   - None: start a cycle. The branch is `freshness/rolling-YYYY-MM-DD` (today), cut from `origin/main`.
   - More than one: comment `NEEDS-HUMAN: more than one rolling PR is open` on the newest, release the lock, STOP.
3. **Work in the dedicated worktree, never in the main checkout.** Other sessions and routines
   move the main checkout's HEAD mid-run. The worktree is `.claude/worktrees/freshness-rolling`.
   - Missing: `git worktree add .claude/worktrees/freshness-rolling -b <branch> origin/main` (new
     cycle) or `git worktree add .claude/worktrees/freshness-rolling <branch>` (continuing).
   - Present: `cd` into it and check it is clean with `git status --porcelain --untracked-files=no`.
     Changes to `tools/freshness/hashes.json` and `tools/freshness/news-hashes.json` don't count:
     they are watchdog state that every run rewrites (`watchdog:news` persists news-hashes.json even
     when nothing changed). Any other tracked change is NEEDS-HUMAN: comment, release, STOP.
     Then:
     - New cycle (only when no rolling PR is open): first
       `git checkout -- tools/freshness/hashes.json tools/freshness/news-hashes.json`, since the next
       watchdog run rebuilds them. Then `git checkout -B <branch> origin/main`.
     - Continuing: `git checkout <branch> && git merge --ff-only origin/<branch>`.
   - Bring a continuing cycle up to date: `git merge --no-edit origin/main`. On a conflict,
     `git merge --abort`, comment `NEEDS-HUMAN: rolling branch conflicts with main in <files>` on
     the PR, release the lock, STOP. **Never rebase or force-push the rolling branch**: Mike may be
     mid-review.
   - `pnpm install --frozen-lockfile --prefer-offline` if `node_modules` is missing.
4. **Judge staleness on the rolling branch.** It already carries this cycle's verified values, so a
   record re-verified earlier in the cycle is not redone unless it is due again.
5. **Commit and report** after the gate below passes. Make one commit per run:
   `freshness: <date> — <n> re-verified, <m> changed` (news-watch uses `news: ...`). Include any
   changes to the two watchdog state files in it. Then `git push origin <branch>` (plain push).
   Never leave report files (such as `docs/reports/freshness-sweep-*.md`) in the worktree: the run's
   report is its PR section, or your final output when there is no PR.
   - New cycle: `gh pr create --head <branch> --title "data: rolling review from <start date>"`.
     The body says:
     - "This PR collects every data run until merged. Merge it when ready, and the next run
       starts a new cycle."
     - "While it is open, don't merge any other data PR (`freshness/*`, `news/*`, `data/*`):
       main would then conflict with this branch and every run would stop. Close them instead,
       using the coverage table below."
     - **Coverage of older open data PRs:** one row per open non-rolling data PR, with
       PR | records it changes | re-verified in this cycle? | not covered here (and why).
       Read each PR's changed records with `gh pr diff <n> --name-only` plus its diff. A correction
       this cycle does not re-cover (out of today's scope, unreachable source, a news item) is
       listed so Mike knows what closing that PR would lose. If it's in scope, re-verify it in a
       later run of this cycle instead.

     This run's section follows the body.
   - Continuing: `gh pr comment <number> --body-file <file>` with this run's section.
   - A run's section has the change table (record | field | old | new | source URL), the
     staleness report (sweep mode), flagged/unverifiable items, and NEEDS-HUMAN if any.
   - If nothing changed and nothing was re-verified: no commit, no comment.
   - If older non-rolling data PRs are still open, keep the coverage table current in each run's
     section (what this run newly covered). Don't close them yourself.
6. Release the lock.

## Procedure

1. Set up the branch and worktree per **Branch and PR** steps 1–3. `--no-pr` still uses the
   worktree and the rolling branch, but skips the push and the PR/comment.
2. Verify per the rules above. Datasets validate via the strict Zod schemas — run
   the data tests after every dataset edit: from `packages/data`:
   `./node_modules/.bin/vitest run --reporter=basic`. NEVER create vitest config
   files (see docs/engineering-notes.md).
3. Full gate before any push: `pnpm test && pnpm typecheck && pnpm build` from root.
4. If the gate fails because of YOUR changes: fix or revert; if it fails for reasons
   you cannot fix within bounds: `gh issue create` with the output, commit nothing,
   stop.
5. Unless `--no-pr`: commit, push and update the rolling PR per **Branch and PR** step 5.
   Release the lock (step 6) in every case.
6. Print a one-paragraph summary as your final output, naming the rolling PR.
