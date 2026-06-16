---
name: loop-digest
description: Weekly closed-loop digest for ParkMath reels — joins the content ledger to analytics (Plausible/Cloudflare), ranks performers, and writes recommendations the reel factory reads next run. Use when asked to run the reel loop digest.
---

# Loop-digest routine

Closes the create → measure → learn loop for the reel factory. Read-only on analytics; writes a review
report + a recommendations file the generator consumes. **Nothing publishes; no datasets change.**

## Run
`REELS_DATE=$(date +%F) pnpm --filter @mathfamily/reels digest`

- Reads `tools/social/ledger.jsonl` (every reel generated, with its UTM id), fetches reach from the
  configured analytics source (Plausible preferred, Cloudflare fallback — see
  `tools/reels/analytics.env.example`), and joins on `utm_campaign` (or the landing path).
- Writes `docs/reports/loop-<date>.md` (top performers + recommendation) and
  `tools/social/recommendations.json` (`boostFormats` / `boostSlugs`), which the next
  `pnpm --filter @mathfamily/reels generate` run uses to **bias which format leads**.
- Degrades to a "no analytics yet" report until creds are set (safe to run anytime).
- `DIGEST_DAYS` changes the window (default 7).

## Steps
1. Run the command above.
2. Read `docs/reports/loop-<date>.md`. If a source is configured and there's signal, sanity-check the
   top performers against what was posted.
3. Commit `docs/reports/loop-<date>.md` for the record. Do **not** commit `tools/social/recommendations.json`
   or `tools/social/ledger.jsonl` (gitignored, local memory).
4. Report: analytics source, reels in window, total visitors, and the recommended formats/slugs.

## Governance
First-party UTM data only (never an affiliate link); read-only; review report only — nothing auto-publishes.
Same trust model as [[content-factory]] / [[reel-factory]].
