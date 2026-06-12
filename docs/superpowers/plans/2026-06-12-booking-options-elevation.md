# ParkMath Booking-Options Elevation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single Holiday Extras affiliate link on ParkMath parking pages with a two-route "Your booking options" module — official airport route + an elevated, ASA/CMA-compliant Holiday Extras route — and deep-link the HE click to its parking page.

**Architecture:** Thread an optional `landingUrl` from the partner config into the AWIN link's `ued` (existing, encoded). Add a `BookingOptions` server component that renders the official route always and the HE route when the affiliate is active, then swap it into the two parking page templates. No shared-package or RoamMath changes; the lounge `AffiliateBlock` is untouched.

**Tech Stack:** Next.js 15 (RSC), TypeScript, config-less vitest (**never** create a vitest/vite config on this `/Volumes/TB4` volume — it deadlocks), `react-dom/server` `renderToStaticMarkup` for the static-component test.

**Branch:** `feat/booking-options` (exists; spec committed at `d0a8a34`).

**Reference spec:** `docs/superpowers/specs/2026-06-12-booking-options-elevation-design.md`

---

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `apps/parkmath/lib/partners.json` | Add `landingUrl` to Holiday Extras | Modify (Task 1) |
| `apps/parkmath/lib/partners.ts` | Thread `landingUrl` → `ued` in `resolveSlot` | Modify (Task 1) |
| `apps/parkmath/tests/partners.test.ts` | Assert HE link now carries the encoded `ued` | Modify (Task 1) |
| `apps/parkmath/components/booking-options.tsx` | Two-route "Your booking options" component | Create (Task 2) |
| `apps/parkmath/tests/booking-options.test.tsx` | Static-markup render test | Create (Task 2) |
| `apps/parkmath/app/airport-parking/[airport]/page.tsx` | Swap `AffiliateBlock` → `BookingOptions` | Modify (Task 3) |
| `apps/parkmath/app/airport-parking/[airport]/[duration]/page.tsx` | Swap `AffiliateBlock` → `BookingOptions` | Modify (Task 3) |

`affiliate-block.tsx` stays (the lounge page still uses it). RoamMath is not touched.

---

## Task 1: Deep-link the HE click to its parking page (`landingUrl` → `ued`)

**Files:**
- Modify: `apps/parkmath/tests/partners.test.ts`
- Modify: `apps/parkmath/lib/partners.json`
- Modify: `apps/parkmath/lib/partners.ts`

- [ ] **Step 1: Update the resolveSlot test to expect the deep-link `ued`**

In `apps/parkmath/tests/partners.test.ts`, inside the `resolveSlot` "parking-prebook" test, replace the final assertion line:

```ts
    expect(r.url).not.toContain("ued=");
```

with:

```ts
    expect(r.url).toContain("ued=https%3A%2F%2Fwww.holidayextras.com%2Fairport-parking.html");
```

(The lounge test is unchanged — it stays `kind:"official"` with no `ued`.)

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter parkmath test`
Expected: FAIL — the current HE link has no `ued` param.

- [ ] **Step 3: Add `landingUrl` to Holiday Extras in `partners.json`**

In `apps/parkmath/lib/partners.json`, replace the `holiday-extras` line with:

```json
    "holiday-extras": { "name": "Holiday Extras", "awinmid": "3496", "active": true, "landingUrl": "https://www.holidayextras.com/airport-parking.html" },
```

- [ ] **Step 4: Thread `landingUrl` into `ued` in `partners.ts`**

In `apps/parkmath/lib/partners.ts`, add `landingUrl` to the `PartnerConfig` interface:

```ts
interface PartnerConfig {
  name: string;
  awinmid: string | null;
  active: boolean;
  landingUrl?: string;
}
```

and in `resolveSlot`, change the affiliate `url` line to pass it as `ued`:

```ts
          url: buildAwinLink({ awinmid: partner.awinmid, publisherId: config.awin.publisherId, airportSlug, ued: partner.landingUrl }),
```

(`buildAwinLink` already treats `ued` as optional and percent-encodes it; when `landingUrl` is absent the link is unchanged.)

- [ ] **Step 5: Run tests + typecheck to verify they pass**

Run: `pnpm --filter parkmath test && pnpm --filter parkmath typecheck`
Expected: PASS — HE link contains the encoded `ued`; lounge unchanged; typecheck clean.

- [ ] **Step 6: Commit**

```bash
git add apps/parkmath/lib/partners.json apps/parkmath/lib/partners.ts apps/parkmath/tests/partners.test.ts
git commit -m "feat(parkmath): deep-link Holiday Extras affiliate click to its parking page (ued)"
```

---

## Task 2: `BookingOptions` two-route component

**Files:**
- Create: `apps/parkmath/components/booking-options.tsx`
- Test (create): `apps/parkmath/tests/booking-options.test.tsx`

Depends on Task 1 (the HE link now carries `ued`). Static server component → `renderToStaticMarkup` (node env, no jsdom, no new deps). Import is **relative** so config-less vitest resolves it.

- [ ] **Step 1: Write the failing test**

Create `apps/parkmath/tests/booking-options.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BookingOptions } from "../components/booking-options";

const html = renderToStaticMarkup(
  <BookingOptions airportName="Gatwick" airportSlug="gatwick" officialUrl="https://www.gatwickairport.com/parking" />
);

describe("BookingOptions", () => {
  it("renders the official route as a non-sponsored equal-weight button", () => {
    expect(html).toContain("Book direct with the airport");
    expect(html).toContain("Go to airport site");
    expect(html).toContain('href="https://www.gatwickairport.com/parking"');
    expect(html).not.toContain('href="https://www.gatwickairport.com/parking" rel="sponsored');
  });

  it("renders the Holiday Extras route with Ad, benefits, compliant discount + deep link", () => {
    expect(html).toContain(">Ad<");
    expect(html).toContain("Free cancellation (cancel to arrival)");
    expect(html).toContain("up to 25% at Gatwick");
    expect(html).toContain("Discount applied automatically");
    expect(html).toContain("https://www.awin1.com/cread.php?");
    expect(html).toContain("awinmid=3496");
    expect(html).toContain("clickref=parkmath-gatwick");
    expect(html).toContain("ued=https%3A%2F%2Fwww.holidayextras.com%2Fairport-parking.html");
    expect(html).toContain("Book my parking");
    expect(html).toContain('rel="sponsored noopener noreferrer"');
  });

  it("keeps the ranking commission-blind and avoids non-compliant copy", () => {
    expect(html).toContain("never changes our ranking");
    expect(html).not.toContain(">Up to 25% off<");
    expect(html).not.toContain("may earn");
    expect(html).not.toContain("up to 75%");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter parkmath test`
Expected: FAIL — `Cannot find module '../components/booking-options'`.

- [ ] **Step 3: Create the component**

Create `apps/parkmath/components/booking-options.tsx`:

```tsx
import { resolveSlot, type SlotId } from "../lib/partners";

const PARKING_SLOT: SlotId = "parking-prebook";

export function BookingOptions({ airportName, airportSlug, officialUrl }: { airportName: string; airportSlug: string; officialUrl: string }) {
  const he = resolveSlot(PARKING_SLOT, airportSlug, officialUrl);
  const hasAffiliate = he.kind === "affiliate";
  return (
    <section aria-label="Your booking options" className="space-y-4 rounded-card border border-ink/10 bg-surface p-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-ink">Your booking options</h2>
        <p className="text-sm text-ink-muted">
          Our ranking above uses only the airport&apos;s own published prices — it isn&apos;t affected by commission.
        </p>
      </div>

      <div className="rounded-card border border-ink/10 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-ink">Book direct with the airport</h3>
          <span className="rounded border border-ink-muted/40 px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">Official site</span>
        </div>
        <p className="mt-1 text-sm text-ink-muted">{airportName} official car parks.</p>
        <a
          href={officialUrl}
          rel="noopener noreferrer"
          target="_blank"
          className="mt-3 inline-block rounded-card border border-brand-accent px-4 py-2 text-sm font-semibold text-brand-accent"
        >
          Go to airport site ▸
        </a>
      </div>

      {hasAffiliate ? (
        <div className="rounded-card border border-brand-accent/30 bg-blue-50 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-ink">Pre-book &amp; save with {he.partnerName}</h3>
            <span className="rounded border border-ink-muted/40 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Ad</span>
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink">
            <li>✓ Free cancellation (cancel to arrival)</li>
            <li>✓ No code needed</li>
            <li>✓ Best Price Guaranteed</li>
          </ul>
          <p className="mt-2 text-sm text-ink-muted">
            10% off most Holiday Extras car parks — up to 25% at Gatwick (Meet &amp; Greet North). Discount applied
            automatically, no code.{" "}
            <a href="https://www.holidayextras.com/airport-parking.html" rel="noopener noreferrer" target="_blank" className="underline underline-offset-4">
              Terms ↗
            </a>
          </p>
          <a
            href={he.url}
            rel="sponsored noopener noreferrer"
            target="_blank"
            className="mt-3 inline-block rounded-card bg-brand-accent px-4 py-2 text-sm font-semibold text-white"
          >
            Book my parking — free cancellation ↗
          </a>
        </div>
      ) : null}

      {hasAffiliate ? (
        <p className="text-xs text-ink-muted">
          We earn a commission only if you book the &ldquo;Ad&rdquo; option — it never changes our ranking or which park
          we show as cheapest.
        </p>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 4: Run test + typecheck to verify they pass**

Run: `pnpm --filter parkmath test && pnpm --filter parkmath typecheck`
Expected: PASS — both routes render; official anchor is not sponsored; HE route carries Ad + benefits + compliant discount + deep-linked `cread.php`; typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add apps/parkmath/components/booking-options.tsx apps/parkmath/tests/booking-options.test.tsx
git commit -m "feat(parkmath): BookingOptions two-route module (official + elevated Holiday Extras)"
```

---

## Task 3: Swap `BookingOptions` into the parking pages

**Files:**
- Modify: `apps/parkmath/app/airport-parking/[airport]/page.tsx:8,116`
- Modify: `apps/parkmath/app/airport-parking/[airport]/[duration]/page.tsx:8,107`

- [ ] **Step 1: Swap the hub page**

In `apps/parkmath/app/airport-parking/[airport]/page.tsx`, change the import (line 8):

```tsx
import { BookingOptions } from "@/components/booking-options";
```

and the usage (line 116):

```tsx
      <BookingOptions airportName={airport.name} airportSlug={airport.slug} officialUrl={record.sourceUrl} />
```

- [ ] **Step 2: Swap the duration page**

In `apps/parkmath/app/airport-parking/[airport]/[duration]/page.tsx`, change the import (line 8):

```tsx
import { BookingOptions } from "@/components/booking-options";
```

and the usage (line 107):

```tsx
      <BookingOptions airportName={airport.name} airportSlug={airport.slug} officialUrl={record.sourceUrl} />
```

- [ ] **Step 3: Verify the swap + typecheck**

Run:
```bash
grep -rn "AffiliateBlock" apps/parkmath/app/airport-parking/ ; pnpm --filter parkmath typecheck
```
Expected: **no** `AffiliateBlock` matches under `airport-parking/` (both swapped); typecheck clean. (The lounge page under `airport-lounges/` still imports `AffiliateBlock` — that's correct and untouched.)

- [ ] **Step 4: Commit**

```bash
git add "apps/parkmath/app/airport-parking/[airport]/page.tsx" "apps/parkmath/app/airport-parking/[airport]/[duration]/page.tsx"
git commit -m "feat(parkmath): render BookingOptions on parking hub + duration pages"
```

---

## Task 4: Full gate + finish

- [ ] **Step 1: Run the full gate**

Run:
```bash
pnpm --filter parkmath test && pnpm --filter parkmath typecheck && \
pnpm --filter @mathfamily/ui test && pnpm --filter @mathfamily/ui typecheck
```
Expected: all PASS (ParkMath: content, parking-content, partners, affiliate-block, booking-options; UI suite unchanged).

- [ ] **Step 2: Finish the branch**

Use the **superpowers:finishing-a-development-branch** skill to verify tests, then merge `feat/booking-options` → `main` (or open a PR), per the user's choice.

---

## Self-Review

**1. Spec coverage**
- Two-route block (official first + HE) → Task 2 ✓
- Official route: "Book direct", "Official site" tag, "Go to airport site", non-sponsored → Task 2 ✓
- HE route: Ad chip, free-cancellation/no-code/best-price chips, "10% … up to 25% at Gatwick" + Terms, "Book my parking — free cancellation" button, sponsored → Task 2 ✓
- Commission-blind intro + footer → Task 2 ✓
- HE deep-link via `ued` to the parking page → Task 1 ✓
- Placement unchanged on hub + duration pages; lounge untouched → Task 3 ✓
- Tests (`renderToStaticMarkup`, partners `ued`) → Tasks 1 & 2 ✓
- Text-only HE (logo later), no reviews chip, PP/Airparks inactive → reflected in component (no logo/reviews) and unchanged config ✓
- RoamMath untouched → no task touches it ✓

**2. Placeholder scan:** No TBD/TODO; full component + test code; exact commands + expected results. ✓

**3. Type consistency:** `BookingOptions({ airportName, airportSlug, officialUrl })` matches both call sites (Task 3). `resolveSlot` returns the existing `ResolvedSlot` (`kind`/`url`/`partnerName`); `he.kind === "affiliate"` gates Route ②; `he.url`/`he.partnerName` used as defined. `PartnerConfig.landingUrl?: string` (Task 1) is what `resolveSlot` reads and `buildAwinLink({ ued })` consumes. ✓
