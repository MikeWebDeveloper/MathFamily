# ParkMath Affiliate-Surface Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put an honest, Ad-labelled Holiday Extras booking card on the drop-off and lounge pages (currently £0 surfaces) via one reusable responsive component, and delete the now-dead `AffiliateBlock`.

**Architecture:** Add an HE `products` map + a `resolveHeProduct` resolver (reusing `buildAwinLink`, now with a `clickrefSuffix` for per-surface attribution). A new responsive `HolidayExtrasCard` (full card desktop / one-line mobile) renders an HE product CTA; place it on drop-off (parking + an extras line) and lounge. Parking keeps `BookingOptions`. ParkMath only; RoamMath untouched.

**Tech Stack:** Next.js 15 (RSC), TypeScript, config-less vitest (**never** create a vitest/vite config on this `/Volumes/TB4` volume — it deadlocks), `react-dom/server` `renderToStaticMarkup` for component tests.

**Branch:** `feat/affiliate-surface-expansion` (exists; spec committed at `3d714d7`).

**Reference spec:** `docs/superpowers/specs/2026-06-12-affiliate-surface-expansion-design.md`

---

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `apps/parkmath/lib/partners.json` | HE `products` map | Modify (Task 1) |
| `apps/parkmath/lib/partners.ts` | `buildAwinLink` `clickrefSuffix` + `resolveHeProduct` | Modify (Task 1) |
| `apps/parkmath/tests/partners.test.ts` | Tests for the above | Modify (Task 1) |
| `apps/parkmath/components/holiday-extras-card.tsx` | Responsive HE product card | Create (Task 2) |
| `apps/parkmath/tests/holiday-extras-card.test.tsx` | Render test | Create (Task 2) |
| `apps/parkmath/app/drop-off-charges/[airport]/page.tsx` | Render card on drop-off | Modify (Task 3) |
| `apps/parkmath/app/airport-lounges/[airport]/page.tsx` | Replace `AffiliateBlock` with card | Modify (Task 3) |
| `apps/parkmath/components/affiliate-block.tsx` + its test | Dead after lounge swap | Delete (Task 4) |

---

## Task 1: HE products config + `resolveHeProduct` + `clickrefSuffix`

**Files:** `apps/parkmath/tests/partners.test.ts`, `apps/parkmath/lib/partners.json`, `apps/parkmath/lib/partners.ts`

- [ ] **Step 1: Write the failing tests**

In `apps/parkmath/tests/partners.test.ts`, change the import line to:

```ts
import { buildAwinLink, resolveHeProduct, resolveSlot } from "../lib/partners";
```

Add this assertion inside the existing `describe("buildAwinLink", …)` block:

```ts
  it("appends a clickref suffix when given", () => {
    const url = buildAwinLink({ awinmid: "3496", publisherId: "2932035", airportSlug: "gatwick", clickrefSuffix: "dropoff" });
    expect(url).toContain("clickref=parkmath-gatwick-dropoff");
  });
```

Add a new top-level `describe` block:

```ts
describe("resolveHeProduct", () => {
  it("builds an HE lounge deep link with a surface clickref", () => {
    const r = resolveHeProduct("lounge", "gatwick", "lounge");
    expect(r).not.toBeNull();
    expect(r!.productLabel).toBe("lounge");
    expect(r!.url).toContain("awinmid=3496");
    expect(r!.url).toContain("clickref=parkmath-gatwick-lounge");
    expect(r!.url).toContain("ued=https%3A%2F%2Fwww.holidayextras.com%2Fairport-lounges.html");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter parkmath test`
Expected: FAIL — `resolveHeProduct` is not exported; `clickrefSuffix` not honoured.

- [ ] **Step 3: Add the `products` map to `partners.json`**

In `apps/parkmath/lib/partners.json`, replace the `holiday-extras` entry with:

```json
    "holiday-extras": {
      "name": "Holiday Extras", "awinmid": "3496", "active": true,
      "landingUrl": "https://www.holidayextras.com/airport-parking.html",
      "products": {
        "parking":   { "url": "https://www.holidayextras.com/airport-parking.html",  "label": "parking"  },
        "lounge":    { "url": "https://www.holidayextras.com/airport-lounges.html",   "label": "lounge"   },
        "hotels":    { "url": "https://www.holidayextras.com/airport-hotels.html",    "label": "hotel"    },
        "transfers": { "url": "https://www.holidayextras.com/airport-transfers.html", "label": "transfer" }
      }
    },
```

- [ ] **Step 4: Update `partners.ts`**

Replace the entire contents of `apps/parkmath/lib/partners.ts` with:

```ts
import partnersJson from "./partners.json";

export type SlotId = "parking-prebook" | "lounge-membership";
export type HeProduct = "parking" | "lounge" | "hotels" | "transfers";

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
  landingUrl?: string;
  products?: Record<string, { url: string; label: string }>;
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

/** Build a bare, fully-tracked AWIN deep link. `clickref` tags each click with its airport (plus an
 *  optional surface suffix for per-page/product attribution). `ued` (optional) is percent-encoded by
 *  URLSearchParams, so a destination carrying its own query string can never leak into the query. */
export function buildAwinLink(args: {
  awinmid: string;
  publisherId: string;
  airportSlug: string;
  ued?: string;
  clickrefSuffix?: string;
}): string {
  const params = new URLSearchParams({
    awinmid: args.awinmid,
    awinaffid: args.publisherId,
    clickref: `parkmath-${args.airportSlug}${args.clickrefSuffix ? `-${args.clickrefSuffix}` : ""}`,
  });
  if (args.ued) params.set("ued", args.ued);
  return `https://www.awin1.com/cread.php?${params.toString()}`;
}

/** Resolve a Holiday Extras product to a tracked deep link, or null when HE is inactive or the
 *  product has no configured URL. `clickrefSuffix` distinguishes the surface (e.g. "dropoff", "lounge",
 *  "dropoff-hotels"). */
export function resolveHeProduct(
  product: HeProduct,
  airportSlug: string,
  clickrefSuffix: string,
): { url: string; productLabel: string } | null {
  const partner = config.partners["holiday-extras"];
  const entry = partner?.products?.[product];
  if (!partner?.active || !partner.awinmid || !entry) return null;
  return {
    url: buildAwinLink({
      awinmid: partner.awinmid,
      publisherId: config.awin.publisherId,
      airportSlug,
      ued: entry.url,
      clickrefSuffix,
    }),
    productLabel: entry.label,
  };
}

/** Resolve a slot to either the first active AWIN partner (affiliate mode) or the official fallback
 *  link. Signature/shape unchanged so the page call sites need no edits. */
export function resolveSlot(slotId: SlotId, airportSlug: string, officialUrl: string): ResolvedSlot {
  const slot = config.slots.find((s) => s.id === slotId);
  if (slot?.active) {
    for (const partnerId of slot.partnerIds) {
      const partner = config.partners[partnerId];
      if (partner?.active && partner.awinmid) {
        return {
          kind: "affiliate",
          url: buildAwinLink({ awinmid: partner.awinmid, publisherId: config.awin.publisherId, airportSlug, ued: partner.landingUrl }),
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

- [ ] **Step 5: Run tests + typecheck**

Run: `pnpm --filter parkmath test && pnpm --filter parkmath typecheck`
Expected: PASS — `resolveHeProduct` lounge link correct; `clickrefSuffix` honoured; existing `buildAwinLink`/`resolveSlot`/`BookingOptions` tests still green; typecheck clean.

- [ ] **Step 6: Commit**

```bash
git add apps/parkmath/lib/partners.json apps/parkmath/lib/partners.ts apps/parkmath/tests/partners.test.ts
git commit -m "feat(parkmath): HE products map + resolveHeProduct + per-surface clickref"
```

---

## Task 2: `HolidayExtrasCard` component

**Files:** Create `apps/parkmath/components/holiday-extras-card.tsx`; Test (create) `apps/parkmath/tests/holiday-extras-card.test.tsx`

Depends on Task 1. Static server component → `renderToStaticMarkup`. RELATIVE import.

- [ ] **Step 1: Write the failing test**

Create `apps/parkmath/tests/holiday-extras-card.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HolidayExtrasCard } from "../components/holiday-extras-card";

const dropoff = renderToStaticMarkup(
  <HolidayExtrasCard product="parking" airportName="Gatwick" airportSlug="gatwick" surface="dropoff" extras={["hotels", "lounge", "transfers"]} />
);
const lounge = renderToStaticMarkup(
  <HolidayExtrasCard product="lounge" airportName="Gatwick" airportSlug="gatwick" surface="lounge" />
);

describe("HolidayExtrasCard", () => {
  it("drop-off parking card: Ad, sponsored deep link, extras, compliant copy", () => {
    expect(dropoff).toContain(">Ad<");
    expect(dropoff).toContain("Book parking");
    expect(dropoff).toContain("https://www.awin1.com/cread.php?");
    expect(dropoff).toContain("awinmid=3496");
    expect(dropoff).toContain("clickref=parkmath-gatwick-dropoff");
    expect(dropoff).toContain("ued=https%3A%2F%2Fwww.holidayextras.com%2Fairport-parking.html");
    expect(dropoff).toContain("Also from Holiday Extras");
    expect(dropoff).toContain("clickref=parkmath-gatwick-dropoff-hotels");
    expect(dropoff).toContain('rel="sponsored noopener noreferrer"');
    expect(dropoff).not.toContain(">Up to 25% off<");
    expect(dropoff).not.toContain("may earn");
  });

  it("lounge card: Ad, lounge deep link with lounge clickref", () => {
    expect(lounge).toContain(">Ad<");
    expect(lounge).toContain("Book lounge");
    expect(lounge).toContain("clickref=parkmath-gatwick-lounge");
    expect(lounge).toContain("ued=https%3A%2F%2Fwww.holidayextras.com%2Fairport-lounges.html");
    expect(lounge).not.toContain("may earn");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter parkmath test`
Expected: FAIL — `Cannot find module '../components/holiday-extras-card'`.

- [ ] **Step 3: Create the component**

Create `apps/parkmath/components/holiday-extras-card.tsx`:

```tsx
import { resolveHeProduct, type HeProduct } from "../lib/partners";

const TERMS_URL = "https://www.holidayextras.com/airport-parking.html";

function discountLine(product: HeProduct): string {
  if (product === "lounge") return "10% off airport lounges, applied automatically.";
  return "10% off most Holiday Extras car parks — up to 25% at Gatwick (Meet & Greet North). Applied automatically, no code.";
}

export function HolidayExtrasCard({ product, airportName, airportSlug, surface, extras }: {
  product: HeProduct;
  airportName: string;
  airportSlug: string;
  surface: string;
  extras?: HeProduct[];
}) {
  const primary = resolveHeProduct(product, airportSlug, surface);
  if (!primary) return null;
  const extraLinks = (extras ?? [])
    .map((p) => resolveHeProduct(p, airportSlug, `${surface}-${p}`))
    .filter((r): r is { url: string; productLabel: string } => r !== null);

  return (
    <section aria-label={`Pre-book ${primary.productLabel} with Holiday Extras`} className="rounded-card border border-brand-accent/30 bg-blue-50 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="rounded border border-ink-muted/40 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Ad</span>
        <span className="text-xs text-ink-muted">Holiday Extras</span>
      </div>

      <a
        href={primary.url}
        rel="sponsored noopener noreferrer"
        target="_blank"
        className="flex min-h-[44px] items-center justify-between gap-3 font-semibold text-brand-accent sm:hidden"
      >
        <span>Pre-book {airportName} {primary.productLabel} — 10% off, free cancellation</span>
        <span aria-hidden="true">↗</span>
      </a>

      <div className="hidden sm:block">
        <h3 className="font-semibold text-ink">Pre-book {airportName} {primary.productLabel}</h3>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink">
          <li>✓ Free cancellation</li>
          <li>✓ 10% off, applied automatically</li>
          <li>✓ Best Price Guaranteed</li>
        </ul>
        <p className="mt-2 text-sm text-ink-muted">
          {discountLine(product)}{" "}
          <a href={TERMS_URL} rel="noopener noreferrer" target="_blank" className="underline underline-offset-4">Terms ↗</a>
        </p>
        <a
          href={primary.url}
          rel="sponsored noopener noreferrer"
          target="_blank"
          className="mt-3 inline-block rounded-card bg-brand-accent px-4 py-2 text-sm font-semibold text-white"
        >
          Book {primary.productLabel} — free cancellation ↗
        </a>
      </div>

      {extraLinks.length > 0 ? (
        <p className="mt-3 text-xs text-ink-muted">
          Also from Holiday Extras:{" "}
          {extraLinks.map((r, i) => (
            <span key={r.productLabel}>
              {i > 0 ? " · " : ""}
              <a href={r.url} rel="sponsored noopener noreferrer" target="_blank" className="underline underline-offset-4">
                airport {r.productLabel}s
              </a>
            </span>
          ))}
        </p>
      ) : null}

      <p className="mt-2 text-xs text-ink-muted">
        Affiliate links (Ad) — if you book through Holiday Extras, ParkMath earns a commission, at no cost to you. It
        never affects which option we show as cheapest.
      </p>
    </section>
  );
}
```

- [ ] **Step 4: Run test + typecheck**

Run: `pnpm --filter parkmath test && pnpm --filter parkmath typecheck`
Expected: PASS — both cards render correctly; typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add apps/parkmath/components/holiday-extras-card.tsx apps/parkmath/tests/holiday-extras-card.test.tsx
git commit -m "feat(parkmath): responsive HolidayExtrasCard (Ad-labelled HE product CTA)"
```

---

## Task 3: Place the card on drop-off + lounge pages

**Files:** `apps/parkmath/app/drop-off-charges/[airport]/page.tsx`, `apps/parkmath/app/airport-lounges/[airport]/page.tsx`

- [ ] **Step 1: Drop-off page — add import + card**

In `apps/parkmath/app/drop-off-charges/[airport]/page.tsx`, add this import after the existing component import (the line importing `DropOffCalculator`):

```tsx
import { HolidayExtrasCard } from "@/components/holiday-extras-card";
```

Then, immediately **before** the FAQ section (the `<section>` whose `<h2>` reads "Frequently asked questions"), insert:

```tsx
      <HolidayExtrasCard product="parking" surface="dropoff" airportName={airport.name} airportSlug={airport.slug} extras={["hotels", "lounge", "transfers"]} />
```

- [ ] **Step 2: Lounge page — swap `AffiliateBlock` for the card**

In `apps/parkmath/app/airport-lounges/[airport]/page.tsx`, change the import (line 8) from `import { AffiliateBlock } from "@/components/affiliate-block";` to:

```tsx
import { HolidayExtrasCard } from "@/components/holiday-extras-card";
```

and replace the usage (line 106) `<AffiliateBlock slotId="lounge-membership" airportSlug={airport.slug} officialUrl={pp.sourceUrl} />` with:

```tsx
      <HolidayExtrasCard product="lounge" surface="lounge" airportName={airport.name} airportSlug={airport.slug} />
```

- [ ] **Step 3: Verify typecheck + tests**

Run: `pnpm --filter parkmath typecheck && pnpm --filter parkmath test`
Expected: PASS. (`pp` is still used by the lounge page's `SourcesBlock`/break-even, so no unused-var error.)

- [ ] **Step 4: Commit**

```bash
git add "apps/parkmath/app/drop-off-charges/[airport]/page.tsx" "apps/parkmath/app/airport-lounges/[airport]/page.tsx"
git commit -m "feat(parkmath): HolidayExtrasCard on drop-off (parking + extras) and lounge pages"
```

---

## Task 4: Delete the dead `AffiliateBlock`

**Files:** Delete `apps/parkmath/components/affiliate-block.tsx`, `apps/parkmath/tests/affiliate-block.test.tsx`

After Task 3 no ParkMath page imports `AffiliateBlock`.

- [ ] **Step 1: Confirm it's unused, then delete**

Run:
```bash
grep -rn "AffiliateBlock" apps/parkmath/app apps/parkmath/components | grep -v "affiliate-block.tsx"
```
Expected: **no matches** (nothing imports it). Then:
```bash
git rm apps/parkmath/components/affiliate-block.tsx apps/parkmath/tests/affiliate-block.test.tsx
```

- [ ] **Step 2: Verify nothing references it + tests pass**

Run:
```bash
grep -rn "AffiliateBlock" apps/parkmath ; pnpm --filter parkmath test && pnpm --filter parkmath typecheck
```
Expected: **no** `AffiliateBlock` matches anywhere under `apps/parkmath`; tests pass; typecheck clean. (RoamMath's separate `apps/roammath/components/affiliate-block.tsx` is untouched.)

- [ ] **Step 3: Commit**

```bash
git commit -m "chore(parkmath): remove dead AffiliateBlock (superseded by BookingOptions + HolidayExtrasCard)"
```

---

## Task 5: Full gate + finish

- [ ] **Step 1: Run the full gate**

Run:
```bash
pnpm --filter parkmath test && pnpm --filter parkmath typecheck && \
pnpm --filter @mathfamily/ui test && pnpm --filter @mathfamily/ui typecheck
```
Expected: all PASS (ParkMath: content, parking-content, partners, booking-options, holiday-extras-card; UI suite unchanged).

- [ ] **Step 2: Finish the branch**

Use the **superpowers:finishing-a-development-branch** skill to verify tests, then complete per the user's choice.

---

## Self-Review

**1. Spec coverage**
- HE `products` map → Task 1 ✓
- `resolveHeProduct` + `buildAwinLink` `clickrefSuffix` (per-surface attribution) → Task 1 ✓
- `HolidayExtrasCard` responsive (desktop card `hidden sm:block` / mobile line `sm:hidden`), Ad chip, product headline, benefit chips, product-specific discount line + Terms, sponsored button, extras line, disclosure footer → Task 2 ✓
- Drop-off placement (parking + `["hotels","lounge","transfers"]` extras, before FAQ) → Task 3 ✓
- Lounge swap (HE lounge replaces dead Priority-Pass block) → Task 3 ✓
- Delete dead `AffiliateBlock` + test; RoamMath untouched → Task 4 ✓
- Tests (`renderToStaticMarkup` card test, `resolveHeProduct`/`clickrefSuffix`) → Tasks 1 & 2 ✓
- Compliance: Ad on every card, no bare "up to 25% off", "earns" not "may earn", editorial primary (card placed after the answer / replaces only the CTA) → copy + placement ✓
- Out of scope (homepage, hotels-primary, per-airport official-parking affiliate, HE logo, RoamMath) → not implemented ✓

**2. Placeholder scan:** No TBD/TODO; full component + config + test code; exact commands + expected results. ✓

**3. Type consistency:** `HeProduct = "parking" | "lounge" | "hotels" | "transfers"` defined in Task 1, imported by the component (Task 2) and used in `extras` (`["hotels","lounge","transfers"]`, all valid keys). `resolveHeProduct(product, airportSlug, clickrefSuffix) → { url, productLabel } | null` is consistent between definition (Task 1) and both call sites in the component (Task 2). `PartnerConfig.products?: Record<string, { url; label }>` matches the JSON (Task 1). `buildAwinLink`'s new `clickrefSuffix?` is optional, so `resolveSlot` (no suffix) is unchanged. Card props `{ product, airportName, airportSlug, surface, extras? }` match both placements (Task 3). ✓
