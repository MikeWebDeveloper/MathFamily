# P4: Freshness Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the automated freshness system — a deterministic daily watchdog over every official source URL, plus a repo-local `/freshness` Claude Code skill that re-verifies data, makes bounded fixes, and opens PRs.

**Architecture:** New workspace package `tools/freshness` (`@mathfamily/freshness-tools`): a pure normaliser, a watchlist generator derived from the datasets, and a watchdog CLI with injectable fetching. The agent side is a versioned skill document (`.claude/skills/freshness/SKILL.md`) invoked headlessly by `tools/freshness/run-agent.sh`; schedules are a launchd plist (weekly sweep) and a thin n8n workflow (daily watchdog). Spec: `docs/superpowers/specs/2026-06-10-p4-freshness-agent-design.md`.

**Tech Stack:** Node 22 (global fetch, node:crypto), TypeScript, Vitest (NO config files — see `docs/engineering-notes.md`), zsh, launchd, n8n.

**Conventions (unchanged):** work from `/Volumes/TB4 Workstation/Users/mike/Desktop/Projects/MathFamily` (quote the path — space inside); branch `p4-freshness` from main; NEVER create `vitest.config.*`; package tests run from inside the package: `./node_modules/.bin/vitest run --reporter=basic`.

---

### Task 1: `tools/freshness` workspace package

**Files:**
- Modify: `pnpm-workspace.yaml` (add `tools/*` to packages)
- Create: `tools/freshness/package.json`, `tools/freshness/tsconfig.json`

- [ ] **Step 1:** In `pnpm-workspace.yaml`, add `- "tools/*"` under `packages:` (keep `allowBuilds` untouched).

- [ ] **Step 2:** `tools/freshness/package.json`:

```json
{
  "name": "@mathfamily/freshness-tools",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "generate": "tsx src/generate-watchlist.ts",
    "watchdog": "tsx src/watchdog.ts"
  },
  "dependencies": { "@mathfamily/data": "workspace:*" },
  "devDependencies": {
    "@mathfamily/config": "workspace:*",
    "tsx": "^4.19.0",
    "typescript": "^5.8.0",
    "vitest": "^3.2.0",
    "@types/node": "^22.0.0"
  }
}
```

`tools/freshness/tsconfig.json`:

```json
{ "extends": "@mathfamily/config/tsconfig.base.json", "include": ["src", "tests"] }
```

- [ ] **Step 3:** Run `pnpm install` from root. Expected: new workspace member resolves. `pnpm --filter @mathfamily/freshness-tools exec tsc --version` prints 5.x.

- [ ] **Step 4: Commit** — `git add -A && git commit -m "chore(freshness): tools workspace package"`

---

### Task 2: Normaliser (pure, TDD)

**Files:**
- Create: `tools/freshness/src/normalize.ts`
- Test: `tools/freshness/tests/normalize.test.ts`

- [ ] **Step 1: Failing tests** at `tools/freshness/tests/normalize.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { contentFingerprint, normalizeText } from "../src/normalize";

describe("normalizeText", () => {
  it("strips HTML tags and collapses whitespace", () => {
    expect(normalizeText("<p>Drop-off:\n  <b>£10</b></p>")).toBe("Drop-off: £10");
  });
  it("removes date-like strings so daily date churn doesn't trigger", () => {
    const a = normalizeText("Prices correct on 1 April 2026. Fee £10. Updated 2026-04-01.");
    const b = normalizeText("Prices correct on 2 May 2026. Fee £10. Updated 2026-05-02.");
    expect(a).toBe(b);
  });
  it("removes cookie-banner boilerplate lines", () => {
    const a = normalizeText("We value your privacy. Accept All. Fee £10");
    expect(a).toContain("Fee £10");
    expect(a.toLowerCase()).not.toContain("privacy");
  });
  it("a real fee change produces different output", () => {
    expect(normalizeText("Fee £10 for 10 minutes")).not.toBe(normalizeText("Fee £12 for 10 minutes"));
  });
});

describe("contentFingerprint", () => {
  it("is stable for equivalent content and differs for changed fees", () => {
    const a = contentFingerprint(Buffer.from("<p>Fee £10</p>  \n"));
    const b = contentFingerprint(Buffer.from("<p>Fee  £10</p>"));
    const c = contentFingerprint(Buffer.from("<p>Fee £12</p>"));
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
  it("hashes PDF bytes directly", () => {
    const pdf = Buffer.concat([Buffer.from("%PDF-1.7\n"), Buffer.from([1, 2, 3])]);
    expect(contentFingerprint(pdf)).toMatch(/^[a-f0-9]{64}$/);
    expect(contentFingerprint(pdf)).not.toBe(contentFingerprint(Buffer.from("%PDF-1.7\nX")));
  });
});
```

- [ ] **Step 2:** Run from `tools/freshness`: `./node_modules/.bin/vitest run --reporter=basic`. Expected: FAIL (module missing).

- [ ] **Step 3: Implement** `tools/freshness/src/normalize.ts`:

```ts
import { createHash } from "node:crypto";

const DATE_PATTERNS = [
  /\b\d{4}-\d{2}-\d{2}\b/g, // ISO dates
  /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi,
  /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi
];

const BOILERPLATE = /\b(?:we value your privacy|accept all|reject all|cookie|cookies|consent)\b[^.]*\.?/gi;

export function normalizeText(input: string): string {
  let text = input.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(BOILERPLATE, " ");
  for (const pattern of DATE_PATTERNS) text = text.replace(pattern, " ");
  return text.replace(/\s+/g, " ").trim();
}

export function contentFingerprint(body: Buffer): string {
  const isPdf = body.subarray(0, 5).toString("latin1") === "%PDF-";
  const material = isPdf ? body : Buffer.from(normalizeText(body.toString("utf8")), "utf8");
  return createHash("sha256").update(material).digest("hex");
}
```

- [ ] **Step 4:** Run tests — PASS (6). **Step 5: Commit** — `git add -A && git commit -m "feat(freshness): content normaliser + fingerprint (TDD)"`

---

### Task 3: Watchlist generator (TDD) + initial watchlist

**Files:**
- Create: `tools/freshness/src/watchlist.ts` (types + builder), `tools/freshness/src/generate-watchlist.ts` (CLI), `tools/freshness/watchlist.json` (generated)
- Test: `tools/freshness/tests/watchlist.test.ts`

- [ ] **Step 1: Failing tests** at `tools/freshness/tests/watchlist.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  loadAirports,
  loadBaggageDataset,
  loadDropOffDataset,
  loadEsimDataset,
  loadLoungeDataset,
  loadParkingDataset,
  loadPriorityPass,
  loadRoamingDataset
} from "@mathfamily/data";
import { buildWatchlist, UNWATCHABLE_DOMAINS } from "../src/watchlist";

describe("buildWatchlist", () => {
  const list = buildWatchlist();

  it("covers every sourceUrl from every dataset exactly once (deduped by URL)", () => {
    const urls = new Set<string>();
    for (const r of loadDropOffDataset().records) urls.add(r.sourceUrl);
    for (const r of loadParkingDataset().records) urls.add(r.sourceUrl);
    for (const r of loadLoungeDataset().records) urls.add(r.sourceUrl);
    urls.add(loadPriorityPass().sourceUrl);
    for (const s of loadRoamingDataset().networkSources) urls.add(s.sourceUrl);
    for (const r of loadEsimDataset().records) urls.add(r.sourceUrl);
    for (const r of loadBaggageDataset().records) urls.add(r.sourceUrl);

    expect(new Set(list.entries.map((e) => e.url)).size).toBe(list.entries.length); // no dupes
    expect(list.entries.map((e) => e.url).sort()).toEqual([...urls].sort()); // exact cover
  });

  it("every entry carries at least one ref and refs are namespaced", () => {
    for (const e of list.entries) {
      expect(e.refs.length).toBeGreaterThanOrEqual(1);
      for (const ref of e.refs) expect(ref).toMatch(/^(drop-off|parking|lounges|priority-pass|roaming|esim|baggage):/);
    }
  });

  it("known WAF-hopeless domains are marked unwatchable (PDFs excepted — direct fetch works)", () => {
    for (const e of list.entries) {
      const domain = new URL(e.url).hostname.replace(/^www\./, "");
      if (UNWATCHABLE_DOMAINS.has(domain) && !e.url.toLowerCase().endsWith(".pdf")) {
        expect(e.watchable, e.url).toBe(false);
      }
    }
    expect(list.entries.some((e) => !e.watchable)).toBe(true); // at least one exists in our data
  });

  it("airports referenced exist (refs use real slugs)", () => {
    const slugs = new Set(loadAirports().map((a) => a.slug));
    for (const e of list.entries) {
      for (const ref of e.refs) {
        const [kind, slug] = ref.split(":");
        if (kind === "drop-off" || kind === "parking" || kind === "lounges") {
          expect(slugs.has(slug!), `unknown airport in ref ${ref}`).toBe(true);
        }
      }
    }
  });
});
```

- [ ] **Step 2:** Run — FAIL (module missing).

- [ ] **Step 3: Implement** `tools/freshness/src/watchlist.ts`:

```ts
import {
  loadBaggageDataset,
  loadDropOffDataset,
  loadEsimDataset,
  loadLoungeDataset,
  loadParkingDataset,
  loadPriorityPass,
  loadRoamingDataset
} from "@mathfamily/data";

export interface WatchEntry {
  url: string;
  refs: string[]; // e.g. "drop-off:gatwick", "roaming:ee"
  watchable: boolean;
}

export interface Watchlist {
  generatedAt: string;
  entries: WatchEntry[];
}

// Domains where neither direct fetch nor the reader proxy reliably returns content
// (hard WAF / JS-only). The weekly sweep covers these with deeper transports instead.
export const UNWATCHABLE_DOMAINS = new Set([
  "londoncityairport.com",
  "dropoff.londoncityairport.com",
  "birminghamairport.co.uk",
  "glasgowairport.com",
  "leedsbradfordairport.co.uk",
  "saily.com",
  "ee.co.uk" // JS shell; the watched source is the PDF guide, which IS watchable when the URL points at the PDF
]);

function domainOf(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "");
}

export function buildWatchlist(now: Date = new Date()): Watchlist {
  const byUrl = new Map<string, Set<string>>();
  const add = (url: string, ref: string) => {
    if (!byUrl.has(url)) byUrl.set(url, new Set());
    byUrl.get(url)!.add(ref);
  };

  for (const r of loadDropOffDataset().records) add(r.sourceUrl, `drop-off:${r.airportSlug}`);
  for (const r of loadParkingDataset().records) add(r.sourceUrl, `parking:${r.airportSlug}`);
  for (const r of loadLoungeDataset().records) add(r.sourceUrl, `lounges:${r.airportSlug}`);
  add(loadPriorityPass().sourceUrl, "priority-pass:tiers");
  for (const s of loadRoamingDataset().networkSources) add(s.sourceUrl, `roaming:${s.network}`);
  for (const r of loadEsimDataset().records) add(r.sourceUrl, `esim:${r.countrySlug}`);
  for (const r of loadBaggageDataset().records) add(r.sourceUrl, `baggage:${r.airlineSlug}`);

  const entries: WatchEntry[] = [...byUrl.entries()]
    .map(([url, refs]) => {
      const domain = domainOf(url);
      const isPdf = url.toLowerCase().endsWith(".pdf");
      return {
        url,
        refs: [...refs].sort(),
        watchable: isPdf ? true : !UNWATCHABLE_DOMAINS.has(domain)
      };
    })
    .sort((a, b) => a.url.localeCompare(b.url));

  return { generatedAt: now.toISOString().slice(0, 10), entries };
}
```

`tools/freshness/src/generate-watchlist.ts` (CLI):

```ts
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildWatchlist } from "./watchlist";

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "watchlist.json");
writeFileSync(out, JSON.stringify(buildWatchlist(), null, 2) + "\n");
console.log(`watchlist.json written: ${buildWatchlist().entries.length} entries`);
```

- [ ] **Step 4:** Run tests — PASS (4 + 6 normalize = 10). Then generate: from `tools/freshness`: `pnpm generate`. Expected: `watchlist.json written: N entries` (N ≈ 100–110: 25 drop-off + 9 parking + ~10 lounges + 1 PP + 4 roaming + 40 esim + 12 baggage, minus URL dedupe).

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(freshness): watchlist generator + generated watchlist (TDD)"`

---

### Task 4: Watchdog CLI (TDD, injectable fetcher)

**Files:**
- Create: `tools/freshness/src/watchdog.ts`, `tools/freshness/hashes.json` (seed `{}`)
- Test: `tools/freshness/tests/watchdog.test.ts`

**Behaviour contract:** for each watchable entry: fetch (direct with a browser UA; on failure or block-page, retry via `https://r.jina.ai/<url>`); fingerprint; then
- no stored hash → store `{hash, checkedAt}` silently (bootstrap, no trigger);
- stored hash equal → update `checkedAt`;
- stored hash differs and NOT pending → set `pendingSince` and report the entry as changed;
- stored hash differs but already `pendingSince` → do nothing (single-trigger rule);
- fetch failed on all transports → report as error (state untouched).
The stored `hash` is NEVER overwritten while pending — the agent does that after verifying (and clears `pendingSince`).

- [ ] **Step 1: Failing tests** at `tools/freshness/tests/watchdog.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { runWatchdog, type Fetcher, type HashState } from "../src/watchdog";
import { contentFingerprint } from "../src/normalize";
import type { Watchlist } from "../src/watchlist";

const list: Watchlist = {
  generatedAt: "2026-06-10",
  entries: [
    { url: "https://a.example/fees", refs: ["drop-off:alpha"], watchable: true },
    { url: "https://b.example/fees", refs: ["parking:beta"], watchable: true },
    { url: "https://blocked.example/x", refs: ["esim:gamma"], watchable: false }
  ]
};

const body = (s: string) => Buffer.from(s, "utf8");

function fetcherOf(map: Record<string, Buffer | Error>): Fetcher {
  return async (url) => {
    const v = map[url];
    if (!v) throw new Error(`unexpected fetch ${url}`);
    if (v instanceof Error) throw v;
    return v;
  };
}

describe("runWatchdog", () => {
  it("bootstrap: unknown URLs get seeded without triggering", async () => {
    const state: HashState = {};
    const result = await runWatchdog(list, state, fetcherOf({
      "https://a.example/fees": body("Fee £10"),
      "https://b.example/fees": body("Fee £5")
    }), new Date("2026-06-11T06:30:00Z"));
    expect(result.changed).toEqual([]);
    expect(result.errors).toEqual([]);
    expect(state["https://a.example/fees"]?.hash).toBe(contentFingerprint(body("Fee £10")));
    expect(state["https://blocked.example/x"]).toBeUndefined(); // unwatchable skipped
  });

  it("change detection: differing content triggers once and sets pendingSince", async () => {
    const state: HashState = {
      "https://a.example/fees": { hash: contentFingerprint(body("Fee £10")), checkedAt: "2026-06-10" },
      "https://b.example/fees": { hash: contentFingerprint(body("Fee £5")), checkedAt: "2026-06-10" }
    };
    const fetcher = fetcherOf({
      "https://a.example/fees": body("Fee £12"),
      "https://b.example/fees": body("Fee £5")
    });
    const first = await runWatchdog(list, state, fetcher, new Date("2026-06-11T06:30:00Z"));
    expect(first.changed.map((c) => c.url)).toEqual(["https://a.example/fees"]);
    expect(first.changed[0]!.refs).toEqual(["drop-off:alpha"]);
    expect(state["https://a.example/fees"]?.pendingSince).toBe("2026-06-11");
    expect(state["https://a.example/fees"]?.hash).toBe(contentFingerprint(body("Fee £10"))); // NOT overwritten

    const second = await runWatchdog(list, state, fetcher, new Date("2026-06-12T06:30:00Z"));
    expect(second.changed).toEqual([]); // single-trigger while pending
  });

  it("fetch failure reports an error and leaves state untouched", async () => {
    const state: HashState = {
      "https://a.example/fees": { hash: "deadbeef", checkedAt: "2026-06-10" }
    };
    const result = await runWatchdog(
      { ...list, entries: [list.entries[0]!] },
      state,
      fetcherOf({ "https://a.example/fees": new Error("403") }),
      new Date("2026-06-11T06:30:00Z")
    );
    expect(result.errors.map((e) => e.url)).toEqual(["https://a.example/fees"]);
    expect(state["https://a.example/fees"]?.hash).toBe("deadbeef");
  });
});
```

- [ ] **Step 2:** Run — FAIL. **Step 3: Implement** `tools/freshness/src/watchdog.ts`:

```ts
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { contentFingerprint } from "./normalize";
import type { Watchlist, WatchEntry } from "./watchlist";

export type Fetcher = (url: string) => Promise<Buffer>;

export interface HashRecord {
  hash: string;
  checkedAt: string;
  pendingSince?: string;
}
export type HashState = Record<string, HashRecord>;

export interface WatchdogResult {
  changed: { url: string; refs: string[] }[];
  errors: { url: string; message: string }[];
}

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36";

export const defaultFetcher: Fetcher = async (url) => {
  const attempts = [url, `https://r.jina.ai/${url}`];
  let lastError: unknown;
  for (const target of attempts) {
    try {
      const res = await fetch(target, { headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml,application/pdf" }, signal: AbortSignal.timeout(45_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const text = buf.subarray(0, 400).toString("utf8").toLowerCase();
      if (text.includes("you have been blocked") || text.includes("security verification") || text.includes("verifying you are")) {
        throw new Error("block page");
      }
      return buf;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
};

export async function runWatchdog(list: Watchlist, state: HashState, fetcher: Fetcher, now: Date): Promise<WatchdogResult> {
  const today = now.toISOString().slice(0, 10);
  const result: WatchdogResult = { changed: [], errors: [] };

  for (const entry of list.entries.filter((e: WatchEntry) => e.watchable)) {
    let hash: string;
    try {
      hash = contentFingerprint(await fetcher(entry.url));
    } catch (error) {
      result.errors.push({ url: entry.url, message: error instanceof Error ? error.message : String(error) });
      continue;
    }
    const stored = state[entry.url];
    if (!stored) {
      state[entry.url] = { hash, checkedAt: today }; // bootstrap: seed silently
    } else if (stored.hash === hash) {
      stored.checkedAt = today;
      delete stored.pendingSince; // page returned to known state (e.g. PR merged + hash updated elsewhere, or transient)
    } else if (!stored.pendingSince) {
      stored.pendingSince = today;
      stored.checkedAt = today;
      result.changed.push({ url: entry.url, refs: entry.refs });
    } else {
      stored.checkedAt = today; // already pending: single-trigger rule
    }
  }
  return result;
}

// CLI: reads watchlist.json + hashes.json, runs, persists state, prints JSON result.
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const list = JSON.parse(readFileSync(join(root, "watchlist.json"), "utf8")) as Watchlist;
  const state = JSON.parse(readFileSync(join(root, "hashes.json"), "utf8")) as HashState;
  runWatchdog(list, state, defaultFetcher, new Date()).then((result) => {
    writeFileSync(join(root, "hashes.json"), JSON.stringify(state, null, 2) + "\n");
    console.log(JSON.stringify(result));
    process.exit(0);
  });
}
```

Seed `tools/freshness/hashes.json` with `{}` (plus trailing newline).

- [ ] **Step 4:** Run tests — PASS (13 total in package). Typecheck clean. **Step 5: Commit** — `git add -A && git commit -m "feat(freshness): watchdog with bootstrap, single-trigger pending, error reporting (TDD)"`

---

### Task 5: The `/freshness` skill + runner script

**Files:**
- Create: `.claude/skills/freshness/SKILL.md`, `tools/freshness/run-agent.sh` (chmod +x)

- [ ] **Step 1:** `.claude/skills/freshness/SKILL.md`:

```markdown
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
   `-<slug>` for single-ref checks).
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
```

- [ ] **Step 2:** `tools/freshness/run-agent.sh`:

```sh
#!/bin/zsh
# Freshness agent runner. Usage:
#   run-agent.sh check <refs...> [--no-pr]
#   run-agent.sh sweep [--full] [--no-pr]
#   PRINT_CMD=1 run-agent.sh ...   # print the claude command instead of running it
set -euo pipefail

REPO="/Volumes/TB4 Workstation/Users/mike/Desktop/Projects/MathFamily"
LOG_DIR="$HOME/Library/Logs/mathfamily-freshness"
mkdir -p "$LOG_DIR"
STAMP=$(date +%Y-%m-%d_%H%M)

cd "$REPO"
PROMPT="/freshness $*"
CMD=(claude -p "$PROMPT" --max-turns 200 --dangerously-skip-permissions)

if [[ "${PRINT_CMD:-0}" == "1" ]]; then
  printf '%q ' "${CMD[@]}"; echo
  exit 0
fi

"${CMD[@]}" >"$LOG_DIR/$STAMP.log" 2>&1
date +%s > "$LOG_DIR/last-success"   # recency beacon for the n8n stale-sweep alert
echo "freshness run complete — log: $LOG_DIR/$STAMP.log"
tail -5 "$LOG_DIR/$STAMP.log"
```

`chmod +x tools/freshness/run-agent.sh`.

- [ ] **Step 3: Verify plumbing without spending a run:** `PRINT_CMD=1 tools/freshness/run-agent.sh sweep --no-pr` prints `claude -p /freshness\ sweep\ --no-pr --max-turns 200 --dangerously-skip-permissions`. Also `claude --version` succeeds on this machine.

- [ ] **Step 4: Commit** — `git add -A && git commit -m "feat(freshness): /freshness skill playbook + headless runner"`

---

### Task 6: Schedules — launchd plist, n8n workflow, setup doc

**Files:**
- Create: `docs/launchd/com.mathfamily.freshness-sweep.plist`, `tools/freshness/n8n-workflow.json`, `tools/freshness/watchdog.md`
- Modify: `docs/launch-checklist.md` (append P4 section)

- [ ] **Step 1:** `docs/launchd/com.mathfamily.freshness-sweep.plist` (weekly sweep, Sunday 07:00):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.mathfamily.freshness-sweep</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>-lc</string>
    <string>"/Volumes/TB4 Workstation/Users/mike/Desktop/Projects/MathFamily/tools/freshness/run-agent.sh" sweep</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict><key>Weekday</key><integer>0</integer><key>Hour</key><integer>7</integer><key>Minute</key><integer>0</integer></dict>
  <key>StandardOutPath</key><string>/tmp/mathfamily-freshness-sweep.log</string>
  <key>StandardErrorPath</key><string>/tmp/mathfamily-freshness-sweep.err</string>
</dict>
</plist>
```

- [ ] **Step 2:** `tools/freshness/n8n-workflow.json` (daily watchdog: Cron 06:30 → Execute Command watchdog → IF changed → Execute Command agent; IF errors → no-op node Mike wires to his preferred notifier):

```json
{
  "name": "MathFamily freshness watchdog",
  "nodes": [
    { "id": "cron", "name": "Daily 06:30", "type": "n8n-nodes-base.scheduleTrigger", "typeVersion": 1.2, "position": [0, 0],
      "parameters": { "rule": { "interval": [{ "field": "cronExpression", "expression": "30 6 * * *" }] } } },
    { "id": "watchdog", "name": "Run watchdog", "type": "n8n-nodes-base.executeCommand", "typeVersion": 1, "position": [220, 0],
      "parameters": { "command": "cd \"/Volumes/TB4 Workstation/Users/mike/Desktop/Projects/MathFamily/tools/freshness\" && pnpm --silent watchdog" } },
    { "id": "parse", "name": "Parse result", "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [440, 0],
      "parameters": { "jsCode": "const out = JSON.parse($input.first().json.stdout.trim().split('\\n').pop());\nreturn [{ json: { changed: out.changed, errors: out.errors, hasChanges: out.changed.length > 0, hasErrors: out.errors.length > 0, refs: out.changed.flatMap(c => c.refs).join(' ') } }];" } },
    { "id": "ifChanged", "name": "Changes?", "type": "n8n-nodes-base.if", "typeVersion": 2, "position": [660, -80],
      "parameters": { "conditions": { "conditions": [{ "leftValue": "={{ $json.hasChanges }}", "rightValue": true, "operator": { "type": "boolean", "operation": "true" } }] } } },
    { "id": "agent", "name": "Trigger freshness agent", "type": "n8n-nodes-base.executeCommand", "typeVersion": 1, "position": [880, -80],
      "parameters": { "command": "=\"/Volumes/TB4 Workstation/Users/mike/Desktop/Projects/MathFamily/tools/freshness/run-agent.sh\" check {{ $json.refs }}" } },
    { "id": "ifErrors", "name": "Errors?", "type": "n8n-nodes-base.if", "typeVersion": 2, "position": [660, 120],
      "parameters": { "conditions": { "conditions": [{ "leftValue": "={{ $json.hasErrors }}", "rightValue": true, "operator": { "type": "boolean", "operation": "true" } }] } } },
    { "id": "sweepRecency", "name": "Sweep ran in last 14 days?", "type": "n8n-nodes-base.executeCommand", "typeVersion": 1, "position": [660, 240],
      "parameters": { "command": "test -n \"$(find \\\"$HOME/Library/Logs/mathfamily-freshness/last-success\\\" -mtime -14 2>/dev/null)\" && echo OK || echo STALE" } },
    { "id": "ifStale", "name": "Sweep stale?", "type": "n8n-nodes-base.if", "typeVersion": 2, "position": [880, 240],
      "parameters": { "conditions": { "conditions": [{ "leftValue": "={{ $json.stdout.trim() }}", "rightValue": "STALE", "operator": { "type": "string", "operation": "equals" } }] } } },
    { "id": "notify", "name": "Notify Mike (wire me up)", "type": "n8n-nodes-base.noOp", "typeVersion": 1, "position": [1100, 180], "parameters": {} }
  ],
  "connections": {
    "Daily 06:30": { "main": [[{ "node": "Run watchdog", "type": "main", "index": 0 }]] },
    "Run watchdog": { "main": [[{ "node": "Parse result", "type": "main", "index": 0 }]] },
    "Parse result": { "main": [[{ "node": "Changes?", "type": "main", "index": 0 }, { "node": "Errors?", "type": "main", "index": 0 }, { "node": "Sweep ran in last 14 days?", "type": "main", "index": 0 }]] },
    "Changes?": { "main": [[{ "node": "Trigger freshness agent", "type": "main", "index": 0 }]] },
    "Errors?": { "main": [[{ "node": "Notify Mike (wire me up)", "type": "main", "index": 0 }]] },
    "Sweep ran in last 14 days?": { "main": [[{ "node": "Sweep stale?", "type": "main", "index": 0 }]] },
    "Sweep stale?": { "main": [[{ "node": "Notify Mike (wire me up)", "type": "main", "index": 0 }]] }
  }
}
```

- [ ] **Step 3:** `tools/freshness/watchdog.md` — setup doc covering: what the watchdog does (link spec §2), how to import `n8n-workflow.json`, installing the plist (`cp docs/launchd/...plist ~/Library/LaunchAgents/ && launchctl load ~/Library/LaunchAgents/com.mathfamily.freshness-sweep.plist`), the `gh auth login` requirement, where logs live, the supervised-first-run procedure (`tools/freshness/run-agent.sh sweep --no-pr`, inspect the local branch + diff, then a real `sweep`), and how to add a notifier to the n8n no-op node.

- [ ] **Step 4:** Append to `docs/launch-checklist.md` a "P4 — Freshness agent (one-time setup)" section with the 5 checklist items from spec §7, referencing `tools/freshness/watchdog.md`.

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(freshness): launchd + n8n schedules, setup doc, checklist"`

---

### Task 7: Live plumbing verification (no agent run)

**Files:** none new — runs and state only. `tools/freshness/hashes.json` gets its bootstrap content.

- [ ] **Step 1:** Real watchdog run: from `tools/freshness`: `pnpm watchdog` (network access required; takes a few minutes for ~100 URLs). Expected stdout JSON: `{"changed":[],"errors":[...]}` — changed MUST be `[]` (bootstrap seeds, never triggers); some errors are expected (flaky/blocked pages that slipped the unwatchable list).
- [ ] **Step 2:** Inspect: `python3 -c "import json; s=json.load(open('hashes.json')); print(len(s), 'seeded')"` — expect ≥ 60 seeded. Review the errors list: any domain erroring should either become reachable on retry or be ADDED to `UNWATCHABLE_DOMAINS` (then regenerate the watchlist, re-run tests, and note the change) — decide per domain, do not ignore.
- [ ] **Step 3:** Re-run `pnpm watchdog` — expect `{"changed":[],"errors":[...]}` with all previously-seeded URLs unchanged (stability check: normaliser kills date churn).
- [ ] **Step 4:** Full repo gate: root `pnpm test && pnpm typecheck && pnpm build` (the new package joins turbo; expect 7 test tasks).
- [ ] **Step 5: Commit** — `git add -A && git commit -m "chore(freshness): bootstrap watchdog state from live run"`

---

### Task 8: Finish branch

- [ ] Final review of the branch (spec coverage: §2–§7; the runner/skill/watchdog contracts consistent), then superpowers:finishing-a-development-branch — merge to main on approval, tag `p4-complete`, push to origin (`git push origin main --tags`). Mike's remaining human steps are exactly the checklist in `docs/launch-checklist.md` (plist load, n8n import, supervised first run).

---

## Out of scope (per spec §8)

Auto-merge; local-model judgment in the watchdog; content generation; affiliate activation; SkyParkSecure API.
