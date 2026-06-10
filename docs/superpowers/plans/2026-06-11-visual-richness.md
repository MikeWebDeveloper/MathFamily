# Visual Richness & =Math Brand Identity — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved spec at `docs/superpowers/specs/2026-06-11-visual-richness-design.md` — atmosphere (maps, flags, blobs, grid texture), shining-edge cards, the =Math logo system, the microanimation kit, and the info-clarity components, across `packages/ui` and both apps.

**Architecture:** All shared visuals live in `packages/ui` (new components + new CSS utilities in `tokens.css`); RoamMath inherits via its existing teal `@theme` override. Map paths and flag SVGs are **generated once** by a new `tools/design-assets` script into committed files under `packages/ui/src/generated/` — zero runtime dependencies. Apps integrate via small page edits.

**Tech Stack:** Next.js (App Router, RSC), Tailwind v4 + `@theme` tokens, vitest (configless, `// @vitest-environment jsdom` docblock), Playwright, plain-Node generation script (`.mjs`).

**CRITICAL CONSTRAINTS for the implementer:**
- **NEVER create `vitest.config.*` or `vite.config.*` files anywhere in this repo** — they deadlock forever on this volume. All vitest runs are configless; jsdom is selected per-file with the `// @vitest-environment jsdom` docblock (see `packages/ui/tests/components.test.tsx`).
- No new runtime/client dependencies. The only new packages are devDependencies of the new `tools/design-assets` workspace.
- Every animation must be inert under `prefers-reduced-motion` (the existing reduce block in `tokens.css` is extended in Task 1).
- Interaction feedback ≤300ms; one-time entrances ≤500ms; only two infinite loops exist (radar pulse, answer-card edge shine) and both pause off-screen.

---

### Task 1: Motion & surface foundation in `tokens.css`

All new CSS utilities the later tasks depend on. CSS isn't unit-testable; verification is typecheck + existing tests still passing.

**Files:**
- Modify: `packages/ui/src/tokens.css`

- [ ] **Step 1: Append the new utilities to `packages/ui/src/tokens.css`**

Add after the existing `.mf-num` rule (keep the existing `@media (prefers-reduced-motion: reduce)` block LAST in the file; Step 2 replaces it):

```css
/* ── Gradient hairline edge: card looks lit from above ── */
.mf-edge {
  position: relative;
}
.mf-edge::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(
    to bottom,
    rgb(15 23 42 / 0.16),
    rgb(15 23 42 / 0.05) 45%,
    rgb(15 23 42 / 0.10)
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  pointer-events: none;
}

/* ── Answer-card shining edge: one per page, ~8s loop ── */
@property --mf-angle {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}
.mf-edge-shine {
  position: relative;
}
.mf-edge-shine::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1.5px;
  background: conic-gradient(
    from var(--mf-angle),
    rgb(255 255 255 / 0.08),
    var(--color-brand-accent) 12%,
    rgb(255 255 255 / 0.08) 30%
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  animation: mf-rotate-edge 8s linear infinite;
  pointer-events: none;
}
@keyframes mf-rotate-edge {
  to { --mf-angle: 360deg; }
}

/* Looping animations pause when ScrollReveal marks them off-screen */
.mf-paused,
.mf-paused::before {
  animation-play-state: paused !important;
}

/* ── Hover sheen: one-shot diagonal light sweep (pointer devices only) ── */
.mf-sheen {
  position: relative;
  overflow: hidden;
}
.mf-sheen::after {
  content: "";
  position: absolute;
  top: -150%;
  left: -60%;
  width: 50%;
  height: 400%;
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.35), transparent);
  transform: rotate(25deg) translateX(-150%);
  opacity: 0;
  pointer-events: none;
}
@media (hover: hover) {
  .mf-sheen:hover::after {
    animation: mf-sheen-sweep 0.5s ease-out;
  }
}
@keyframes mf-sheen-sweep {
  from { transform: rotate(25deg) translateX(-150%); opacity: 1; }
  to { transform: rotate(25deg) translateX(320%); opacity: 0; }
}

/* ── Press state for touch ── */
.mf-press {
  transition: transform 120ms ease;
}
.mf-press:active {
  transform: scale(0.98);
}

/* ── Radar pulse (map pins) ── */
@keyframes mf-pulse-ring {
  0% { transform: scale(0.6); opacity: 0.7; }
  70% { transform: scale(2.2); opacity: 0; }
  100% { transform: scale(2.2); opacity: 0; }
}
.mf-pulse {
  animation: mf-pulse-ring 2s cubic-bezier(0.2, 0.6, 0.4, 1) infinite;
  transform-origin: center;
  transform-box: fill-box;
}

/* ── Ambient backdrop: masked dot grid + drifting blobs ── */
.mf-grid-bg {
  background-image: radial-gradient(
    color-mix(in srgb, var(--color-brand) 6%, transparent) 1px,
    transparent 1px
  );
  background-size: 22px 22px;
  -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent 70%);
  mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent 70%);
}
.mf-blob {
  filter: blur(80px);
  animation: mf-drift 75s ease-in-out infinite alternate;
}
.mf-blob-2 {
  filter: blur(80px);
  animation: mf-drift 90s ease-in-out infinite alternate-reverse;
}
@keyframes mf-drift {
  from { transform: translate3d(0, 0, 0) scale(1); }
  to { transform: translate3d(40px, 28px, 0) scale(1.12); }
}

/* ── Section heading underline grows when its .mf-reveal parent reveals ── */
.mf-underline-grow::after {
  content: "";
  display: block;
  height: 2px;
  width: 0;
  margin-top: 6px;
  background: var(--color-brand-accent);
  transition: width 0.45s cubic-bezier(0.16, 1, 0.3, 1) 0.15s;
}
.mf-reveal.mf-in .mf-underline-grow::after,
.mf-in .mf-underline-grow::after {
  width: 2.5rem;
}

/* ── Verified-pill tick draws itself (one-time) ── */
.mf-tick {
  stroke-dasharray: 16;
  stroke-dashoffset: 16;
  animation: mf-tick-draw 0.3s ease-out 0.15s forwards;
}
@keyframes mf-tick-draw {
  to { stroke-dashoffset: 0; }
}

/* ── =Math logo entrance (once per session, toggled by BrandLogo) + hover tilt ── */
.mf-logo-tile {
  transition: transform 180ms ease;
}
a:hover .mf-logo-tile {
  transform: rotate(3deg);
}
.mf-logo-animate .mf-logo-bar-top {
  animation: mf-bar-left 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.mf-logo-animate .mf-logo-bar-bottom {
  animation: mf-bar-right 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.08s both;
}
@keyframes mf-bar-left {
  from { transform: translateX(-8px); opacity: 0; }
  to { transform: none; opacity: 1; }
}
@keyframes mf-bar-right {
  from { transform: translateX(8px); opacity: 0; }
  to { transform: none; opacity: 1; }
}
```

- [ ] **Step 2: Replace the existing reduced-motion block at the end of the file**

Old:

```css
@media (prefers-reduced-motion: reduce) {
  .mf-fade-in,
  .mf-rise-in {
    animation: none;
  }
  .mf-reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

New:

```css
@media (prefers-reduced-motion: reduce) {
  .mf-fade-in,
  .mf-rise-in,
  .mf-edge-shine::before,
  .mf-sheen:hover::after,
  .mf-pulse,
  .mf-blob,
  .mf-blob-2,
  .mf-logo-animate .mf-logo-bar-top,
  .mf-logo-animate .mf-logo-bar-bottom {
    animation: none;
  }
  .mf-reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
  .mf-underline-grow::after {
    transition: none;
    width: 2.5rem;
  }
  .mf-tick {
    animation: none;
    stroke-dashoffset: 0;
  }
  .mf-press,
  .mf-logo-tile {
    transition: none;
  }
}
```

- [ ] **Step 3: Verify nothing broke**

Run: `pnpm --filter @mathfamily/ui test && pnpm --filter @mathfamily/ui typecheck`
Expected: existing tests PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/tokens.css
git commit -m "feat(ui): motion & surface foundation — edges, shine, sheen, pulse, blobs, grid"
```

---

### Task 2: ScrollReveal pauses looping animations off-screen

**Files:**
- Modify: `packages/ui/src/scroll-reveal.tsx`

- [ ] **Step 1: Extend `ScrollReveal` with a loop-pauser**

In `packages/ui/src/scroll-reveal.tsx`, inside the existing `useEffect` (after the reveal-observer setup, before the `fallback` timeout), add a second observer. Final file body of the effect becomes:

```tsx
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".mf-reveal:not(.mf-in)"));
    const loops = Array.from(document.querySelectorAll<HTMLElement>("[data-mf-loop]"));

    const reduced =
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      nodes.forEach((n) => n.classList.add("mf-in"));
      return;
    }

    let observer: IntersectionObserver | null = null;
    if (nodes.length > 0) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add("mf-in");
              observer?.unobserve(entry.target);
            }
          }
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
      );
      nodes.forEach((n) => observer?.observe(n));
    }

    // Looping animations (edge shine, radar pulse) pause while off-screen.
    let loopObserver: IntersectionObserver | null = null;
    if (loops.length > 0) {
      loopObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          entry.target.classList.toggle("mf-paused", !entry.isIntersecting);
        }
      });
      loops.forEach((n) => loopObserver?.observe(n));
    }

    const fallback = window.setTimeout(() => nodes.forEach((n) => n.classList.add("mf-in")), 1500);

    return () => {
      observer?.disconnect();
      loopObserver?.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);
```

Note: the early-return on `nodes.length === 0` from the old version is gone (loops may exist without reveals). The reduced-motion early-return stays.

- [ ] **Step 2: Verify**

Run: `pnpm --filter @mathfamily/ui test && pnpm --filter @mathfamily/ui typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/scroll-reveal.tsx
git commit -m "feat(ui): ScrollReveal pauses data-mf-loop animations off-screen"
```

---

### Task 3: BrandLogo (=Math glyph + wordmark) with header/footer integration

**Files:**
- Create: `packages/ui/src/brand-logo.tsx`
- Modify: `packages/ui/src/site-header.tsx`, `packages/ui/src/site-footer.tsx`, `packages/ui/src/index.ts`
- Test: `packages/ui/tests/brand-logo.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `packages/ui/tests/brand-logo.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrandLogo, MathGlyph } from "../src/brand-logo";
import { SiteHeader } from "../src/site-header";
import { SiteFooter } from "../src/site-footer";

describe("MathGlyph", () => {
  it("renders the equals tile with two bars", () => {
    const { container } = render(<MathGlyph />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(container.querySelector(".mf-logo-bar-top")).not.toBeNull();
    expect(container.querySelector(".mf-logo-bar-bottom")).not.toBeNull();
  });
});

describe("BrandLogo", () => {
  it("renders prefix and the constant Math suffix", () => {
    render(<BrandLogo prefix="Park" />);
    expect(screen.getByText("Park")).toBeDefined();
    expect(screen.getByText("Math")).toBeDefined();
  });
});

describe("SiteHeader with logo", () => {
  it("renders the BrandLogo when brandPrefix is given", () => {
    render(<SiteHeader brandName="ParkMath" brandPrefix="Park" links={[{ label: "X", href: "/x" }]} />);
    expect(screen.getByText("Park")).toBeDefined();
    expect(screen.getByText("Math")).toBeDefined();
  });
});

describe("SiteFooter family lockup", () => {
  it("renders the =Math family line", () => {
    render(<SiteFooter brandName="ParkMath" links={[]} />);
    expect(screen.getByText(/=Math family/)).toBeDefined();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @mathfamily/ui test`
Expected: FAIL — cannot resolve `../src/brand-logo`.

- [ ] **Step 3: Implement**

Create `packages/ui/src/brand-logo.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

/** The =Math family glyph: a calculator key carrying an equals sign.
 *  Top bar takes the brand accent (per-brand); bottom bar is constant white. */
export function MathGlyph({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="mf-logo-tile shrink-0">
      <rect x="1" y="1" width="30" height="30" rx="8" fill="var(--color-brand)" />
      <rect x="9" y="11.5" width="14" height="3.4" rx="1.7" fill="var(--color-brand-accent)" className="mf-logo-bar-top" />
      <rect x="9" y="17.5" width="14" height="3.4" rx="1.7" fill="#ffffff" className="mf-logo-bar-bottom" />
    </svg>
  );
}

/** Family wordmark: [=] {Prefix}Math. Entrance animation runs once per session. */
export function BrandLogo({ prefix }: { prefix: string }) {
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    try {
      if (!sessionStorage.getItem("mf-logo-seen")) {
        sessionStorage.setItem("mf-logo-seen", "1");
        setAnimate(true);
      }
    } catch {
      /* storage unavailable — render static */
    }
  }, []);
  return (
    <span className={`inline-flex items-center gap-2 ${animate ? "mf-logo-animate" : ""}`}>
      <MathGlyph />
      <span className="text-lg font-bold tracking-tight">
        <span className="text-brand">{prefix}</span>
        <span className="text-ink">Math</span>
      </span>
    </span>
  );
}
```

Replace `packages/ui/src/site-header.tsx` with:

```tsx
import { BrandLogo } from "./brand-logo";

export function SiteHeader({
  brandName,
  brandPrefix,
  links
}: {
  brandName: string;
  brandPrefix?: string;
  links: { label: string; href: string }[];
}) {
  return (
    <header
      className="sticky top-0 z-40 border-b border-ink/10 bg-white/80 backdrop-blur-md"
      style={{ boxShadow: "0 1px 0 rgb(15 23 42 / 0.04), 0 6px 16px -10px rgb(15 23 42 / 0.18)" }}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5">
        <a href="/" aria-label={`${brandName} home`} className="transition-opacity hover:opacity-80">
          {brandPrefix ? <BrandLogo prefix={brandPrefix} /> : (
            <span className="text-lg font-bold tracking-tight text-brand">{brandName}</span>
          )}
        </a>
        <nav aria-label="Main" className="flex gap-5 text-sm font-medium text-ink-muted">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-brand-accent">{l.label}</a>
          ))}
        </nav>
      </div>
    </header>
  );
}
```

In `packages/ui/src/site-footer.tsx`, replace the last paragraph:

Old:
```tsx
        <p>Part of the Math family of UK cost calculators.</p>
```

New:
```tsx
        <p className="flex items-center gap-2">
          <span aria-hidden className="inline-flex h-4 w-4 items-center justify-center rounded bg-brand text-[10px] font-bold leading-none text-white">=</span>
          <span>Part of the <strong className="font-semibold text-ink">=Math family</strong> of UK cost calculators.</span>
        </p>
```

In `packages/ui/src/index.ts`, add:

```ts
export * from "./brand-logo";
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @mathfamily/ui test && pnpm --filter @mathfamily/ui typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/brand-logo.tsx packages/ui/src/site-header.tsx packages/ui/src/site-footer.tsx packages/ui/src/index.ts packages/ui/tests/brand-logo.test.tsx
git commit -m "feat(ui): =Math brand logo system — glyph, wordmark, header/footer lockups"
```

---

### Task 4: Map & flag asset generator (`tools/design-assets`)

Generates committed TS modules — UK outline, world outline + per-country paths/centroids, and circle-flags markup — so `packages/ui` needs zero dependencies. Requires network access when run (GitHub raw for flags; npm for world-atlas data).

**Files:**
- Create: `tools/design-assets/package.json`
- Create: `tools/design-assets/generate.mjs`
- Generated (committed): `packages/ui/src/generated/uk-path.ts`, `packages/ui/src/generated/world-paths.ts`, `packages/ui/src/generated/flags.ts`
- Test: `packages/ui/tests/generated-assets.test.ts`

- [ ] **Step 1: Create `tools/design-assets/package.json`**

```json
{
  "name": "@mathfamily/design-assets",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "generate": "node generate.mjs"
  },
  "devDependencies": {
    "topojson-client": "^3.1.0",
    "world-atlas": "^2.0.2"
  }
}
```

(Confirm `pnpm-workspace.yaml` already globs `tools/*`; `tools/freshness` exists, so it should. If it lists packages explicitly, add `tools/design-assets`.)

- [ ] **Step 2: Create `tools/design-assets/generate.mjs`**

```js
// Generates committed map/flag assets into packages/ui/src/generated/.
// Run: pnpm --filter @mathfamily/design-assets generate   (needs network for flags)
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { feature } from "topojson-client";

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, "../../packages/ui/src/generated");

// world-atlas numeric ids → iso2, for the 40 RoamMath destinations
const N3_TO_A2 = {
  "724": "es", "250": "fr", "380": "it", "620": "pt", "300": "gr", "276": "de",
  "372": "ie", "528": "nl", "056": "be", "040": "at", "756": "ch", "616": "pl",
  "191": "hr", "196": "cy", "470": "mt", "792": "tr", "840": "us", "124": "ca",
  "484": "mx", "036": "au", "554": "nz", "784": "ae", "764": "th", "392": "jp",
  "156": "cn", "356": "in", "710": "za", "818": "eg", "504": "ma", "788": "tn",
  "578": "no", "352": "is", "752": "se", "208": "dk", "203": "cz", "348": "hu",
  "642": "ro", "100": "bg", "008": "al", "499": "me"
};

const D2R = Math.PI / 180;
// Spherical mercator. y grows downward (screen space). Lat clamped for sanity.
function merc([lng, lat]) {
  const phi = Math.max(-60, Math.min(84, lat)) * D2R;
  return [lng * D2R, -Math.log(Math.tan(Math.PI / 4 + phi / 2))];
}

function* points(geom) {
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  for (const poly of polys) for (const ring of poly) for (const pt of ring) yield pt;
}

function makeFit(geoms, width) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const g of geoms) for (const pt of points(g)) {
    const [x, y] = merc(pt);
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  const s = width / (maxX - minX);
  const height = Math.ceil((maxY - minY) * s);
  return {
    project: (pt) => { const [x, y] = merc(pt); return [(x - minX) * s, (y - minY) * s]; },
    constants: { s, minX, minY },
    viewBox: `0 0 ${width} ${height}`
  };
}

function geomToPath(geom, project) {
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  let d = "";
  for (const poly of polys) for (const ring of poly) {
    ring.forEach((pt, i) => {
      const [x, y] = project(pt);
      d += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    });
    d += "Z";
  }
  return d;
}

function bboxCenter(geom, project) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const pt of points(geom)) {
    const [x, y] = project(pt);
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  return [((minX + maxX) / 2).toFixed(1), ((minY + maxY) / 2).toFixed(1)];
}

const HEADER = "// GENERATED by tools/design-assets/generate.mjs — DO NOT EDIT.\n// Regenerate: pnpm --filter @mathfamily/design-assets generate\n";

await mkdir(OUT, { recursive: true });

// ── UK (50m for a decent coastline) ──────────────────────────────
{
  const topo = require("world-atlas/countries-50m.json");
  const gb = feature(topo, topo.objects.countries).features.find((f) => f.id === "826");
  if (!gb) throw new Error("GB not found in countries-50m");
  const fit = makeFit([gb.geometry], 200);
  const d = geomToPath(gb.geometry, fit.project);
  const { s, minX, minY } = fit.constants;
  await writeFile(path.join(OUT, "uk-path.ts"), `${HEADER}
export const UK_VIEWBOX = ${JSON.stringify(fit.viewBox)};
export const UK_PATH = ${JSON.stringify(d)};
const S = ${s}, MINX = ${minX}, MINY = ${minY};
const D2R = Math.PI / 180;
/** Project lat/lng to UK_VIEWBOX coordinates (same mercator fit as UK_PATH). */
export function ukProject(lat: number, lng: number): [number, number] {
  const x = lng * D2R;
  const y = -Math.log(Math.tan(Math.PI / 4 + (lat * D2R) / 2));
  return [(x - MINX) * S, (y - MINY) * S];
}
`);
}

// ── World (110m): outline + per-destination paths & centroids ────
{
  const topo = require("world-atlas/countries-110m.json");
  const feats = feature(topo, topo.objects.countries).features.filter((f) => f.id !== "010"); // drop Antarctica
  const fit = makeFit(feats.map((f) => f.geometry), 1000);
  const outline = feats.map((f) => geomToPath(f.geometry, fit.project)).join("");
  const paths = {}, centroids = {};
  for (const f of feats) {
    const a2 = N3_TO_A2[String(f.id).padStart(3, "0")];
    if (!a2) continue;
    paths[a2] = geomToPath(f.geometry, fit.project);
    centroids[a2] = bboxCenter(f.geometry, fit.project).map(Number);
  }
  const missing = Object.values(N3_TO_A2).filter((a2) => !paths[a2]);
  if (missing.length) throw new Error(`countries missing from 110m atlas: ${missing.join(",")}`);
  await writeFile(path.join(OUT, "world-paths.ts"), `${HEADER}
export const WORLD_VIEWBOX = ${JSON.stringify(fit.viewBox)};
export const WORLD_OUTLINE = ${JSON.stringify(outline)};
export const COUNTRY_PATHS: Record<string, string> = ${JSON.stringify(paths)};
export const COUNTRY_CENTROIDS: Record<string, [number, number]> = ${JSON.stringify(centroids)};
`);
}

// ── Flags (circle-flags, MIT) for the 40 destinations + gb ───────
{
  const codes = [...new Set([...Object.values(N3_TO_A2), "gb"])].sort();
  const flags = {};
  for (const a2 of codes) {
    const res = await fetch(`https://raw.githubusercontent.com/HatScripts/circle-flags/gh-pages/flags/${a2}.svg`);
    if (!res.ok) throw new Error(`flag ${a2}: HTTP ${res.status}`);
    const svg = await res.text();
    flags[a2] = svg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").trim();
  }
  await writeFile(path.join(OUT, "flags.ts"), `${HEADER}
// Flag artwork: HatScripts/circle-flags (MIT). Inner markup of 512x512 viewBox SVGs.
export const FLAGS: Record<string, string> = ${JSON.stringify(flags)};
`);
}

console.log("generated:", OUT);
```

- [ ] **Step 3: Install and run the generator**

Run: `pnpm install && pnpm --filter @mathfamily/design-assets generate`
Expected: `generated: …/packages/ui/src/generated` and three new `.ts` files there.

- [ ] **Step 4: Write the assertion test for generated assets**

Create `packages/ui/tests/generated-assets.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { UK_PATH, UK_VIEWBOX, ukProject } from "../src/generated/uk-path";
import { WORLD_OUTLINE, COUNTRY_PATHS, COUNTRY_CENTROIDS, WORLD_VIEWBOX } from "../src/generated/world-paths";
import { FLAGS } from "../src/generated/flags";

describe("generated map assets", () => {
  it("has a non-trivial UK path and sane viewBox", () => {
    expect(UK_PATH.length).toBeGreaterThan(500);
    expect(UK_VIEWBOX).toMatch(/^0 0 200 \d+$/);
  });
  it("projects Heathrow inside the UK viewBox", () => {
    const [, , w, h] = UK_VIEWBOX.split(" ").map(Number);
    const [x, y] = ukProject(51.47, -0.4543);
    expect(x).toBeGreaterThan(0); expect(x).toBeLessThan(w);
    expect(y).toBeGreaterThan(0); expect(y).toBeLessThan(h);
  });
  it("has world outline, 40 country paths and centroids", () => {
    expect(WORLD_OUTLINE.length).toBeGreaterThan(5000);
    expect(Object.keys(COUNTRY_PATHS)).toHaveLength(40);
    expect(Object.keys(COUNTRY_CENTROIDS)).toHaveLength(40);
    expect(WORLD_VIEWBOX).toMatch(/^0 0 1000 \d+$/);
  });
  it("has 41 flags (40 destinations + gb) with svg innards", () => {
    expect(Object.keys(FLAGS)).toHaveLength(41);
    expect(FLAGS.es).toContain("<");
    expect(FLAGS.es).not.toContain("<svg");
  });
});
```

- [ ] **Step 5: Run tests**

Run: `pnpm --filter @mathfamily/ui test`
Expected: PASS.

- [ ] **Step 6: Commit (including generated files)**

```bash
git add tools/design-assets packages/ui/src/generated packages/ui/tests/generated-assets.test.ts pnpm-lock.yaml pnpm-workspace.yaml
git commit -m "feat(assets): map & flag generator + committed UK/world paths and circle-flags"
```

---

### Task 5: UkMap, RegionMap, CountryFlag components

**Files:**
- Create: `packages/ui/src/uk-map.tsx`, `packages/ui/src/region-map.tsx`, `packages/ui/src/country-flag.tsx`
- Modify: `packages/ui/src/index.ts`
- Test: `packages/ui/tests/maps.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `packages/ui/tests/maps.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { UkMap } from "../src/uk-map";
import { RegionMap } from "../src/region-map";
import { CountryFlag } from "../src/country-flag";

describe("UkMap", () => {
  it("renders the outline and one marker group per marker", () => {
    const { container } = render(
      <UkMap markers={[{ lat: 51.47, lng: -0.4543, active: true }, { lat: 55.95, lng: -3.3725 }]} />
    );
    expect(container.querySelectorAll("path")).toHaveLength(1);
    expect(container.querySelectorAll("g")).toHaveLength(2);
    expect(container.querySelector(".mf-pulse")).not.toBeNull();
  });
});

describe("RegionMap", () => {
  it("renders world outline + highlighted country + pulse dot", () => {
    const { container } = render(<RegionMap iso2="es" />);
    expect(container.querySelectorAll("path")).toHaveLength(2);
    expect(container.querySelector(".mf-pulse")).not.toBeNull();
  });
  it("renders nothing for an unknown country", () => {
    const { container } = render(<RegionMap iso2="zz" />);
    expect(container.innerHTML).toBe("");
  });
});

describe("CountryFlag", () => {
  it("renders vendored flag markup", () => {
    const { container } = render(<CountryFlag iso2="es" />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg!.innerHTML.length).toBeGreaterThan(10);
  });
  it("renders nothing for an unknown code", () => {
    const { container } = render(<CountryFlag iso2="zz" />);
    expect(container.innerHTML).toBe("");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @mathfamily/ui test`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement the three components**

Create `packages/ui/src/uk-map.tsx`:

```tsx
import { UK_PATH, UK_VIEWBOX, ukProject } from "./generated/uk-path";

export type UkMapMarker = { lat: number; lng: number; active?: boolean };

/** Decorative UK outline with airport dots. Active markers get the radar pulse. */
export function UkMap({ markers, className }: { markers: UkMapMarker[]; className?: string }) {
  return (
    <svg viewBox={UK_VIEWBOX} aria-hidden data-mf-loop className={className}>
      <path d={UK_PATH} fill="currentColor" opacity="0.07" />
      {markers.map((m, i) => {
        const [x, y] = ukProject(m.lat, m.lng);
        return (
          <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
            {m.active ? <circle r="7" className="mf-pulse" fill="var(--color-brand-accent)" opacity="0.35" /> : null}
            <circle r={m.active ? 3 : 1.8} fill="var(--color-brand-accent)" opacity={m.active ? 1 : 0.55} />
          </g>
        );
      })}
    </svg>
  );
}
```

Create `packages/ui/src/region-map.tsx`:

```tsx
import { COUNTRY_CENTROIDS, COUNTRY_PATHS, WORLD_OUTLINE, WORLD_VIEWBOX } from "./generated/world-paths";

/** Decorative world map with the destination country filled and pulsing. */
export function RegionMap({ iso2, className }: { iso2: string; className?: string }) {
  const country = COUNTRY_PATHS[iso2];
  const centroid = COUNTRY_CENTROIDS[iso2];
  if (!country || !centroid) return null;
  const [cx, cy] = centroid;
  return (
    <svg viewBox={WORLD_VIEWBOX} aria-hidden data-mf-loop className={className}>
      <path d={WORLD_OUTLINE} fill="currentColor" opacity="0.05" />
      <path d={country} fill="var(--color-brand-accent)" opacity="0.25" />
      <g transform={`translate(${cx} ${cy})`}>
        <circle r="12" className="mf-pulse" fill="var(--color-brand-accent)" opacity="0.35" />
        <circle r="4" fill="var(--color-brand-accent)" />
      </g>
    </svg>
  );
}
```

Create `packages/ui/src/country-flag.tsx`:

```tsx
import { FLAGS } from "./generated/flags";

/** Vendored circle-flag (MIT, HatScripts/circle-flags). Decorative by default. */
export function CountryFlag({ iso2, size = 20, className }: { iso2: string; size?: number; className?: string }) {
  const inner = FLAGS[iso2];
  if (!inner) return null;
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      aria-hidden
      className={className}
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}
```

Add to `packages/ui/src/index.ts`:

```ts
export * from "./uk-map";
export * from "./region-map";
export * from "./country-flag";
```

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @mathfamily/ui test && pnpm --filter @mathfamily/ui typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/uk-map.tsx packages/ui/src/region-map.tsx packages/ui/src/country-flag.tsx packages/ui/src/index.ts packages/ui/tests/maps.test.tsx
git commit -m "feat(ui): UkMap, RegionMap and CountryFlag components over generated assets"
```

---

### Task 6: Airport coordinates in the dataset

**Files:**
- Modify: `packages/data/src/schemas.ts:5-12` (AirportSchema), `packages/data/datasets/airports.json`
- Test: `packages/data/tests/airports-geo.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/data/tests/airports-geo.test.ts` (match the import style of the existing tests in `packages/data/tests/` — they import loaders from `../src`):

```ts
import { describe, expect, it } from "vitest";
import { loadAirports } from "../src";

describe("airport coordinates", () => {
  it("every airport has lat/lng inside the UK bounding box", () => {
    for (const a of loadAirports()) {
      expect(a.lat, a.slug).toBeGreaterThan(49.8);
      expect(a.lat, a.slug).toBeLessThan(61);
      expect(a.lng, a.slug).toBeGreaterThan(-8.5);
      expect(a.lng, a.slug).toBeLessThan(2);
    }
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @mathfamily/data test`
Expected: FAIL — `lat` undefined (schema strips/rejects unknown keys; property absent).

- [ ] **Step 3: Extend the schema**

In `packages/data/src/schemas.ts`, replace `AirportSchema`:

```ts
export const AirportSchema = z.strictObject({
  name: z.string().min(1),
  slug: Slug,
  iata: z.string().regex(/^[A-Z]{3}$/, "expected 3-letter uppercase IATA code"),
  region: z.string().min(1),
  // Aerodrome coordinates (decimal degrees) — used only for map decoration
  lat: z.number().min(49.8).max(61),
  lng: z.number().min(-8.5).max(2)
});
```

- [ ] **Step 4: Add coordinates to `packages/data/datasets/airports.json`**

Add `"lat"`/`"lng"` to each record (aerodrome reference points, accurate to ~0.01°):

| slug | lat | lng |
|---|---|---|
| heathrow | 51.4700 | -0.4543 |
| gatwick | 51.1537 | -0.1821 |
| manchester | 53.3654 | -2.2750 |
| stansted | 51.8860 | 0.2389 |
| luton | 51.8747 | -0.3683 |
| edinburgh | 55.9500 | -3.3725 |
| birmingham | 52.4539 | -1.7480 |
| glasgow | 55.8719 | -4.4331 |
| bristol | 51.3827 | -2.7191 |
| belfast-international | 54.6575 | -6.2158 |
| newcastle | 55.0375 | -1.6917 |
| liverpool | 53.3336 | -2.8497 |
| london-city | 51.5053 | 0.0553 |
| leeds-bradford | 53.8659 | -1.6606 |
| east-midlands | 52.8311 | -1.3281 |
| aberdeen | 57.2019 | -2.1978 |
| belfast-city | 54.6181 | -5.8725 |
| southampton | 50.9503 | -1.3568 |
| cardiff | 51.3967 | -3.3433 |
| exeter | 50.7344 | -3.4139 |
| southend | 51.5714 | 0.6956 |
| bournemouth | 50.7800 | -1.8425 |
| norwich | 52.6758 | 1.2828 |
| inverness | 57.5425 | -4.0475 |
| teesside | 54.5092 | -1.4294 |

Example record after edit:

```json
  { "name": "London Heathrow", "slug": "heathrow", "iata": "LHR", "region": "London", "lat": 51.47, "lng": -0.4543 },
```

- [ ] **Step 5: Run tests**

Run: `pnpm --filter @mathfamily/data test && pnpm -r typecheck`
Expected: PASS (typecheck across apps confirms no consumer breaks — `Airport` only gained fields).

- [ ] **Step 6: Commit**

```bash
git add packages/data/src/schemas.ts packages/data/datasets/airports.json packages/data/tests/airports-geo.test.ts
git commit -m "feat(data): airport lat/lng for map decoration"
```

---### Task 7: AnswerCard, VerifiedStamp, CaveatChip

**Files:**
- Create: `packages/ui/src/answer-card.tsx`, `packages/ui/src/verified-stamp.tsx`, `packages/ui/src/caveat-chip.tsx`
- Modify: `packages/ui/src/index.ts`
- Test: `packages/ui/tests/answer-components.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `packages/ui/tests/answer-components.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnswerCard } from "../src/answer-card";
import { VerifiedStamp } from "../src/verified-stamp";
import { CaveatChip } from "../src/caveat-chip";

describe("AnswerCard", () => {
  it("renders label, big value, note and the anchor id for the mini bar", () => {
    const { container } = render(<AnswerCard label="Drop-off charge" value="£7" note="for 10 minutes" />);
    expect(screen.getByText("£7")).toBeDefined();
    expect(screen.getByText("for 10 minutes")).toBeDefined();
    expect(container.querySelector("#mf-answer-anchor")).not.toBeNull();
    expect(container.querySelector(".mf-edge-shine")).not.toBeNull();
  });
});

describe("VerifiedStamp", () => {
  it("renders the date and the source link inside a details element", () => {
    render(<VerifiedStamp verifiedAt="2026-06-10" sourceUrl="https://example.com/x" sourceLabel="Official page" />);
    expect(screen.getByText(/10 Jun 2026/)).toBeDefined();
    const link = screen.getByRole("link", { name: /Official page/ });
    expect(link.getAttribute("href")).toBe("https://example.com/x");
  });
});

describe("CaveatChip", () => {
  it("renders its caveat text", () => {
    render(<CaveatChip>Max stay 15 min</CaveatChip>);
    expect(screen.getByText("Max stay 15 min")).toBeDefined();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @mathfamily/ui test`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

Create `packages/ui/src/answer-card.tsx`:

```tsx
import type { ReactNode } from "react";

/** The one-per-page hero answer: navy showpiece with the shining edge.
 *  Carries id="mf-answer-anchor" — MiniAnswerBar observes it. */
export function AnswerCard({
  label,
  value,
  note,
  footer
}: {
  label: string;
  value: string;
  note?: string;
  footer?: ReactNode;
}) {
  return (
    <div
      id="mf-answer-anchor"
      data-mf-loop
      className="mf-edge-shine mf-rise-in relative overflow-hidden rounded-card bg-brand p-7 text-white"
      style={{ boxShadow: "var(--shadow-hero)" }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/10 to-transparent" />
      <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{label}</p>
      <p className="mf-num mt-2 text-6xl font-bold leading-none">{value}</p>
      {note ? <p className="mt-3 text-sm text-white/80">{note}</p> : null}
      {footer ? <div className="mt-4 border-t border-white/15 pt-3 text-sm text-white/80">{footer}</div> : null}
    </div>
  );
}
```

Create `packages/ui/src/verified-stamp.tsx`:

```tsx
/** Per-figure freshness stamp: "✓ 10 Jun 2026" → tap reveals the official source. */
export function VerifiedStamp({
  verifiedAt,
  sourceUrl,
  sourceLabel
}: {
  verifiedAt: string;
  sourceUrl: string;
  sourceLabel: string;
}) {
  const formatted = new Date(`${verifiedAt}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC"
  });
  return (
    <details className="relative inline-block align-middle">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-semibold text-positive transition-colors hover:bg-positive/10 [&::-webkit-details-marker]:hidden">
        <span aria-hidden>✓</span> {formatted}
      </summary>
      <div className="absolute left-0 z-30 mt-1.5 w-60 rounded-lg border border-ink/10 bg-white p-3 text-left shadow-lg">
        <p className="text-xs text-ink-muted">Verified {formatted} against:</p>
        <a href={sourceUrl} rel="noopener" className="mt-1 block break-words text-xs font-medium text-brand-accent underline underline-offset-2">
          {sourceLabel}
        </a>
      </div>
    </details>
  );
}
```

Create `packages/ui/src/caveat-chip.tsx`:

```tsx
import type { ReactNode } from "react";

/** Amber inline caveat — surfaces what competitors bury in footnotes. */
export function CaveatChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-warning ring-1 ring-warning/25">
      <svg aria-hidden viewBox="0 0 16 16" className="h-3 w-3 shrink-0 fill-current">
        <path d="M8 1.5 15 14H1L8 1.5Zm-.75 5h1.5v4h-1.5v-4Zm0 5h1.5v1.5h-1.5V11.5Z" />
      </svg>
      {children}
    </span>
  );
}
```

Add to `packages/ui/src/index.ts`:

```ts
export * from "./answer-card";
export * from "./verified-stamp";
export * from "./caveat-chip";
```

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @mathfamily/ui test && pnpm --filter @mathfamily/ui typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/answer-card.tsx packages/ui/src/verified-stamp.tsx packages/ui/src/caveat-chip.tsx packages/ui/src/index.ts packages/ui/tests/answer-components.test.tsx
git commit -m "feat(ui): AnswerCard (shining edge), VerifiedStamp, CaveatChip"
```

---

### Task 8: MiniAnswerBar + AnimatedNumber (client components)

**Files:**
- Create: `packages/ui/src/mini-answer-bar.tsx`, `packages/ui/src/animated-number.tsx`
- Modify: `packages/ui/src/index.ts`
- Test: `packages/ui/tests/client-widgets.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `packages/ui/tests/client-widgets.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { MiniAnswerBar } from "../src/mini-answer-bar";
import { AnimatedNumber } from "../src/animated-number";

describe("MiniAnswerBar", () => {
  it("starts hidden (translated off-screen, aria-hidden)", () => {
    render(<MiniAnswerBar summary="LGW drop-off · £7 / 10 min" verified />);
    const bar = screen.getByTestId("mini-answer-bar");
    expect(bar.getAttribute("aria-hidden")).toBe("true");
    expect(bar.className).toContain("translate-y-full");
    expect(bar.textContent).toContain("LGW drop-off");
    expect(bar.textContent).toContain("verified");
  });
});

describe("AnimatedNumber", () => {
  it("renders the formatted value", () => {
    const fmt = (p: number | null) => (p === null ? "—" : `£${(p / 100).toFixed(2)}`);
    render(<AnimatedNumber pence={700} render={fmt} />);
    expect(screen.getByText("£7.00")).toBeDefined();
  });
  it("settles on the new value after a change", async () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    const fmt = (p: number | null) => (p === null ? "—" : String(p));
    const { rerender } = render(<AnimatedNumber pence={100} render={fmt} />);
    await act(async () => { rerender(<AnimatedNumber pence={250} render={fmt} />); });
    expect(screen.getByText("250")).toBeDefined(); // reduced-motion → instant
    vi.unstubAllGlobals();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @mathfamily/ui test`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

Create `packages/ui/src/mini-answer-bar.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

/** Slim sticky bar that appears once #mf-answer-anchor (the AnswerCard, or any
 *  element given that id) has scrolled above the viewport — the answer never
 *  leaves the screen. */
export function MiniAnswerBar({ summary, verified }: { summary: string; verified?: boolean }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const anchor = document.getElementById("mf-answer-anchor");
    if (!anchor || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0),
      { threshold: 0 }
    );
    io.observe(anchor);
    return () => io.disconnect();
  }, []);
  return (
    <div
      data-testid="mini-answer-bar"
      aria-hidden={!show}
      className={`fixed inset-x-0 bottom-0 z-50 transition-transform duration-200 ${show ? "translate-y-0" : "translate-y-full"}`}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 border-t border-white/10 bg-brand/95 px-4 py-2.5 text-white backdrop-blur">
        <span className="mf-num truncate text-sm font-semibold">{summary}</span>
        {verified ? <span className="shrink-0 text-xs font-semibold text-emerald-300">✓ verified</span> : null}
      </div>
    </div>
  );
}
```

Create `packages/ui/src/animated-number.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

/** Count-up numeric output (~250ms, ease-out). Instant under reduced motion,
 *  on first render, or when either side of the transition is null. */
export function AnimatedNumber({
  pence,
  render
}: {
  pence: number | null;
  render: (pence: number | null) => string;
}) {
  const [display, setDisplay] = useState(pence);
  const prev = useRef(pence);
  useEffect(() => {
    const from = prev.current;
    prev.current = pence;
    if (
      pence === null ||
      from === null ||
      from === pence ||
      (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches)
    ) {
      setDisplay(pence);
      return;
    }
    const start = performance.now();
    const dur = 250;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      setDisplay(Math.round(from + (pence - from) * eased));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pence]);
  return <span className="mf-num">{render(display)}</span>;
}
```

Add to `packages/ui/src/index.ts`:

```ts
export * from "./mini-answer-bar";
export * from "./animated-number";
```

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @mathfamily/ui test && pnpm --filter @mathfamily/ui typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/mini-answer-bar.tsx packages/ui/src/animated-number.tsx packages/ui/src/index.ts packages/ui/tests/client-widgets.test.tsx
git commit -m "feat(ui): MiniAnswerBar sticky answer + AnimatedNumber count-up"
```

---

### Task 9: AmbientBackdrop, line glyphs, FeeGrid/FeeStat/AnswerLead upgrades

**Files:**
- Create: `packages/ui/src/ambient-backdrop.tsx`, `packages/ui/src/line-glyphs.tsx`
- Modify: `packages/ui/src/fee-grid.tsx`, `packages/ui/src/fee-stat.tsx`, `packages/ui/src/answer-lead.tsx`, `packages/ui/src/index.ts`
- Test: `packages/ui/tests/ambient.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `packages/ui/tests/ambient.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { AmbientBackdrop } from "../src/ambient-backdrop";
import { RunwayDivider, PlaneGlyph, SimGlyph } from "../src/line-glyphs";
import { FeeGrid } from "../src/fee-grid";

describe("AmbientBackdrop", () => {
  it("renders grid + two blobs, aria-hidden, pointer-events none", () => {
    const { container } = render(<AmbientBackdrop />);
    const root = container.firstElementChild!;
    expect(root.getAttribute("aria-hidden")).toBe("true");
    expect(root.className).toContain("pointer-events-none");
    expect(container.querySelector(".mf-grid-bg")).not.toBeNull();
    expect(container.querySelector(".mf-blob")).not.toBeNull();
    expect(container.querySelector(".mf-blob-2")).not.toBeNull();
  });
});

describe("line glyphs", () => {
  it("render decorative svgs", () => {
    for (const C of [RunwayDivider, PlaneGlyph, SimGlyph]) {
      const { container } = render(<C />);
      expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    }
  });
});

describe("FeeGrid highlightRow", () => {
  it("marks the winner row", () => {
    const { container } = render(
      <FeeGrid columns={["Option", "7 days"]} rows={[["Meet & Greet", "£90"], ["Long Stay", "£55"]]} highlightRow={1} />
    );
    const rows = container.querySelectorAll("tbody tr");
    expect(rows[1].className).toContain("mf-winner-row");
    expect(rows[0].className).not.toContain("mf-winner-row");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @mathfamily/ui test`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `packages/ui/src/ambient-backdrop.tsx`:

```tsx
/** Decorative page-top atmosphere: masked dot grid + two slow-drifting blobs.
 *  Mount once per layout inside a `relative` body wrapper, before <main>. */
export function AmbientBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] overflow-hidden">
      <div className="mf-grid-bg absolute inset-0" />
      <div
        className="mf-blob absolute -top-24 right-[-10%] h-[420px] w-[420px] rounded-full"
        style={{ background: "color-mix(in srgb, var(--color-brand) 14%, transparent)" }}
      />
      <div
        className="mf-blob-2 absolute top-32 left-[-12%] h-[360px] w-[360px] rounded-full"
        style={{ background: "color-mix(in srgb, var(--color-brand-accent) 10%, transparent)" }}
      />
    </div>
  );
}
```

Create `packages/ui/src/line-glyphs.tsx`:

```tsx
/** Brand line-art glyph set — decorative accents, never photos. All stroke-based,
 *  currentColor, aria-hidden. Use at low opacity (e.g. className="text-brand/20"). */

export function PlaneGlyph({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M44 24 28 22 16 6h-4l6 16-12 2-4-6H0l4 8-4 8h2l4-6 12 2-6 16h4l12-16 16-2c2 0 2-4 0-4Z" />
    </svg>
  );
}

export function TowerGlyph({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M16 14h16l-2 10h-12l-2-10Zm6 10v18m4-18v18m-10 0h16M14 14l2-6h16l2 6M24 4v4" />
    </svg>
  );
}

export function LuggageGlyph({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="12" y="14" width="24" height="26" rx="4" />
      <path d="M19 14V9a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v5M19 22v10m10-10v10" />
    </svg>
  );
}

export function SimGlyph({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 6h14l8 8v26a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
      <rect x="18" y="22" width="12" height="12" rx="2" />
      <path d="M24 22v12M18 28h12" />
    </svg>
  );
}

/** Runway-dash section divider (ParkMath flavour). */
export function RunwayDivider({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 8" aria-hidden preserveAspectRatio="none" className={className ?? "h-2 w-full text-ink/15"}>
      <line x1="0" y1="4" x2="400" y2="4" stroke="currentColor" strokeWidth="2" strokeDasharray="18 14" />
    </svg>
  );
}
```

In `packages/ui/src/fee-grid.tsx`, change the signature and row rendering:

```tsx
import type { ReactNode } from "react";

export function FeeGrid({
  columns,
  rows,
  caption,
  highlightRow
}: {
  columns: string[];
  rows: ReactNode[][];
  caption?: string;
  highlightRow?: number;
}) {
```

and replace the `<tr>` (keeping everything else identical):

```tsx
            {rows.map((cells, i) => (
              <tr
                key={i}
                className={`border-b border-ink/5 transition-[background-color,box-shadow] duration-150 odd:bg-white even:bg-surface/40 hover:bg-brand-accent/[0.06] hover:shadow-[inset_2px_0_0_0_var(--color-brand-accent)] ${
                  i === highlightRow ? "mf-winner-row bg-brand-accent/[0.07] font-semibold odd:bg-brand-accent/[0.07] even:bg-brand-accent/[0.07]" : ""
                }`}
              >
```

Also swap the container's flat border for the gradient edge — change the wrapper div:

Old: `className="overflow-hidden rounded-card border border-ink/10 bg-white"`
New: `className="mf-edge overflow-hidden rounded-card bg-white"`

In `packages/ui/src/freshness-badge.tsx`, replace the dot with a drawn tick — swap the `<span aria-hidden …h-1.5 w-1.5…/>` dot for:

```tsx
      <svg aria-hidden viewBox="0 0 12 12" className="h-3 w-3 shrink-0" fill="none">
        <path d="M2.5 6.5 5 9l4.5-5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mf-tick" />
      </svg>
```

(The existing text-only tests in `components.test.tsx` keep passing — they assert text, not the dot.)

In `packages/ui/src/sources-block.tsx`, add the referee/independence statement: locate the block's outer container and append this paragraph as its last child (after the existing method/sources content, exact JSX):

```tsx
      <p className="mt-3 border-t border-ink/10 pt-3 text-xs text-ink-muted">
        <strong className="font-semibold text-ink">Independent:</strong> we are not owned by any airport, network or
        booking site. Links marked * may earn us a commission — commissions never affect the figures we publish.
      </p>
```

In `packages/ui/src/fee-stat.tsx`, upgrade the inner highlight — replace the hairline div:

Old:
```tsx
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/20" />
```
New:
```tsx
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white/12 to-transparent" />
```

In `packages/ui/src/answer-lead.tsx`, swap the flat border for the gradient edge (keep the brand left rule):

Old: `className="mf-rise-in rounded-card border border-ink/5 border-l-4 border-l-brand-accent bg-gradient-to-br from-surface to-white p-6"`
New: `className="mf-edge mf-rise-in rounded-card border-l-4 border-l-brand-accent bg-gradient-to-br from-surface to-white p-6"`

Add to `packages/ui/src/index.ts`:

```ts
export * from "./ambient-backdrop";
export * from "./line-glyphs";
```

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @mathfamily/ui test && pnpm --filter @mathfamily/ui typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/ambient-backdrop.tsx packages/ui/src/line-glyphs.tsx packages/ui/src/fee-grid.tsx packages/ui/src/fee-stat.tsx packages/ui/src/answer-lead.tsx packages/ui/src/index.ts packages/ui/tests/ambient.test.tsx
git commit -m "feat(ui): ambient backdrop, line glyphs, winner rows, gradient card edges"
```

---

### Task 10: ParkMath integration

**Files:**
- Modify: `apps/parkmath/app/layout.tsx`, `apps/parkmath/app/page.tsx`, `apps/parkmath/app/drop-off-charges/[airport]/page.tsx`, `apps/parkmath/components/drop-off-calculator.tsx`, `apps/parkmath/app/airport-parking/[airport]/page.tsx`, `apps/parkmath/app/opengraph-image.tsx`, `apps/parkmath/components/family-links.tsx`, `apps/parkmath/components/airport-search.tsx`

- [ ] **Step 1: Layout — ambient backdrop + logo**

In `apps/parkmath/app/layout.tsx`:
- Add `AmbientBackdrop` to the `@mathfamily/ui` import list.
- Change the body block:

Old:
```tsx
      <body className="bg-white font-sans text-ink antialiased">
        <ScrollProgress />
        <ScrollReveal />
        <SiteHeader brandName="ParkMath" links={NAV} />
```
New:
```tsx
      <body className="relative bg-white font-sans text-ink antialiased">
        <ScrollProgress />
        <ScrollReveal />
        <AmbientBackdrop />
        <SiteHeader brandName="ParkMath" brandPrefix="Park" links={NAV} />
```

- [ ] **Step 2: Home page — UK coverage map beside the hero**

In `apps/parkmath/app/page.tsx`:
- Add `UkMap` to the `@mathfamily/ui` import.
- Replace the hero section:

Old:
```tsx
      <section className="space-y-5">
        <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
          What does it cost to <span className="text-brand-accent">drop someone off</span> at a UK airport?
        </h1>
        <p className="max-w-2xl text-lg text-ink-muted">
          Every UK airport&apos;s drop-off charge, time limit, penalty and the free alternative — verified against
          official airport pages and date-stamped.
        </p>
        <AirportSearch airports={airports} feeBySlug={feeBySlug} />
      </section>
```
New:
```tsx
      <section className="relative">
        <UkMap
          markers={airports.map((a) => ({ lat: a.lat, lng: a.lng }))}
          className="pointer-events-none absolute -top-6 right-0 hidden h-[340px] text-brand sm:block"
        />
        <div className="relative space-y-5">
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
            What does it cost to <span className="text-brand-accent">drop someone off</span> at a UK airport?
          </h1>
          <p className="max-w-2xl text-lg text-ink-muted">
            Every UK airport&apos;s drop-off charge, time limit, penalty and the free alternative — verified against
            official airport pages and date-stamped.
          </p>
          <AirportSearch airports={airports} feeBySlug={feeBySlug} />
        </div>
      </section>
```

- [ ] **Step 3: Airport drop-off page — AnswerCard, map pin, mini bar, caveat chips, verified stamp**

In `apps/parkmath/app/drop-off-charges/[airport]/page.tsx`:
- Extend the `@mathfamily/ui` import: add `AnswerCard, CaveatChip, MiniAnswerBar, UkMap, VerifiedStamp` (keep `FeeStat` removed from this page — replace its usage below).
- After the `<header>` block, add the chips row:

```tsx
      {!record.isFree ? (
        <div className="flex flex-wrap gap-2">
          {record.maxStayMinutes !== null ? <CaveatChip>Max stay {record.maxStayMinutes} min</CaveatChip> : null}
          {record.penaltyPence !== null ? <CaveatChip>{formatPence(record.penaltyPence)} penalty if unpaid</CaveatChip> : null}
          {record.paymentDeadline ? <CaveatChip>Pay by {record.paymentDeadline}</CaveatChip> : null}
        </div>
      ) : null}
```

- Replace the `<FeeStat …/>` block:

Old:
```tsx
      <FeeStat
        label="Current drop-off charge"
        value={record.isFree ? "Free" : formatPence(record.bands[0]?.totalPence ?? 0)}
        note={record.isFree ? "No forecourt charge" : record.feeSummary}
      />
```
New:
```tsx
      <div className="grid items-start gap-5 sm:grid-cols-[1fr_220px]">
        <AnswerCard
          label="Current drop-off charge"
          value={record.isFree ? "Free" : formatPence(record.bands[0]?.totalPence ?? 0)}
          note={record.isFree ? "No forecourt charge" : record.feeSummary}
          footer={<VerifiedStamp verifiedAt={record.verifiedAt} sourceUrl={record.sourceUrl} sourceLabel={`Official ${airport.name} page`} />}
        />
        <UkMap markers={[{ lat: airport.lat, lng: airport.lng, active: true }]} className="hidden text-brand sm:block" />
      </div>
      <MiniAnswerBar
        summary={`${airport.iata} drop-off · ${record.isFree ? "Free" : record.feeSummary}`}
        verified
      />
```

Note: `VerifiedStamp` renders dark-on-white styling inside the navy card via its popover; the summary line itself uses `text-positive` which passes on navy at this size — if contrast looks weak in review, wrap it: `<span className="rounded bg-white/90 px-1.5">…</span>`. Implementer judgement, but contrast ≥4.5:1 is mandatory.

- [ ] **Step 4: DropOffCalculator — count-up + warning chips + slider glow**

Replace the result/warnings section of `apps/parkmath/components/drop-off-calculator.tsx`:

Old:
```tsx
      <div className="mt-5 rounded-xl bg-surface p-4">
        <p id="calc-result" data-testid="calculator-result" aria-live="polite" className="mf-num text-4xl font-bold text-brand">
          <span key={cost} className="mf-fade-in inline-block">{cost}</span>
        </p>
      </div>
      <ul className="mt-3 space-y-1 text-sm text-ink-muted">
        {quote.warnings.map((w) => (
          <li key={w.code}>{w.message}</li>
        ))}
      </ul>
```
New:
```tsx
      <div className="mt-5 rounded-xl bg-surface p-4">
        <p id="calc-result" data-testid="calculator-result" aria-live="polite" className="text-4xl font-bold text-brand">
          <AnimatedNumber pence={quote.costPence} render={(p) => (p === null ? "Beyond published tariff" : formatPence(p))} />
        </p>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {quote.warnings.map((w) => (
          <li key={w.code} className="mf-rise-in"><CaveatChip>{w.message}</CaveatChip></li>
        ))}
      </ul>
```

Imports: add `import { AnimatedNumber, CaveatChip } from "@mathfamily/ui";` and drop the now-unused `cost` variable (delete the `const cost = …` line). Also add the section container classes `mf-edge` in place of `border border-ink/10`:

Old: `className="rounded-card border border-ink/10 bg-white p-6"`
New: `className="mf-edge rounded-card bg-white p-6"`

Slider glow — change the range input className:

Old: `className="h-2 w-full cursor-pointer accent-brand-accent"`
New: `className="h-2 w-full cursor-pointer accent-brand-accent transition-shadow focus-visible:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-brand-accent)_25%,transparent)] active:shadow-[0_0_12px_color-mix(in_srgb,var(--color-brand-accent)_45%,transparent)]"`

- [ ] **Step 5: Parking page — crown the cheapest 7-day row**

In `apps/parkmath/app/airport-parking/[airport]/page.tsx`, before the `return`, compute the winner index:

```tsx
  const sevenDayPrices = record.products.map((p) => p.prices.find((x) => x.days === 7)?.totalPence ?? Number.POSITIVE_INFINITY);
  const winnerIndex = sevenDayPrices.indexOf(Math.min(...sevenDayPrices));
```

Then pass it to the grid and crown the cell — replace the `rows={…}` of `<FeeGrid …>`:

Old:
```tsx
        rows={record.products.map((p) => [
          p.name,
          ...[3, 7, 14].map((d) => {
            const price = p.prices.find((x) => x.days === d);
            return price ? formatPence(price.totalPence) : "—";
          })
        ])}
```
New (adds `highlightRow` prop alongside):
```tsx
        highlightRow={winnerIndex >= 0 ? winnerIndex : undefined}
        rows={record.products.map((p, i) => [
          i === winnerIndex ? (
            <span key="w" className="inline-flex items-center gap-2">
              {p.name}
              <span className="rounded-full bg-brand-accent/15 px-2 py-0.5 text-[11px] font-bold text-brand-accent">Cheapest 7-day</span>
            </span>
          ) : (
            p.name
          ),
          ...[3, 7, 14].map((d) => {
            const price = p.prices.find((x) => x.days === d);
            return price ? formatPence(price.totalPence) : "—";
          })
        ])}
```

- [ ] **Step 6: Card links get sheen + press; glyph accents; heading underlines**

- In `apps/parkmath/components/family-links.tsx` and `apps/parkmath/components/airport-search.tsx`: find each card-style `<a>`/`<Link>` element (the airport result cards and the family cross-link cards) and append `mf-sheen mf-press` to its `className`. Mechanical 1-line edits; do not change any other markup.
- In `apps/parkmath/app/page.tsx`: add `RunwayDivider` to the ui import and insert `<RunwayDivider className="h-2 w-full text-brand/15" />` immediately before the `<EmailCaptureSlot …/>` element — the runway-dash section divider.
- In `apps/parkmath/app/drop-off-charges/[airport]/page.tsx`: append `mf-underline-grow` to the className of the two section `<h2>` elements ("If you don't pay" and "Frequently asked questions") and add `mf-reveal` to their parent `<section>` classNames so the underline grows on reveal.

- [ ] **Step 7: Favicon, OG image — stamp the glyph**

Create `apps/parkmath/app/icon.svg` (Next.js serves this as the favicon automatically):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect x="1" y="1" width="30" height="30" rx="8" fill="#0a2540"/>
  <rect x="9" y="11.5" width="14" height="3.4" rx="1.7" fill="#2563eb"/>
  <rect x="9" y="17.5" width="14" height="3.4" rx="1.7" fill="#ffffff"/>
</svg>
```

In `apps/parkmath/app/opengraph-image.tsx`, add the equals tile above the title — replace the title div:

Old:
```tsx
        <div style={{ display: "flex", fontSize: 88, fontWeight: 700 }}>ParkMath</div>
```
New:
```tsx
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 10, width: 84, height: 84, borderRadius: 20, backgroundColor: "#0d3158", padding: 20 }}>
            <div style={{ display: "flex", height: 10, borderRadius: 5, backgroundColor: "#2563eb" }} />
            <div style={{ display: "flex", height: 10, borderRadius: 5, backgroundColor: "#ffffff" }} />
          </div>
          <div style={{ display: "flex", fontSize: 88, fontWeight: 700 }}>ParkMath</div>
        </div>
```

Apply the same tile (with `backgroundColor: "#0d3158"` swapped to a teal-tinted `#0f3d39` and bar colour `#0d9488`) to `apps/roammath/app/opengraph-image.tsx` in Task 11, and to the per-airport OG images `apps/parkmath/app/airport-parking/[airport]/opengraph-image.tsx` and `apps/parkmath/app/drop-off-charges/[airport]/opengraph-image.tsx` if their layout has room (smaller tile, 56px, top-left) — read those files first and keep their existing text content unchanged.

- [ ] **Step 8: Verify**

Run: `pnpm --filter parkmath test && pnpm --filter parkmath typecheck && pnpm --filter parkmath build`
Expected: tests PASS, typecheck clean, static build succeeds.

- [ ] **Step 9: Commit**

```bash
git add apps/parkmath
git commit -m "feat(parkmath): atmosphere, UK maps, answer card, mini bar, chips, winner rows, OG glyph"
```

---

### Task 11: RoamMath integration (iso2, flags, region map)

**Files:**
- Modify: `packages/data/src/roaming.ts:17-27`, `packages/data/datasets/roammath/roaming.json`, `apps/roammath/app/layout.tsx`, `apps/roammath/app/roaming/page.tsx`, `apps/roammath/app/roaming/[country]/page.tsx`, `apps/roammath/components/roaming-calculator.tsx`, `apps/roammath/app/opengraph-image.tsx`, `apps/roammath/components/family-links.tsx`
- Test: `packages/data/tests/roaming-iso2.test.ts`

- [ ] **Step 1: Write the failing iso2 test**

Create `packages/data/tests/roaming-iso2.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { loadRoamingDataset } from "../src";

describe("roaming destinations iso2", () => {
  it("every destination has a lowercase iso2 code", () => {
    for (const d of loadRoamingDataset().destinations) {
      expect(d.iso2, d.countrySlug).toMatch(/^[a-z]{2}$/);
    }
  });
});
```

Run: `pnpm --filter @mathfamily/data test` — expected FAIL.

- [ ] **Step 2: Extend the schema**

In `packages/data/src/roaming.ts`, add to `RoamingDestinationSchema` (after `countryName`):

```ts
    iso2: z.string().regex(/^[a-z]{2}$/, "expected lowercase ISO 3166-1 alpha-2"),
```

- [ ] **Step 3: Inject iso2 into the dataset**

Run this one-off from the repo root (it preserves key order by rebuilding each record):

```bash
node -e '
const fs = require("fs");
const p = "packages/data/datasets/roammath/roaming.json";
const map = {spain:"es",france:"fr",italy:"it",portugal:"pt",greece:"gr",germany:"de",ireland:"ie",netherlands:"nl",belgium:"be",austria:"at",switzerland:"ch",poland:"pl",croatia:"hr",cyprus:"cy",malta:"mt",turkey:"tr",usa:"us",canada:"ca",mexico:"mx",australia:"au","new-zealand":"nz",uae:"ae",thailand:"th",japan:"jp",china:"cn",india:"in","south-africa":"za",egypt:"eg",morocco:"ma",tunisia:"tn",norway:"no",iceland:"is",sweden:"se",denmark:"dk",czechia:"cz",hungary:"hu",romania:"ro",bulgaria:"bg",albania:"al",montenegro:"me"};
const d = JSON.parse(fs.readFileSync(p, "utf8"));
d.destinations = d.destinations.map(({countrySlug, countryName, ...rest}) => {
  if (!map[countrySlug]) throw new Error("no iso2 for " + countrySlug);
  return { countrySlug, countryName, iso2: map[countrySlug], ...rest };
});
fs.writeFileSync(p, JSON.stringify(d, null, 2) + "\n");
console.log("done", d.destinations.length);
'
```

Run: `pnpm --filter @mathfamily/data test` — expected PASS. Then `pnpm -r typecheck`.

```bash
git add packages/data/src/roaming.ts packages/data/datasets/roammath/roaming.json packages/data/tests/roaming-iso2.test.ts
git commit -m "feat(data): iso2 country codes on roaming destinations"
```

- [ ] **Step 4: Layout — ambient + logo**

`apps/roammath/app/layout.tsx` mirrors Task 10 Step 1: add `AmbientBackdrop` to the ui import, `relative` on body, `<AmbientBackdrop />` after `<ScrollReveal />`, and `brandPrefix="Roam"` on `SiteHeader`. (RoamMath's `@theme` override automatically tints the blobs/grid teal.)

- [ ] **Step 5: Country page — flag watermark, region map, mini bar**

In `apps/roammath/app/roaming/[country]/page.tsx`:
- Extend ui import with `CountryFlag, MiniAnswerBar, RegionMap`.
- Replace the `<header>`:

Old:
```tsx
      <header className="space-y-3">
        <h1 className="text-3xl font-bold text-ink">{destination.countryName} roaming charges: all four UK networks compared</h1>
```
New:
```tsx
      <header className="relative space-y-3">
        <CountryFlag
          iso2={destination.iso2}
          size={260}
          className="pointer-events-none absolute -top-10 right-0 opacity-[0.06]"
        />
        <div className="flex items-center gap-3">
          <CountryFlag iso2={destination.iso2} size={36} className="shrink-0 rounded-full shadow-sm" />
          <h1 className="text-3xl font-bold text-ink">{destination.countryName} roaming charges: all four UK networks compared</h1>
        </div>
```
(keep the badge/citation row, close `</header>` as before).

- Wrap the existing `<AnswerLead …>` so the mini bar has an anchor, and add the map + bar:

Old:
```tsx
      <AnswerLead answer={m.answer}>{networkFacts}</AnswerLead>
```
New:
```tsx
      <div id="mf-answer-anchor">
        <AnswerLead answer={m.answer}>{networkFacts}</AnswerLead>
      </div>
      <RegionMap iso2={destination.iso2} className="mx-auto -my-2 hidden w-full max-w-xl text-ink sm:block" />
      <MiniAnswerBar summary={`${destination.countryName} · ${m.answer}`} verified />
```

- [ ] **Step 6: Roaming index — flag chip grid**

In `apps/roammath/app/roaming/page.tsx`:
- Add `CountryFlag` to the ui import.
- After the intro `<p className="text-ink-muted">…</p>`, insert the chip grid:

```tsx
      <nav aria-label="Destinations" className="mf-reveal flex flex-wrap gap-2">
        {destinations.map((dest) => (
          <Link
            key={dest.countrySlug}
            href={`/roaming/${dest.countrySlug}`}
            className="mf-press inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-brand-accent/40 hover:bg-brand-accent/5"
          >
            <CountryFlag iso2={dest.iso2} size={18} />
            {dest.countryName}
          </Link>
        ))}
      </nav>
```

- In the table rows, add the small flag to the destination cell — replace the first cell `<Link>`:

Old:
```tsx
      <Link
        key="dest"
        href={`/roaming/${dest.countrySlug}`}
        className="font-medium text-brand-accent underline-offset-4 hover:underline"
      >
        {dest.countryName}
      </Link>,
```
New:
```tsx
      <Link
        key="dest"
        href={`/roaming/${dest.countrySlug}`}
        className="inline-flex items-center gap-2 font-medium text-brand-accent underline-offset-4 hover:underline"
      >
        <CountryFlag iso2={dest.iso2} size={16} />
        {dest.countryName}
      </Link>,
```

- [ ] **Step 7: RoamingCalculator — count-up + verdict highlight + caveat chips**

In `apps/roammath/components/roaming-calculator.tsx`:
- Import: `import { AnimatedNumber, CaveatChip } from "@mathfamily/ui";`
- Section container: `className="rounded-card border border-ink/10 bg-white p-6"` → `className="mf-edge rounded-card bg-white p-6"`.
- Network rows — replace the price span:

Old:
```tsx
            <span className="mf-num font-medium text-ink">
              {n.totalPence === null ? "no standard pass" : n.included ? "included" : formatPence(n.totalPence)}
            </span>
```
New:
```tsx
            <span className="font-medium text-ink">
              {n.totalPence === null ? <span className="mf-num">no standard pass</span> : n.included ? <span className="mf-num">included</span> : (
                <AnimatedNumber pence={n.totalPence} render={(p) => (p === null ? "—" : formatPence(p))} />
              )}
            </span>
```
- eSIM row price: `…{formatPence(r.esimChoice.totalPence)}…` span → `<AnimatedNumber pence={r.esimChoice.totalPence} render={(p) => (p === null ? "—" : formatPence(p))} />` (keep the surrounding span classes minus `mf-num`).
- Verdict paragraph gets the highlight treatment:

Old: `className="mt-2 border-t border-ink/10 pt-3 text-base font-bold text-brand"`
New: `className="mt-2 rounded-lg border-t border-ink/10 bg-brand-accent/[0.07] p-3 text-base font-bold text-brand"`
- Warnings list → chips:

Old:
```tsx
      <ul className="mt-3 space-y-1 text-xs text-ink-muted">
        {r.warnings.map((w) => (
          <li key={w.code}>{w.message}</li>
        ))}
      </ul>
```
New:
```tsx
      <ul className="mt-3 flex flex-wrap gap-2">
        {r.warnings.map((w) => (
          <li key={w.code}><CaveatChip>{w.message}</CaveatChip></li>
        ))}
      </ul>
```

- [ ] **Step 8: Favicon, OG image + family links sheen**

- Create `apps/roammath/app/icon.svg` — same SVG as Task 10 Step 7 but with `fill="#134e4a"` on the tile and `fill="#0d9488"` on the top bar.
- `apps/roammath/app/opengraph-image.tsx`: apply the Task 10 Step 7 OG tile with `backgroundColor: "#0f3d39"` and top-bar `#0d9488` next to the "RoamMath" title (same structure).
- `apps/roammath/components/family-links.tsx`: append `mf-sheen mf-press` to the card link classNames (mechanical, as in Task 10 Step 6).
- Both range inputs in `apps/roammath/components/roaming-calculator.tsx` get the Task 10 Step 4 slider-glow className swap (`accent-brand-accent` → the same `transition-shadow focus-visible:… active:…` string).

- [ ] **Step 9: Verify**

Run: `pnpm --filter roammath typecheck && pnpm --filter roammath build && pnpm --filter @mathfamily/ui test`
Expected: clean.

- [ ] **Step 10: Commit**

```bash
git add apps/roammath packages/data
git commit -m "feat(roammath): flags, region map, chip grid, count-up calculator, OG glyph"
```

---

### Task 12: Playwright e2e — design behaviours

**Files:**
- Create: `apps/parkmath/e2e/design.spec.ts`

- [ ] **Step 1: Write the spec**

Create `apps/parkmath/e2e/design.spec.ts` (follow the existing patterns in `apps/parkmath/e2e/drop-off.spec.ts` for baseURL/server assumptions):

```ts
import { test, expect } from "@playwright/test";

test.describe("visual richness behaviours", () => {
  test("header carries the =Math logo lockup", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header");
    await expect(header.locator("svg.mf-logo-tile")).toBeVisible();
    await expect(header.getByText("Park", { exact: true })).toBeVisible();
    await expect(header.getByText("Math", { exact: true })).toBeVisible();
  });

  test("mini answer bar appears only after the answer card scrolls away", async ({ page }) => {
    await page.goto("/drop-off-charges/heathrow");
    const bar = page.getByTestId("mini-answer-bar");
    await expect(bar).toHaveAttribute("aria-hidden", "true");
    await page.mouse.wheel(0, 4000);
    await expect(bar).toHaveAttribute("aria-hidden", "false");
    await expect(bar).toBeInViewport();
  });

  test("caveat chips surface penalty info on charging airports", async ({ page }) => {
    await page.goto("/drop-off-charges/heathrow");
    await expect(page.getByText(/penalty if unpaid/).first()).toBeVisible();
  });

  test("reduced motion shows content immediately with no looping animations", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const reveal = page.locator(".mf-reveal").first();
    await expect(reveal).toHaveCSS("opacity", "1");
    const shine = page.locator(".mf-edge-shine").first();
    if (await shine.count()) {
      const anim = await shine.evaluate((el) => getComputedStyle(el, "::before").animationName);
      expect(anim).toBe("none");
    }
  });

  test("answer is server-rendered before any JS", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto("/drop-off-charges/heathrow");
    await expect(page.locator("#mf-answer-anchor")).toBeVisible();
    await ctx.close();
  });
});
```

Adjust the two airport assumptions if needed: pick any airport from `packages/data/datasets/parkmath/drop-off-fees.json` with `penaltyPence !== null` (replace `heathrow` consistently if it has none).

- [ ] **Step 2: Run e2e**

Run: `pnpm --filter parkmath e2e`
Expected: PASS (the playwright config manages the dev server as for existing specs).

- [ ] **Step 3: Commit**

```bash
git add apps/parkmath/e2e/design.spec.ts
git commit -m "test(parkmath): e2e for logo, mini answer bar, chips, reduced motion, no-JS answer"
```

---

### Task 13: Full verification sweep

- [ ] **Step 1: Workspace-wide checks**

Run: `pnpm -r test && pnpm -r typecheck && pnpm -r build`
Expected: all green. Fix anything that isn't before proceeding.

- [ ] **Step 2: Manual visual pass (dev server)**

Run `pnpm --filter parkmath dev` and check on a phone-width viewport (375px) and desktop:
- home: grid texture + blobs visible but subtle; UK map dots; logo entrance once (reload → no re-animation in same tab).
- airport page: answer card edge shine; map pin pulse; chips; mini bar on scroll; calculator count-up.
- No text sits on top of a blob/map at unreadable contrast; nothing shifts layout.
Then `pnpm --filter roammath dev`: teal blobs, flag chips, flag watermark, region map highlight, calculator verdict highlight.

- [ ] **Step 3: Final commit & wrap-up**

```bash
git status   # confirm clean or commit stragglers
```

Use the superpowers:finishing-a-development-branch skill to close out.

---

## Self-review notes (already applied)

- `FeeStat` keeps its hero shadow but is no longer used on the airport drop-off page (replaced by `AnswerCard`); it remains on the home page stat trio — intentional.
- `AnswerCard` owns `id="mf-answer-anchor"`; RoamMath's country page reuses the id on a wrapper div instead (no `AnswerCard` there — the calculator is that page's hero). `MiniAnswerBar` only assumes the id exists.
- Both infinite loops carry `data-mf-loop` (`AnswerCard`, `UkMap`, `RegionMap`) and are paused off-screen by Task 2's observer and disabled by reduced-motion CSS.
- The generator must run before Task 5's imports exist — tasks are ordered accordingly (4 → 5).
- No `vitest.config.*` / `vite.config.*` files are created anywhere (volume deadlock constraint).

**Conscious deviations from the spec (carry to review):**
- *Email-capture success tick*: the MailerLite form posts to an external action and navigates away — there is no client-side success state to animate today. Deferred until the form gains an inline success response.
- *Per-number verification*: the tap-to-source `VerifiedStamp` lands on the hero answer figures; comparison tables keep their existing verified-date caption/column rather than a stamp in every cell (noise + tap-target size on mobile).
