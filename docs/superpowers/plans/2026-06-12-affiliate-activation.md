# ParkMath Affiliate Activation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn on AWIN affiliate links for ParkMath parking — one featured, ASA-compliant Holiday Extras CTA per airport — and add an env-gated AWIN tracking seam, without changing any page or touching RoamMath.

**Architecture:** Restructure `partners.json` into structured AWIN config (publisher id + per-partner `awinmid` + ordered slot `partnerIds`); build the `cread.php` link in code via a pure `buildAwinLink` (no string templates → no encoding footgun); keep `resolveSlot`'s existing signature so no page changes; give `AffiliateBlock` an "Ad" chip + compliant disclosure; add an env-gated AWIN MasterTag to the shared `SiteAnalytics` (shipped off). The OG-image fix is a Vercel env var, documented as an ops step.

**Tech Stack:** Next.js 15 (App Router, RSC), TypeScript, vitest (config-less — **never** create a vitest/vite config file on this `/Volumes/TB4` volume; it deadlocks), `react-dom/server` for static-markup component tests, `@testing-library/react` (only in `packages/ui`, already present).

**Branch:** `feat/affiliate-activation` already exists with the spec committed (`d7a5660`). Work continues on it.

**Reference spec:** `docs/superpowers/specs/2026-06-12-affiliate-activation-design.md`

---

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `apps/parkmath/lib/partners.json` | Structured AWIN config (publisher id, partners w/ `awinmid`, slots w/ ordered `partnerIds`) | Rewrite (Task 2) |
| `apps/parkmath/lib/partners.ts` | `buildAwinLink` (pure link builder) + `resolveSlot` (unchanged signature, new internals) | Modify (Tasks 1, 2) |
| `apps/parkmath/tests/partners.test.ts` | Unit tests for `buildAwinLink` + `resolveSlot` | Modify (Tasks 1, 2) |
| `apps/parkmath/components/affiliate-block.tsx` | "Ad" chip + compliant disclosure; relative import | Modify (Task 3) |
| `apps/parkmath/tests/affiliate-block.test.tsx` | Static-markup render test of `AffiliateBlock` | Create (Task 3) |
| `packages/ui/src/site-analytics.tsx` | Cloudflare beacon + env-gated AWIN MasterTag seam | Modify (Task 4) |
| `packages/ui/tests/site-analytics.test.tsx` | Render tests for both analytics branches | Modify (Task 4) |
| `docs/affiliate-activation-ops.md` | Vercel env vars + go-live/verify runbook | Create (Task 5) |

Pages (`airport-parking/[airport]/page.tsx`, its `[duration]` child, `airport-lounges/[airport]/page.tsx`) call `AffiliateBlock` with the **same props as today** — so they are **not modified**. RoamMath's `lib/partners.*` and `components/affiliate-block.tsx` are **not modified**.

---

## Task 1: `buildAwinLink` pure link builder

**Files:**
- Modify: `apps/parkmath/lib/partners.ts`
- Test: `apps/parkmath/tests/partners.test.ts`

This task is purely additive — it does not touch `resolveSlot` or `partners.json`, so the existing `resolveSlot` test keeps passing.

- [ ] **Step 1: Write the failing tests**

In `apps/parkmath/tests/partners.test.ts`, change the import line to add `buildAwinLink`, and add a new `describe` block above the existing `resolveSlot` block. The import line becomes:

```ts
import { buildAwinLink, resolveSlot } from "../lib/partners";
```

Add:

```ts
describe("buildAwinLink", () => {
  it("builds a bare cread.php link with clickref and no ued", () => {
    expect(buildAwinLink({ awinmid: "3496", publisherId: "2932035", airportSlug: "gatwick" })).toBe(
      "https://www.awin1.com/cread.php?awinmid=3496&awinaffid=2932035&clickref=parkmath-gatwick"
    );
  });
  it("percent-encodes a ued destination so its own query string cannot leak", () => {
    const url = buildAwinLink({
      awinmid: "3496",
      publisherId: "2932035",
      airportSlug: "gatwick",
      ued: "https://shop.example.com/p?a=1&b=2",
    });
    expect(url).toContain("ued=https%3A%2F%2Fshop.example.com%2Fp%3Fa%3D1%26b%3D2");
    expect(url.split("&")).toHaveLength(4); // awinmid, awinaffid, clickref, ued — destination's & is encoded
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter parkmath test`
Expected: FAIL — `buildAwinLink is not a function` / not exported.

- [ ] **Step 3: Implement `buildAwinLink`**

In `apps/parkmath/lib/partners.ts`, add this exported function (place it after the `import` line, above `resolveSlot`):

```ts
/** Build a bare, fully-tracked AWIN deep link. `clickref` tags every click with its airport
 *  for per-airport reporting. `ued` (optional) is percent-encoded by URLSearchParams, so a
 *  destination carrying its own query string can never leak into the cread.php query. */
export function buildAwinLink(args: {
  awinmid: string;
  publisherId: string;
  airportSlug: string;
  ued?: string;
}): string {
  const params = new URLSearchParams({
    awinmid: args.awinmid,
    awinaffid: args.publisherId,
    clickref: `parkmath-${args.airportSlug}`,
  });
  if (args.ued) params.set("ued", args.ued);
  return `https://www.awin1.com/cread.php?${params.toString()}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter parkmath test`
Expected: PASS (the `buildAwinLink` block plus the still-unchanged `resolveSlot` block).

- [ ] **Step 5: Commit**

```bash
git add apps/parkmath/lib/partners.ts apps/parkmath/tests/partners.test.ts
git commit -m "feat(parkmath): add buildAwinLink AWIN deep-link builder"
```

---

## Task 2: Structured `partners.json` + `resolveSlot` rewrite

**Files:**
- Modify: `apps/parkmath/lib/partners.json`
- Modify: `apps/parkmath/lib/partners.ts`
- Test: `apps/parkmath/tests/partners.test.ts`

- [ ] **Step 1: Rewrite the `resolveSlot` tests for the active state**

Replace the **entire** `describe("resolveSlot", …)` block in `apps/parkmath/tests/partners.test.ts` with:

```ts
describe("resolveSlot", () => {
  it("parking-prebook resolves to the active Holiday Extras affiliate link", () => {
    const r = resolveSlot("parking-prebook", "gatwick", "https://www.gatwickairport.com/parking");
    expect(r.kind).toBe("affiliate");
    expect(r.partnerName).toBe("Holiday Extras");
    expect(r.disclosureRequired).toBe(true);
    expect(r.url).toContain("awinmid=3496");
    expect(r.url).toContain("awinaffid=2932035");
    expect(r.url).toContain("clickref=parkmath-gatwick");
    expect(r.url).not.toContain("ued=");
  });
  it("lounge-membership stays official while inactive", () => {
    const r = resolveSlot("lounge-membership", "gatwick", "https://www.prioritypass.com");
    expect(r.kind).toBe("official");
    expect(r.url).toBe("https://www.prioritypass.com");
    expect(r.disclosureRequired).toBe(false);
  });
});
```

The full file is now exactly:

```ts
import { describe, expect, it } from "vitest";
import { buildAwinLink, resolveSlot } from "../lib/partners";

describe("buildAwinLink", () => {
  it("builds a bare cread.php link with clickref and no ued", () => {
    expect(buildAwinLink({ awinmid: "3496", publisherId: "2932035", airportSlug: "gatwick" })).toBe(
      "https://www.awin1.com/cread.php?awinmid=3496&awinaffid=2932035&clickref=parkmath-gatwick"
    );
  });
  it("percent-encodes a ued destination so its own query string cannot leak", () => {
    const url = buildAwinLink({
      awinmid: "3496",
      publisherId: "2932035",
      airportSlug: "gatwick",
      ued: "https://shop.example.com/p?a=1&b=2",
    });
    expect(url).toContain("ued=https%3A%2F%2Fshop.example.com%2Fp%3Fa%3D1%26b%3D2");
    expect(url.split("&")).toHaveLength(4);
  });
});

describe("resolveSlot", () => {
  it("parking-prebook resolves to the active Holiday Extras affiliate link", () => {
    const r = resolveSlot("parking-prebook", "gatwick", "https://www.gatwickairport.com/parking");
    expect(r.kind).toBe("affiliate");
    expect(r.partnerName).toBe("Holiday Extras");
    expect(r.disclosureRequired).toBe(true);
    expect(r.url).toContain("awinmid=3496");
    expect(r.url).toContain("awinaffid=2932035");
    expect(r.url).toContain("clickref=parkmath-gatwick");
    expect(r.url).not.toContain("ued=");
  });
  it("lounge-membership stays official while inactive", () => {
    const r = resolveSlot("lounge-membership", "gatwick", "https://www.prioritypass.com");
    expect(r.kind).toBe("official");
    expect(r.url).toBe("https://www.prioritypass.com");
    expect(r.disclosureRequired).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify the resolveSlot block fails**

Run: `pnpm --filter parkmath test`
Expected: FAIL — `parking-prebook` still returns `kind:"official"` (old data/logic), so the affiliate assertions fail.

- [ ] **Step 3: Rewrite `partners.json`**

Replace the entire contents of `apps/parkmath/lib/partners.json` with:

```json
{
  "awin": { "publisherId": "2932035" },
  "partners": {
    "holiday-extras": { "name": "Holiday Extras", "awinmid": "3496", "active": true },
    "purple-parking": { "name": "Purple Parking", "awinmid": "12028", "active": false },
    "airparks": { "name": "Airparks", "awinmid": "3494", "active": false },
    "priority-pass": { "name": "Priority Pass", "awinmid": null, "active": false }
  },
  "slots": [
    { "id": "parking-prebook", "partnerIds": ["holiday-extras"], "active": true },
    { "id": "lounge-membership", "partnerIds": ["priority-pass"], "active": false }
  ]
}
```

- [ ] **Step 4: Rewrite `resolveSlot` to use the structured config**

Replace the entire contents of `apps/parkmath/lib/partners.ts` with (this keeps `buildAwinLink` from Task 1 and the existing `ResolvedSlot` shape):

```ts
import partnersJson from "./partners.json";

export type SlotId = "parking-prebook" | "lounge-membership";

export interface ResolvedSlot {
  kind: "affiliate" | "official";
  url: string;
  label: string;
  partnerName: string | null;
  disclosureRequired: boolean;
}

interface PartnerConfig {
  name: string;
  awinmid: string | null;
  active: boolean;
}

interface SlotConfig {
  id: string;
  partnerIds: string[];
  active: boolean;
}

const config = partnersJson as unknown as {
  awin: { publisherId: string };
  partners: Record<string, PartnerConfig>;
  slots: SlotConfig[];
};

/** Build a bare, fully-tracked AWIN deep link. `clickref` tags every click with its airport
 *  for per-airport reporting. `ued` (optional) is percent-encoded by URLSearchParams, so a
 *  destination carrying its own query string can never leak into the cread.php query. */
export function buildAwinLink(args: {
  awinmid: string;
  publisherId: string;
  airportSlug: string;
  ued?: string;
}): string {
  const params = new URLSearchParams({
    awinmid: args.awinmid,
    awinaffid: args.publisherId,
    clickref: `parkmath-${args.airportSlug}`,
  });
  if (args.ued) params.set("ued", args.ued);
  return `https://www.awin1.com/cread.php?${params.toString()}`;
}

/** Resolve a slot to either the first active AWIN partner (affiliate mode) or the official
 *  fallback link. Signature/shape unchanged so the page call sites need no edits. */
export function resolveSlot(slotId: SlotId, airportSlug: string, officialUrl: string): ResolvedSlot {
  const slot = config.slots.find((s) => s.id === slotId);
  if (slot?.active) {
    for (const partnerId of slot.partnerIds) {
      const partner = config.partners[partnerId];
      if (partner?.active && partner.awinmid) {
        return {
          kind: "affiliate",
          url: buildAwinLink({ awinmid: partner.awinmid, publisherId: config.awin.publisherId, airportSlug }),
          label: `Pre-book & compare prices with ${partner.name}`,
          partnerName: partner.name,
          disclosureRequired: true,
        };
      }
    }
  }
  return {
    kind: "official",
    url: officialUrl,
    label: "Check live prices on the official site",
    partnerName: null,
    disclosureRequired: false,
  };
}
```

- [ ] **Step 5: Run tests + typecheck to verify they pass**

Run: `pnpm --filter parkmath test && pnpm --filter parkmath typecheck`
Expected: PASS — `parking-prebook` → affiliate (HE), `lounge-membership` → official; typecheck clean.

- [ ] **Step 6: Commit**

```bash
git add apps/parkmath/lib/partners.json apps/parkmath/lib/partners.ts apps/parkmath/tests/partners.test.ts
git commit -m "feat(parkmath): activate Holiday Extras parking affiliate via structured partners config"
```

---

## Task 3: `AffiliateBlock` "Ad" chip + compliant disclosure

**Files:**
- Modify: `apps/parkmath/components/affiliate-block.tsx`
- Test (create): `apps/parkmath/tests/affiliate-block.test.tsx`

`AffiliateBlock` is a sync server component, so we render it to a static HTML string (`react-dom/server`) — no jsdom, no new deps. The component's import must become **relative** so config-less vitest can resolve it.

- [ ] **Step 1: Write the failing test**

Create `apps/parkmath/tests/affiliate-block.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AffiliateBlock } from "../components/affiliate-block";

describe("AffiliateBlock", () => {
  it("affiliate mode: Ad chip, sponsored AWIN link, ASA-compliant disclosure", () => {
    const html = renderToStaticMarkup(
      <AffiliateBlock slotId="parking-prebook" airportSlug="gatwick" officialUrl="https://www.gatwickairport.com/parking" />
    );
    expect(html).toContain(">Ad<");
    expect(html).toContain('rel="sponsored noopener noreferrer"');
    expect(html).toContain("https://www.awin1.com/cread.php?");
    expect(html).toContain("awinmid=3496");
    expect(html).toContain("clickref=parkmath-gatwick");
    expect(html).toContain("ParkMath earns a commission");
    expect(html).not.toContain("may earn");
  });

  it("official mode: no Ad chip, no sponsored rel, links to the official URL", () => {
    const html = renderToStaticMarkup(
      <AffiliateBlock slotId="lounge-membership" airportSlug="gatwick" officialUrl="https://www.prioritypass.com" />
    );
    expect(html).toContain('href="https://www.prioritypass.com"');
    expect(html).not.toContain(">Ad<");
    expect(html).not.toContain("sponsored");
    expect(html).not.toContain("earns a commission");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter parkmath test`
Expected: FAIL — the rendered HTML has no `>Ad<` chip and the old "may earn" disclosure (or the import can't resolve `@/lib/partners`).

- [ ] **Step 3: Rewrite the component**

Replace the entire contents of `apps/parkmath/components/affiliate-block.tsx` with (note the **relative** import and the inline `Ad` text so no whitespace splits the `>Ad<` token):

```tsx
import { resolveSlot, type SlotId } from "../lib/partners";

export function AffiliateBlock({ slotId, airportSlug, officialUrl }: { slotId: SlotId; airportSlug: string; officialUrl: string }) {
  const slot = resolveSlot(slotId, airportSlug, officialUrl);
  return (
    <div className="rounded-card border border-brand-accent/30 bg-blue-50 p-4">
      {slot.disclosureRequired ? (
        <span className="mb-2 inline-block rounded border border-ink-muted/40 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Ad</span>
      ) : null}
      <a
        href={slot.url}
        rel={slot.kind === "affiliate" ? "sponsored noopener noreferrer" : "noopener noreferrer"}
        target="_blank"
        className="block font-semibold text-brand-accent underline underline-offset-4"
      >
        {slot.label} ↗
      </a>
      {slot.disclosureRequired ? (
        <p className="mt-2 text-sm text-ink-muted">
          Affiliate link — if you book through {slot.partnerName}, ParkMath earns a commission, at no
          cost to you. We rank parking options by price only; this never affects which we show as cheapest.
        </p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Run test + typecheck to verify they pass**

Run: `pnpm --filter parkmath test && pnpm --filter parkmath typecheck`
Expected: PASS — both affiliate and official render assertions hold; typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add apps/parkmath/components/affiliate-block.tsx apps/parkmath/tests/affiliate-block.test.tsx
git commit -m "feat(parkmath): Ad-labelled, ASA-compliant AffiliateBlock disclosure"
```

---

## Task 4: AWIN MasterTag seam in `SiteAnalytics`

**Files:**
- Modify: `packages/ui/src/site-analytics.tsx`
- Modify: `packages/ui/tests/site-analytics.test.tsx`

Additive, env-gated, null-safe — ships **off** (`NEXT_PUBLIC_AWIN_PUBLISHER_ID` unset). Shared component, so it stays inert for RoamMath too.

- [ ] **Step 1: Update the tests (add AWIN cases, make the "nothing" case explicit)**

Replace the entire contents of `packages/ui/tests/site-analytics.test.tsx` with:

```tsx
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { SiteAnalytics } from "../src/site-analytics";

afterEach(() => { cleanup(); vi.unstubAllEnvs(); });

describe("SiteAnalytics", () => {
  it("renders nothing when no analytics env vars are set", () => {
    vi.stubEnv("NEXT_PUBLIC_CF_BEACON_TOKEN", "");
    vi.stubEnv("NEXT_PUBLIC_AWIN_PUBLISHER_ID", "");
    const { container } = render(<SiteAnalytics />);
    expect(container.innerHTML).toBe("");
  });
  it("renders the Cloudflare beacon script with the token when set", () => {
    vi.stubEnv("NEXT_PUBLIC_CF_BEACON_TOKEN", "abc123");
    vi.stubEnv("NEXT_PUBLIC_AWIN_PUBLISHER_ID", "");
    const { container } = render(<SiteAnalytics />);
    const s = container.querySelector('script[src*="cloudflareinsights"]');
    expect(s).not.toBeNull();
    expect(s!.getAttribute("data-cf-beacon")).toContain("abc123");
  });
  it("renders the AWIN MasterTag script when the publisher id is set", () => {
    vi.stubEnv("NEXT_PUBLIC_CF_BEACON_TOKEN", "");
    vi.stubEnv("NEXT_PUBLIC_AWIN_PUBLISHER_ID", "2932035");
    const { container } = render(<SiteAnalytics />);
    const s = container.querySelector('script[src*="dwin1.com"]');
    expect(s).not.toBeNull();
    expect(s!.getAttribute("src")).toBe("https://www.dwin1.com/2932035.js");
  });
});
```

- [ ] **Step 2: Run tests to verify the AWIN case fails**

Run: `pnpm --filter @mathfamily/ui test`
Expected: FAIL — the AWIN MasterTag script is not rendered yet.

- [ ] **Step 3: Add the AWIN seam to the component**

Replace the entire contents of `packages/ui/src/site-analytics.tsx` with:

```tsx
/** Privacy-first analytics seam. Renders the Cloudflare Web Analytics beacon when
 *  NEXT_PUBLIC_CF_BEACON_TOKEN is set, and the AWIN publisher MasterTag when
 *  NEXT_PUBLIC_AWIN_PUBLISHER_ID is set. Renders nothing for any var left unset (safe in
 *  dev/CI/preview). This is the one place analytics/tracking scripts live, so adding a new
 *  provider later (e.g. self-hosted Plausible) means adding one <script> here. */
export function SiteAnalytics() {
  const cfToken = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;
  const awinPublisherId = process.env.NEXT_PUBLIC_AWIN_PUBLISHER_ID;
  return (
    <>
      {cfToken ? (
        <script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon={JSON.stringify({ token: cfToken })}
        />
      ) : null}
      {awinPublisherId ? (
        <script defer src={`https://www.dwin1.com/${awinPublisherId}.js`} type="text/javascript" />
      ) : null}
    </>
  );
}
```

- [ ] **Step 4: Run tests + typecheck to verify they pass**

Run: `pnpm --filter @mathfamily/ui test && pnpm --filter @mathfamily/ui typecheck`
Expected: PASS — all three branches; typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/site-analytics.tsx packages/ui/tests/site-analytics.test.tsx
git commit -m "feat(ui): env-gated AWIN MasterTag seam in SiteAnalytics (ships off)"
```

---

## Task 5: Ops runbook + full gate + finish

**Files:**
- Create: `docs/affiliate-activation-ops.md`

- [ ] **Step 1: Write the ops runbook**

Create `docs/affiliate-activation-ops.md`:

```markdown
# Affiliate Activation — Ops Runbook

## Vercel environment variables (set in the ParkMath project)

| Variable | Value | Purpose | Required? |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://www.parkmath.co.uk` | Fixes `metadataBase` so OG/canonical URLs are absolute (apex 308-redirects to `www`, so use the `www` form). | Yes — fixes broken social previews |
| `NEXT_PUBLIC_AWIN_PUBLISHER_ID` | `2932035` | Renders the AWIN publisher MasterTag. **Optional** — not needed to earn commission; recovers ~4–5% of clicks lost to browser cookie-blocking. | No (leave unset to ship the seam off) |

After setting `NEXT_PUBLIC_SITE_URL`, **redeploy**, then verify a share preview / `<meta property="og:image">`
resolves to an absolute `https://www.parkmath.co.uk/...` URL (not `localhost`).

## Go-live verification

1. Open any `/airport-parking/<airport>` page → the affiliate card shows an **Ad** chip, a
   "Pre-book & compare prices with Holiday Extras" link, and the "earns a commission" disclosure.
2. The link target is `https://www.awin1.com/cread.php?awinmid=3496&awinaffid=2932035&clickref=parkmath-<airport>`.
3. Click it once; confirm the click appears in the AWIN dashboard against publisher 2932035.
4. The `/airport-lounges/<airport>` page is unchanged (Priority Pass official link, no Ad chip).

## Changing this later

- **Swap the featured merchant / reorder:** edit `apps/parkmath/lib/partners.json` — `slots[parking-prebook].partnerIds`.
- **Reactivate Purple Parking / Airparks:** flip their `active` to `true` and add their ids to a slot's `partnerIds`
  (they are the same parent company as Holiday Extras — only present them as honestly-labelled "also from the
  Holiday Extras group", never as independent competitors).
- **Per-airport / highest-commission routing:** add an optional `airportOverrides` map to a slot and extend
  `resolveSlot` to consult it before the default `partnerIds` order (e.g. `heathrow → heathrow-official`).
- **Turn the AWIN MasterTag on:** set `NEXT_PUBLIC_AWIN_PUBLISHER_ID=2932035` in Vercel and redeploy.
```

- [ ] **Step 2: Commit the runbook**

```bash
git add docs/affiliate-activation-ops.md
git commit -m "docs(affiliate): Vercel env + go-live/verify ops runbook"
```

- [ ] **Step 3: Run the full gate**

Run:
```bash
pnpm --filter parkmath test && pnpm --filter parkmath typecheck && \
pnpm --filter @mathfamily/ui test && pnpm --filter @mathfamily/ui typecheck
```
Expected: all PASS (ParkMath: content, parking-content, partners, affiliate-block; UI: full suite incl. site-analytics).

- [ ] **Step 4: Finish the branch**

Use the **superpowers:finishing-a-development-branch** skill to verify tests, then merge `feat/affiliate-activation` → `main` (or open a PR), per the user's choice.

---

## Self-Review

**1. Spec coverage**
- Single Holiday Extras featured CTA, siblings inactive in config → Task 2 (`partners.json`) ✓
- Bare `cread.php` + `clickref`, no `ued`, URLSearchParams encoding → Tasks 1 & 2 ✓
- `resolveSlot` unchanged signature/shape (no page edits) → Task 2 ✓
- "Ad" chip + "earns" (not "may earn") disclosure, `rel="sponsored"` kept → Task 3 ✓
- Env-gated AWIN MasterTag seam, shipped off → Task 4 ✓
- OG fix = `NEXT_PUBLIC_SITE_URL=https://www.parkmath.co.uk` (ops, no code) → Task 5 ✓
- Tests: `buildAwinLink` unit, `resolveSlot` affiliate+official, `AffiliateBlock` render, `SiteAnalytics` branches → Tasks 1–4 ✓
- Future direction (per-airport / highest-commission routing; reactivating siblings) → documented in Task 5 runbook ✓
- RoamMath untouched → no task modifies RoamMath files ✓

**2. Placeholder scan:** No TBD/TODO; every code step shows complete content; every test step shows the assertion and the exact command + expected result. ✓

**3. Type consistency:** `ResolvedSlot` (kind/url/label/partnerName/disclosureRequired) is identical to the current shape and used consistently. `buildAwinLink` args `{ awinmid, publisherId, airportSlug, ued? }` match between definition (Tasks 1, 2) and call site in `resolveSlot` (Task 2). `partners.json` keys (`awin.publisherId`, `partners[].awinmid/active`, `slots[].partnerIds/active`) match the `config` cast and reads in `resolveSlot`. ✓
