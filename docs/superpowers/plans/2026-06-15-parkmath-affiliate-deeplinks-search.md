# ParkMath Affiliate Deep-Links + Search Handoff — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every ParkMath parking affiliate link airport-specific (and optionally date-prefilled), and add a reusable airport+dates search box that hands the search off to Holiday Extras pre-filled — deep-link only, mobile-first.

**Architecture:** All URL logic is added as pure, unit-tested functions in `apps/parkmath/lib/partners.ts` (extending the existing tested `buildAwinLink`). Two surfaces consume them: the existing `BookingOptions` card (gains date inputs + an airport-specific affiliate link) and a new `ParkingSearch` component placed on the home above the bento. Date-prefill is config-gated (`datePrefill` flag, default off) with a guaranteed airport-prefill fallback, flipped on after a one-off spike that captures Holiday Extras' live dated-search URL. Components render an SSR-correct affiliate **anchor** whose `href` is enhanced on the client as the user types/picks dates (no `window.open`), matching this repo's "SSR-correct, JS-enhances" pattern.

**Tech Stack:** Next.js (App Router) + React client components, TypeScript, Vitest (`renderToStaticMarkup`, no jsdom) for unit/component tests, Playwright for interactive e2e, pnpm workspace.

**Spec:** `docs/superpowers/specs/2026-06-15-parkmath-affiliate-deeplinks-search-design.md`

**Branch:** `feat/parkmath-affiliate-deeplinks-search` (already created; spec already committed).

---

## Conventions for this plan

- **Run all parkmath unit tests:** `pnpm --filter parkmath test`
- **Run one unit test file:** `pnpm --filter parkmath exec vitest run tests/<file>`
- **Typecheck:** `pnpm --filter parkmath exec tsc --noEmit`
- **Run e2e:** `pnpm --filter parkmath e2e`
- **Never** create a `vitest.config.*` / `vite.config.*` file (known esbuild `build()` deadlock on this `/Volumes/TB4` volume). Tests run config-less; import via **relative paths** (`../lib/partners`), never the `@/` alias (config-less Vitest can't resolve it).
- Money is in **pence** (integers) throughout, matching the existing dataset/components.

## Spec → task coverage map

| Spec section | Task(s) |
|---|---|
| §1 deep-link layer (config + builders + fallback ladder) | 1, 2 |
| §2 search component | 5, 6 |
| §3 Path A booking card (merged dates) | 4 |
| §3 home placement | 6 |
| §4 copy & compliance | 4, 5 |
| §5 robustness + spike + flag | 1, 2, 8 |
| §6 testing | every task (TDD) + 7 (e2e) |
| date validation | 3 |

> **Spec reconciliation (discovered during planning):** §3 proposes folding `DealsStrip` on the home. The home (`apps/parkmath/app/page.tsx`) does **not** currently render `DealsStrip` — it renders `AffiliateExtras`. So there is **nothing to remove**; Task 6 only *adds* `ParkingSearch` above the bento and leaves `AffiliateExtras` untouched.

## File structure

| File | Responsibility | Action |
|---|---|---|
| `apps/parkmath/lib/partners.json` | Add HE `airportParking` config (URL pattern, slug overrides, `datePrefill` flag, `dateUrlTemplate`) | Modify |
| `apps/parkmath/lib/partners.ts` | Pure URL/date helpers: `formatHeDate`, `composeParkingUed`, `buildParkingSearchUrl`, `validateSearchDates` + `HeAirportParkingConfig` type | Modify |
| `apps/parkmath/components/booking-options.tsx` | Airport-page card: airport-specific affiliate link + merged date inputs + compliant copy | Modify |
| `apps/parkmath/components/parking-search.tsx` | Home standalone search (airport + dates → affiliate handoff anchor) | Create |
| `apps/parkmath/app/page.tsx` | Render `ParkingSearch` above the bento | Modify |
| `apps/parkmath/tests/partners.test.ts` | Unit tests for the new pure functions | Modify |
| `apps/parkmath/tests/booking-options.test.tsx` | Updated card assertions (airport-specific ued, date inputs) | Modify |
| `apps/parkmath/tests/parking-search.test.tsx` | Static-render tests for the home search | Create |
| `apps/parkmath/e2e/parking-search.spec.ts` | Interactive href-enhancement on both surfaces | Create |

---

## Task 1: Config + pure `ued` composer (airport-prefill + gated date-prefill)

**Files:**
- Modify: `apps/parkmath/lib/partners.json`
- Modify: `apps/parkmath/lib/partners.ts`
- Test: `apps/parkmath/tests/partners.test.ts`

- [ ] **Step 1: Add the HE airport-parking config to `partners.json`**

In `apps/parkmath/lib/partners.json`, add an `airportParking` block to the `holiday-extras` partner (after its `products` block). Final `holiday-extras` entry:

```json
    "holiday-extras": {
      "name": "Holiday Extras", "awinmid": "3496", "active": true,
      "landingUrl": "https://www.holidayextras.com/airport-parking.html",
      "products": {
        "parking":   { "url": "https://www.holidayextras.com/airport-parking.html",  "label": "parking"  },
        "lounge":    { "url": "https://www.holidayextras.com/airport-lounges.html",   "label": "lounge"   },
        "hotels":    { "url": "https://www.holidayextras.com/airport-hotels.html",    "label": "hotel"    },
        "transfers": { "url": "https://www.holidayextras.com/airport-transfers.html", "label": "transfer" }
      },
      "airportParking": {
        "urlPattern": "https://www.holidayextras.com/{slug}-airport-parking.html",
        "slugOverrides": {},
        "datePrefill": false,
        "dateUrlTemplate": null
      }
    },
```

- [ ] **Step 2: Write the failing test** for `formatHeDate` + `composeParkingUed`

Append to `apps/parkmath/tests/partners.test.ts` (add the two new names to the existing import line at the top: `import { activeSlotPartnerName, buildAwinLink, composeParkingUed, formatHeDate, resolveHeProduct, resolveSlot } from "../lib/partners";`):

```ts
describe("formatHeDate", () => {
  it("converts an ISO date to HE's DD/MM/YY format", () => {
    expect(formatHeDate("2026-12-07")).toBe("07/12/26");
    expect(formatHeDate("2026-01-31")).toBe("31/01/26");
  });
});

describe("composeParkingUed", () => {
  const ap = {
    urlPattern: "https://www.holidayextras.com/{slug}-airport-parking.html",
    slugOverrides: { "london-city": "london-city-airport" },
    datePrefill: false as boolean,
    dateUrlTemplate: null as string | null,
  };

  it("returns the airport page (no dates) when datePrefill is off", () => {
    const r = composeParkingUed(ap, "gatwick", "2026-12-07", "2026-12-12");
    expect(r.datePrefilled).toBe(false);
    expect(r.ued).toBe("https://www.holidayextras.com/gatwick-airport-parking.html");
  });

  it("applies a slug override", () => {
    const r = composeParkingUed(ap, "london-city");
    expect(r.ued).toBe("https://www.holidayextras.com/london-city-airport-airport-parking.html");
  });

  it("uses the dated template when datePrefill is on and both dates are present", () => {
    const dated = { ...ap, datePrefill: true, dateUrlTemplate: "https://www.holidayextras.com/quote?dest={slug}&ArrivalDate={dropOff}&DepartDate={returnDate}" };
    const r = composeParkingUed(dated, "gatwick", "2026-12-07", "2026-12-12");
    expect(r.datePrefilled).toBe(true);
    expect(r.ued).toBe("https://www.holidayextras.com/quote?dest=gatwick&ArrivalDate=07/12/26&DepartDate=12/12/26");
  });

  it("falls back to the airport page when datePrefill is on but a date is missing", () => {
    const dated = { ...ap, datePrefill: true, dateUrlTemplate: "https://x/{slug}?a={dropOff}&b={returnDate}" };
    const r = composeParkingUed(dated, "gatwick", "2026-12-07", undefined);
    expect(r.datePrefilled).toBe(false);
    expect(r.ued).toBe("https://www.holidayextras.com/gatwick-airport-parking.html");
  });

  it("falls back to the generic landing url when no config is given", () => {
    const r = composeParkingUed(undefined, "gatwick", undefined, undefined, "https://www.holidayextras.com/airport-parking.html");
    expect(r.ued).toBe("https://www.holidayextras.com/airport-parking.html");
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm --filter parkmath exec vitest run tests/partners.test.ts`
Expected: FAIL — `composeParkingUed`/`formatHeDate` are not exported.

- [ ] **Step 4: Implement the helpers in `partners.ts`**

Add to `apps/parkmath/lib/partners.ts`. First extend `PartnerConfig` with the optional config and export its type (place the interface near the top, after the existing `interface PartnerConfig`):

```ts
export interface HeAirportParkingConfig {
  /** Airport-page URL with a `{slug}` placeholder, e.g. ".../{slug}-airport-parking.html". */
  urlPattern: string;
  /** Map our airport slug → HE's page slug, for airports whose HE URL differs. */
  slugOverrides: Record<string, string>;
  /** When false, dates are ignored and we deep-link to the airport page (reliable baseline). */
  datePrefill: boolean;
  /** Dated-search URL with `{slug}`/`{dropOff}`/`{returnDate}` placeholders, or null until confirmed. */
  dateUrlTemplate: string | null;
}
```

Add `airportParking?: HeAirportParkingConfig;` to the existing `interface PartnerConfig`.

Then append these pure functions at the end of the file:

```ts
/** ISO `YYYY-MM-DD` → Holiday Extras' `DD/MM/YY`. */
export function formatHeDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y.slice(2)}`;
}

/** Resolve the `ued` destination for a parking search, applying the fallback ladder:
 *  dated template (if enabled + both dates) → airport page → generic landing. Pure: takes config
 *  explicitly so the dated path is testable without flipping the live `datePrefill` flag. */
export function composeParkingUed(
  ap: HeAirportParkingConfig | undefined,
  airportSlug: string,
  dropOff?: string,
  returnDate?: string,
  fallbackLandingUrl?: string,
): { ued: string; datePrefilled: boolean } {
  if (!ap) {
    return { ued: fallbackLandingUrl ?? "https://www.holidayextras.com/airport-parking.html", datePrefilled: false };
  }
  const slug = ap.slugOverrides[airportSlug] ?? airportSlug;
  if (ap.datePrefill && ap.dateUrlTemplate && dropOff && returnDate) {
    const ued = ap.dateUrlTemplate
      .replace(/\{slug\}/g, slug)
      .replace(/\{dropOff\}/g, formatHeDate(dropOff))
      .replace(/\{returnDate\}/g, formatHeDate(returnDate));
    return { ued, datePrefilled: true };
  }
  return { ued: ap.urlPattern.replace(/\{slug\}/g, slug), datePrefilled: false };
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter parkmath exec vitest run tests/partners.test.ts`
Expected: PASS (all new cases green; existing cases still green).

- [ ] **Step 6: Commit**

```bash
git add apps/parkmath/lib/partners.json apps/parkmath/lib/partners.ts apps/parkmath/tests/partners.test.ts
git commit -m "feat(parkmath): config + pure ued composer for airport/date parking deep links"
```

---

## Task 2: `buildParkingSearchUrl` — tracked, airport-routed search link

**Files:**
- Modify: `apps/parkmath/lib/partners.ts`
- Test: `apps/parkmath/tests/partners.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `apps/parkmath/tests/partners.test.ts` (add `buildParkingSearchUrl` to the import line):

```ts
describe("buildParkingSearchUrl", () => {
  it("builds a tracked link to the airport-specific HE page with a -search clickref", () => {
    const r = buildParkingSearchUrl({ airportSlug: "gatwick" });
    expect(r).not.toBeNull();
    expect(r!.partnerName).toBe("Holiday Extras");
    expect(r!.datePrefilled).toBe(false);
    expect(r!.url).toContain("https://www.awin1.com/cread.php?");
    expect(r!.url).toContain("awinmid=3496");
    expect(r!.url).toContain("awinaffid=2932035");
    expect(r!.url).toContain("clickref=parkmath-gatwick-search");
    // ued is the airport-specific page, percent-encoded
    expect(r!.url).toContain("ued=https%3A%2F%2Fwww.holidayextras.com%2Fgatwick-airport-parking.html");
  });

  it("stays on the airport page (no dates) while datePrefill is off, even if dates are passed", () => {
    const r = buildParkingSearchUrl({ airportSlug: "manchester", dropOff: "2026-12-07", returnDate: "2026-12-12" });
    expect(r!.datePrefilled).toBe(false);
    expect(r!.url).toContain("ued=https%3A%2F%2Fwww.holidayextras.com%2Fmanchester-airport-parking.html");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter parkmath exec vitest run tests/partners.test.ts`
Expected: FAIL — `buildParkingSearchUrl` is not exported.

- [ ] **Step 3: Implement `buildParkingSearchUrl` in `partners.ts`**

Append at the end of `apps/parkmath/lib/partners.ts`:

```ts
/** Build a tracked AWIN deep link for a parking search: resolves the active parking partner
 *  (single best HE-group brand for the airport — currently Holiday Extras), composes the `ued`
 *  via the fallback ladder, and tags the click with a `-search` surface suffix. Returns null only
 *  if the parking slot is inactive or has no active partner. */
export function buildParkingSearchUrl(args: {
  airportSlug: string;
  dropOff?: string;
  returnDate?: string;
}): { url: string; partnerName: string; datePrefilled: boolean } | null {
  const slot = config.slots.find((s) => s.id === "parking-prebook");
  if (!slot?.active) return null;
  for (const partnerId of slot.partnerIds) {
    const partner = config.partners[partnerId];
    if (partner?.active && partner.awinmid) {
      const { ued, datePrefilled } = composeParkingUed(
        partner.airportParking,
        args.airportSlug,
        args.dropOff,
        args.returnDate,
        partner.landingUrl,
      );
      return {
        url: buildAwinLink({
          awinmid: partner.awinmid,
          publisherId: config.awin.publisherId,
          airportSlug: args.airportSlug,
          ued,
          clickrefSuffix: "search",
        }),
        partnerName: partner.name,
        datePrefilled,
      };
    }
  }
  return null;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter parkmath exec vitest run tests/partners.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/parkmath/lib/partners.ts apps/parkmath/tests/partners.test.ts
git commit -m "feat(parkmath): buildParkingSearchUrl tracked airport-routed deep link"
```

---

## Task 3: `validateSearchDates` — pure date validation

**Files:**
- Modify: `apps/parkmath/lib/partners.ts`
- Test: `apps/parkmath/tests/partners.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `apps/parkmath/tests/partners.test.ts` (add `validateSearchDates` to the import line):

```ts
describe("validateSearchDates", () => {
  const today = "2026-06-15";
  it("returns null for a valid future range", () => {
    expect(validateSearchDates("2026-12-07", "2026-12-12", today)).toBeNull();
  });
  it("requires both dates", () => {
    expect(validateSearchDates("", "2026-12-12", today)).toBe("Pick both dates");
    expect(validateSearchDates("2026-12-07", "", today)).toBe("Pick both dates");
  });
  it("rejects a drop-off in the past", () => {
    expect(validateSearchDates("2026-06-14", "2026-12-12", today)).toBe("Drop-off can't be in the past");
  });
  it("rejects a return on or before drop-off", () => {
    expect(validateSearchDates("2026-12-12", "2026-12-07", today)).toBe("Return must be after drop-off");
    expect(validateSearchDates("2026-12-12", "2026-12-12", today)).toBe("Return must be after drop-off");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter parkmath exec vitest run tests/partners.test.ts`
Expected: FAIL — `validateSearchDates` is not exported.

- [ ] **Step 3: Implement `validateSearchDates` in `partners.ts`**

Append at the end of `apps/parkmath/lib/partners.ts` (ISO `YYYY-MM-DD` strings compare correctly with `<`):

```ts
/** Validate a search date range against today (all ISO `YYYY-MM-DD`). Returns an error message
 *  or null when valid. Pure — the caller passes `todayIso` so it stays deterministic/testable. */
export function validateSearchDates(dropOff: string, returnDate: string, todayIso: string): string | null {
  if (!dropOff || !returnDate) return "Pick both dates";
  if (dropOff < todayIso) return "Drop-off can't be in the past";
  if (returnDate <= dropOff) return "Return must be after drop-off";
  return null;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter parkmath exec vitest run tests/partners.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/parkmath/lib/partners.ts apps/parkmath/tests/partners.test.ts
git commit -m "feat(parkmath): validateSearchDates pure helper"
```

---

## Task 4: Upgrade `BookingOptions` — airport-specific link + merged date inputs

**Files:**
- Modify: `apps/parkmath/components/booking-options.tsx`
- Test: `apps/parkmath/tests/booking-options.test.tsx`

The card keeps all current compliant copy and the official-site block; it switches the affiliate `href` to the airport-specific `buildParkingSearchUrl`, and adds two native date inputs whose values enhance that `href` on the client.

- [ ] **Step 1: Update the failing tests in `booking-options.test.tsx`**

Replace the body of the second `it(...)` block (the "renders the Holiday Extras route…" test) and add two new assertions. The key change: the `ued` is now the **airport-specific** page, and the clickref carries the `-search` suffix. Replace lines in `apps/parkmath/tests/booking-options.test.tsx`:

```ts
  it("renders the Holiday Extras route with Ad, benefits, compliant discount + airport-specific deep link", () => {
    expect(html).toContain(">Ad<");
    expect(html).toContain("Free cancellation (cancel to arrival)");
    expect(html).toContain("up to 25% at Gatwick");
    expect(html).toContain("Discount applied automatically");
    expect(html).toContain("https://www.awin1.com/cread.php?");
    expect(html).toContain("awinmid=3496");
    expect(html).toContain("clickref=parkmath-gatwick-search");
    // Airport-specific page (not the old generic /airport-parking.html)
    expect(html).toContain("ued=https%3A%2F%2Fwww.holidayextras.com%2Fgatwick-airport-parking.html");
    expect(html).not.toContain("ued=https%3A%2F%2Fwww.holidayextras.com%2Fairport-parking.html");
    expect(html).toContain("Book my parking");
    expect(html).toContain('rel="sponsored noopener noreferrer"');
  });

  it("renders drop-off and return date inputs inside the affiliate card", () => {
    expect(html).toContain('type="date"');
    expect(html).toContain("Drop-off");
    expect(html).toContain("Return");
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter parkmath exec vitest run tests/booking-options.test.tsx`
Expected: FAIL — old generic `ued`, no `-search` clickref, no date inputs yet.

- [ ] **Step 3: Rewrite `booking-options.tsx`**

Replace the entire contents of `apps/parkmath/components/booking-options.tsx` with:

```tsx
"use client";

import { useState } from "react";
import { buildParkingSearchUrl } from "../lib/partners";

export function BookingOptions({
  airportName,
  airportSlug,
  officialUrl,
  price,
  days,
}: {
  airportName: string;
  airportSlug: string;
  officialUrl: string;
  /** Optional: cheapest pre-book price in pence, shown in the affiliate CTA. */
  price?: number;
  /** Optional: duration in days, shown beside the price figure. */
  days?: number;
}) {
  const [dropOff, setDropOff] = useState("");
  const [returnDate, setReturnDate] = useState("");

  // Airport-specific affiliate link; dates enhance the href on the client when datePrefill is on,
  // otherwise it stays on the airport page (reliable baseline). Falls back to the official link only
  // if the parking slot is somehow inactive.
  const link = buildParkingSearchUrl({
    airportSlug,
    dropOff: dropOff || undefined,
    returnDate: returnDate || undefined,
  });
  const hasAffiliate = link !== null;
  const affiliateHref = link?.url ?? officialUrl;
  const partnerName = link?.partnerName ?? "Holiday Extras";

  const priceStr =
    price !== undefined && days !== undefined
      ? `from £${(price / 100).toFixed(2)} for ${days} day${days === 1 ? "" : "s"}`
      : price !== undefined
        ? `from £${(price / 100).toFixed(2)}`
        : null;

  const dateField = "min-h-11 w-full rounded-card border border-ink/15 bg-card px-3 text-sm text-ink";

  return (
    <section aria-label="Your booking options" className="space-y-4 rounded-card border border-ink/10 bg-surface p-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-ink">Your booking options</h2>
        <p className="text-sm text-ink-muted">
          Our ranking above uses only the airport&apos;s own published prices — it isn&apos;t affected by commission.
        </p>
      </div>

      {hasAffiliate ? (
        <>
          <div className="rounded-card border border-brand-accent/30 bg-blue-50 dark:bg-brand-accent/[0.08] dark:border-brand-accent/20 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-ink">Pre-book &amp; save with {partnerName}</h3>
              <span className="rounded border border-ink-muted/40 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Ad</span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="block text-xs font-medium text-ink-muted">
                Drop-off
                <input
                  type="date"
                  value={dropOff}
                  onChange={(e) => setDropOff(e.target.value)}
                  className={`mt-1 ${dateField}`}
                />
              </label>
              <label className="block text-xs font-medium text-ink-muted">
                Return
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className={`mt-1 ${dateField}`}
                />
              </label>
            </div>

            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink">
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
            <p className="mt-2 text-xs text-ink-muted">
              We earn a commission only if you book the &ldquo;Ad&rdquo; option — it never changes our ranking or which park
              we show as cheapest.
            </p>
            <a
              href={affiliateHref}
              rel="sponsored noopener noreferrer"
              target="_blank"
              className="mt-3 inline-block min-h-11 rounded-card bg-brand-accent px-4 py-2 text-sm font-semibold text-white"
            >
              Book my parking{priceStr ? ` — ${priceStr}` : ""} — free cancellation ↗
            </a>
          </div>

          <div className="rounded-card border border-ink/10 bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-ink">Book direct with the airport</h3>
              <span className="rounded border border-ink-muted/40 px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">Official site</span>
            </div>
            <p className="mt-1 text-sm text-ink-muted">{airportName} official car parks.</p>
            <a
              href={officialUrl}
              rel="noopener noreferrer"
              target="_blank"
              className="mt-3 inline-block min-h-11 rounded-card border border-brand-accent px-4 py-2 text-sm font-semibold text-brand-accent"
            >
              Go to airport site ▸
            </a>
          </div>
        </>
      ) : (
        <div className="rounded-card border border-ink/10 bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-ink">Book direct with the airport</h3>
            <span className="rounded border border-ink-muted/40 px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">Official site</span>
          </div>
          <p className="mt-1 text-sm text-ink-muted">{airportName} official car parks.</p>
          <a
            href={officialUrl}
            rel="noopener noreferrer"
            target="_blank"
            className="mt-3 inline-block min-h-11 rounded-card border border-brand-accent px-4 py-2 text-sm font-semibold text-brand-accent"
          >
            Go to airport site ▸
          </a>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter parkmath exec vitest run tests/booking-options.test.tsx`
Expected: PASS (all blocks, including the unchanged ordering/price tests).

- [ ] **Step 5: Commit**

```bash
git add apps/parkmath/components/booking-options.tsx apps/parkmath/tests/booking-options.test.tsx
git commit -m "feat(parkmath): airport-specific affiliate link + merged date inputs in BookingOptions"
```

---

## Task 5: Create the `ParkingSearch` home component

**Files:**
- Create: `apps/parkmath/components/parking-search.tsx`
- Test: `apps/parkmath/tests/parking-search.test.tsx`

SSR-correct: with no airport matched, the CTA is an internal anchor to `/airport-parking` (works with JS off, crawlable). On the client, typing a known airport name/IATA turns it into the tracked affiliate anchor; dates enhance it.

- [ ] **Step 1: Write the failing test**

Create `apps/parkmath/tests/parking-search.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ParkingSearch } from "../components/parking-search";

const airports = [
  { slug: "gatwick", name: "Gatwick", iata: "LGW" },
  { slug: "manchester", name: "Manchester", iata: "MAN" },
];

const html = renderToStaticMarkup(<ParkingSearch airports={airports} />);

describe("ParkingSearch", () => {
  it("renders the search heading and a labelled airport input", () => {
    expect(html).toContain("Find airport parking");
    expect(html).toContain('list="pm-airports"');
  });

  it("lists each airport as a datalist option (typeahead source)", () => {
    expect(html).toContain('value="Gatwick"');
    expect(html).toContain('value="Manchester"');
  });

  it("renders two native date inputs", () => {
    expect(html.match(/type="date"/g)?.length).toBe(2);
  });

  it("defaults the CTA to the internal parking hub when no airport is chosen (JS-off safe)", () => {
    expect(html).toContain('href="/airport-parking"');
    // No affiliate link is emitted at rest — the home never fires a generic affiliate click.
    expect(html).not.toContain("awin1.com/cread.php");
  });

  it("shows an Ad/commission disclosure", () => {
    expect(html).toContain("Ad");
    expect(html).toContain("commission");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter parkmath exec vitest run tests/parking-search.test.tsx`
Expected: FAIL — module `../components/parking-search` does not exist.

- [ ] **Step 3: Implement `parking-search.tsx`**

Create `apps/parkmath/components/parking-search.tsx`:

```tsx
"use client";

import { useMemo, useState } from "react";
import { buildParkingSearchUrl } from "../lib/partners";

export interface SearchAirport {
  slug: string;
  name: string;
  iata: string;
}

/** Home "find parking" search: airport (typeahead via datalist) + drop-off + return.
 *  At rest (no airport matched) the CTA points to the internal /airport-parking hub, so the page
 *  is crawlable and JS-off safe and the home never emits a generic affiliate click. Once a known
 *  airport is typed, the CTA becomes a tracked, airport-specific affiliate handoff (dates enhance
 *  the href when datePrefill is enabled). */
export function ParkingSearch({ airports }: { airports: SearchAirport[] }) {
  const [airportText, setAirportText] = useState("");
  const [dropOff, setDropOff] = useState("");
  const [returnDate, setReturnDate] = useState("");

  const index = useMemo(() => {
    const m = new Map<string, SearchAirport>();
    for (const a of airports) {
      m.set(a.name.toLowerCase(), a);
      m.set(a.iata.toLowerCase(), a);
    }
    return m;
  }, [airports]);

  const matched = index.get(airportText.trim().toLowerCase());
  const link = matched
    ? buildParkingSearchUrl({ airportSlug: matched.slug, dropOff: dropOff || undefined, returnDate: returnDate || undefined })
    : null;
  const isAffiliate = link !== null;
  const href = link?.url ?? "/airport-parking";

  const field = "min-h-11 w-full rounded-card border border-ink/15 bg-card px-3 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/40";

  return (
    <section aria-label="Find airport parking" className="rounded-card border border-ink/10 bg-surface p-4 space-y-3">
      <h2 className="text-lg font-semibold text-ink">Find airport parking</h2>

      <form
        className="grid grid-cols-1 gap-3 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-end"
        onSubmit={(e) => e.preventDefault()}
      >
        <label className="block text-xs font-medium text-ink-muted">
          Airport
          <input
            list="pm-airports"
            value={airportText}
            onChange={(e) => setAirportText(e.target.value)}
            placeholder="Start typing — e.g. Gatwick or LGW"
            className={`mt-1 ${field}`}
            aria-label="Airport"
          />
          <datalist id="pm-airports">
            {airports.map((a) => (
              <option key={a.slug} value={a.name}>{a.iata}</option>
            ))}
          </datalist>
        </label>

        <label className="block text-xs font-medium text-ink-muted">
          Drop-off
          <input type="date" value={dropOff} onChange={(e) => setDropOff(e.target.value)} className={`mt-1 ${field}`} aria-label="Drop-off date" />
        </label>

        <label className="block text-xs font-medium text-ink-muted">
          Return
          <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className={`mt-1 ${field}`} aria-label="Return date" />
        </label>

        <a
          href={href}
          {...(isAffiliate ? { rel: "sponsored noopener noreferrer", target: "_blank" } : {})}
          className="inline-flex min-h-11 items-center justify-center rounded-card bg-brand-accent px-4 text-sm font-semibold text-white"
        >
          Search parking →
        </a>
      </form>

      <p className="text-xs text-ink-muted">
        <span className="mr-1 rounded border border-ink-muted/40 px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide">Ad</span>
        Opens our travel partner (Holiday Extras) with your search ready — we may earn commission, at no extra cost to you.
      </p>
    </section>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter parkmath exec vitest run tests/parking-search.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/parkmath/components/parking-search.tsx apps/parkmath/tests/parking-search.test.tsx
git commit -m "feat(parkmath): ParkingSearch home component (airport+dates affiliate handoff)"
```

---

## Task 6: Wire `ParkingSearch` into the home above the bento

**Files:**
- Modify: `apps/parkmath/app/page.tsx`

- [ ] **Step 1: Add the import**

In `apps/parkmath/app/page.tsx`, add after the existing `HomeAnswerHero` import (line ~7):

```tsx
import { ParkingSearch } from "@/components/parking-search";
```

- [ ] **Step 2: Render the search between the hero and the bento**

In `apps/parkmath/app/page.tsx`, immediately **after** the closing `</section>` of the HERO block (the section that ends right before `{/* ── 2. BENTO ── */}`) and **before** the bento `<section ...>`, insert:

```tsx
      {/* ── 1b. FIND PARKING — affiliate search handoff (airport + dates) ── */}
      <ParkingSearch airports={airports.map((a) => ({ slug: a.slug, name: a.name, iata: a.iata }))} />
```

- [ ] **Step 3: Typecheck + run the full parkmath unit suite**

Run: `pnpm --filter parkmath exec tsc --noEmit`
Expected: PASS (no type errors).

Run: `pnpm --filter parkmath test`
Expected: PASS (all unit/component tests green).

- [ ] **Step 4: Verify in the browser (preview tools)**

Start the dev server and confirm the search renders above the bento on the home, and the booking card on an airport page shows the date inputs.
- Home: load `/`, confirm the "Find airport parking" band sits between the hero and the bento; confirm no console errors.
- Airport page: load `/airport-parking/manchester`, confirm two date inputs appear in the "Pre-book & save" card and the "Book my parking" link points at `awin1.com/cread.php` with `manchester-airport-parking.html` encoded in `ued`.

- [ ] **Step 5: Commit**

```bash
git add apps/parkmath/app/page.tsx
git commit -m "feat(parkmath): place ParkingSearch on the home above the bento"
```

---

## Task 7: Interactive e2e — href enhancement on both surfaces

**Files:**
- Create: `apps/parkmath/e2e/parking-search.spec.ts`

These assert the **anchor href** changes as the user types/picks (no popup handling needed), matching the repo's existing e2e style (`parking-reactive.spec.ts`).

- [ ] **Step 1: Write the e2e test**

Create `apps/parkmath/e2e/parking-search.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("home parking search turns into a tracked affiliate link once an airport is typed", async ({ page }) => {
  await page.goto("/");

  const search = page.getByRole("region", { name: "Find airport parking" });
  await expect(search).toBeVisible();

  const cta = search.getByRole("link", { name: /Search parking/ });
  // At rest it points at the internal hub (no generic affiliate click from the home).
  await expect(cta).toHaveAttribute("href", "/airport-parking");

  await search.getByLabel("Airport").fill("Gatwick");
  // Now it's the tracked, airport-specific affiliate handoff.
  await expect(cta).toHaveAttribute("href", /awin1\.com\/cread\.php/);
  await expect(cta).toHaveAttribute("href", /clickref=parkmath-gatwick-search/);
  await expect(cta).toHaveAttribute("href", /gatwick-airport-parking\.html/);
  await expect(cta).toHaveAttribute("rel", /sponsored/);
});

test("airport-page booking card deep-links to the airport-specific HE page", async ({ page }) => {
  await page.goto("/airport-parking/manchester");

  const result = page.getByTestId("parking-result");
  const book = result.getByRole("link", { name: /Book my parking/ });
  await expect(book).toBeVisible();
  await expect(book).toHaveAttribute("href", /awin1\.com\/cread\.php/);
  await expect(book).toHaveAttribute("href", /manchester-airport-parking\.html/);
  await expect(book).toHaveAttribute("href", /clickref=parkmath-manchester-search/);

  // Date inputs are present and editable (the merged search).
  await expect(result.getByLabel("Drop-off")).toBeVisible();
  await expect(result.getByLabel("Return")).toBeVisible();
});
```

> Note: `getByLabel("Drop-off")` / `getByLabel("Return")` resolve because the `<input>`s are nested inside their `<label>` text in both components. If the runner reports a strict-mode multiple-match on the home page, scope with the `search` region as shown for the home test.

- [ ] **Step 2: Run the e2e test**

Run: `pnpm --filter parkmath e2e -- parking-search.spec.ts`
Expected: PASS (Playwright builds/serves the app per `playwright.config.ts`).

- [ ] **Step 3: Commit**

```bash
git add apps/parkmath/e2e/parking-search.spec.ts
git commit -m "test(parkmath): e2e for parking search href enhancement (home + booking card)"
```

---

## Task 8: Date-prefill spike + flip the flag (MANUAL, gated)

> This is a **manual investigation** step — it cannot be TDD'd because it depends on Holiday Extras' live site. The dated-URL *logic* is already fully tested (Task 1's `composeParkingUed` dated cases). This task only fills in the real template + flips the flag.

- [ ] **Step 1: Capture the live HE dated-search URL**

On a normal browser, open Holiday Extras airport parking for 2–3 airports (e.g. Gatwick, Manchester, Heathrow), enter dates, run the search, and capture from the browser **Network** tab the exact request URL that returns priced results. Record:
- the airport identifier HE uses (page slug vs a numeric `DestNum`),
- the date parameter names + format (confirm `ArrivalDate`/`DepartDate`, `DD/MM/YY`),
- any required fixed params.
- For each airport whose HE page slug differs from our slug, note it for `slugOverrides`.

- [ ] **Step 2: Encode the template + overrides in `partners.json`**

Set, on `holiday-extras.airportParking`:
- `dateUrlTemplate` to the captured URL with `{slug}`, `{dropOff}`, `{returnDate}` placeholders (raw — `buildAwinLink` percent-encodes the whole `ued`).
- `slugOverrides` for any mismatched airports.
- `datePrefill` to `true`.

- [ ] **Step 3: Add a confirming unit test**

If the live format differs from the Task 1 example, update the dated-case expectations in `tests/partners.test.ts` to match the real template, then add an integration assertion:

```ts
it("buildParkingSearchUrl date-prefills once the flag is on (live template)", () => {
  const r = buildParkingSearchUrl({ airportSlug: "gatwick", dropOff: "2026-12-07", returnDate: "2026-12-12" });
  expect(r!.datePrefilled).toBe(true);
  expect(r!.url).toContain("clickref=parkmath-gatwick-search");
  // ued contains the encoded dates (exact param names per the captured template)
  expect(r!.url).toContain("07%2F12%2F26");
  expect(r!.url).toContain("12%2F12%2F26");
});
```

- [ ] **Step 4: Verify + e2e**

Run: `pnpm --filter parkmath test`
Run: `pnpm --filter parkmath e2e -- parking-search.spec.ts`
Then extend the home e2e to fill both dates and assert the encoded dates now appear in the CTA `href`.
Expected: PASS. If the live contract can't be confirmed, **leave `datePrefill: false`** — everything still ships with airport-prefill (this task is optional/deferrable).

- [ ] **Step 5: Commit**

```bash
git add apps/parkmath/lib/partners.json apps/parkmath/tests/partners.test.ts apps/parkmath/e2e/parking-search.spec.ts
git commit -m "feat(parkmath): enable HE date-prefill after live-URL spike"
```

---

## Task 9: Final verification + graph refresh

**Files:** none (verification only)

- [ ] **Step 1: Full unit suite + typecheck**

Run: `pnpm --filter parkmath test`
Expected: PASS (all files).

Run: `pnpm --filter parkmath exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 2: Full e2e suite (catch regressions on home + parking pages)**

Run: `pnpm --filter parkmath e2e`
Expected: PASS (existing specs + the new `parking-search.spec.ts`).

- [ ] **Step 3: Refresh the knowledge graph**

Run: `graphify update .`
Expected: completes (AST-only, no API cost).

- [ ] **Step 4: Commit any graph changes**

```bash
git add graphify-out
git commit -m "chore(parkmath): refresh graphify graph after affiliate search feature" || echo "nothing to commit"
```

---

## Self-review notes (completed)

- **Spec coverage:** every spec section maps to a task (see table above); the date-prefill spike (§5) is isolated in Task 8 and is non-blocking.
- **Placeholder scan:** no TBD/TODO; the one genuinely-unknowable value (HE's live dated URL) is gated behind a flag with tested fallback and an explicit manual task.
- **Type/name consistency:** `composeParkingUed`, `buildParkingSearchUrl`, `formatHeDate`, `validateSearchDates`, `HeAirportParkingConfig`, `SearchAirport`, and the `{ url, partnerName, datePrefilled }` return shape are used identically across Tasks 1–7.
- **Reconciliation:** home has no `DealsStrip` to remove (noted above); Task 6 only adds `ParkingSearch`.
