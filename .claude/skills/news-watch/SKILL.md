---
name: news-watch
description: Gather official airport news/updates into the ParkMath news dataset and open a PR. Modes — "check <news-refs...>" (targeted, watchdog-triggered) and "sweep" (scheduled). Use when asked to run a news check/sweep.
---

# News-watch routine

Extends the freshness pipeline to gather **official airport operational/fee updates** into
`packages/data/datasets/parkmath/news.json` and open a **PR for human review**. It NEVER
edits cost datasets or code — `news.json` only.

## Hard rules (same trust model as /freshness)
- **Official sources only.** Every item's `sourceUrl` must be the airport's own domain.
- **Never invent.** Only emit a `change` (before→after) the official page explicitly states;
  otherwise `change: null`. Null-over-guess for any uncertain field.
- **In scope:** drop-off/forecourt fee changes, parking tariff/closure changes, lounge
  changes, terminal works, drop-off-zone relocations, car-park closures/openings, strikes,
  major operational changes. Out of scope: third-party/press, marketing, anything not on an
  official page.
- **PR-only, never push to main. Bounded change: only `news.json`.**
- **Single-trigger pending:** the watchdog already de-dupes repeat triggers; do not re-PR an
  item already present (the merge helper dedupes too).

## Modes

### `check <news-refs...>`
Targeted run for specific `news:<airport>` refs the watchdog flagged as changed.
1. For each ref `news:<airport>`, look up its URL in `tools/freshness/news-sources.json`.
2. Fetch the page (transport ladder: direct → `https://r.jina.ai/<url>` → Wayback). For the
   **page-reading + extraction**, prefer cheap Gemini: set the model via
   `export GRAPHIFY_GEMINI_MODEL="$(tools/gemini-pick-model.sh)"` and have Gemini read the
   fetched text and propose candidate updates — you (Claude) own the trust judgement and the
   final JSON. (If Gemini is unavailable, do the extraction yourself.)
3. For each genuine, in-scope, officially-stated update, build a candidate object:
   `{ airportSlug, category, title, summary (answer-first), change|null, sourceUrl,
      sourceLabel, publishedAt }`. Quote the official page in your PR description as evidence.
4. Merge with the deterministic helper so ids/dedupe/validation are exact:
   ```ts
   // tsx one-off, run from repo root
   import { loadNewsDataset } from "@mathfamily/data";
   import { mergeNewsItems } from "./tools/freshness/src/news-extract";
   // write mergeNewsItems(loadNewsDataset(), candidates, todayISO) back to news.json
   ```
   (Or apply `mergeNewsItems` semantics by hand and validate with
   `pnpm --filter @mathfamily/data test`.)
5. Run `pnpm --filter @mathfamily/data test` — it must pass (validates the new `news.json`).
6. Open a PR on a branch `news/<run-id>` touching ONLY `news.json`, body listing each new item
   with its source URL + the verbatim quote, under a `## NEEDS-HUMAN` heading. Never merge it.

### `sweep`
Scheduled full pass:
1. Run the watchdog to refresh fingerprints and get changed refs:
   `pnpm --filter @mathfamily/freshness-tools watchdog:news` → JSON `{ changed: [{url, refs}], errors }`.
2. Extract the news refs: `refsWithPrefix(changed.flatMap(c => c.refs), "news:")`.
3. If any, run the `check` flow above for those `news:<airport>` refs. If none changed, exit
   cleanly with "no news changes".
4. Open one PR for all new items (or none).

## Output discipline
- One PR per run at most; title `news: N candidate update(s) — <airports>`.
- If nothing verifiable found, do nothing (no empty PRs).
- Report: refs checked, items added, PR URL (or "no changes").
