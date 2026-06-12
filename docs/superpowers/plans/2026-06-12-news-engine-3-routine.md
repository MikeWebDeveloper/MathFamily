# News Engine Sub-project 3 — Gathering Routine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A scheduled local Claude Code routine that watches each ParkMath airport's official newsroom/ops pages, extracts in-scope updates into `news.json`, dedupes, and opens a **PR-for-review** — reusing the existing freshness watchdog, transport ladder, and trust gates.

**Architecture:** Extends `tools/freshness`. A curated `news-sources.json` (per-airport official news/ops URLs) is merged into the existing `watchlist.json` as `news:<airport>` entries, so the *unchanged* `runWatchdog()` fingerprint-diffs them alongside cost sources. A new `/news-watch` Claude Code skill (run via the `run-agent.sh` pattern) reads only the *changed* `news:` URLs, extracts `NewsItem`s (offloading page-reading to cheap Gemini), dedupes via a small deterministic `news-extract` module, appends to `packages/data/datasets/parkmath/news.json`, and opens a PR. Bounded change: the routine may only touch `news.json`.

**Tech Stack:** TypeScript (tsx, the freshness package), vitest (configless), the freshness watchdog (`runWatchdog`/`contentFingerprint`), a Claude Code skill (headless `claude -p`), launchd, Gemini (`gemini-2.5-flash` via `tools/gemini-pick-model.sh`).

**From the spec:** [docs/superpowers/specs/2026-06-12-news-engine-design.md](../specs/2026-06-12-news-engine-design.md) → "Sub-project 3 — News gathering routine". Sub-projects 1 & 2 are already merged (the `NewsItem` schema, loaders, `news.json` with 8 items, and all surfaces exist on `main`).

**CRITICAL CONSTRAINTS:**
- **NEVER create `vitest.config.*` / `vite.config.*`** (TB4-volume deadlock). The freshness package already has a configless vitest setup — extend it.
- **No fabricated data.** The routine only emits items it can quote from an official page; everything lands as a **PR for human review**, never an auto-commit to `main`. The `news.json` PR is validated by the existing `packages/data` news content test (a malformed draft fails CI).
- **Bounded change:** the routine writes **only** `packages/data/datasets/parkmath/news.json` — never cost datasets or code.
- **Trust gates (reused from freshness):** official sources only; never invent; null-over-guess; date-stamp; PR-only; single-trigger pending (one PR per change, not per run).

---

## Shared contracts (define once; later tasks depend on these — do not rename)

**`tools/freshness/news-sources.json`** — curated official news/ops URLs:
```json
{ "generatedAt": "YYYY-MM-DD",
  "sources": [ { "airportSlug": "bristol", "url": "https://…", "label": "Bristol Airport newsroom" } ] }
```

**`tools/freshness/src/news-sources.ts`** (Task 1):
```ts
type NewsSource = { airportSlug: string; url: string; label: string };
type NewsSourcesFile = { generatedAt: string; sources: NewsSource[] };
loadNewsSources(): NewsSourcesFile
```

**`watchlist.ts`** (Task 1): `buildWatchlist()` additionally appends one `WatchEntry` per news source, with `refs: ["news:<airportSlug>"]` and the same `watchable` domain rules.

**`tools/freshness/src/news-extract.ts`** (Task 2) — deterministic, fully tested:
```ts
import type { NewsItem, NewsDataset } from "@mathfamily/data";
type NewsCandidate = Omit<NewsItem, "id" | "verifiedAt" | "supersedes" | "body"> & { body?: string | null };
newsId(airportSlug: string | null, topic: string, isoDate: string): string   // "<airport-or-uk>-<topic>-<mon><year>"
isDuplicateNews(existing: NewsItem[], cand: { airportSlug: string | null; title: string; change: NewsItem["change"] }): boolean
mergeNewsItems(dataset: NewsDataset, candidates: NewsCandidate[], today: string): NewsDataset  // append non-dupes, stamp verifiedAt=today, set lastUpdated, keep sorted
refsWithPrefix(changedRefs: string[], prefix: string): string[]   // e.g. "news:" → ["bristol", ...]
```

**`run-agent.sh`** (Task 4): new modes `news <news-refs...>` and `news-sweep` → `claude -p "/news-watch …"`.

**`/news-watch` skill** (Task 3): `.claude/skills/news-watch/SKILL.md`, modes `check <refs...>` and `sweep`.

**Verify commands:** `pnpm --filter @mathfamily/freshness test|typecheck`, `pnpm --filter @mathfamily/data test`, `PRINT_CMD=1 tools/freshness/run-agent.sh …`.

---

### Task 1: News source list + watchlist integration

**Files:**
- Create: `tools/freshness/news-sources.json`, `tools/freshness/src/news-sources.ts`
- Modify: `tools/freshness/src/watchlist.ts`
- Test: `tools/freshness/tests/watchlist-news.test.ts`

- [ ] **Step 1: Seed `news-sources.json` with the known official URLs**

Create `tools/freshness/news-sources.json` with the official news/ops pages already confirmed during the sub-project-2 seed research (these are real, verified URLs). The full 25-airport discovery is Task 6.
```json
{
  "generatedAt": "2026-06-12",
  "sources": [
    { "airportSlug": "bristol", "url": "https://www.bristolairport.co.uk/corporate/news-and-media/news-and-media-centre/", "label": "Bristol Airport news & media centre" },
    { "airportSlug": "edinburgh", "url": "https://corporate.edinburghairport.com/news", "label": "Edinburgh Airport corporate news" },
    { "airportSlug": "manchester", "url": "https://mediacentre.manchesterairport.co.uk/", "label": "Manchester Airport media centre" },
    { "airportSlug": "birmingham", "url": "https://www.birminghamairport.co.uk/news/", "label": "Birmingham Airport news" },
    { "airportSlug": "east-midlands", "url": "https://mediacentre.eastmidlandsairport.com/", "label": "East Midlands Airport media centre" },
    { "airportSlug": "heathrow", "url": "https://www.heathrow.com/transport-and-directions/terminal-drop-off-charge", "label": "Heathrow Terminal Drop-Off Charge" },
    { "airportSlug": "luton", "url": "https://www.london-luton.co.uk/to-and-from-lla/dropping-off", "label": "London Luton drop-off" },
    { "airportSlug": "stansted", "url": "https://www.stanstedairport.com/parking/pick-up-and-drop-off/", "label": "London Stansted pick-up & drop-off" },
    { "airportSlug": "gatwick", "url": "https://www.gatwickairport.com/transport-options/drop-off.html", "label": "London Gatwick drop-off" }
  ]
}
```

- [ ] **Step 2: Write the failing test**

Create `tools/freshness/tests/watchlist-news.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { buildWatchlist } from "../src/watchlist";
import { loadNewsSources } from "../src/news-sources";

describe("news sources in watchlist", () => {
  it("loadNewsSources returns the curated sources", () => {
    const f = loadNewsSources();
    expect(f.sources.length).toBeGreaterThan(0);
    for (const s of f.sources) expect(s.url).toMatch(/^https:\/\//);
  });
  it("buildWatchlist includes a news:<airport> entry for each news source", () => {
    const list = buildWatchlist(new Date("2026-06-12T00:00:00Z"));
    const sources = loadNewsSources().sources;
    for (const s of sources) {
      const entry = list.entries.find((e) => e.url === s.url && e.refs.includes(`news:${s.airportSlug}`));
      expect(entry, `missing news entry for ${s.airportSlug}`).toBeDefined();
    }
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `pnpm --filter @mathfamily/freshness test`
Expected: FAIL — `../src/news-sources` not found.

- [ ] **Step 4: Implement the loader + watchlist merge**

Create `tools/freshness/src/news-sources.ts`:
```ts
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export interface NewsSource { airportSlug: string; url: string; label: string }
export interface NewsSourcesFile { generatedAt: string; sources: NewsSource[] }

export function loadNewsSources(): NewsSourcesFile {
  const p = join(dirname(fileURLToPath(import.meta.url)), "..", "news-sources.json");
  return JSON.parse(readFileSync(p, "utf8")) as NewsSourcesFile;
}
```

In `tools/freshness/src/watchlist.ts`, import `loadNewsSources` and add the news sources into the same `byUrl` map BEFORE building `entries` (so a URL watched for both cost and news merges refs). After the existing dataset `add(...)` calls (the `for (const r of loadBaggageDataset()...)` line) add:
```ts
  for (const s of loadNewsSources().sources) add(s.url, `news:${s.airportSlug}`);
```
Add the import at the top: `import { loadNewsSources } from "./news-sources";`. The rest of `buildWatchlist()` (watchable rules, sort) is unchanged — news URLs flow through the same domain/PDF watchable logic.

- [ ] **Step 5: Regenerate watchlist.json + run tests**

Run: `pnpm --filter @mathfamily/freshness exec tsx src/generate-watchlist.ts` (regenerates `watchlist.json` to include the news entries), then `pnpm --filter @mathfamily/freshness test && pnpm --filter @mathfamily/freshness typecheck`.
Expected: PASS; `watchlist.json` now contains `news:<airport>` entries.

- [ ] **Step 6: Commit**

```bash
git add tools/freshness/news-sources.json tools/freshness/src/news-sources.ts tools/freshness/src/watchlist.ts tools/freshness/watchlist.json tools/freshness/tests/watchlist-news.test.ts
git commit -m "feat(freshness): curated news sources merged into the watchlist"
```

---

### Task 2: Deterministic `news-extract` helpers

**Files:**
- Create: `tools/freshness/src/news-extract.ts`
- Test: `tools/freshness/tests/news-extract.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tools/freshness/tests/news-extract.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { newsId, isDuplicateNews, mergeNewsItems, refsWithPrefix } from "../src/news-extract";
import type { NewsItem, NewsDataset } from "@mathfamily/data";

const base: NewsItem = {
  id: "bristol-dropoff-fee-jan-2026", airportSlug: "bristol", category: "fee-change",
  title: "Bristol raises drop-off to £8.50", summary: "Now £8.50.", body: null,
  change: { label: "Drop-off", from: "£7", to: "£8.50" },
  sourceUrl: "https://www.bristolairport.co.uk/x", sourceLabel: "Bristol",
  publishedAt: "2026-01-02", verifiedAt: "2026-06-12", supersedes: null
};

describe("news-extract", () => {
  it("newsId builds a stable kebab slug with month-year", () => {
    expect(newsId("bristol", "dropoff-fee", "2026-01-02")).toBe("bristol-dropoff-fee-jan-2026");
    expect(newsId(null, "uk-strike", "2025-12-15")).toBe("uk-uk-strike-dec-2025");
  });
  it("isDuplicateNews flags same airport + same change", () => {
    expect(isDuplicateNews([base], { airportSlug: "bristol", title: "Bristol raises drop-off to £8.50", change: base.change })).toBe(true);
    expect(isDuplicateNews([base], { airportSlug: "gatwick", title: "x", change: null })).toBe(false);
  });
  it("refsWithPrefix extracts the suffixes for a prefix", () => {
    expect(refsWithPrefix(["news:bristol", "drop-off:gatwick", "news:luton"], "news:")).toEqual(["bristol", "luton"]);
  });
  it("mergeNewsItems appends non-duplicates, stamps verifiedAt, bumps lastUpdated, stays valid", () => {
    const ds: NewsDataset = { version: "1.0.0", lastUpdated: "2026-06-10", items: [base] };
    const merged = mergeNewsItems(ds, [
      { airportSlug: "bristol", category: "fee-change", title: "Bristol raises drop-off to £8.50", summary: "dup", change: base.change, sourceUrl: base.sourceUrl, sourceLabel: "Bristol", publishedAt: "2026-01-02" },
      { airportSlug: "luton", category: "drop-off-zone", title: "Luton ANPR live", summary: "New ANPR.", change: null, sourceUrl: "https://www.london-luton.co.uk/x", sourceLabel: "Luton", publishedAt: "2026-05-01" }
    ], "2026-06-12");
    expect(merged.items).toHaveLength(2);           // Bristol dup skipped, Luton added
    expect(merged.lastUpdated).toBe("2026-06-12");
    const luton = merged.items.find((i) => i.airportSlug === "luton")!;
    expect(luton.verifiedAt).toBe("2026-06-12");
    expect(luton.id).toBe("luton-drop-off-zone-may-2026");
    expect(luton.supersedes).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @mathfamily/freshness test`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `tools/freshness/src/news-extract.ts`:
```ts
import { NewsDatasetSchema, type NewsItem, type NewsDataset } from "@mathfamily/data";

const MONTHS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
const kebab = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export function newsId(airportSlug: string | null, topic: string, isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  const my = `${MONTHS[d.getUTCMonth()]}-${d.getUTCFullYear()}`;
  return kebab(`${airportSlug ?? "uk"}-${topic}-${my}`);
}

const normTitle = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export function isDuplicateNews(
  existing: NewsItem[],
  cand: { airportSlug: string | null; title: string; change: NewsItem["change"] }
): boolean {
  return existing.some((e) => {
    if (e.airportSlug !== cand.airportSlug) return false;
    if (normTitle(e.title) === normTitle(cand.title)) return true;
    if (e.change && cand.change && e.change.label === cand.change.label && e.change.to === cand.change.to) return true;
    return false;
  });
}

export function refsWithPrefix(changedRefs: string[], prefix: string): string[] {
  return changedRefs.filter((r) => r.startsWith(prefix)).map((r) => r.slice(prefix.length));
}

export type NewsCandidate = Omit<NewsItem, "id" | "verifiedAt" | "supersedes" | "body"> & { body?: string | null };

export function mergeNewsItems(dataset: NewsDataset, candidates: NewsCandidate[], today: string): NewsDataset {
  const items = [...dataset.items];
  for (const c of candidates) {
    if (isDuplicateNews(items, { airportSlug: c.airportSlug, title: c.title, change: c.change })) continue;
    const topic = c.change ? `${c.category}` : c.category;
    items.push({
      id: newsId(c.airportSlug, topic, c.publishedAt),
      airportSlug: c.airportSlug, category: c.category, title: c.title, summary: c.summary,
      body: c.body ?? null, change: c.change, sourceUrl: c.sourceUrl, sourceLabel: c.sourceLabel,
      publishedAt: c.publishedAt, verifiedAt: today, supersedes: null
    });
  }
  const out: NewsDataset = { version: dataset.version, lastUpdated: today, items };
  return NewsDatasetSchema.parse(out); // throws on any invalid candidate — safety gate
}
```

- [ ] **Step 4: Run tests + typecheck**

Run: `pnpm --filter @mathfamily/freshness test && pnpm --filter @mathfamily/freshness typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tools/freshness/src/news-extract.ts tools/freshness/tests/news-extract.test.ts
git commit -m "feat(freshness): deterministic news-extract helpers (id, dedupe, merge, ref-filter)"
```

---

### Task 3: The `/news-watch` agent skill

**Files:**
- Create: `.claude/skills/news-watch/SKILL.md`

- [ ] **Step 1: Write the skill playbook**

Create `.claude/skills/news-watch/SKILL.md` with this exact content:

````markdown
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
   `pnpm --filter @mathfamily/freshness watchdog` → JSON `{ changed: [{url, refs}], errors }`.
2. Extract the news refs: `refsWithPrefix(changed.flatMap(c => c.refs), "news:")`.
3. If any, run the `check` flow above for those `news:<airport>` refs. If none changed, exit
   cleanly with "no news changes".
4. Open one PR for all new items (or none).

## Output discipline
- One PR per run at most; title `news: N candidate update(s) — <airports>`.
- If nothing verifiable found, do nothing (no empty PRs).
- Report: refs checked, items added, PR URL (or "no changes").
````

- [ ] **Step 2: Verify the skill file is well-formed**

Run: `head -5 .claude/skills/news-watch/SKILL.md` (confirm frontmatter present). No code to test here — this is an agent playbook.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/news-watch/SKILL.md
git commit -m "feat(news): /news-watch agent skill (check + sweep, PR-only, bounded)"
```

---

### Task 4: `run-agent.sh` news modes

**Files:**
- Modify: `tools/freshness/run-agent.sh`
- Test: `tools/freshness/tests/run-agent.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tools/freshness/tests/run-agent.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const sh = join(dirname(fileURLToPath(import.meta.url)), "..", "run-agent.sh");
const printCmd = (args: string[]) =>
  execFileSync(sh, args, { env: { ...process.env, PRINT_CMD: "1" }, encoding: "utf8" });

describe("run-agent.sh news modes", () => {
  it("news mode routes to /news-watch check", () => {
    expect(printCmd(["news", "news:bristol"])).toContain("/news-watch check news:bristol");
  });
  it("news-sweep mode routes to /news-watch sweep", () => {
    expect(printCmd(["news-sweep"])).toContain("/news-watch sweep");
  });
  it("freshness modes still route to /freshness", () => {
    expect(printCmd(["sweep"])).toContain("/freshness sweep");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @mathfamily/freshness test`
Expected: FAIL — news modes route to `/freshness news` not `/news-watch`.

- [ ] **Step 3: Implement the routing**

In `tools/freshness/run-agent.sh`, replace the prompt-construction line
`PROMPT="/freshness $*"` with mode-aware routing:
```sh
MODE="${1:-}"
case "$MODE" in
  news)        shift; PROMPT="/news-watch check $*" ;;
  news-sweep)  PROMPT="/news-watch sweep" ;;
  *)           PROMPT="/freshness $*" ;;
esac
```
Keep the rest of the script unchanged (the sweep beacon line `if [[ "${1:-}" == "sweep" ]]` still only fires for the freshness sweep, which is correct).

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @mathfamily/freshness test`
Expected: PASS (all three routing tests green).

- [ ] **Step 5: Commit**

```bash
git add tools/freshness/run-agent.sh tools/freshness/tests/run-agent.test.ts
git commit -m "feat(freshness): run-agent.sh news / news-sweep modes route to /news-watch"
```

---

### Task 5: launchd schedule + docs

**Files:**
- Create: `docs/launchd/com.mathfamily.news-sweep.plist`
- Modify: `docs/engineering-notes.md`

- [ ] **Step 1: Create the launchd plist**

Create `docs/launchd/com.mathfamily.news-sweep.plist` (mirrors the freshness-sweep plist; weekly news sweep, offset from the freshness sweep so they don't overlap the shared `hashes.json`):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.mathfamily.news-sweep</string>
  <key>ProgramArguments</key>
  <array>
    <string>/Volumes/TB4 Workstation/Users/mike/Desktop/Projects/MathFamily/tools/freshness/run-agent.sh</string>
    <string>news-sweep</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict><key>Weekday</key><integer>1</integer><key>Hour</key><integer>8</integer><key>Minute</key><integer>0</integer></dict>
  <key>StandardOutPath</key><string>/Users/mike/Library/Logs/mathfamily-freshness/news-sweep.out.log</string>
  <key>StandardErrorPath</key><string>/Users/mike/Library/Logs/mathfamily-freshness/news-sweep.err.log</string>
  <key>RunAtLoad</key><false/>
</dict>
</plist>
```
(Monday 08:00 — the freshness sweep runs at a different time; check the existing
`com.mathfamily.freshness-sweep.plist` and pick a non-overlapping slot.)

- [ ] **Step 2: Document install + cadence**

Append to `docs/engineering-notes.md` a "## News-watch routine" section:
```markdown
## News-watch routine

Gathers official airport updates into `packages/data/datasets/parkmath/news.json` via a PR.
- Sources: `tools/freshness/news-sources.json` (curated official news/ops URLs), merged into
  the shared `watchlist.json` as `news:<airport>` entries.
- Agent: the `/news-watch` skill, run headless by `tools/freshness/run-agent.sh news-sweep`.
- Cadence: weekly sweep via launchd. Install:
  `cp docs/launchd/com.mathfamily.news-sweep.plist ~/Library/LaunchAgents/ && launchctl load ~/Library/LaunchAgents/com.mathfamily.news-sweep.plist`
- Manual run: `tools/freshness/run-agent.sh news news:bristol` (targeted) or
  `tools/freshness/run-agent.sh news-sweep` (full). Add `PRINT_CMD=1` to dry-run.
- Output: a PR on `news/<run-id>` touching only `news.json`, with a NEEDS-HUMAN block. Review
  and merge to publish.
- Cost: extraction can use Gemini (`gemini-2.5-flash` via `tools/gemini-pick-model.sh`).
```

- [ ] **Step 3: Commit**

```bash
git add docs/launchd/com.mathfamily.news-sweep.plist docs/engineering-notes.md
git commit -m "feat(news): launchd weekly news-sweep schedule + docs"
```

---

### Task 6: Full official-source discovery + verification gate

**Files:**
- Modify: `tools/freshness/news-sources.json` (expand to all 25 airports)

- [ ] **Step 1: Discover the remaining airports' official news/ops URLs**

The seed covers 9 airports; find the official newsroom / "media centre" / "at the airport" /
drop-off URL for the remaining 16 ParkMath airports (gatwick already present; remaining:
newcastle, liverpool, london-city, leeds-bradford, aberdeen, belfast-international,
belfast-city, southampton, cardiff, exeter, southend, bournemouth, norwich, inverness,
teesside, glasgow). Under Ultracode, run a **Workflow** that fans out across these airports,
each agent web-searching + fetching the airport's official site to find the canonical
news/ops page URL, with an adversarial verify pass confirming the URL is the airport's own
domain and returns content. Add the verified URLs to `news-sources.json` (skip any airport
with no usable official page — better omitted than wrong).

- [ ] **Step 2: Regenerate the watchlist + validate**

Run: `pnpm --filter @mathfamily/freshness exec tsx src/generate-watchlist.ts` then
`pnpm --filter @mathfamily/freshness test && pnpm --filter @mathfamily/freshness typecheck`.
Expected: PASS; `watchlist.json` now has a `news:<airport>` entry per discovered source.

- [ ] **Step 3: Dry-run the routine end-to-end (no PR)**

Run: `PRINT_CMD=1 tools/freshness/run-agent.sh news-sweep` — confirm it prints the
`/news-watch sweep` command. Then a real bounded smoke test: run
`pnpm --filter @mathfamily/freshness watchdog` once to (re)seed fingerprints for the new
news URLs into `hashes.json` (bootstrap is silent — no false "changed"), and confirm the
JSON result has no errors for the news URLs (or only expected WAF blocks, which the sweep
handles).

- [ ] **Step 4: Full gate + commit**

Run: `pnpm -r test && pnpm -r typecheck && pnpm --filter parkmath build`
Expected: all green (the news dataset + freshness package all pass).
```bash
git add tools/freshness/news-sources.json tools/freshness/watchlist.json tools/freshness/hashes.json
git commit -m "feat(freshness): full 25-airport news-source discovery + fingerprint bootstrap"
```

---

## Self-review (completed during authoring)

- **Spec coverage:** watchlist news URLs (Task 1) ✓; scheduled local Claude Code agent / run-agent.sh pattern (Tasks 3-4) ✓; diff fingerprints (reuses `runWatchdog`, Task 3 sweep) ✓; extract into news.json + dedupe/supersede (Task 2 `mergeNewsItems`/`isDuplicateNews`) ✓; PR-for-review with NEEDS-HUMAN (Task 3) ✓; trust gates official/never-invent/null-over-guess/PR-only/single-trigger/bounded-change (Tasks 2-3) ✓; daily check + weekly sweep on launchd (Task 5) ✓; Gemini cheap extraction backend (Task 3) ✓; ParkMath-first ✓.
- **Type consistency:** `NewsSource`/`NewsSourcesFile`, `loadNewsSources`, `newsId`/`isDuplicateNews`/`mergeNewsItems`/`refsWithPrefix`/`NewsCandidate` defined once (Tasks 1-2) and referenced identically in the skill (Task 3) and tests. `mergeNewsItems` validates via `NewsDatasetSchema` (from `@mathfamily/data`, already exists). The `news:` ref prefix is consistent across watchlist, run-agent routing, and the skill.
- **Reuse, not duplication:** `runWatchdog`/`contentFingerprint`/`hashes.json`/the transport ladder are reused unchanged; only `buildWatchlist()` gains a merge line and `run-agent.sh` gains a `case`. The news routine and freshness routine share the watchdog + `hashes.json` but act on disjoint ref prefixes (`news:` vs `drop-off:`/`parking:`/…), so they never fight over an item.
- **No fabricated data / bounded change:** the skill emits only officially-quoted items, validated by `mergeNewsItems` + the `packages/data` news test, as a PR touching only `news.json`.
- **No vitest/vite config files;** tests extend the freshness package's existing configless vitest.

## Out of scope

- Search-driven discovery (curated watchlist only this round; a web-search pass is a later enhancement per the spec).
- RoamMath news automation (this routine is ParkMath-first; RoamMath reuses the same machinery later with its own `news-sources.json` + `news.json`).
- Auto-publish (every run is PR-only; no auto-merge).
