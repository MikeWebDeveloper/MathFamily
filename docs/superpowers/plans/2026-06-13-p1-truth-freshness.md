# P1 — Truth & Freshness Correctness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Fix the trust-correctness gaps the research flagged: no misleading "£0 saving", data-driven payment-deadline copy, surfaced news verification dates, a *confidence* freshness signal (delta + data range), and ready-to-activate eSIM affiliate wiring with a safe fallback.

**Architecture:** Small data-driven fixes + two new pure helpers in `apps/parkmath/lib/content.ts` (testable in isolation) + additive optional props on `FreshnessBadge`. Most "empty state" cases were already guarded (verified by scouting) and are out of scope. No schema changes.

**Tech Stack:** React 19, Tailwind v4. Tests: `packages/ui` = vitest+jsdom+@testing-library (`// @vitest-environment jsdom` first line); apps = plain vitest for `lib/` helpers + `renderToStaticMarkup` for components; engine/data plain vitest.

**Branch:** `design-upgrade-p1` (already checked out; stacked on `design-upgrade-p0b` / PR #4 — the foundation isn't merged to main yet).

**Constraints:** Never create a vitest/vite config file (esbuild deadlock); no `pnpm install`. Commit trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`. Don't touch `packages/ui/tests/ambient.test.tsx`.

**Deferred (data-pipeline / blocked):** true per-row "oldest verified" history (needs a schema field); year-on-year delta on parking pages (ParkingRecord has no `priorYearFeePence`); the live Airalo deeplink value (AWIN approval pending — we wire the plumbing + fallback only).

---

## Task 1: Don't render a misleading "Save £0.00"

**Files:** Modify `apps/parkmath/lib/chart-svg.ts` (~L42); Test `apps/parkmath/tests/chart-svg.test.ts`.

- [ ] **Step 1: Write the failing test.** Read `apps/parkmath/tests/chart-svg.test.ts` for its import + the `parkingChartSvg` signature, then add:

```ts
it("does not claim a £0 saving when gate equals pre-book", () => {
  const svg = parkingChartSvg({ gatePence: 5000, prebookPence: 5000 /* ...other required args as the existing tests pass them */ });
  expect(svg).not.toContain("Save £0.00");
  expect(svg).toContain("Same price as pre-booking");
});
```
(Match the exact argument shape the existing tests use — read them first.)

- [ ] **Step 2: Run, expect FAIL** — `pnpm --filter parkmath exec vitest run tests/chart-svg.test.ts`.

- [ ] **Step 3: Implement.** In `apps/parkmath/lib/chart-svg.ts`, find the line that always emits the saving text (`Save ${gbp(saving)} by pre-booking`). Replace it with a conditional: when `saving > 0` keep `Save ${gbp(saving)} by pre-booking`; otherwise emit `Same price as pre-booking`. Keep all SVG positioning identical.

- [ ] **Step 4: Run, expect PASS. Step 5: Commit** `fix(parkmath): don't render misleading "Save £0.00" on equal-price parking chart`.

---

## Task 2: Payment-deadline chip uses the real data (not hardcoded copy)

**Files:** Modify `apps/parkmath/lib/content.ts` (new helper); Modify `apps/parkmath/app/drop-off-charges/[airport]/page.tsx` (~L84); Test `apps/parkmath/tests/content.test.ts`.

- [ ] **Step 1: Write the failing test.** In `apps/parkmath/tests/content.test.ts` add (match its existing import style for `DropOffRecord` fixtures — reuse an existing fixture helper if present):

```ts
import { paymentDeadlineChip } from "../lib/content";

describe("paymentDeadlineChip", () => {
  it("returns the real deadline, not generic copy", () => {
    expect(paymentDeadlineChip({ paymentDeadline: "midnight on the day of your visit" } as any)).toBe("Pay by: midnight on the day of your visit");
  });
  it("returns null when there is no deadline", () => {
    expect(paymentDeadlineChip({ paymentDeadline: null } as any)).toBeNull();
  });
});
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement.** In `apps/parkmath/lib/content.ts` add:

```ts
import type { DropOffRecord } from "@mathfamily/data";

/** The payment-deadline caveat text, driven by the real data (never generic copy). */
export function paymentDeadlineChip(record: Pick<DropOffRecord, "paymentDeadline">): string | null {
  return record.paymentDeadline ? `Pay by: ${record.paymentDeadline}` : null;
}
```
(If `content.ts` already imports `DropOffRecord`, reuse the existing import.) Then in `apps/parkmath/app/drop-off-charges/[airport]/page.tsx` around L84, replace:
```tsx
{record.paymentDeadline ? <CaveatChip>Pay before you leave</CaveatChip> : null}
```
with:
```tsx
{paymentDeadlineChip(record) ? <CaveatChip>{paymentDeadlineChip(record)}</CaveatChip> : null}
```
and add `paymentDeadlineChip` to the existing `@/lib/content` import.

- [ ] **Step 4: Run, expect PASS** (`pnpm --filter parkmath exec vitest run tests/content.test.ts`). **Step 5: Commit** `fix(parkmath): payment-deadline chip uses real data, not hardcoded copy`.

---

## Task 3: NewsCard surfaces the verified date

**Files:** Modify `packages/ui/src/news-card.tsx` (~L19); Test `packages/ui/tests/news.test.tsx`.

- [ ] **Step 1: Write the failing test.** Read `packages/ui/tests/news.test.tsx` (jsdom) for the existing `NewsCard` render + the item shape, then add:

```tsx
it("shows the verified date when it differs from published", () => {
  const item = { /* ...spread an existing fixture... */ publishedAt: "2026-01-10", verifiedAt: "2026-06-01" } as any;
  const { container } = render(<NewsCard item={item} />);
  expect(container.textContent).toMatch(/verified/i);
});
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement.** In `packages/ui/src/news-card.tsx`, after the existing `<time dateTime={item.publishedAt}>` element, add (using the same `fmtDate` helper already in the file):
```tsx
{item.verifiedAt !== item.publishedAt ? (
  <time dateTime={item.verifiedAt} className="text-ink-muted">verified {fmtDate(item.verifiedAt)}</time>
) : null}
```
(Keep layout sensible — if the dates sit in a flex/row, this becomes a second item; match the surrounding markup.)

- [ ] **Step 4: Run, expect PASS** (`pnpm --filter @mathfamily/ui exec vitest run tests/news.test.tsx`). **Step 5: Commit** `feat(ui): NewsCard surfaces verifiedAt alongside publishedAt`.

---

## Task 4: FreshnessBadge confidence (delta + data range)

**Files:** Modify `apps/parkmath/lib/content.ts` (`freshnessDelta` helper); Modify `packages/ui/src/freshness-badge.tsx` (additive props); Modify `apps/parkmath/app/drop-off-charges/[airport]/page.tsx` (pass `deltaLabel`) + `apps/parkmath/app/drop-off-charges/page.tsx` (pass `oldestRowDate`); Tests: `apps/parkmath/tests/content.test.ts` + `packages/ui/tests/components.test.tsx`.

- [ ] **Step 1a: content helper test.** In `apps/parkmath/tests/content.test.ts` add:

```ts
import { freshnessDelta } from "../lib/content";

describe("freshnessDelta", () => {
  const base = { isFree: false, bands: [{ totalPence: 600, upToMinutes: 10 }] };
  it("'unchanged' when this year equals last", () => {
    expect(freshnessDelta({ ...base, priorYearFeePence: 600 } as any)).toBe("Unchanged vs last year");
  });
  it("'up' when dearer than last year", () => {
    expect(freshnessDelta({ ...base, priorYearFeePence: 500 } as any)).toBe("Up £1.00 vs last year");
  });
  it("null when no prior-year data or free", () => {
    expect(freshnessDelta({ ...base, priorYearFeePence: null } as any)).toBeNull();
    expect(freshnessDelta({ isFree: true, bands: [], priorYearFeePence: 500 } as any)).toBeNull();
  });
});
```

- [ ] **Step 1b: FreshnessBadge test.** In `packages/ui/tests/components.test.tsx`, inside the existing `describe("FreshnessBadge")`, add:

```tsx
it("renders a delta label when provided", () => {
  const { container } = render(<FreshnessBadge verifiedAt="2026-06-01" deltaLabel="Unchanged vs last year" />);
  expect(container.textContent).toContain("Unchanged vs last year");
});
it("renders a data range when oldestRowDate differs", () => {
  const { container } = render(<FreshnessBadge verifiedAt="2026-06-01" oldestRowDate="2026-01-15" />);
  expect(container.textContent).toMatch(/2026/);
  expect(container.textContent?.toLowerCase()).toContain("data from");
});
```

- [ ] **Step 2: Run both, expect FAIL.**

- [ ] **Step 3a: Implement the helper.** In `apps/parkmath/lib/content.ts` add (reuse `formatPence` from `@mathfamily/engine` — check how `trendNote` imports it):

```ts
/** A short confidence delta vs last year, or null when not comparable. */
export function freshnessDelta(record: Pick<DropOffRecord, "isFree" | "bands" | "priorYearFeePence">): string | null {
  const current = record.bands[0]?.totalPence;
  if (record.isFree || current === undefined || record.priorYearFeePence === null) return null;
  const diff = current - record.priorYearFeePence;
  if (diff === 0) return "Unchanged vs last year";
  return diff > 0 ? `Up ${formatPence(diff)} vs last year` : `Down ${formatPence(-diff)} vs last year`;
}
```

- [ ] **Step 3b: Implement FreshnessBadge props.** Read `packages/ui/src/freshness-badge.tsx`, then add two optional props to its signature: `deltaLabel?: string; oldestRowDate?: string;`. When `oldestRowDate` is provided AND differs from `verifiedAt`, render the main line as `Data from {fmt(oldestRowDate)} to {fmt(verifiedAt)}` (reuse its existing en-GB date formatter); otherwise keep the current `Verified {date}`. When `deltaLabel` is provided, render it as a small secondary line/`<span>` (muted) after the date. Keep the existing green/amber age logic.

- [ ] **Step 3c: Wire the call sites.**
  - `apps/parkmath/app/drop-off-charges/[airport]/page.tsx` (the `FreshnessBadge` ~L75): pass `deltaLabel={freshnessDelta(record) ?? undefined}` (import `freshnessDelta` from `@/lib/content`).
  - `apps/parkmath/app/drop-off-charges/page.tsx` (~L64): it already computes `latestVerified` (max). Add `const oldestVerified = records.map(r => r.verifiedAt).sort()[0];` and pass `oldestRowDate={oldestVerified}` to the `FreshnessBadge`.

- [ ] **Step 4: Run both test files, expect PASS. Step 5: Commit** `feat(ui,parkmath): FreshnessBadge confidence — delta + data range`.

---

## Task 5: RoamMath eSIM affiliate wiring + safe fallback

**Files:** Modify `apps/roammath/app/roaming/[country]/[network]/page.tsx` (the eSIM `Callout` ~L137–149); Test `apps/roammath/tests/partners.test.ts` (if absent, create plain-vitest).

Airalo stays `active:false` in `partners.json` (the AWIN deeplink isn't approved yet). This task wires `resolveSlot` into the eSIM CTA so it activates the moment the config flips, and shows a safe fallback ("official site" plain link / nothing) while inactive — so there is never a dead affiliate link.

- [ ] **Step 1: Write the failing test.** Read `apps/roammath/lib/partners.ts` (`resolveSlot` signature) and `partners.json`. In `apps/roammath/tests/partners.test.ts` add (plain vitest):

```ts
import { resolveSlot } from "../lib/partners";

describe("resolveSlot esim", () => {
  it("falls back to official (non-affiliate) while the slot is inactive", () => {
    const r = resolveSlot("esim", "france", "https://www.airalo.com/france-esim");
    expect(r.kind).toBe("official");
    expect(r.disclosureRequired).toBe(false);
  });
});
```
(Adjust arg names to the real `resolveSlot` signature.)

- [ ] **Step 2: Run, expect PASS or FAIL** — if `resolveSlot` already returns this, the test passes immediately (it documents/locks the fallback). If the signature differs, fix the test to match, then continue. (This task is mostly wiring the page, which has no unit test; the test locks the fallback contract.)

- [ ] **Step 3: Implement the page wiring.** In `apps/roammath/app/roaming/[country]/[network]/page.tsx`, where the eSIM `Callout` renders `r7.esimChoice` (~L137–149): compute `const esimSlot = resolveSlot("esim", country, officialAiraloUrl)` (use the country slug + a sensible official Airalo URL as the fallback `officialUrl` arg — match `resolveSlot`'s signature). Inside the Callout, add a link:
  - if `esimSlot.kind === "affiliate"`: render the affiliate CTA `<a href={esimSlot.url} ...>` + the disclosure text ("We may earn commission").
  - else: render a quiet `<a href={esimSlot.url} ...>Check prices on the official site →</a>` (no disclosure).
  Import `resolveSlot` from `@/lib/partners` (or relative if `@/` doesn't resolve in this app — check existing imports on the page). Keep the existing price-comparison content.

- [ ] **Step 4: Run the test + typecheck.** `pnpm --filter roammath exec vitest run tests/partners.test.ts` and `pnpm --filter roammath typecheck` (exit 0). **Step 5: Commit** `feat(roammath): wire eSIM affiliate slot with safe official-site fallback`.

---

## Task 6: Verification

- [ ] `pnpm typecheck` → 7/7 clean.
- [ ] `pnpm test` → all tasks pass (parkmath + ui counts grow; no regressions).
- [ ] `pnpm --filter parkmath exec next build` and `pnpm --filter roammath exec next build` → succeed (use `next build` directly — NOT `pnpm --filter <app> build`, which runs indexnow.mjs).
- [ ] Report SHAs.

---

## Self-Review

**Coverage vs spec P1:** hardcoded-copy drift → T2 (paymentDeadline) ✓; honest empty states → T1 (only real gap: £0 saving) + scout confirmed the rest already guarded ✓; FreshnessBadge confidence (delta + range) → T4 ✓; verifiedAt on news → T3 ✓; Airalo/eSIM as a trust fix → T5 (plumbing + fallback; live deeplink deferred to AWIN approval, flagged) ✓.
**Placeholders:** none — each step has code or a precise read-then-apply instruction with the target code. Steps that say "match the existing fixture/signature" require reading the named file first (the values aren't invented).
**Type consistency:** `paymentDeadlineChip(record): string|null`, `freshnessDelta(record): string|null`, FreshnessBadge `deltaLabel?:string`/`oldestRowDate?:string` used identically in helper, props, tests, and call sites.
**Backward-compat:** FreshnessBadge new props optional — all other existing call sites render unchanged.
