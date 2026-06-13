# ParkMath Home — Navigation Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the ParkMath home page from a hero + bare text-links layout into a calm topic-tile navigation hub — premium-depth nav tiles (drop-off / parking / lounges), a quieter secondary row, a button-triggered "nearest airports" feature, and one subtle neutral-voice partner deals strip.

**Architecture:** Composition-first. The depth/motion kit already exists in `packages/ui` (`tokens.css`, `AnimatedNumber`, `ScrollReveal`, `AmbientBackdrop`). New code is small: a pure `nearestAirports` util in `@mathfamily/engine`, a `.mf-glint` token + `GlintController` and `NavTile`/`NavTileGrid` in `@mathfamily/ui`, and `NearbyAirports` + `DealsStrip` + tile icons in the ParkMath app, wired into `app/page.tsx`. The home page stays a server component; only the geolocation widget and the glint scheduler are client code.

**Tech Stack:** Next.js 16 (App Router, React 19), TypeScript, Tailwind v4 (`@theme` tokens), Vitest (+ jsdom + @testing-library/react), Playwright, pnpm + Turbo monorepo.

**Branch:** `home-dashboard-redesign` (already created; the design spec is committed there).

**Spec:** `docs/superpowers/specs/2026-06-13-parkmath-home-dashboard-design.md`

**Conventions for every commit:** end the commit message with the trailer
`Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

**Key constraint (do not violate):** never create a vitest/vite config file on this volume — `esbuild build()` deadlocks on the TB4 volume. Vitest already runs config-less; `.tsx` tests opt into jsdom with a `// @vitest-environment jsdom` first line (see existing `packages/ui/tests/ambient.test.tsx`).

---

## File Structure

**Create:**
- `packages/engine/src/geo-distance.ts` — pure haversine + `nearestAirports`.
- `packages/engine/tests/geo-distance.test.ts` — its unit tests.
- `packages/ui/src/glint-controller.tsx` — client controller firing the occasional glint.
- `packages/ui/tests/glint-controller.test.tsx` — its test.
- `packages/ui/src/nav-tile.tsx` — `NavTile` + `NavTileGrid` (presentational).
- `packages/ui/tests/nav-tile.test.tsx` — their tests.
- `apps/parkmath/components/tile-icons.tsx` — six inline SVG tile icons.
- `apps/parkmath/components/deals-strip.tsx` — the single partner band.
- `apps/parkmath/tests/deals-strip.test.tsx` — its test.
- `apps/parkmath/components/nearby-airports.tsx` — client geolocation widget.
- `apps/parkmath/tests/nearby-airports.test.tsx` — its test.
- `apps/parkmath/e2e/home-dashboard.spec.ts` — Playwright e2e.

**Modify:**
- `packages/engine/src/index.ts` — export `geo-distance`.
- `packages/ui/src/tokens.css` — add `.mf-glint` token + keyframe.
- `packages/ui/src/index.ts` — export `glint-controller` and `nav-tile`.
- `apps/parkmath/app/layout.tsx` — mount `<GlintController />`.
- `apps/parkmath/lib/partners.ts` — add `activeSlotPartnerName`.
- `apps/parkmath/tests/partners.test.ts` — add its tests.
- `apps/parkmath/app/page.tsx` — assemble the new layout.

---

## Task 1: `nearestAirports` distance util (pure, engine)

**Files:**
- Create: `packages/engine/src/geo-distance.ts`
- Test: `packages/engine/tests/geo-distance.test.ts`
- Modify: `packages/engine/src/index.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/engine/tests/geo-distance.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { haversineKm, nearestAirports } from "../src/geo-distance";
import type { Airport } from "@mathfamily/data";

const mk = (slug: string, name: string, iata: string, lat: number, lng: number): Airport => ({
  name, slug, iata, region: "Test", lat, lng,
});

const airports: Airport[] = [
  mk("heathrow", "Heathrow", "LHR", 51.47, -0.4543),
  mk("gatwick", "Gatwick", "LGW", 51.1537, -0.1821),
  mk("manchester", "Manchester", "MAN", 53.3537, -2.275),
  mk("edinburgh", "Edinburgh", "EDI", 55.95, -3.3725),
];

describe("haversineKm", () => {
  it("is zero for identical points", () => {
    expect(haversineKm(51.5, -0.12, 51.5, -0.12)).toBe(0);
  });
  it("matches a known distance (London ↔ Edinburgh ≈ 530 km)", () => {
    const km = haversineKm(51.5074, -0.1278, 55.9533, -3.1883);
    expect(km).toBeGreaterThan(520);
    expect(km).toBeLessThan(540);
  });
});

describe("nearestAirports", () => {
  it("returns the n closest, nearest first (central London → LHR then LGW)", () => {
    const res = nearestAirports(51.5074, -0.1278, airports, 2);
    expect(res.map((r) => r.airport.slug)).toEqual(["heathrow", "gatwick"]);
  });
  it("orders strictly by ascending distance", () => {
    const ds = nearestAirports(53.0, -2.0, airports, 4).map((r) => r.distanceKm);
    expect([...ds]).toEqual([...ds].sort((x, y) => x - y));
  });
  it("never returns more than n", () => {
    expect(nearestAirports(51.5, -0.1, airports, 3)).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @mathfamily/engine exec vitest run tests/geo-distance.test.ts`
Expected: FAIL — `Failed to resolve import "../src/geo-distance"`.

- [ ] **Step 3: Write the implementation**

Create `packages/engine/src/geo-distance.ts`:

```ts
import type { Airport } from "@mathfamily/data";

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance between two lat/lng points, in kilometres (haversine). */
export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface AirportDistance {
  airport: Airport;
  distanceKm: number;
}

/** The `n` airports closest to (lat, lng), nearest first. Ties keep input order. */
export function nearestAirports(lat: number, lng: number, airports: Airport[], n: number): AirportDistance[] {
  return airports
    .map((airport) => ({ airport, distanceKm: haversineKm(lat, lng, airport.lat, airport.lng) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, Math.max(0, n));
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @mathfamily/engine exec vitest run tests/geo-distance.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Export from the engine barrel**

In `packages/engine/src/index.ts`, append:

```ts
export * from "./geo-distance";
```

- [ ] **Step 6: Typecheck and commit**

Run: `pnpm --filter @mathfamily/engine typecheck`
Expected: no errors.

```bash
git add packages/engine/src/geo-distance.ts packages/engine/tests/geo-distance.test.ts packages/engine/src/index.ts
git commit -m "feat(engine): haversine + nearestAirports util"
```

---

## Task 2: `.mf-glint` token (slow occasional sweep)

**Files:**
- Modify: `packages/ui/src/tokens.css`

The glint is a real child element (`.mf-glint__sweep`), not a pseudo-element — `::before` is taken by `.mf-edge` and `::after` by `.mf-sheen`, so a child avoids all conflicts. `GlintController` (Task 3) toggles `.is-glinting` to fire it.

- [ ] **Step 1: Add the glint CSS**

In `packages/ui/src/tokens.css`, immediately AFTER the `.mf-sheen` block (ends at the `@keyframes mf-sheen-sweep { … }` around line 176), insert:

```css
/* ── Slow occasional glint: ambient sweep on nav tiles, fired by GlintController.
   Visible only on dark surfaces (the primary nav tiles are navy). Tunable via
   --mf-glint-dur / --mf-glint-opacity. ── */
.mf-glint {
  position: relative;
  overflow: hidden;
}
.mf-glint__sweep {
  position: absolute;
  top: -150%;
  left: -60%;
  width: 55%;
  height: 400%;
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / var(--mf-glint-opacity, 0.14)), transparent);
  transform: rotate(25deg) translateX(-180%);
  opacity: 0;
  pointer-events: none;
}
.mf-glint.is-glinting .mf-glint__sweep {
  animation: mf-glint-sweep var(--mf-glint-dur, 1.8s) ease-in-out;
}
@keyframes mf-glint-sweep {
  0% { transform: rotate(25deg) translateX(-180%); opacity: 0; }
  12% { opacity: 1; }
  100% { transform: rotate(25deg) translateX(360%); opacity: 0; }
}
```

- [ ] **Step 2: Disable it under reduced motion**

In the existing `@media (prefers-reduced-motion: reduce)` block at the end of `tokens.css`, add `.mf-glint__sweep` to the rule list that sets `animation: none` (it already lists `.mf-sheen:hover::after`, `.mf-pulse`, etc.). Add this line inside that block:

```css
  .mf-glint__sweep { display: none; }
```

- [ ] **Step 3: Commit**

(No unit test — CSS-only; verified visually in Task 9.)

```bash
git add packages/ui/src/tokens.css
git commit -m "feat(ui): .mf-glint token for the slow occasional tile sweep"
```

---

## Task 3: `GlintController` (client) + mount

**Files:**
- Create: `packages/ui/src/glint-controller.tsx`
- Test: `packages/ui/tests/glint-controller.test.tsx`
- Modify: `packages/ui/src/index.ts`, `apps/parkmath/app/layout.tsx`

- [ ] **Step 1: Write the failing test**

Create `packages/ui/tests/glint-controller.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { GlintController } from "../src/glint-controller";

afterEach(cleanup);

describe("GlintController", () => {
  it("renders nothing and does not throw (no IntersectionObserver in jsdom)", () => {
    const { container } = render(<GlintController />);
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @mathfamily/ui exec vitest run tests/glint-controller.test.tsx`
Expected: FAIL — cannot resolve `../src/glint-controller`.

- [ ] **Step 3: Write the implementation**

Create `packages/ui/src/glint-controller.tsx`:

```tsx
"use client";

import { useEffect } from "react";

/**
 * Mount once per page (next to ScrollReveal). Fires a slow, occasional sweep on every
 * `.mf-glint` element at a randomised interval (~10s ±35%), and pauses while off-screen.
 * Inert under reduced motion or when IntersectionObserver is unavailable (jsdom/SSR).
 */
export function GlintController() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".mf-glint"));
    if (nodes.length === 0) return;

    const visible = new WeakSet<HTMLElement>();
    const timers = new Map<HTMLElement, number>();
    const SWEEP_MS = 2000;
    const BASE_MS = 10000;

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const el = e.target as HTMLElement;
        if (e.isIntersecting) visible.add(el);
        else visible.delete(el);
      }
    });
    nodes.forEach((n) => io.observe(n));

    const schedule = (n: HTMLElement) => {
      const jitter = BASE_MS * 0.35 * (Math.random() * 2 - 1);
      const delay = Math.max(4000, BASE_MS + jitter);
      timers.set(
        n,
        window.setTimeout(() => {
          if (visible.has(n)) {
            n.classList.add("is-glinting");
            window.setTimeout(() => n.classList.remove("is-glinting"), SWEEP_MS);
          }
          schedule(n);
        }, delay),
      );
    };
    nodes.forEach(schedule);

    return () => {
      io.disconnect();
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  return null;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @mathfamily/ui exec vitest run tests/glint-controller.test.tsx`
Expected: PASS.

- [ ] **Step 5: Export from the UI barrel**

In `packages/ui/src/index.ts`, append:

```ts
export * from "./glint-controller";
```

- [ ] **Step 6: Mount it in the ParkMath layout**

In `apps/parkmath/app/layout.tsx`:
- Add `GlintController` to the existing import on line 3:
  ```ts
  import { AmbientBackdrop, GlintController, ScrollProgress, ScrollReveal, SiteAnalytics, SiteFooter, SiteHeader } from "@mathfamily/ui";
  ```
- Mount it right after `<ScrollReveal />` (line 47):
  ```tsx
  <ScrollReveal />
  <GlintController />
  ```

- [ ] **Step 7: Typecheck and commit**

Run: `pnpm --filter @mathfamily/ui typecheck`
Expected: no errors.

```bash
git add packages/ui/src/glint-controller.tsx packages/ui/tests/glint-controller.test.tsx packages/ui/src/index.ts apps/parkmath/app/layout.tsx
git commit -m "feat(ui): GlintController + mount in ParkMath layout"
```

---

## Task 4: `NavTile` + `NavTileGrid`

**Files:**
- Create: `packages/ui/src/nav-tile.tsx`
- Test: `packages/ui/tests/nav-tile.test.tsx`
- Modify: `packages/ui/src/index.ts`

Uses a plain `<a href>` (the `ui` package has no `next` dependency, matching `AirportSearch`/`FamilyLinks`). Primary tiles are **navy** (`bg-brand text-white`) so the white glint sweep is visible and the depth reads; secondary tiles are quiet white cards with no glint.

- [ ] **Step 1: Write the failing test**

Create `packages/ui/tests/nav-tile.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { NavTile, NavTileGrid } from "../src/nav-tile";

afterEach(cleanup);

describe("NavTile", () => {
  it("primary renders a crawlable link carrying the glint sweep", () => {
    const { container } = render(
      <NavTile href="/airport-parking" title="Airport parking" descriptor="Gate vs pre-book" variant="primary" />,
    );
    const a = container.querySelector("a")!;
    expect(a.getAttribute("href")).toBe("/airport-parking");
    expect(a.className).toContain("mf-glint");
    expect(a.className).toContain("bg-brand");
    expect(container.querySelector(".mf-glint__sweep")).not.toBeNull();
  });
  it("secondary has no glint and supports download", () => {
    const { container } = render(
      <NavTile href="/data/drop-off-charges.csv" title="Open data" variant="secondary" download />,
    );
    const a = container.querySelector("a")!;
    expect(a.className).not.toContain("mf-glint");
    expect(a.hasAttribute("download")).toBe(true);
  });
});

describe("NavTileGrid", () => {
  it("renders one tile per item with a staggered reveal delay", () => {
    const tiles = [
      { href: "/a", title: "A" },
      { href: "/b", title: "B" },
      { href: "/c", title: "C" },
    ];
    const { container } = render(<NavTileGrid tiles={tiles} variant="primary" />);
    expect(container.querySelectorAll("a")).toHaveLength(3);
    const wrappers = container.querySelectorAll(".mf-reveal");
    expect((wrappers[1] as HTMLElement).style.getPropertyValue("--mf-delay")).toBe("40ms");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @mathfamily/ui exec vitest run tests/nav-tile.test.tsx`
Expected: FAIL — cannot resolve `../src/nav-tile`.

- [ ] **Step 3: Write the implementation**

Create `packages/ui/src/nav-tile.tsx`:

```tsx
import type { CSSProperties, ReactNode } from "react";

export interface NavTileData {
  href: string;
  title: string;
  descriptor?: string;
  icon?: ReactNode;
  download?: boolean;
}

type Variant = "primary" | "secondary";

export function NavTile({ href, title, descriptor, icon, download, variant = "primary" }: NavTileData & { variant?: Variant }) {
  if (variant === "secondary") {
    return (
      <a
        href={href}
        {...(download ? { download: "" } : {})}
        className="mf-edge mf-sheen mf-press group flex items-center gap-2.5 rounded-card bg-white p-4 text-sm outline-none transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-brand-accent/40"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {icon ? <span aria-hidden className="shrink-0 text-brand-accent/80">{icon}</span> : null}
        <span className="font-semibold text-ink transition-colors group-hover:text-brand-accent">{title}</span>
      </a>
    );
  }
  return (
    <a
      href={href}
      {...(download ? { download: "" } : {})}
      className="mf-glint mf-sheen mf-press group relative flex h-full flex-col gap-2 rounded-card bg-brand p-5 text-white outline-none ring-1 ring-white/10 transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-white/50"
      style={{ boxShadow: "var(--shadow-hero)" }}
    >
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white/12 to-transparent" />
      <span aria-hidden className="mf-glint__sweep" />
      {icon ? <span aria-hidden className="text-white/90">{icon}</span> : null}
      <span className="text-base font-semibold">{title}</span>
      {descriptor ? <span className="text-sm text-white/70">{descriptor}</span> : null}
      <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-medium text-white/90">
        Open <span aria-hidden>→</span>
      </span>
    </a>
  );
}

export function NavTileGrid({ tiles, variant = "primary" }: { tiles: NavTileData[]; variant?: Variant }) {
  const cols = variant === "primary" ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-3";
  return (
    <div className={`grid grid-cols-1 gap-4 ${cols}`}>
      {tiles.map((t, i) => (
        <div key={t.href} className="mf-reveal h-full" style={{ "--mf-delay": `${i * 40}ms` } as CSSProperties}>
          <NavTile {...t} variant={variant} />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @mathfamily/ui exec vitest run tests/nav-tile.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Export from the UI barrel**

In `packages/ui/src/index.ts`, append:

```ts
export * from "./nav-tile";
```

- [ ] **Step 6: Typecheck and commit**

Run: `pnpm --filter @mathfamily/ui typecheck`
Expected: no errors.

```bash
git add packages/ui/src/nav-tile.tsx packages/ui/tests/nav-tile.test.tsx packages/ui/src/index.ts
git commit -m "feat(ui): NavTile + NavTileGrid (premium-depth nav tiles)"
```

---

## Task 5: `activeSlotPartnerName` helper

**Files:**
- Modify: `apps/parkmath/lib/partners.ts`
- Test: `apps/parkmath/tests/partners.test.ts`

Lets the deals strip decide affiliate framing without an airport in context. The tracked link itself is still built per-airport on detail pages (`resolveSlot`/`buildAwinLink` unchanged).

- [ ] **Step 1: Write the failing test**

Append to `apps/parkmath/tests/partners.test.ts` (and add `activeSlotPartnerName` to the existing import from `../lib/partners`):

```ts
describe("activeSlotPartnerName", () => {
  it("returns the active parking partner's name", () => {
    expect(activeSlotPartnerName("parking-prebook")).toBe("Holiday Extras");
  });
  it("returns null for an inactive slot", () => {
    expect(activeSlotPartnerName("lounge-membership")).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter parkmath exec vitest run tests/partners.test.ts`
Expected: FAIL — `activeSlotPartnerName is not exported` / not a function.

- [ ] **Step 3: Write the implementation**

In `apps/parkmath/lib/partners.ts`, append after `resolveSlot`:

```ts
/** Name of the first active partner for an active slot, or null. Surfaces without an
 *  airport in context (e.g. the home deals strip) use this to decide affiliate framing;
 *  the tracked link is still built per-airport elsewhere via resolveSlot/buildAwinLink. */
export function activeSlotPartnerName(slotId: SlotId): string | null {
  const slot = config.slots.find((s) => s.id === slotId);
  if (!slot?.active) return null;
  for (const partnerId of slot.partnerIds) {
    const partner = config.partners[partnerId];
    if (partner?.active && partner.awinmid) return partner.name;
  }
  return null;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter parkmath exec vitest run tests/partners.test.ts`
Expected: PASS (existing tests + 2 new).

- [ ] **Step 5: Commit**

```bash
git add apps/parkmath/lib/partners.ts apps/parkmath/tests/partners.test.ts
git commit -m "feat(parkmath): activeSlotPartnerName helper for home deals strip"
```

---

## Task 6: `DealsStrip`

**Files:**
- Create: `apps/parkmath/components/deals-strip.tsx`
- Test: `apps/parkmath/tests/deals-strip.test.tsx`

Neutral-referee voice, absolute-£ framing, **no percentage anchoring**. CTA routes to `/airport-parking` (never a raw affiliate link). Affiliate disclosure shows only while a parking partner is active.

- [ ] **Step 1: Write the failing test**

Create `apps/parkmath/tests/deals-strip.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { DealsStrip } from "../components/deals-strip";

afterEach(cleanup);

describe("DealsStrip", () => {
  it("routes to /airport-parking and never anchors on a percentage", () => {
    const { container } = render(<DealsStrip />);
    expect(container.querySelector('a[href="/airport-parking"]')).not.toBeNull();
    expect(container.textContent).not.toMatch(/%/);
  });
  it("shows an affiliate disclosure while the parking partner is active", () => {
    const { container } = render(<DealsStrip />);
    expect(container.textContent).toContain("commission");
    expect(container.textContent).toContain("Holiday Extras");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter parkmath exec vitest run tests/deals-strip.test.tsx`
Expected: FAIL — cannot resolve `../components/deals-strip`.

- [ ] **Step 3: Write the implementation**

Create `apps/parkmath/components/deals-strip.tsx`:

```tsx
import { activeSlotPartnerName } from "@/lib/partners";

/** One subtle partner band. Neutral-referee voice, absolute-£ framing, no percentage
 *  anchoring. CTA routes to /airport-parking, where the tracked per-airport affiliate
 *  link fires — the home page never emits a generic affiliate click. */
export function DealsStrip() {
  const partner = activeSlotPartnerName("parking-prebook");
  return (
    <aside
      className="mf-rise-in mf-edge mf-sheen relative overflow-hidden rounded-card bg-surface p-4 sm:flex sm:items-center sm:justify-between sm:gap-4"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div>
        <p className="text-sm font-semibold text-ink">Pre-booking parking usually costs less than the gate price</p>
        <p className="mt-1 text-xs text-ink-muted">
          Compare pre-book vs drive-up prices at your airport.
          {partner ? (
            <span className="text-ink-muted/80"> *We may earn commission ({partner}). We show absolute prices and stay neutral.</span>
          ) : null}
        </p>
      </div>
      <a
        href="/airport-parking"
        className="mf-press mt-3 inline-flex min-h-11 items-center gap-1 rounded-card border border-brand-accent/40 bg-white px-4 text-sm font-semibold text-brand-accent outline-none transition hover:border-brand-accent focus-visible:ring-2 focus-visible:ring-brand-accent/40 sm:mt-0"
      >
        Compare parking{partner ? " *" : ""} <span aria-hidden>→</span>
      </a>
    </aside>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter parkmath exec vitest run tests/deals-strip.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/parkmath/components/deals-strip.tsx apps/parkmath/tests/deals-strip.test.tsx
git commit -m "feat(parkmath): neutral-voice DealsStrip routing to /airport-parking"
```

---

## Task 7: Tile icons

**Files:**
- Create: `apps/parkmath/components/tile-icons.tsx`
- Test: `apps/parkmath/tests/tile-icons.test.tsx`

Minimal inline stroke SVGs (color inherits from the tile; `aria-hidden`). Matches the stroke style already used in `AirportSearch`.

- [ ] **Step 1: Write the failing test**

Create `apps/parkmath/tests/tile-icons.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { CarIcon, ParkingIcon, LoungeIcon, PriceIndexIcon, NewsIcon, DataIcon } from "../components/tile-icons";

afterEach(cleanup);

describe("tile icons", () => {
  it("each renders a decorative svg", () => {
    for (const Icon of [CarIcon, ParkingIcon, LoungeIcon, PriceIndexIcon, NewsIcon, DataIcon]) {
      const { container, unmount } = render(<Icon />);
      const svg = container.querySelector("svg")!;
      expect(svg.getAttribute("aria-hidden")).toBe("true");
      unmount();
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter parkmath exec vitest run tests/tile-icons.test.tsx`
Expected: FAIL — cannot resolve `../components/tile-icons`.

- [ ] **Step 3: Write the implementation**

Create `apps/parkmath/components/tile-icons.tsx`:

```tsx
const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function CarIcon() {
  return (
    <svg {...base}>
      <path d="M3 13l2-5a2 2 0 0 1 1.9-1.3h10.2A2 2 0 0 1 19 8l2 5" />
      <path d="M3 13h18v4a1 1 0 0 1-1 1h-1a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H4a1 1 0 0 1-1-1z" />
    </svg>
  );
}
export function ParkingIcon() {
  return (
    <svg {...base}>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M9 17V7h3.5a3 3 0 0 1 0 6H9" />
    </svg>
  );
}
export function LoungeIcon() {
  return (
    <svg {...base}>
      <path d="M5 11V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3" />
      <path d="M3 13a2 2 0 0 1 2 2v3h14v-3a2 2 0 1 1 2-2v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M7 20v1M17 20v1" />
    </svg>
  );
}
export function PriceIndexIcon() {
  return (
    <svg {...base}>
      <path d="M4 4v16h16" />
      <path d="M7 14l3-3 3 2 4-5" />
    </svg>
  );
}
export function NewsIcon() {
  return (
    <svg {...base}>
      <path d="M4 5h13a1 1 0 0 1 1 1v12a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2z" />
      <path d="M8 9h6M8 13h6M8 17h4" />
    </svg>
  );
}
export function DataIcon() {
  return (
    <svg {...base}>
      <path d="M12 4v10" />
      <path d="M8 11l4 4 4-4" />
      <path d="M5 19h14" />
    </svg>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter parkmath exec vitest run tests/tile-icons.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/parkmath/components/tile-icons.tsx apps/parkmath/tests/tile-icons.test.tsx
git commit -m "feat(parkmath): inline tile icons for the nav grid"
```

---

## Task 8: `NearbyAirports` (button-triggered geolocation)

**Files:**
- Create: `apps/parkmath/components/nearby-airports.tsx`
- Test: `apps/parkmath/tests/nearby-airports.test.tsx`

Client component. No auto-prompt — geolocation fires only on tap. Renders nothing if the browser has no geolocation. Distance shown in miles; location never leaves the browser.

- [ ] **Step 1: Write the failing test**

Create `apps/parkmath/tests/nearby-airports.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, expect, it, afterEach, vi } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";
import { NearbyAirports } from "../components/nearby-airports";
import type { Airport } from "@mathfamily/data";

const airports: Airport[] = [
  { name: "Heathrow", slug: "heathrow", iata: "LHR", region: "London", lat: 51.47, lng: -0.4543 },
  { name: "Gatwick", slug: "gatwick", iata: "LGW", region: "London", lat: 51.1537, lng: -0.1821 },
  { name: "Manchester", slug: "manchester", iata: "MAN", region: "North West", lat: 53.3537, lng: -2.275 },
];

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("NearbyAirports", () => {
  it("shows the nearest airports after a successful geolocation", async () => {
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: (ok: PositionCallback) =>
          ok({ coords: { latitude: 51.5074, longitude: -0.1278 } } as GeolocationPosition),
      },
    });
    const { getByRole, findByText, container } = render(
      <NearbyAirports airports={airports} feeBySlug={{ heathrow: "£6.00 drop-off" }} />,
    );
    fireEvent.click(getByRole("button", { name: /find airports near me/i }));
    await findByText("Heathrow");
    expect(container.querySelectorAll('a[href^="/drop-off-charges/"]')).toHaveLength(3);
  });

  it("renders nothing when geolocation is unavailable", () => {
    vi.stubGlobal("navigator", {});
    const { container } = render(<NearbyAirports airports={airports} />);
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter parkmath exec vitest run tests/nearby-airports.test.tsx`
Expected: FAIL — cannot resolve `../components/nearby-airports`.

- [ ] **Step 3: Write the implementation**

Create `apps/parkmath/components/nearby-airports.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { Airport } from "@mathfamily/data";
import { nearestAirports } from "@mathfamily/engine";

type Status = "idle" | "locating" | "ready" | "error";
type Near = { slug: string; name: string; miles: number };

export function NearbyAirports({ airports, feeBySlug }: { airports: Airport[]; feeBySlug?: Record<string, string> }) {
  const [status, setStatus] = useState<Status>("idle");
  const [results, setResults] = useState<Near[]>([]);

  // Progressive enhancement: render nothing if the browser can't locate.
  if (typeof navigator !== "undefined" && !("geolocation" in navigator)) return null;
  if (typeof navigator === "undefined") return null;

  function locate() {
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const near = nearestAirports(pos.coords.latitude, pos.coords.longitude, airports, 3);
        setResults(near.map((n) => ({ slug: n.airport.slug, name: n.airport.name, miles: Math.round(n.distanceKm * 0.621371) })));
        setStatus("ready");
      },
      () => setStatus("error"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
    );
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={locate}
        className="mf-press inline-flex min-h-11 items-center gap-2 rounded-card border border-ink/15 bg-white px-4 text-sm font-medium text-ink-muted outline-none transition hover:border-brand-accent/40 hover:text-brand-accent focus-visible:ring-2 focus-visible:ring-brand-accent/40"
      >
        <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
        {status === "locating" ? "Finding your location…" : "Find airports near me"}
      </button>
      <p className="mt-1.5 text-xs text-ink-muted/80">Your location stays in your browser — we don&apos;t send or store it.</p>

      {status === "error" ? (
        <p className="mt-2 text-xs text-warning">Couldn&apos;t get your location — search above instead.</p>
      ) : null}

      {status === "ready" && results.length > 0 ? (
        <ul className="mf-fade-in mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {results.map((r) => (
            <li key={r.slug}>
              <a
                href={`/drop-off-charges/${r.slug}`}
                className="mf-sheen mf-press flex items-center justify-between gap-2 rounded-card border border-ink/10 bg-white p-3 outline-none transition hover:border-brand-accent/40 focus-visible:ring-2 focus-visible:ring-brand-accent/40"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">{r.name}</span>
                  <span className="mf-num block text-xs text-ink-muted">
                    {r.miles} mi{feeBySlug?.[r.slug] ? ` · ${feeBySlug[r.slug]}` : ""}
                  </span>
                </span>
                <span aria-hidden className="text-brand-accent">→</span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter parkmath exec vitest run tests/nearby-airports.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/parkmath/components/nearby-airports.tsx apps/parkmath/tests/nearby-airports.test.tsx
git commit -m "feat(parkmath): NearbyAirports button-triggered geolocation widget"
```

---

## Task 9: Assemble the home page

**Files:**
- Modify: `apps/parkmath/app/page.tsx`

Replace the bare text-link blocks with the tile grids + near-me action + deals strip. Hero, stat strip, email capture and family link are preserved.

- [ ] **Step 1: Rewrite `apps/parkmath/app/page.tsx`**

Replace the entire file with:

```tsx
import { loadAirports, loadDropOffDataset } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { webSiteLd, JsonLd } from "@mathfamily/geo";
import { EmailCaptureSlot, RunwayDivider, StatStrip, UkMap, NavTileGrid } from "@mathfamily/ui";
import { AirportSearch } from "@/components/airport-search";
import { NearbyAirports } from "@/components/nearby-airports";
import { DealsStrip } from "@/components/deals-strip";
import { FamilyLinks } from "@/components/family-links";
import { CarIcon, ParkingIcon, LoungeIcon, PriceIndexIcon, NewsIcon, DataIcon } from "@/components/tile-icons";

export default function HomePage() {
  const airports = loadAirports();
  const records = loadDropOffDataset().records;
  const charging = records.filter((r) => !r.isFree);
  const freeCount = records.length - charging.length;
  const airportsBySlug = new Map(airports.map((a) => [a.slug, a]));
  let maxBandPence = 0;
  let maxBandNote = "";
  for (const r of charging) {
    for (const b of r.bands) {
      if (b.totalPence > maxBandPence) {
        maxBandPence = b.totalPence;
        const name = airportsBySlug.get(r.airportSlug)?.name ?? r.airportSlug;
        maxBandNote = `${name}, up to ${b.upToMinutes} min`;
      }
    }
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const feeBySlug: Record<string, string> = {};
  for (const r of records) {
    feeBySlug[r.airportSlug] = r.isFree ? "Free" : `${formatPence(r.bands[0]?.totalPence ?? 0)} drop-off`;
  }

  const primaryTiles = [
    { href: "/drop-off-charges", title: "Drop-off charges", descriptor: "Compare every UK airport in one table", icon: <CarIcon /> },
    { href: "/airport-parking", title: "Airport parking", descriptor: "Gate price vs pre-book — what you save", icon: <ParkingIcon /> },
    { href: "/airport-lounges", title: "Airport lounges", descriptor: "Pay-per-visit or membership break-even", icon: <LoungeIcon /> },
  ];
  const secondaryTiles = [
    { href: "/parking-price-index-2026", title: "Price index 2026", icon: <PriceIndexIcon /> },
    { href: "/news", title: "Travel news", icon: <NewsIcon /> },
    { href: "/data/drop-off-charges.csv", title: "Open data (CSV)", icon: <DataIcon />, download: true },
  ];

  return (
    <div className="space-y-12">
      <JsonLd data={webSiteLd({ name: "ParkMath", url: siteUrl })} />
      <section className="relative">
        <UkMap
          markers={airports.map((a) => ({ lat: a.lat, lng: a.lng }))}
          className="pointer-events-none absolute -top-6 right-0 hidden h-[340px] text-brand lg:block"
        />
        <div className="relative space-y-5">
          <h1 className="max-w-3xl text-h1 font-bold tracking-tight text-balance text-ink">
            What does it cost to <span className="text-brand-accent whitespace-nowrap">drop someone off</span> at a UK airport?
          </h1>
          <p className="max-w-2xl text-base text-ink-muted sm:text-lg">
            Every UK airport&apos;s drop-off charge, time limit, penalty and the free alternative — verified against
            official airport pages and date-stamped.
          </p>
          <AirportSearch airports={airports} feeBySlug={feeBySlug} />
          <NearbyAirports airports={airports} feeBySlug={feeBySlug} />
        </div>
      </section>

      <section className="mf-reveal">
        <StatStrip stats={[
          { label: "Most expensive drop-off", value: formatPence(maxBandPence), note: maxBandNote },
          { label: "Airports charging a fee", value: String(charging.length), note: `of ${records.length} tracked` },
          { label: "Still free", value: String(freeCount), note: "Free at the forecourt" },
        ]} />
      </section>

      <section className="space-y-4">
        <h2 className="mf-reveal text-h2 font-semibold text-ink">Where do you want to start?</h2>
        <NavTileGrid tiles={primaryTiles} variant="primary" />
        <NavTileGrid tiles={secondaryTiles} variant="secondary" />
      </section>

      <DealsStrip />

      <RunwayDivider className="h-2 w-full text-brand/15" />

      <EmailCaptureSlot
        formAction={process.env.NEXT_PUBLIC_MAILERLITE_FORM_ACTION}
        hook="Get notified when any UK airport changes its drop-off fees"
      />

      <FamilyLinks />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck and run the app tests**

Run: `pnpm --filter parkmath typecheck`
Expected: no errors.

Run: `pnpm --filter parkmath test`
Expected: PASS (all existing + new component tests).

- [ ] **Step 3: Visually verify in the dev server**

Run: `pnpm --filter parkmath dev`
Open `http://localhost:3000` and confirm:
- Three navy primary tiles (drop-off / parking / lounges) render with icons, lift on hover, and glint occasionally (~every 10s, randomised).
- Secondary row (Price index / Travel news / Open data) renders; "Open data" downloads the CSV.
- "Find airports near me" appears under the search; clicking it prompts for location and lists nearby airports with distance + fee.
- Deals strip shows the neutral copy + "Compare parking *" → `/airport-parking`, with the disclosure line.
- Toggle OS "reduce motion" and reload: no glint/sheen animations; content all visible.

- [ ] **Step 4: Commit**

```bash
git add apps/parkmath/app/page.tsx
git commit -m "feat(parkmath): home navigation-hub layout (tiles, near-me, deals)"
```

---

## Task 10: Playwright e2e

**Files:**
- Create: `apps/parkmath/e2e/home-dashboard.spec.ts`

Mirror the existing specs in `apps/parkmath/e2e/` (the `playwright.config.ts` provides `baseURL` + web server).

- [ ] **Step 1: Write the e2e spec**

Create `apps/parkmath/e2e/home-dashboard.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test.describe("home navigation hub", () => {
  test("primary tiles route to the right pages", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /airport parking/i }).first().click();
    await expect(page).toHaveURL(/\/airport-parking$/);
  });

  test("deals strip routes to the parking hub", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /compare parking/i }).click();
    await expect(page).toHaveURL(/\/airport-parking$/);
  });

  test("the find-near-me button is present and focusable", async ({ page }) => {
    await page.goto("/");
    const btn = page.getByRole("button", { name: /find airports near me/i });
    await expect(btn).toBeVisible();
    await btn.focus();
    await expect(btn).toBeFocused();
  });
});
```

- [ ] **Step 2: Run the e2e**

Run: `pnpm --filter parkmath exec playwright test e2e/home-dashboard.spec.ts`
Expected: PASS (3 tests). If Playwright browsers are missing, run `pnpm --filter parkmath exec playwright install` first.

- [ ] **Step 3: Commit**

```bash
git add apps/parkmath/e2e/home-dashboard.spec.ts
git commit -m "test(parkmath): e2e for home navigation hub"
```

---

## Task 11: Full verification + graphify refresh

- [ ] **Step 1: Run the whole suite + typecheck from the repo root**

Run: `pnpm test`
Expected: all package + app tests PASS.

Run: `pnpm typecheck`
Expected: no errors across the monorepo.

- [ ] **Step 2: Production build of ParkMath**

Run: `pnpm --filter parkmath build`
Expected: build succeeds (no React-server/client boundary errors; `NearbyAirports` and `GlintController` are the only `"use client"` additions).

- [ ] **Step 3: Refresh the knowledge graph (per CLAUDE.md)**

Run: `graphify update .`
Expected: graph updates with no API cost (AST-only).

- [ ] **Step 4: Commit any graph changes**

```bash
git add graphify-out
git commit -m "chore: graphify update for home navigation hub" || echo "nothing to commit"
```

---

## Self-Review (completed while writing)

**Spec coverage:**
- Topic-tile routing hub → Tasks 4, 9. ✓
- Premium-depth cards + slow occasional glint → Tasks 2, 3, 4 (primary tiles navy so the white glint is visible — a refinement on the spec's "tinted band" note, since a white sweep is invisible on white cards). ✓
- Button-triggered nearest airports, client-side, privacy-safe, graceful fallback → Tasks 1, 8. ✓
- Subtle deals strip, neutral voice, no %, routes to `/airport-parking`, config-driven disclosure → Tasks 5, 6. ✓
- Reuse of existing kit (StatStrip, AnimatedNumber, ScrollReveal, AmbientBackdrop, UkMap, EmailCaptureSlot, FamilyLinks) → Task 9. ✓
- Secondary row (Price index / News / Open data) → Task 9. Note: `/data` has no landing page (only CSV route handlers that send `Content-Disposition: attachment`), so the "Open data" tile is a `download` link to `/data/drop-off-charges.csv`. If a `/data` index page is wanted later, that's a small follow-up — out of scope here. ✓
- Accessibility/perf/reduced-motion → handled by the existing kit + Task 9 Step 3 checks; no new heavy `backdrop-filter`. ✓
- Testing (engine unit, component, e2e, reuse existing vitest config) → Tasks 1, 3, 4, 5, 6, 7, 8, 10. ✓
- Stat-strip count-up: intentionally **not** added — `StatStrip` is a shared component taking pre-formatted strings; the redesign's value (tiles/glint/geo/deals) doesn't need an API change, and it already has `.mf-fade-in`. Flagged here rather than silently dropped.

**Placeholder scan:** none — every code step is complete.

**Type consistency:** `Airport` (`{name, slug, iata, region, lat, lng}`), `AirportDistance`, `NavTileData`, `activeSlotPartnerName(slotId: SlotId)`, `haversineKm`, `nearestAirports` are used identically across tasks. `nearestAirports` returns `{ airport, distanceKm }`; the widget converts km → miles. ✓
