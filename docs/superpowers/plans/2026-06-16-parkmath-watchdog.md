# ParkMath Watchdog (Unit W) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A daily site + affiliate-deeplink health check that GETs every live parkmath.co.uk route, validates the AWIN deeplinks structurally + probes their destination landing pages (never firing the click tracker), and opens a GitHub issue only when something breaks.

**Architecture:** A standalone Node tool `tools/watchdog/` modelled on `tools/awin/` — pure, dependency-free, unit-tested logic in `lib.mjs` (route enumeration, deeplink building/validation, result classification, report formatting) separated from a thin network runner `check.mjs` (fetches, throttling, exit code). A `.claude/skills/watchdog/SKILL.md` wraps the runner and handles the GitHub-issue side effect. A daily Claude Code scheduled-task (`parkmath-watchdog`) runs the skill.

**Tech Stack:** Node ≥18 ESM (`.mjs`), built-in `node:test` + `node:assert/strict` (run via `node --test tools/watchdog/`), global `fetch`, `gh` CLI for issues. No new dependencies. Reads dataset JSON directly from `packages/data/datasets/` and config from `apps/parkmath/lib/partners.json` (single sources of truth — no hardcoded mids/slugs).

**Branch:** `feat/parkmath-automations-v2` (already created off `main`; the spec commit `8930936` is its first commit).

**Source spec:** `docs/superpowers/specs/2026-06-16-parkmath-automations-v2-design.md` §3.

---

## File Structure

| File | Responsibility |
|---|---|
| `tools/watchdog/lib.mjs` | **Pure logic** (no network/secrets): dataset normalization, route enumeration, `buildAwinLink` port, deeplink structural validation, destination-URL extraction, result classification, markdown report formatting. |
| `tools/watchdog/lib.test.mjs` | `node:test` unit tests for every pure function in `lib.mjs`. |
| `tools/watchdog/check.mjs` | **Runner** (network): loads datasets + `partners.json`, enumerates routes, fetches pages (throttled, retry-once, timeout), probes destination URLs, runs structural validation, prints summary (`--json`), writes `docs/reports/watchdog-<date>.md` on failure, exits `0` (green) / `1` (failures). Flags: `--json`, `--no-fetch` (structural only), `--base <url>`. |
| `tools/watchdog/README.md` | Usage + the no-phantom-clicks rule. |
| `.claude/skills/watchdog/SKILL.md` | Agent wrapper: run `check.mjs`, on failure open/update a single rolling GitHub issue + keep the report; close it when green. Silent when green. |
| *(runtime)* scheduled-task `parkmath-watchdog` | Daily ~06:40 local; runs `/watchdog`; guards on TB4 volume mounted. |

Constants/interfaces defined in Task 1–5 and reused by the runner/skill: `DEFAULT_BASE_URL`, `DURATION_SLUGS`, `recordsOf`, `enumerateRoutes`, `buildAwinLink`, `activePartners`, `expectedDeeplinks`, `destinationUrls`, `validateDeeplink`, `classifyResults`, `formatReport`.

---

## Task 1: Scaffold `tools/watchdog/` with dataset normalization + duration slugs

**Files:**
- Create: `tools/watchdog/lib.mjs`
- Test: `tools/watchdog/lib.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
// tools/watchdog/lib.test.mjs
// Unit tests for the watchdog's pure logic. Zero deps — Node's built-in runner.
// Run: node --test tools/watchdog/
import { test } from "node:test";
import assert from "node:assert/strict";
import { recordsOf, DURATION_SLUGS } from "./lib.mjs";

test("DURATION_SLUGS mirrors apps/parkmath/lib/parking-content.ts", () => {
  assert.deepEqual(DURATION_SLUGS, ["3-days", "7-days", "14-days"]);
});

test("recordsOf normalizes bare array | {records} | {items} | junk", () => {
  assert.deepEqual(recordsOf([1, 2]), [1, 2]);
  assert.deepEqual(recordsOf({ records: [3] }), [3]);
  assert.deepEqual(recordsOf({ items: [4] }), [4]);
  assert.deepEqual(recordsOf(null), []);
  assert.deepEqual(recordsOf({ nope: 1 }), []);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tools/watchdog/`
Expected: FAIL — `Cannot find module './lib.mjs'`.

- [ ] **Step 3: Write minimal implementation**

```js
// tools/watchdog/lib.mjs
// Pure logic for the ParkMath site + deeplink watchdog — no network, no secrets, no deps.
// Unit-tested in lib.test.mjs (run: node --test tools/watchdog/). The runner (check.mjs) does the
// actual fetching; everything here is deterministic and safe to call anywhere.

export const DEFAULT_BASE_URL = "https://parkmath.co.uk";

// Mirror of apps/parkmath/lib/parking-content.ts:DURATION_SLUGS — keep in sync (Task 8 CI guard).
export const DURATION_SLUGS = ["3-days", "7-days", "14-days"];

/** Normalize a dataset JSON (bare array | {records:[...]} | {items:[...]}) to its records array. */
export function recordsOf(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.records)) return data.records;
  if (data && Array.isArray(data.items)) return data.items;
  return [];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tools/watchdog/`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add tools/watchdog/lib.mjs tools/watchdog/lib.test.mjs
git commit -m "feat(watchdog): scaffold pure-logic lib with dataset normalization

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Route enumeration

**Files:**
- Modify: `tools/watchdog/lib.mjs`
- Test: `tools/watchdog/lib.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
// add to tools/watchdog/lib.test.mjs
import { enumerateRoutes } from "./lib.mjs";

const FIXTURE = {
  airports: [{ slug: "heathrow" }, { slug: "gatwick" }],
  dropOff: { records: [{ airportSlug: "heathrow" }, { airportSlug: "gatwick" }] },
  parking: { records: [{ airportSlug: "heathrow" }] },
  lounges: { records: [{ airportSlug: "gatwick" }] },
  news: { items: [{ id: "news-1" }, { id: "news-2" }] },
};

test("enumerateRoutes covers hubs + per-dataset airport/duration/news routes", () => {
  const routes = enumerateRoutes(FIXTURE);
  const paths = routes.map((r) => r.path);
  // 5 hubs
  assert.ok(paths.includes("/") && paths.includes("/drop-off-charges") && paths.includes("/news"));
  // drop-off: one per drop-off record
  assert.ok(paths.includes("/drop-off-charges/heathrow") && paths.includes("/drop-off-charges/gatwick"));
  // parking hub + 3 durations, only for parking records (heathrow only)
  assert.ok(paths.includes("/airport-parking/heathrow"));
  assert.ok(paths.includes("/airport-parking/heathrow/3-days"));
  assert.ok(paths.includes("/airport-parking/heathrow/14-days"));
  assert.ok(!paths.includes("/airport-parking/gatwick")); // no parking record
  // lounges only for lounge records (gatwick only)
  assert.ok(paths.includes("/airport-lounges/gatwick") && !paths.includes("/airport-lounges/heathrow"));
  // news by id
  assert.ok(paths.includes("/news/news-1") && paths.includes("/news/news-2"));
  // exact total: 5 hubs + 2 drop-off + (1 parking + 3 durations) + 1 lounge + 2 news = 14
  assert.equal(routes.length, 14);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tools/watchdog/`
Expected: FAIL — `enumerateRoutes is not a function`.

- [ ] **Step 3: Write minimal implementation** (append to `lib.mjs`)

```js
/** Build the list of live ParkMath routes ({path, kind}) to health-check, derived from the datasets.
 *  Per-section airports come from each dataset's own records (parking/lounges are subsets of all 25). */
export function enumerateRoutes({ airports, dropOff, parking, lounges, news, durationSlugs = DURATION_SLUGS }) {
  void airports; // reserved; routes derive from per-section datasets so we never 404 a missing record
  const routes = [
    { path: "/", kind: "hub" },
    { path: "/drop-off-charges", kind: "hub" },
    { path: "/airport-parking", kind: "hub" },
    { path: "/airport-lounges", kind: "hub" },
    { path: "/news", kind: "hub" },
  ];
  for (const r of recordsOf(dropOff)) routes.push({ path: `/drop-off-charges/${r.airportSlug}`, kind: "drop-off" });
  for (const r of recordsOf(parking)) {
    routes.push({ path: `/airport-parking/${r.airportSlug}`, kind: "parking" });
    for (const d of durationSlugs) routes.push({ path: `/airport-parking/${r.airportSlug}/${d}`, kind: "parking-duration" });
  }
  for (const r of recordsOf(lounges)) routes.push({ path: `/airport-lounges/${r.airportSlug}`, kind: "lounge" });
  for (const r of recordsOf(news)) routes.push({ path: `/news/${r.id}`, kind: "news" });
  return routes;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tools/watchdog/`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tools/watchdog/lib.mjs tools/watchdog/lib.test.mjs
git commit -m "feat(watchdog): enumerate live routes from datasets

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: `buildAwinLink` port + structural deeplink validation

**Files:**
- Modify: `tools/watchdog/lib.mjs`
- Test: `tools/watchdog/lib.test.mjs`

> Port mirrors `apps/parkmath/lib/partners.ts:37-51` exactly. `validateDeeplink` reads decoded params via `URL.searchParams` (which round-trips the encoded `ued`).

- [ ] **Step 1: Write the failing test**

```js
// add to tools/watchdog/lib.test.mjs
import { buildAwinLink, validateDeeplink } from "./lib.mjs";

test("buildAwinLink matches the partners.ts contract (encoded ued, clickref suffix)", () => {
  const url = buildAwinLink({
    awinmid: "3496", publisherId: "2932035", airportSlug: "heathrow",
    ued: "https://www.holidayextras.com/airport-parking.html", clickrefSuffix: "dropoff",
  });
  assert.ok(url.startsWith("https://www.awin1.com/cread.php?"));
  const q = new URL(url).searchParams;
  assert.equal(q.get("awinmid"), "3496");
  assert.equal(q.get("awinaffid"), "2932035");
  assert.equal(q.get("clickref"), "parkmath-heathrow-dropoff");
  assert.equal(q.get("ued"), "https://www.holidayextras.com/airport-parking.html");
});

test("buildAwinLink omits suffix and ued when not given", () => {
  const url = buildAwinLink({ awinmid: "3496", publisherId: "2932035", airportSlug: "gatwick" });
  const q = new URL(url).searchParams;
  assert.equal(q.get("clickref"), "parkmath-gatwick");
  assert.equal(q.get("ued"), null);
});

const VALID_OPTS = { activeMids: new Set(["3496"]), publisherId: "2932035" };

test("validateDeeplink passes a well-formed link", () => {
  const url = buildAwinLink({ awinmid: "3496", publisherId: "2932035", airportSlug: "heathrow", ued: "https://x.test/p", clickrefSuffix: "lounge" });
  assert.deepEqual(validateDeeplink(url, { ...VALID_OPTS, expectedUed: "https://x.test/p" }), []);
});

test("validateDeeplink flags wrong host, inactive mid, bad affid, bad clickref, ued mismatch", () => {
  assert.deepEqual(validateDeeplink("https://evil.test/cread.php?awinmid=3496&awinaffid=2932035&clickref=parkmath-x", VALID_OPTS).length, 1);
  const wrongMid = buildAwinLink({ awinmid: "9999", publisherId: "2932035", airportSlug: "x" });
  assert.ok(validateDeeplink(wrongMid, VALID_OPTS).some((p) => p.includes("not an active mid")));
  const wrongAff = buildAwinLink({ awinmid: "3496", publisherId: "0000", airportSlug: "x" });
  assert.ok(validateDeeplink(wrongAff, VALID_OPTS).some((p) => p.includes("awinaffid")));
  const badRef = "https://www.awin1.com/cread.php?awinmid=3496&awinaffid=2932035&clickref=WRONG";
  assert.ok(validateDeeplink(badRef, VALID_OPTS).some((p) => p.includes("clickref")));
  const goodUrl = buildAwinLink({ awinmid: "3496", publisherId: "2932035", airportSlug: "x", ued: "https://a.test" });
  assert.ok(validateDeeplink(goodUrl, { ...VALID_OPTS, expectedUed: "https://b.test" }).some((p) => p.includes("ued")));
});

test("validateDeeplink rejects unparseable input", () => {
  assert.deepEqual(validateDeeplink("not a url", VALID_OPTS), ["unparseable URL"]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tools/watchdog/`
Expected: FAIL — `buildAwinLink is not a function`.

- [ ] **Step 3: Write minimal implementation** (append to `lib.mjs`)

```js
/** Port of apps/parkmath/lib/partners.ts:buildAwinLink — MUST stay byte-identical in output. */
export function buildAwinLink({ awinmid, publisherId, airportSlug, ued, clickrefSuffix }) {
  const params = new URLSearchParams({
    awinmid,
    awinaffid: publisherId,
    clickref: `parkmath-${airportSlug}${clickrefSuffix ? `-${clickrefSuffix}` : ""}`,
  });
  if (ued) params.set("ued", ued);
  return `https://www.awin1.com/cread.php?${params.toString()}`;
}

/** Structural check of a built deeplink against the AWIN contract. Returns problems[] (empty = ok).
 *  Never makes a request — this validates the string only. */
export function validateDeeplink(url, { activeMids, publisherId, expectedUed }) {
  let u;
  try { u = new URL(url); } catch { return ["unparseable URL"]; }
  const problems = [];
  if (u.host !== "www.awin1.com" || u.pathname !== "/cread.php") problems.push(`wrong host/path: ${u.host}${u.pathname}`);
  const q = u.searchParams;
  if (!activeMids.has(q.get("awinmid"))) problems.push(`awinmid ${q.get("awinmid")} not an active mid`);
  if (q.get("awinaffid") !== publisherId) problems.push(`awinaffid ${q.get("awinaffid")} !== ${publisherId}`);
  if (!/^parkmath-[a-z0-9-]+$/.test(q.get("clickref") ?? "")) problems.push(`bad clickref: ${q.get("clickref")}`);
  if (expectedUed !== undefined && q.get("ued") !== expectedUed) problems.push("ued mismatch");
  return problems;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tools/watchdog/`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tools/watchdog/lib.mjs tools/watchdog/lib.test.mjs
git commit -m "feat(watchdog): port buildAwinLink + structural deeplink validation

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Active partners → expected deeplinks + destination URLs (from `partners.json`)

**Files:**
- Modify: `tools/watchdog/lib.mjs`
- Test: `tools/watchdog/lib.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
// add to tools/watchdog/lib.test.mjs
import { activePartners, expectedDeeplinks, destinationUrls } from "./lib.mjs";

const PARTNERS = {
  awin: { publisherId: "2932035" },
  partners: {
    "holiday-extras": {
      name: "Holiday Extras", awinmid: "3496", active: true,
      landingUrl: "https://he.test/parking",
      products: { parking: { url: "https://he.test/parking", label: "parking" }, lounge: { url: "https://he.test/lounge", label: "lounge" } },
    },
    "purple-parking": { name: "Purple Parking", awinmid: "12028", active: false },
    "priority-pass": { name: "Priority Pass", awinmid: null, active: false },
  },
};

test("activePartners returns only active+mid partners with their destinations", () => {
  const ap = activePartners(PARTNERS);
  assert.equal(ap.length, 1);
  assert.equal(ap[0].slug, "holiday-extras");
  // landingUrl (surface null) + 2 products
  assert.equal(ap[0].destinations.length, 3);
});

test("destinationUrls is the distinct set of ued targets, never awin1.com", () => {
  const urls = destinationUrls(PARTNERS);
  assert.deepEqual(new Set(urls), new Set(["https://he.test/parking", "https://he.test/lounge"]));
  assert.ok(urls.every((u) => !u.includes("awin1.com")));
});

test("expectedDeeplinks = activePartners × airports × destinations, all structurally valid", () => {
  const airportSlugs = ["heathrow", "gatwick"];
  const links = expectedDeeplinks({ partnersJson: PARTNERS, airportSlugs });
  assert.equal(links.length, 1 * 2 * 3); // 6
  const opts = { activeMids: new Set(["3496"]), publisherId: "2932035" };
  for (const l of links) assert.deepEqual(validateDeeplink(l.url, { ...opts, expectedUed: l.expectedUed }), []);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tools/watchdog/`
Expected: FAIL — `activePartners is not a function`.

- [ ] **Step 3: Write minimal implementation** (append to `lib.mjs`)

```js
/** Active partners (active + awinmid) with their ued destinations, read from partners.json shape.
 *  destinations[].surface is the clickref suffix (null for the bare landingUrl link). */
export function activePartners(partnersJson) {
  const out = [];
  for (const [slug, p] of Object.entries(partnersJson.partners ?? {})) {
    if (!p.active || !p.awinmid) continue;
    const destinations = [];
    if (p.landingUrl) destinations.push({ surface: null, url: p.landingUrl });
    for (const [product, entry] of Object.entries(p.products ?? {})) destinations.push({ surface: product, url: entry.url });
    out.push({ slug, name: p.name, awinmid: p.awinmid, destinations });
  }
  return out;
}

/** Every deeplink the site can emit (active partners × airports × destinations), for structural checks. */
export function expectedDeeplinks({ partnersJson, airportSlugs }) {
  const publisherId = partnersJson.awin.publisherId;
  const links = [];
  for (const partner of activePartners(partnersJson)) {
    for (const slug of airportSlugs) {
      for (const dest of partner.destinations) {
        links.push({
          partner: partner.slug, airport: slug, surface: dest.surface,
          url: buildAwinLink({ awinmid: partner.awinmid, publisherId, airportSlug: slug, ued: dest.url, clickrefSuffix: dest.surface ?? undefined }),
          expectedUed: dest.url,
        });
      }
    }
  }
  return links;
}

/** Distinct ued destination URLs to probe for liveness. These are the merchant landing pages —
 *  NEVER awin1.com/cread.php (firing the tracker would register phantom affiliate clicks). */
export function destinationUrls(partnersJson) {
  const set = new Set();
  for (const partner of activePartners(partnersJson)) for (const dest of partner.destinations) set.add(dest.url);
  return [...set];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tools/watchdog/`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tools/watchdog/lib.mjs tools/watchdog/lib.test.mjs
git commit -m "feat(watchdog): derive expected deeplinks + destinations from partners.json

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Result classification + markdown report

**Files:**
- Modify: `tools/watchdog/lib.mjs`
- Test: `tools/watchdog/lib.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
// add to tools/watchdog/lib.test.mjs
import { classifyResults, formatReport } from "./lib.mjs";

test("classifyResults aggregates page/destination/deeplink failures", () => {
  const summary = classifyResults({
    pageResults: [{ path: "/", ok: true }, { path: "/news", ok: false, detail: "503" }],
    destResults: [{ url: "https://he.test/parking", ok: true }],
    deeplinkProblems: [{ url: "https://www.awin1.com/cread.php?x", problems: ["bad clickref: WRONG"] }],
  });
  assert.equal(summary.ok, false);
  assert.equal(summary.checked, 3);
  assert.equal(summary.failures.length, 2);
  assert.ok(summary.failures.some((f) => f.type === "page" && f.path === "/news"));
  assert.ok(summary.failures.some((f) => f.type === "deeplink"));
});

test("classifyResults ok=true when nothing fails", () => {
  const summary = classifyResults({ pageResults: [{ path: "/", ok: true }], destResults: [], deeplinkProblems: [] });
  assert.equal(summary.ok, true);
  assert.equal(summary.failures.length, 0);
});

test("formatReport lists each failure with its type", () => {
  const summary = classifyResults({
    pageResults: [{ path: "/news", ok: false, detail: "503" }], destResults: [], deeplinkProblems: [],
  });
  const md = formatReport({ date: "2026-06-16", summary });
  assert.ok(md.includes("# 🔴 ParkMath watchdog — 2026-06-16"));
  assert.ok(md.includes("`/news`") && md.includes("503"));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tools/watchdog/`
Expected: FAIL — `classifyResults is not a function`.

- [ ] **Step 3: Write minimal implementation** (append to `lib.mjs`)

```js
/** Combine page + destination + structural results into a pass/fail summary. */
export function classifyResults({ pageResults, destResults, deeplinkProblems }) {
  const failures = [];
  for (const r of pageResults) if (!r.ok) failures.push({ type: "page", path: r.path, detail: r.detail });
  for (const r of destResults) if (!r.ok) failures.push({ type: "destination", url: r.url, detail: r.detail });
  for (const p of deeplinkProblems) failures.push({ type: "deeplink", url: p.url, detail: p.problems.join("; ") });
  return { ok: failures.length === 0, failures, checked: pageResults.length + destResults.length + deeplinkProblems.length };
}

/** Markdown body for docs/reports/watchdog-<date>.md (written on failure only). */
export function formatReport({ date, summary }) {
  const lines = [
    `# 🔴 ParkMath watchdog — ${date}`, "",
    `${summary.failures.length} failing of ${summary.checked} checks.`, "",
  ];
  for (const f of summary.failures) {
    if (f.type === "page") lines.push(`- **page** \`${f.path}\` — ${f.detail}`);
    else if (f.type === "destination") lines.push(`- **affiliate destination** ${f.url} — ${f.detail}`);
    else lines.push(`- **deeplink** \`${f.url}\` — ${f.detail}`);
  }
  return lines.join("\n") + "\n";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tools/watchdog/`
Expected: PASS — all tests green.

- [ ] **Step 5: Commit**

```bash
git add tools/watchdog/lib.mjs tools/watchdog/lib.test.mjs
git commit -m "feat(watchdog): classify results + format failure report

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: The network runner `check.mjs`

**Files:**
- Create: `tools/watchdog/check.mjs`

> The runner does the I/O the pure lib intentionally avoids. It is verified by running it against the live site (no unit test mocks fetch — keep the network surface in this one file). Uses a concurrency cap, a 15s timeout, a single retry, and a browser-like User-Agent so Cloudflare/HE don't bot-block a plain Node UA.

- [ ] **Step 1: Write the runner**

```js
#!/usr/bin/env node
// ParkMath site + affiliate-deeplink watchdog — runner.
// Usage:
//   node tools/watchdog/check.mjs [--json] [--no-fetch] [--base https://parkmath.co.uk]
// Exit code: 0 = all green, 1 = one or more failures (or a fatal error).
// SAFETY: probes merchant DESTINATION pages only; never requests awin1.com/cread.php.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  DEFAULT_BASE_URL, recordsOf, enumerateRoutes, expectedDeeplinks, destinationUrls, validateDeeplink, classifyResults, formatReport,
} from "./lib.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const DATA = path.join(REPO, "packages/data/datasets");
const UA = "Mozilla/5.0 (compatible; ParkMathWatchdog/1.0; +https://parkmath.co.uk)";
const TIMEOUT_MS = 15_000;
const CONCURRENCY = 8;

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const noFetch = args.includes("--no-fetch");
const baseIdx = args.indexOf("--base");
const BASE = baseIdx >= 0 ? args[baseIdx + 1] : DEFAULT_BASE_URL;

async function readJson(rel) { return JSON.parse(await readFile(path.join(DATA, rel), "utf8")); }

/** GET a URL once: ok if status 200 and body looks like a real HTML doc. Returns {ok, detail}. */
async function probe(url, { expectHtml }) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { redirect: "follow", signal: ctrl.signal, headers: { "user-agent": UA, accept: "text/html" } });
    if (expectHtml) {
      if (res.status !== 200) return { ok: false, detail: `HTTP ${res.status}` };
      const body = await res.text();
      if (body.length < 500 || !body.toLowerCase().includes("</html>")) return { ok: false, detail: `thin/non-HTML body (${body.length}b)` };
      return { ok: true };
    }
    // destination probe: accept any non-error (2xx/3xx) — landing pages may 30x to a locale path.
    if (res.status >= 400) return { ok: false, detail: `HTTP ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, detail: e.name === "AbortError" ? `timeout >${TIMEOUT_MS}ms` : String(e.message || e) };
  } finally {
    clearTimeout(t);
  }
}

/** Probe once, retry a single time on failure (filters transient blips). */
async function probeRetry(url, opts) {
  const first = await probe(url, opts);
  if (first.ok) return first;
  return probe(url, opts);
}

/** Run an async fn over items with a fixed concurrency cap. */
async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx], idx); }
  }));
  return out;
}

async function main() {
  const [airports, dropOff, parking, lounges, news, partnersJson] = await Promise.all([
    readJson("airports.json"), readJson("parkmath/drop-off-fees.json"), readJson("parkmath/parking-tariffs.json"),
    readJson("parkmath/lounges.json"), readJson("parkmath/news.json"),
    readFile(path.join(REPO, "apps/parkmath/lib/partners.json"), "utf8").then(JSON.parse),
  ]);

  // 1) Structural deeplink validation (no network).
  const airportSlugs = recordsOf(airports).map((a) => a.slug);
  const activeMids = new Set(expectedDeeplinks({ partnersJson, airportSlugs: ["_"] }).map((l) => new URL(l.url).searchParams.get("awinmid")));
  const publisherId = partnersJson.awin.publisherId;
  const deeplinkProblems = [];
  for (const l of expectedDeeplinks({ partnersJson, airportSlugs })) {
    const problems = validateDeeplink(l.url, { activeMids, publisherId, expectedUed: l.expectedUed });
    if (problems.length) deeplinkProblems.push({ url: l.url, problems });
  }

  // 2) Page liveness + 3) destination liveness (network, unless --no-fetch).
  let pageResults = [];
  let destResults = [];
  if (!noFetch) {
    const routes = enumerateRoutes({ airports, dropOff, parking, lounges, news });
    pageResults = await pool(routes, CONCURRENCY, async (r) => ({ path: r.path, ...(await probeRetry(BASE + r.path, { expectHtml: true })) }));
    const dests = destinationUrls(partnersJson);
    destResults = await pool(dests, CONCURRENCY, async (url) => ({ url, ...(await probeRetry(url, { expectHtml: false })) }));
  }

  const summary = classifyResults({ pageResults, destResults, deeplinkProblems });
  if (asJson) {
    process.stdout.write(JSON.stringify({ base: BASE, ...summary }, null, 2) + "\n");
  } else {
    console.log(`watchdog ${summary.ok ? "✅ all green" : "🔴 FAIL"} — ${summary.checked} checks, ${summary.failures.length} failing (base ${BASE})`);
    for (const f of summary.failures) console.log(`  - ${f.type} ${f.path || f.url}: ${f.detail}`);
  }
  process.exit(summary.ok ? 0 : 1);
}

main().catch((e) => { console.error("watchdog fatal:", e); process.exit(1); });
```

- [ ] **Step 2: Verify the pure-only path (no network)**

Run: `node tools/watchdog/check.mjs --no-fetch --json`
Expected: JSON with `"ok": true`, `"failures": []`, `checked` equal to the deeplink count (active-partner destinations × 25 airports), exit `0`. Confirm by echoing the code: `echo $?` → `0`.

- [ ] **Step 3: Verify the live run against production**

Run: `node tools/watchdog/check.mjs`
Expected: `watchdog ✅ all green — N checks, 0 failing` and exit `0`, assuming the site is healthy. If Cloudflare bot-challenges the UA (failures all showing `HTTP 403`/`503` on every page), note it — the fix is to allow the watchdog UA in Cloudflare or widen the accepted-status set; record the outcome rather than forcing a pass.

- [ ] **Step 4: Verify failure detection**

Run: `node tools/watchdog/check.mjs --base https://parkmath.co.uk/this-does-not-exist-xyz --json`
Expected: page probes fail (`HTTP 404`), `"ok": false`, exit `1` (`echo $?` → `1`). (This points the base at a bad prefix so every route 404s — confirms non-zero exit + failure listing.)

- [ ] **Step 5: Commit**

```bash
git add tools/watchdog/check.mjs
git commit -m "feat(watchdog): network runner (page + destination probes, exit codes)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: README + the `watchdog` skill (GitHub-issue side effect)

**Files:**
- Create: `tools/watchdog/README.md`
- Create: `.claude/skills/watchdog/SKILL.md`

- [ ] **Step 1: Write the README**

```markdown
# watchdog — ParkMath site + affiliate-deeplink health check

Daily check that every live parkmath.co.uk route is up and the Holiday Extras deeplinks are intact.

## Run
```bash
node tools/watchdog/check.mjs            # full check against https://parkmath.co.uk
node tools/watchdog/check.mjs --json     # machine-readable summary
node tools/watchdog/check.mjs --no-fetch # structural deeplink checks only (no network)
node tools/watchdog/check.mjs --base https://staging.example  # alternate base
node --test tools/watchdog/              # unit tests (pure logic in lib.mjs)
```
Exit `0` = all green; exit `1` = one or more failures.

## What it checks
1. **Pages up** — GET every hub + per-airport drop-off/parking/parking-duration/lounge + news page; 200 + real HTML.
2. **Deeplink integrity** — every link `buildAwinLink()` can emit is validated structurally against the AWIN contract (mid/affid/clickref/ued), and the distinct **destination** landing pages (holidayextras.com) are probed for liveness.

## SAFETY
Never requests `awin1.com/cread.php` / `awclick.php`. Firing the click tracker would register phantom affiliate clicks and risk AWIN compliance. Only structural validation + merchant-destination probing.
```

- [ ] **Step 2: Write the skill**

```markdown
---
name: watchdog
description: Daily ParkMath site + affiliate-deeplink health check. Runs tools/watchdog/check.mjs; on failure opens/updates a single rolling GitHub issue and writes docs/reports/watchdog-<date>.md; silent when everything is green. Use when asked to run the site watchdog.
---

# watchdog routine

Runs the read-only `tools/watchdog` checker and turns a failure into one actionable, rolling
GitHub issue. **Silent when green** — no file, no issue, no noise.

## Hard rules
- **Read-only.** The only side effects are: a GitHub issue (via `gh`) and, on failure,
  `docs/reports/watchdog-<YYYY-MM-DD>.md`. Never edit code, datasets, or `partners.json`.
- **Never fire affiliate trackers.** The checker already guarantees this; do not add any request to
  `awin1.com`. If asked to "test the affiliate link", that means the destination page only.
- **One rolling issue.** Reuse a single open issue titled `🔴 Watchdog` (label `watchdog`); never
  open a second. Comment to update; close when green.
- **Guard the volume.** The repo is on the external TB4 volume. If the repo path is not present,
  report "repo volume not mounted" and stop (exit cleanly) — do not flag a false outage.

## Steps
1. **Preflight.** Confirm the repo root exists (the `package.json` with `"name": "mathfamily"`). If
   not, stop cleanly. Compute `<date>` = today (`date +%F`, Europe/London).
2. **Run the check** from the repo root:
   ```bash
   node tools/watchdog/check.mjs --json
   ```
   Capture stdout (the JSON summary) and the exit code.
3. **If exit 0 (green):**
   - If an open issue with label `watchdog` exists (`gh issue list --label watchdog --state open --json number,title`),
     comment "✅ Green again as of `<date>`." and close it.
   - Otherwise do nothing. Do not write a report. Done.
4. **If exit 1 (failures):**
   - Write `docs/reports/watchdog-<YYYY-MM-DD>.md` from the JSON: a `# 🔴 ParkMath watchdog — <date>`
     heading, the `N failing of M checks` line, and one bullet per failure (`type`, `path`/`url`, `detail`).
   - Find the existing rolling issue: `gh issue list --label watchdog --state open --json number`.
     - **None open:** create it —
       ```bash
       gh issue create --label watchdog --title "🔴 Watchdog — affiliate/site failures" --body-file docs/reports/watchdog-<YYYY-MM-DD>.md
       ```
       (Create the `watchdog` label first if missing: `gh label create watchdog --color B60205 --description "site/deeplink watchdog" || true`.)
     - **One open:** add a dated comment with the current failure list:
       `gh issue comment <number> --body-file docs/reports/watchdog-<YYYY-MM-DD>.md`.
   - Do not @-mention or escalate beyond the issue.
5. **Report** a one-line summary of what you did (green/with-issue-number).

## Guardrails recap
- Silent on green; one rolling `watchdog`-labelled issue on failure; report file only on failure.
- No affiliate-tracker requests, ever. No edits to code/data. Volume-guarded.
```

- [ ] **Step 3: Commit**

```bash
git add tools/watchdog/README.md .claude/skills/watchdog/SKILL.md
git commit -m "feat(watchdog): README + watchdog skill (rolling GitHub issue, silent on green)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Register the daily scheduled-task + CI guard, then verify

**Files:**
- Modify: `.github/workflows/ci.yml` (add the watchdog unit tests to the test job)

- [ ] **Step 1: Add the unit tests to CI**

In `.github/workflows/ci.yml`, in the existing test job (after dependencies are installed), add a step:

```yaml
      - name: Watchdog unit tests
        run: node --test tools/watchdog/ tools/awin/
```

(If the test job already runs `pnpm test` via turbo and `tools/*` are not turbo packages, this explicit `node --test` step is what exercises them. Place it alongside the existing test step.)

- [ ] **Step 2: Verify CI file is valid**

Run: `node -e "const y=require('fs').readFileSync('.github/workflows/ci.yml','utf8'); console.log(y.includes('node --test tools/watchdog/') ? 'step present' : 'MISSING')"`
Expected: `step present`.

- [ ] **Step 3: Commit the CI change**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: run watchdog + awin node unit tests

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 4: Register the scheduled-task** (runtime action, not a file)

Using the scheduled-tasks tool (NOT launchd — launchd is broken on the TB4-volume home, see the spec §1), create a daily task:
- **taskId:** `parkmath-watchdog`
- **cronExpression:** `42 6 * * *` (daily ~06:42 local; off the :00 mark)
- **prompt:**
  > Run the ParkMath site + affiliate-deeplink watchdog. Repository: `/Volumes/TB4 Workstation/Users/mike/Desktop/Projects/MathFamily` (on the external TB4 volume — if not mounted, stop and report, do nothing else). Change into it and run the `watchdog` skill (equivalent to `/watchdog`), following `.claude/skills/watchdog/SKILL.md`: run `node tools/watchdog/check.mjs --json`; if green, do nothing (close any open `watchdog` issue); if it reports failures, write `docs/reports/watchdog-<date>.md` and open/update the single rolling `watchdog`-labelled GitHub issue. Never request awin1.com/cread.php. Read-only otherwise.

- [ ] **Step 5: Pre-approve tools with a manual run**

In the app's Scheduled section, click **Run now** on `parkmath-watchdog` once and approve the tools it uses (`Bash` for `node`/`gh`). Confirm: a green run does nothing; to prove the issue path works, temporarily run the skill's check against a bad base (`--base https://parkmath.co.uk/nope`) by hand and confirm it would create exactly one `watchdog`-labelled issue, then close it. Record the result.

- [ ] **Step 6: Final full-suite check**

Run: `node --test tools/watchdog/` → all tests PASS. `node tools/watchdog/check.mjs` → exit `0` against the healthy live site.

---

## Self-Review (completed during planning)

**Spec coverage (§3):** pages-up check → Task 2 + 6; deeplink structural validation without firing cread.php → Task 3–4 + 6 (destinations only); GitHub issue on failure / silent on green / report file on failure → Task 7; daily scheduled-task ~06:40, volume-guarded → Task 8. The optional Product/OG-meta check (§3.3) is intentionally **deferred** (YAGNI for v1) — noted here so it isn't lost; add a `kind:"og"` check later if a page-meta regression is seen.

**Placeholder scan:** none — every step has runnable code/commands and expected output.

**Type/name consistency:** `recordsOf`, `enumerateRoutes`, `buildAwinLink`, `activePartners`, `expectedDeeplinks`, `destinationUrls`, `validateDeeplink`, `classifyResults`, `formatReport`, `DURATION_SLUGS`, `DEFAULT_BASE_URL` are defined once and used with matching signatures across the runner and tests. `summary.checked` counts pages + destinations + deeplink problems consistently in `classifyResults` and the runner's output.

**Known risk flagged in Task 6:** Cloudflare bot-challenge on the watchdog UA could cause blanket false failures; handled by setting a UA and recording (not forcing) the outcome.
