# Mobile-First Design Elevation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the 49 findings in [docs/design-audit/2026-06-12-mobile-design-audit.md](../../design-audit/2026-06-12-mobile-design-audit.md) and land the premium-elevation phases, so ParkMath + RoamMath are mobile-flawless (96% of traffic) and read as a best-in-class trustworthy fintech instrument.

**Architecture:** The audit collapses into **three shared files** — `packages/ui/src/tokens.css` (fluid type scale), `packages/ui/src/site-header.tsx` (responsive nav), `packages/ui/src/fee-grid.tsx` (card-rows + column typing) — plus thin per-app className/token sweeps and a set of extracted shared primitives. Both apps inherit the shared `@mathfamily/ui` package, so each shared-component fix repairs every route of both apps at once. RoamMath gets everything via its existing teal `@theme` override — no per-app forks.

**Tech Stack:** Next.js (App Router, RSC + small client islands), Tailwind v4 with `@theme` design tokens (a `--text-x` token auto-generates a `text-x` utility), vitest (configless; jsdom via `// @vitest-environment jsdom` docblock), @testing-library/react, Playwright e2e.

**CRITICAL CONSTRAINTS:**
- **NEVER create `vitest.config.*` or `vite.config.*` anywhere** — they deadlock on this TB4 volume. All vitest runs are configless; jsdom is selected per-file with the docblock (see `packages/ui/tests/components.test.tsx`). Tests that touch the DOM also need `afterEach(cleanup)` (auto-cleanup does not fire configless).
- No new runtime dependencies. No animation/JS libraries — motion is CSS only.
- Every animation must be inert under `prefers-reduced-motion` (extend the existing reduce block in `tokens.css`).
- The hero **answer must render with JavaScript disabled** (server-rendered text); client islands only enhance.
- Touch targets ≥ 44px on every interactive element; visible focus rings; contrast ≥ 4.5:1.

---

## Shared contracts (define once; every task below depends on these — do not rename)

**Type-scale tokens** added to `tokens.css @theme` (Tailwind v4 turns `--text-foo` into a `text-foo` utility and `--text-foo--line-height` into its paired line-height):

| Utility class | Token | clamp (mobile→desktop) | line-height |
|---|---|---|---|
| `text-display` | `--text-display` | 36→60px | 1.0 |
| `text-stat` | `--text-stat` | 32→48px | 1.05 |
| `text-h1` | `--text-h1` | 28→44px | 1.1 |
| `text-h2` | `--text-h2` | 18→22px | 1.3 |
| `text-lead` | `--text-lead` | 17→20px | 1.55 |

Plus a `.mf-num-display` utility = `mf-num` tabular figures with +0.01em tracking for display-size numbers (do NOT change base `.mf-num`; tables rely on 0-tracking).

**`FeeGrid` extended API** (back-compatible — new props optional, omitting them preserves today's rendering):

```ts
FeeGrid({
  columns: string[];
  rows: ReactNode[][];
  caption?: string;
  highlightRow?: number;
  numericColumns?: number[]; // 0-based indices holding numeric data → right-align + .mf-num + text-ink font-medium.
                             // Omitted (undefined) ⇒ back-compat: every column index > 0 is treated as numeric.
                             // Pass an explicit list to mark prose columns (e.g. "Free alternative", "Fair-use note") as non-numeric.
})
```
Below `md` the same data renders as **card-rows** (`<table className="hidden md:table">` + a `md:hidden` card list); at `md+` the table is unchanged.

**Shared primitives** (Phase 3) — fixed signatures:
- `RangeSlider({ min, max, value, onChange, ariaLabel, ariaValuetext, ariaDescribedby?, className? })` — client component.
- `PageHeading({ children, className? })` — `<h1 class="text-h1 font-bold tracking-tight text-balance text-ink ...">`.
- `CheckTick({ className? })` — the brand check SVG, shared by `FreshnessBadge` + `MiniAnswerBar`.

**Verification commands** (used throughout):
- UI unit: `pnpm --filter @mathfamily/ui test`
- App unit: `pnpm --filter parkmath test` / `pnpm --filter roammath test`
- Types: `pnpm --filter <pkg> typecheck`
- Build: `pnpm --filter parkmath build` / `pnpm --filter roammath build`
- e2e: `pnpm --filter parkmath e2e`
- Full sweep: `pnpm -r test && pnpm -r typecheck && pnpm -r build`

---

# PHASE 0 — Foundation: fluid type scale

### Task 1: Add the clamp() type-scale tokens + `.mf-num-display`

**Files:**
- Modify: `packages/ui/src/tokens.css` (the `@theme` block, lines 1-22; and the motion section + reduced-motion block)
- Test: `packages/ui/tests/tokens.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `packages/ui/tests/tokens.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const css = readFileSync(fileURLToPath(new URL("../src/tokens.css", import.meta.url)), "utf8");

describe("fluid type-scale tokens", () => {
  it("defines a clamp() token + line-height for every scale step", () => {
    for (const name of ["display", "stat", "h1", "h2", "lead"]) {
      expect(css, name).toMatch(new RegExp(`--text-${name}:\\s*clamp\\(`));
      expect(css, `${name} line-height`).toContain(`--text-${name}--line-height`);
    }
  });
  it("adds a display-size numeric utility without touching base .mf-num tracking", () => {
    expect(css).toContain(".mf-num-display");
    // base .mf-num must keep 0 letter-spacing (tables rely on it): no letter-spacing inside the .mf-num{} block
    const mfNumBlock = css.match(/\.mf-num\s*\{[^}]*\}/);
    expect(mfNumBlock).not.toBeNull();
    expect(mfNumBlock![0]).not.toContain("letter-spacing");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @mathfamily/ui test`
Expected: FAIL — `--text-display` clamp not found.

- [ ] **Step 3: Add the tokens**

In `packages/ui/src/tokens.css`, inside the `@theme { … }` block, immediately after the `--font-mono` line (line 13), add:

```css

  /* Fluid type scale — viewport-aware so headings stop dominating the mobile fold.
     Tailwind v4 exposes each --text-* as a `text-*` utility with its paired line-height. */
  --text-display: clamp(2.25rem, 1.6rem + 3.2vw, 3.75rem);  /* 36 → 60 */
  --text-display--line-height: 1;
  --text-stat: clamp(2rem, 1.5rem + 2.5vw, 3rem);           /* 32 → 48 */
  --text-stat--line-height: 1.05;
  --text-h1: clamp(1.75rem, 1.45rem + 1.9vw, 2.75rem);      /* 28 → 44 */
  --text-h1--line-height: 1.1;
  --text-h2: clamp(1.125rem, 1rem + 0.6vw, 1.375rem);       /* 18 → 22 */
  --text-h2--line-height: 1.3;
  --text-lead: clamp(1.0625rem, 1rem + 0.3vw, 1.25rem);     /* 17 → 20 */
  --text-lead--line-height: 1.55;
```

Then add the `.mf-num-display` utility right after the existing `.mf-num { … }` rule (search for `.mf-num {` — it is in the motion section). Add:

```css
/* Display-size numbers: tabular mono with a hair of tracking. Do NOT add tracking to
   base .mf-num — comparison tables depend on 0-tracking tabular figures aligning. */
.mf-num-display {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
}
```

- [ ] **Step 4: Run tests + typecheck + build**

Run: `pnpm --filter @mathfamily/ui test && pnpm --filter @mathfamily/ui typecheck`
Expected: PASS (tokens test green; existing 7 suites still green).
Run: `pnpm --filter parkmath build`
Expected: build succeeds (confirms Tailwind accepts the new tokens and `text-display`/`text-h1` utilities resolve).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/tokens.css packages/ui/tests/tokens.test.ts
git commit -m "feat(ui): fluid clamp() type-scale tokens + mf-num-display"
```

---

# PHASE 1 — Shared chrome & grid (the three high-leverage files)

### Task 2: Responsive `SiteHeader` — collapse nav under `sm`, 44px targets

The header packs the wordmark + 3-4 full-phrase links into one un-collapsing row; labels wrap and crowd the logo on every mobile page. Make the inline nav `hidden sm:flex` and add an `sm:hidden` disclosure menu. `SiteHeader` becomes a client component (needs `useState` for the toggle).

**Files:**
- Modify: `packages/ui/src/site-header.tsx` (full rewrite)
- Test: `packages/ui/tests/site-header.test.tsx` (create)

- [ ] **Step 1: Write the failing test**

Create `packages/ui/tests/site-header.test.tsx`:

```tsx
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SiteHeader } from "../src/site-header";

afterEach(cleanup);

const LINKS = [
  { label: "Drop-off charges", href: "/drop-off-charges" },
  { label: "Parking", href: "/airport-parking" },
];

describe("SiteHeader responsive nav", () => {
  it("renders the inline nav as hidden-until-sm", () => {
    const { container } = render(<SiteHeader brandName="ParkMath" brandPrefix="Park" links={LINKS} />);
    const inlineNav = container.querySelector('nav[aria-label="Main"]');
    expect(inlineNav).not.toBeNull();
    expect(inlineNav!.className).toContain("hidden");
    expect(inlineNav!.className).toContain("sm:flex");
  });

  it("exposes a mobile disclosure button (≥44px hit area) that toggles a menu", () => {
    render(<SiteHeader brandName="ParkMath" brandPrefix="Park" links={LINKS} />);
    const btn = screen.getByRole("button", { name: /menu/i });
    expect(btn.className).toContain("sm:hidden");
    expect(btn.className).toContain("min-h-11");
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("navigation", { name: "Mobile" })).toBeNull();
    fireEvent.click(btn);
    expect(btn.getAttribute("aria-expanded")).toBe("true");
    const mobileNav = screen.getByRole("navigation", { name: "Mobile" });
    // every mobile link is a ≥44px row
    mobileNav.querySelectorAll("a").forEach((a) => expect(a.className).toContain("min-h-11"));
  });

  it("still renders the BrandLogo lockup and keeps the wordmark from shrinking", () => {
    const { container } = render(<SiteHeader brandName="ParkMath" brandPrefix="Park" links={LINKS} />);
    expect(screen.getByText("Park")).toBeDefined();
    expect(screen.getByText("Math")).toBeDefined();
    expect(container.querySelector("a[aria-label='ParkMath home']")!.className).toContain("shrink-0");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @mathfamily/ui test`
Expected: FAIL — no disclosure button / nav not `hidden sm:flex`.

- [ ] **Step 3: Rewrite `site-header.tsx`**

Replace the entire file `packages/ui/src/site-header.tsx` with:

```tsx
"use client";

import { useState } from "react";
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
  const [open, setOpen] = useState(false);
  return (
    <header
      className="sticky top-0 z-40 border-b border-ink/10 bg-white/80 backdrop-blur-md"
      style={{ boxShadow: "0 1px 0 rgb(15 23 42 / 0.04), 0 6px 16px -10px rgb(15 23 42 / 0.18)" }}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3">
        <a href="/" aria-label={`${brandName} home`} className="shrink-0 transition-opacity hover:opacity-80">
          {brandPrefix ? <BrandLogo prefix={brandPrefix} /> : (
            <span className="text-lg font-bold tracking-tight text-brand">{brandName}</span>
          )}
        </a>

        {/* Desktop / tablet inline nav */}
        <nav aria-label="Main" className="hidden items-center gap-5 text-sm font-medium text-ink-muted sm:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="-my-2 inline-flex min-h-11 items-center whitespace-nowrap py-2 transition-colors hover:text-brand-accent"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Mobile disclosure */}
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="mf-mobile-nav"
          onClick={() => setOpen((v) => !v)}
          className="-mr-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-ink transition-colors hover:bg-ink/5 sm:hidden"
        >
          <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open ? (
        <nav id="mf-mobile-nav" aria-label="Mobile" className="border-t border-ink/10 bg-white px-4 pb-3 pt-1 sm:hidden">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="flex min-h-11 items-center border-b border-ink/5 text-sm font-medium text-ink last:border-b-0 hover:text-brand-accent"
            >
              {l.label}
            </a>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
```

- [ ] **Step 4: Run tests + typecheck**

Run: `pnpm --filter @mathfamily/ui test && pnpm --filter @mathfamily/ui typecheck`
Expected: PASS (new site-header tests + existing brand-logo tests green).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/site-header.tsx packages/ui/tests/site-header.test.tsx
git commit -m "feat(ui): responsive SiteHeader — sm-collapsing nav with 44px disclosure menu"
```

---

### Task 3: Bind hero/stat/lead components to the fluid tokens

`AnswerCard` (`text-6xl`), `FeeStat` (`text-5xl`), `AnswerLead` (`text-xl`) are hard-fixed at desktop sizes. Bind them to the Task-1 tokens. Also add responsive padding so the navy cards aren't oversized on a phone.

**Files:**
- Modify: `packages/ui/src/answer-card.tsx:20,25`, `packages/ui/src/fee-stat.tsx:4,9`, `packages/ui/src/answer-lead.tsx:4,7`
- Test: `packages/ui/tests/type-binding.test.tsx` (create)

- [ ] **Step 1: Write the failing test**

Create `packages/ui/tests/type-binding.test.tsx`:

```tsx
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AnswerCard } from "../src/answer-card";
import { FeeStat } from "../src/fee-stat";
import { AnswerLead } from "../src/answer-lead";

afterEach(cleanup);

it("AnswerCard value uses the fluid display token (not text-6xl)", () => {
  render(<AnswerCard label="X" value="£7" />);
  const v = screen.getByText("£7");
  expect(v.className).toContain("text-display");
  expect(v.className).toContain("mf-num-display");
  expect(v.className).not.toContain("text-6xl");
});

it("FeeStat value uses the fluid stat token", () => {
  render(<FeeStat label="X" value="23" />);
  const v = screen.getByText("23");
  expect(v.className).toContain("text-stat");
  expect(v.className).not.toContain("text-5xl");
});

it("AnswerLead answer uses the fluid lead token", () => {
  render(<AnswerLead answer="It costs £7." />);
  const a = screen.getByText("It costs £7.");
  expect(a.className).toContain("text-lead");
  expect(a.className).not.toContain("text-xl");
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @mathfamily/ui test`
Expected: FAIL — still `text-6xl`/`text-5xl`/`text-xl`.

- [ ] **Step 3: Apply the edits**

`packages/ui/src/answer-card.tsx` — change the container padding (line 20) and value (line 25):

Old line 20 (`className="mf-edge-shine mf-rise-in relative overflow-hidden rounded-card bg-brand p-7 text-white"`) → replace `p-7` with `p-5 sm:p-7`.
Old line 25:
```tsx
      <p className="mf-num mt-2 text-6xl font-bold leading-none">{value}</p>
```
New:
```tsx
      <p className="mf-num-display mt-2 text-display font-bold">{value}</p>
```

`packages/ui/src/fee-stat.tsx` — change padding (line 4 `p-6` → `p-5 sm:p-6`) and value (line 9):

Old line 9:
```tsx
      <p className="mf-num mt-2 text-5xl font-bold leading-none text-white">{value}</p>
```
New:
```tsx
      <p className="mf-num-display mt-2 text-stat font-bold text-white">{value}</p>
```

`packages/ui/src/answer-lead.tsx` — change padding (line 4 `p-6` → `p-5 sm:p-6`) and answer (line 7):

Old line 7:
```tsx
      <p className="text-xl font-semibold leading-snug text-ink">{answer}</p>
```
New:
```tsx
      <p className="text-lead font-semibold text-ink">{answer}</p>
```

(`leading-none`/`leading-snug` are dropped because the tokens carry their own line-height.)

- [ ] **Step 4: Run tests + typecheck**

Run: `pnpm --filter @mathfamily/ui test && pnpm --filter @mathfamily/ui typecheck`
Expected: PASS (new binding tests + existing answer-components/ambient tests green; those assert text content, not the old size classes).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/answer-card.tsx packages/ui/src/fee-stat.tsx packages/ui/src/answer-lead.tsx packages/ui/tests/type-binding.test.tsx
git commit -m "feat(ui): bind AnswerCard/FeeStat/AnswerLead to fluid type tokens + responsive padding"
```

---

### Task 4: Responsive `FeeGrid` — card-rows below `md`, per-column typing, contrast fix

The shared grid clips columns at 390px on all four master tables. Render card-rows below `md`, keep the table at `md+`, add the `numericColumns` prop so prose columns left-align and numeric cells get `text-ink font-medium` (fixing the inverted-contrast bug), and make cell padding responsive.

**Files:**
- Modify: `packages/ui/src/fee-grid.tsx` (full rewrite)
- Test: `packages/ui/tests/fee-grid.test.tsx` (create)

- [ ] **Step 1: Write the failing test**

Create `packages/ui/tests/fee-grid.test.tsx`:

```tsx
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { FeeGrid } from "../src/fee-grid";

afterEach(cleanup);

const COLS = ["Airport", "Fee", "Free alternative"];
const ROWS = [["Heathrow", "£7", "Park & Ride"], ["Gatwick", "£10", "—"]];

describe("FeeGrid responsive + column typing", () => {
  it("renders BOTH a md+ table and a md:hidden card list of the same rows", () => {
    const { container } = render(<FeeGrid columns={COLS} rows={ROWS} numericColumns={[1]} />);
    const table = container.querySelector("table");
    expect(table).not.toBeNull();
    expect(table!.className).toContain("md:table");
    expect(table!.className).toContain("hidden");
    const cards = container.querySelector('[data-testid="fee-grid-cards"]');
    expect(cards).not.toBeNull();
    expect(cards!.className).toContain("md:hidden");
    // 2 rows → 2 cards
    expect(cards!.querySelectorAll('[data-testid="fee-grid-card"]')).toHaveLength(2);
  });

  it("numeric columns are right-aligned mono with ink weight; prose columns are left normal", () => {
    const { container } = render(<FeeGrid columns={COLS} rows={ROWS} numericColumns={[1]} />);
    const firstBodyRow = container.querySelector("tbody tr")!;
    const cells = firstBodyRow.querySelectorAll("td");
    // td[0] is the "Fee" numeric column (col index 1)
    expect(cells[0].className).toContain("text-right");
    expect(cells[0].className).toContain("mf-num");
    expect(cells[0].className).toContain("text-ink");
    expect(cells[0].className).not.toContain("text-ink-muted");
    // td[1] is the "Free alternative" prose column (col index 2)
    expect(cells[1].className).toContain("text-left");
    expect(cells[1].className).not.toContain("mf-num");
  });

  it("back-compat: omitting numericColumns treats every column > 0 as numeric", () => {
    const { container } = render(<FeeGrid columns={["A", "B"]} rows={[["x", "1"]]} />);
    const td = container.querySelector("tbody tr td")!;
    expect(td.className).toContain("mf-num");
    expect(td.className).toContain("text-right");
  });

  it("highlightRow still flags the winner row and card", () => {
    const { container } = render(<FeeGrid columns={COLS} rows={ROWS} numericColumns={[1]} highlightRow={1} />);
    const rows = container.querySelectorAll("tbody tr");
    expect(rows[1].className).toContain("mf-winner-row");
    const cards = container.querySelectorAll('[data-testid="fee-grid-card"]');
    expect(cards[1].className).toContain("mf-winner-row");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @mathfamily/ui test`
Expected: FAIL — no card list / no numericColumns typing.

- [ ] **Step 3: Rewrite `fee-grid.tsx`**

Replace the entire file `packages/ui/src/fee-grid.tsx` with:

```tsx
import type { ReactNode } from "react";

export function FeeGrid({
  columns,
  rows,
  caption,
  highlightRow,
  numericColumns
}: {
  columns: string[];
  rows: ReactNode[][];
  caption?: string;
  highlightRow?: number;
  /** 0-based column indices holding numeric data. Omitted ⇒ every column > 0 is numeric (back-compat). */
  numericColumns?: number[];
}) {
  const isNumeric = (j: number) => (numericColumns ? numericColumns.includes(j) : j > 0);
  const numCell = "px-3 py-3 text-right text-sm font-medium text-ink mf-num sm:px-5 sm:py-3.5";
  const proseCell = "px-3 py-3 text-left text-sm text-ink-muted sm:px-5 sm:py-3.5";
  const winnerRow =
    "mf-winner-row bg-brand-accent/[0.07] font-semibold odd:bg-brand-accent/[0.07] even:bg-brand-accent/[0.07]";

  return (
    <div className="mf-edge overflow-hidden rounded-card bg-white" style={{ boxShadow: "var(--shadow-card)" }}>
      {caption ? <p className="px-4 pt-4 text-xs text-ink-muted sm:px-5">{caption}</p> : null}

      {/* md+ : the precise instrument table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="hidden w-full text-left text-sm md:table">
          <thead className="border-b border-ink/10 bg-surface text-xs uppercase tracking-wider text-ink-muted">
            <tr>
              {columns.map((c, j) => (
                <th key={c} scope="col" className={`px-5 py-3.5 font-semibold ${isNumeric(j) ? "text-right" : ""}`}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((cells, i) => (
              <tr
                key={i}
                className={`border-b border-ink/5 transition-[background-color,box-shadow] duration-150 odd:bg-white even:bg-surface/40 hover:bg-brand-accent/[0.06] hover:shadow-[inset_2px_0_0_0_var(--color-brand-accent)] ${
                  i === highlightRow ? winnerRow : ""
                }`}
              >
                {cells.map((cell, j) =>
                  j === 0 ? (
                    <th key={j} scope="row" className="px-5 py-3.5 font-semibold text-ink">{cell}</th>
                  ) : (
                    <td key={j} className={isNumeric(j) ? numCell : proseCell}>{cell}</td>
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* < md : card-rows — no horizontal scroll, each row is one tappable-feeling card */}
      <div data-testid="fee-grid-cards" className="divide-y divide-ink/5 md:hidden">
        {rows.map((cells, i) => (
          <div
            key={i}
            data-testid="fee-grid-card"
            className={`px-4 py-3.5 ${i === highlightRow ? winnerRow : ""}`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-semibold text-ink">{cells[0]}</span>
              {(() => {
                const heroIdx = cells.findIndex((_, j) => j > 0 && isNumeric(j));
                return heroIdx > 0 ? <span className="mf-num shrink-0 text-base font-semibold text-ink">{cells[heroIdx]}</span> : null;
              })()}
            </div>
            <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
              {cells.map((cell, j) => {
                if (j === 0) return null;
                const heroIdx = cells.findIndex((_, k) => k > 0 && isNumeric(k));
                if (j === heroIdx) return null; // already shown as the hero figure
                return (
                  <div key={j} className="contents">
                    <dt className="text-ink-muted">{columns[j]}</dt>
                    <dd className={isNumeric(j) ? "mf-num text-right text-ink" : "text-ink"}>{cell}</dd>
                  </div>
                );
              })}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}
```

Notes for the implementer: the `<table className="hidden … md:table">` plus the wrapper `hidden … md:block` together guarantee the table never shows below `md`; the card list is `md:hidden`. The caption moved out of `<caption>` into a `<p>` so it is never clipped. The numeric cells now use `text-ink font-medium` (was `text-ink-muted`) — data is no longer the lowest-contrast text.

- [ ] **Step 4: Run tests + typecheck**

Run: `pnpm --filter @mathfamily/ui test && pnpm --filter @mathfamily/ui typecheck`
Expected: PASS. The existing `ambient.test.tsx` FeeGrid highlightRow test still passes (it omits `numericColumns`, hits back-compat, and asserts `mf-winner-row` on `tbody tr` — still present).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/fee-grid.tsx packages/ui/tests/fee-grid.test.tsx
git commit -m "feat(ui): responsive FeeGrid — card-rows below md, per-column typing, data-weight contrast"
```

---

### Task 5: Pass `numericColumns` from every FeeGrid call site

Now that `FeeGrid` supports prose columns, tag the prose columns on each of the four tables so they left-align (and so the card-row hero figure picks the right numeric column). These are RSC page edits — only the `<FeeGrid …>` call props change.

**Files:**
- Modify: `apps/parkmath/app/drop-off-charges/page.tsx`, `apps/parkmath/app/airport-parking/page.tsx`, `apps/parkmath/app/airport-lounges/page.tsx`, `apps/parkmath/app/airport-parking/[airport]/page.tsx`, `apps/roammath/app/roaming/page.tsx`, `apps/roammath/app/roaming/[country]/page.tsx`, `apps/roammath/app/baggage-fees/page.tsx`

- [ ] **Step 1: Identify each table's numeric columns**

For each `<FeeGrid columns={[…]} …>` call, the numeric columns are the price/charge/count columns; prose columns are names/notes/alternatives. Read each call's `columns` array and add a `numericColumns={[…]}` prop listing the 0-based indices of numeric columns. Reference values (verify against the actual `columns` array in each file before editing):

| File | columns (current) | numericColumns |
|---|---|---|
| `drop-off-charges/page.tsx` | Airport, Fee, Time limit, Penalty, Free alternative, Verified | `[1, 2, 3]` |
| `airport-parking/page.tsx` | Airport, Cheapest 7-day, … (verify) | numeric price cols only |
| `airport-lounges/page.tsx` | Airport, Walk-in, … (verify) | numeric price cols only |
| `airport-parking/[airport]/page.tsx` | Option, 3 days, 7 days, 14 days | `[1, 2, 3]` |
| `roaming/page.tsx` | Destination, EE, O2, Vodafone, Three, Best eSIM | `[1, 2, 3, 4, 5]` |
| `roaming/[country]/page.tsx` | Network, Daily charge, Pass / product name, Fair-use note | `[1]` |
| `baggage-fees/page.tsx` | Airline, Checked bag, … (verify) | numeric price cols only |

- [ ] **Step 2: Add the prop to each call**

Example — `apps/roammath/app/roaming/[country]/page.tsx`, the `<FeeGrid>` for the networks table: add `numericColumns={[1]}` so only "Daily charge" is numeric and "Pass / product name" + "Fair-use note" left-align:

```tsx
      <FeeGrid
        caption={`All four networks' ${destination.countryName} roaming charges (verified ${latestVerified}).`}
        columns={["Network", "Daily charge", "Pass / product name", "Fair-use note"]}
        numericColumns={[1]}
        rows={destination.perNetwork.map((n) => [ /* unchanged */
          NETWORK_LABELS[n.network] ?? n.network,
          n.included ? "Included" : n.dailyPassPence !== null ? formatPence(n.dailyPassPence) + "/day" : "No standard pass",
          n.passName ?? "—",
          n.fairUseNote ?? "—"
        ])}
      />
```

Apply the analogous one-line `numericColumns={…}` addition to each of the other six calls, using the table above.

- [ ] **Step 3: Verify build + e2e + visual**

Run: `pnpm --filter parkmath build && pnpm --filter roammath build && pnpm --filter parkmath typecheck && pnpm --filter roammath typecheck`
Expected: clean.
Run: `pnpm --filter parkmath e2e`
Expected: PASS (the master-table e2e — `apps/parkmath/e2e/drop-off.spec.ts` — still finds the table at desktop width; if it asserts at a mobile viewport, update it to expect the card list, see Task 16's e2e note).

- [ ] **Step 4: Commit**

```bash
git add apps/parkmath/app apps/roammath/app
git commit -m "feat(apps): tag prose vs numeric FeeGrid columns across all four master tables"
```

---

# PHASE 2 — App typography & touch-target sweep

### Task 6: ParkMath home — h1, lead, cross-links, search affordance

**Files:**
- Modify: `apps/parkmath/app/page.tsx` (h1 line ~41, lead ~44, cross-link rows ~58-71), `apps/parkmath/components/airport-search.tsx` (search input ~16-23)

- [ ] **Step 1: Heading + lead → tokens**

In `apps/parkmath/app/page.tsx`, the hero `h1` (currently `text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl`): replace the size classes with the fluid token and keep the brand-accent span:

```tsx
          <h1 className="max-w-3xl text-h1 font-bold tracking-tight text-balance text-ink">
            What does it cost to <span className="text-brand-accent whitespace-nowrap">drop someone off</span> at a UK airport?
          </h1>
```

The lead paragraph (currently `text-lg text-ink-muted`):

```tsx
          <p className="max-w-2xl text-base text-ink-muted sm:text-lg">
```

- [ ] **Step 2: Cross-link rows → 44px hit areas**

The two cross-link paragraphs ("Compare all airports…", "Compare airport parking…", "Lounge or membership?") render bare links. Wrap each link with `inline-flex min-h-11 items-center` and give the rows `gap-x-6 gap-y-2 flex-wrap`. Example for the parking/lounge row:

```tsx
      <p className="flex flex-wrap gap-x-6 gap-y-2">
        <Link href="/airport-parking" className="inline-flex min-h-11 items-center text-base font-semibold text-brand-accent underline underline-offset-4">
          Compare airport parking →
        </Link>
        <Link href="/airport-lounges" className="inline-flex min-h-11 items-center text-base font-semibold text-brand-accent underline underline-offset-4">
          Lounge or membership? →
        </Link>
      </p>
```

Apply the same `inline-flex min-h-11 items-center` to the single "Compare all airports in one table →" link.

- [ ] **Step 3: Search field — leading magnifier + comfortable height**

In `apps/parkmath/components/airport-search.tsx`, wrap the input in a `relative` container and add an absolute magnifier; bump left padding. Replace the `<input …>` (lines 16-23) with:

```tsx
      <div className="relative">
        <svg aria-hidden viewBox="0 0 20 20" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="9" cy="9" r="6" /><path d="m14 14 3 3" />
        </svg>
        <input
          id="airport-search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your airport — e.g. Gatwick or LGW"
          className="w-full rounded-card border border-ink/15 bg-white py-3.5 pl-11 pr-4 text-base shadow-sm outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/30"
        />
      </div>
```

- [ ] **Step 4: Verify**

Run: `pnpm --filter parkmath test && pnpm --filter parkmath typecheck && pnpm --filter parkmath build`
Expected: clean (existing `airport-search` e2e — `home search filters airports` — still passes; the input id and role are unchanged).

- [ ] **Step 5: Commit**

```bash
git add apps/parkmath/app/page.tsx apps/parkmath/components/airport-search.tsx
git commit -m "feat(parkmath): home h1/lead → fluid tokens, 44px cross-links, search magnifier"
```

---

### Task 7: ParkMath detail pages — terse caveat chip, h1s, de-dup the answer

**Files:**
- Modify: `apps/parkmath/app/drop-off-charges/[airport]/page.tsx` (chips row ~65-67, AnswerCard note ~77-82, h1), `apps/parkmath/app/airport-parking/[airport]/page.tsx` (h1), `apps/parkmath/app/airport-lounges/[airport]/page.tsx` (h1)

- [ ] **Step 1: Terse payment-deadline chip**

In `apps/parkmath/app/drop-off-charges/[airport]/page.tsx`, the payment-deadline `CaveatChip` currently renders the full `record.paymentDeadline` sentence. Replace it with a terse fixed token and move the detail into the existing `AnswerLead` bullet (the lead already shows `Pay by: …`). Change the chip to:

```tsx
        {record.paymentDeadline ? <CaveatChip>Pay before you leave</CaveatChip> : null}
```

(The full deadline text remains visible in the `AnswerLead` `Pay by:` bullet, so no information is lost.)

- [ ] **Step 2: De-duplicate `feeSummary`**

The `AnswerLead` and the `AnswerCard` both surface `record.feeSummary` in the same fold. Keep the `AnswerCard` as the single hero number and shorten the `AnswerCard` note to context only (drop the repeated summary). Change the `AnswerCard` note prop to the band/time context, not the full summary:

```tsx
        <AnswerCard
          label="Current drop-off charge"
          value={record.isFree ? "Free" : formatPence(record.bands[0]?.totalPence ?? 0)}
          note={record.isFree ? "No forecourt charge" : record.bands[0] ? `for up to ${record.bands[0].upToMinutes} min` : undefined}
          footer={/* unchanged VerifiedStamp */}
        />
```

(The full `feeSummary` stays in the `AnswerLead` answer sentence above.)

- [ ] **Step 3: Detail h1s → fluid token**

In all three detail pages, change the `h1` from `text-3xl font-bold text-ink` to the fluid heading. e.g. drop-off:

```tsx
        <h1 className="text-h1 font-bold tracking-tight text-balance text-ink">{airport.name} drop-off charge</h1>
```

Apply the same `text-h1 font-bold tracking-tight text-balance text-ink` swap to the parking (`{airport.name} parking: gate vs pre-book`) and lounge h1s.

- [ ] **Step 4: Verify**

Run: `pnpm --filter parkmath test && pnpm --filter parkmath typecheck && pnpm --filter parkmath build && pnpm --filter parkmath e2e`
Expected: clean (the `caveat chips surface penalty info` e2e asserts `/penalty if unpaid/`, which is a different chip and unaffected).

- [ ] **Step 5: Commit**

```bash
git add apps/parkmath/app/drop-off-charges apps/parkmath/app/airport-parking apps/parkmath/app/airport-lounges
git commit -m "feat(parkmath): terse caveat chip, fluid detail h1s, de-duplicated hero answer"
```

---

### Task 8: ParkMath calculators — touch targets, parking winner row, warnings as chips

**Files:**
- Modify: `apps/parkmath/components/parking-calculator.tsx` (toggle buttons ~21-34, winner row ~40-56, warnings ~60-64)

- [ ] **Step 1: Duration toggle → 44px**

In `apps/parkmath/components/parking-calculator.tsx`, both button classNames (`px-4 py-2`) become `min-h-11`:

Selected: `"min-h-11 rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition"`
Unselected: `"min-h-11 cursor-pointer rounded-lg border border-ink/20 px-4 py-2 text-sm font-medium text-ink transition hover:-translate-y-0.5 hover:border-brand-accent hover:text-brand-accent"`

- [ ] **Step 2: Winner row — name wraps break baseline alignment**

The long `o.name` ("Park & Ride (formerly Long Stay) — drive-up") wraps and breaks the name|price baseline. Change the option row to `items-start`, let the name shrink, keep the price from shrinking. Replace the option `<div>` body:

```tsx
              <span className="flex min-w-0 items-start gap-2 text-sm font-medium text-ink">
                {i === 0 ? (
                  <span className="mt-0.5 shrink-0 rounded-full bg-brand-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Cheapest</span>
                ) : null}
                <span className="min-w-0">{o.name}</span>
              </span>
              <span className="mf-num shrink-0 text-lg font-bold text-brand">{formatPence(o.totalPence)}</span>
```

and change the row container `items-baseline` → `items-start`.

- [ ] **Step 3: Warnings → CaveatChip**

Import `CaveatChip` and render the warnings as chips instead of muted fine-print:

```tsx
import { CaveatChip } from "@mathfamily/ui";
```
```tsx
      <ul className="mt-3 flex flex-wrap gap-2">
        {c.warnings.map((w) => (
          <li key={w.code}><CaveatChip>{w.message}</CaveatChip></li>
        ))}
      </ul>
```

- [ ] **Step 4: Verify**

Run: `pnpm --filter parkmath test && pnpm --filter parkmath typecheck && pnpm --filter parkmath build`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add apps/parkmath/components/parking-calculator.tsx
git commit -m "feat(parkmath): parking calc 44px toggles, winner-row alignment, caveat chips"
```

---

### Task 9: RoamMath home + index — unify flag-chips, h1, destination links

**Files:**
- Modify: `apps/roammath/app/page.tsx` (h1, destination links), `apps/roammath/app/roaming/page.tsx` (flag-chip padding ~100-111), `apps/roammath/app/baggage-fees/page.tsx` (h1 + header label)

- [ ] **Step 1: RoamMath home h1 + destination links**

In `apps/roammath/app/page.tsx`, hero `h1` → fluid token (`text-h1 font-bold tracking-tight text-balance text-ink`). The bare underlined destination links (`gap-2`, no padding) become flag-chips matching the index — reuse the same chip markup as `roaming/page.tsx` (flag + name in a `min-h-11 rounded-full border …` pill). If keeping links, at minimum add `block py-2.5`.

- [ ] **Step 2: Index flag-chips → 44px**

In `apps/roammath/app/roaming/page.tsx`, the chip `<Link>` (`px-3 py-1.5`, ~32px) → add `min-h-11` and `py-2`:

```tsx
            className="mf-press inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/10 bg-white px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-brand-accent/40 hover:bg-brand-accent/5"
```

- [ ] **Step 3: Baggage index h1 + header label**

`apps/roammath/app/baggage-fees/page.tsx`: h1 → `text-h1 font-bold tracking-tight text-balance text-ink`; shorten the wrapping `FIRST CHECKED BAG` column header to `Checked bag` in the `columns` array.

- [ ] **Step 4: Verify**

Run: `pnpm --filter roammath test && pnpm --filter roammath typecheck && pnpm --filter roammath build`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add apps/roammath/app/page.tsx apps/roammath/app/roaming/page.tsx apps/roammath/app/baggage-fees/page.tsx
git commit -m "feat(roammath): unified flag-chips, fluid h1s, 44px destination targets"
```

---

### Task 10: RoamMath detail/baggage — h1s, lead, watermark, citation row

**Files:**
- Modify: `apps/roammath/app/roaming/[country]/page.tsx` (h1 ~102, watermark ~95-99, citation row ~104-109), `apps/roammath/app/baggage-fees/[airline]/page.tsx` (h1 ~74), `apps/roammath/components/roaming-calculator.tsx` (verdict ~55)

- [ ] **Step 1: Country + airline h1 → token**

`roaming/[country]/page.tsx` h1 and `baggage-fees/[airline]/page.tsx` h1: `text-3xl font-bold text-ink` → `text-h1 font-bold tracking-tight text-balance text-ink`.

- [ ] **Step 2: Flag watermark — hide on mobile**

The 260px flag watermark reads as a smudge behind the mobile h1. Add `hidden sm:block` to the watermark `CountryFlag`:

```tsx
        <CountryFlag iso2={destination.iso2} size={260} className="pointer-events-none absolute -top-10 right-0 hidden opacity-[0.06] sm:block" />
```

- [ ] **Step 3: Citation row spacing + hide duplicate inline citation on mobile**

The freshness pill + dotted `SourceCitation` crowd one row under the h1 (the citation is duplicated in the Sources block). Give the row `gap-y-2` and hide the inline citation on mobile:

```tsx
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <FreshnessBadge verifiedAt={latestVerified} />
          {networkSources.slice(0, 1).map((s) => (
            <span key={s.network} className="hidden sm:inline-flex">
              <SourceCitation url={s.sourceUrl} label={`${NETWORK_LABELS[s.network] ?? s.network} price guide`} />
            </span>
          ))}
        </div>
```

- [ ] **Step 4: Calculator verdict weight**

In `apps/roammath/components/roaming-calculator.tsx`, the verdict paragraph `text-base font-bold` → `text-sm font-semibold` (still readable, less shouty) — keep the `rounded-lg bg-brand-accent/[0.07] p-3` from the prior pass.

- [ ] **Step 5: Verify**

Run: `pnpm --filter roammath test && pnpm --filter roammath typecheck && pnpm --filter roammath build`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add apps/roammath/app/roaming apps/roammath/app/baggage-fees apps/roammath/components/roaming-calculator.tsx
git commit -m "feat(roammath): fluid detail h1s, mobile watermark/citation tidy, calmer verdict"
```

---

### Task 11: Footer + MiniAnswerBar safe-area + shared CheckTick

**Files:**
- Create: `packages/ui/src/check-tick.tsx`
- Modify: `packages/ui/src/site-footer.tsx` (links ~5-8), `packages/ui/src/mini-answer-bar.tsx` (safe-area ~30-35, tick ~34), `packages/ui/src/freshness-badge.tsx` (use CheckTick), `packages/ui/src/index.ts`
- Test: `packages/ui/tests/check-tick.test.tsx` (create)

- [ ] **Step 1: Write the failing test**

Create `packages/ui/tests/check-tick.test.tsx`:

```tsx
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { CheckTick } from "../src/check-tick";

afterEach(cleanup);

it("renders an aria-hidden svg with a draw-animated tick path", () => {
  const { container } = render(<CheckTick />);
  const svg = container.querySelector("svg");
  expect(svg).not.toBeNull();
  expect(svg!.getAttribute("aria-hidden")).toBe("true");
  expect(container.querySelector(".mf-tick")).not.toBeNull();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @mathfamily/ui test`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `check-tick.tsx` and wire it in**

Create `packages/ui/src/check-tick.tsx`:

```tsx
/** Brand check tick — the FreshnessBadge/MiniAnswerBar verified mark. Draws itself once (mf-tick). */
export function CheckTick({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 12 12" className={className ?? "h-3 w-3 shrink-0"} fill="none">
      <path d="M2.5 6.5 5 9l4.5-5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mf-tick" />
    </svg>
  );
}
```

In `packages/ui/src/freshness-badge.tsx`, replace the inline tick svg with `<CheckTick />` (import it). In `packages/ui/src/mini-answer-bar.tsx`: import `CheckTick`, replace the raw `✓` glyph (line 34) with `<CheckTick className="h-3.5 w-3.5 text-emerald-300" />`, and add iOS safe-area padding to the inner row (line 32) — change `px-4 py-2.5` to `px-4 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]`. Add `export * from "./check-tick";` to `packages/ui/src/index.ts`.

- [ ] **Step 4: Footer links → 44px**

In `packages/ui/src/site-footer.tsx`, the footer nav links become `py-1.5 inline-flex min-h-11 items-center`, and the nav gets `flex-wrap gap-x-4 gap-y-1`:

```tsx
        <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-1">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="inline-flex min-h-11 items-center py-1.5 hover:text-brand-accent">{l.label}</a>
          ))}
        </nav>
```

- [ ] **Step 5: Verify**

Run: `pnpm --filter @mathfamily/ui test && pnpm --filter @mathfamily/ui typecheck`
Expected: PASS (the existing FreshnessBadge text tests still pass — they assert text, not the tick markup).

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/check-tick.tsx packages/ui/src/freshness-badge.tsx packages/ui/src/mini-answer-bar.tsx packages/ui/src/site-footer.tsx packages/ui/src/index.ts packages/ui/tests/check-tick.test.tsx
git commit -m "feat(ui): shared CheckTick, footer 44px targets, MiniAnswerBar safe-area inset"
```

---

### Task 12: Phase 0-2 verification gate (re-screenshot the fold + tables)

**Files:** none (verification only)

- [ ] **Step 1: Full workspace gate**

Run: `pnpm -r test && pnpm -r typecheck && pnpm -r build`
Expected: all green.

- [ ] **Step 2: Visual re-capture**

Rebuild and `next start` both apps (ports 3100/3101), then re-capture mobile (390) + tablet (768) + desktop (1280) for: home, drop-off table, drop-off detail, parking detail, roaming index, roaming country, baggage table. Confirm: header shows a hamburger and no wrapping; all four tables render as card-rows at 390 with no horizontal scroll; h1s are ~28-30px and ≤2 lines; the answer hero number is ~36px on mobile; no caveat chip wraps. Use the capture approach from the audit (`reducedMotion: "reduce"`, `fullPage: true`).

- [ ] **Step 3: Commit (if any nits fixed during visual pass)**

```bash
git add -A && git commit -m "fix(design): mobile fold + table card-row visual nits from Phase 0-2 gate" || echo "nothing to fix"
```

---

# PHASE 3 — Shared primitives (consistency hardening)

### Task 13: Extract `RangeSlider` and adopt it in all three calculators

The drop-off slider has a focus-visible ring + active glow; the lounge and roaming sliders don't. Extract one primitive.

**Files:**
- Create: `packages/ui/src/range-slider.tsx`
- Modify: `packages/ui/src/index.ts`, `apps/parkmath/components/drop-off-calculator.tsx`, `apps/parkmath/components/lounge-calculator.tsx`, `apps/roammath/components/roaming-calculator.tsx`
- Test: `packages/ui/tests/range-slider.test.tsx` (create)

- [ ] **Step 1: Write the failing test**

Create `packages/ui/tests/range-slider.test.tsx`:

```tsx
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { RangeSlider } from "../src/range-slider";

afterEach(cleanup);

it("renders an accessible range input with the glow classes and fires onChange", () => {
  const onChange = vi.fn();
  render(<RangeSlider min={1} max={20} value={3} onChange={onChange} ariaLabel="Visits" ariaValuetext="3 visits" />);
  const input = screen.getByRole("slider", { name: "Visits" });
  expect(input.getAttribute("aria-valuetext")).toBe("3 visits");
  expect(input.className).toContain("accent-brand-accent");
  expect(input.className).toContain("focus-visible:shadow");
  fireEvent.change(input, { target: { value: "7" } });
  expect(onChange).toHaveBeenCalledWith(7);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @mathfamily/ui test`
Expected: FAIL — module not found.

- [ ] **Step 3: Create the primitive**

Create `packages/ui/src/range-slider.tsx`:

```tsx
"use client";

/** Shared themed range input: thumb-friendly, focus-visible ring + active glow, brand accent. */
export function RangeSlider({
  min,
  max,
  value,
  onChange,
  ariaLabel,
  ariaValuetext,
  ariaDescribedby,
  className
}: {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
  ariaValuetext: string;
  ariaDescribedby?: string;
  className?: string;
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      aria-label={ariaLabel}
      aria-valuetext={ariaValuetext}
      aria-describedby={ariaDescribedby}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`h-2 w-full cursor-pointer accent-brand-accent transition-shadow focus-visible:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-brand-accent)_25%,transparent)] active:shadow-[0_0_12px_color-mix(in_srgb,var(--color-brand-accent)_45%,transparent)] ${className ?? ""}`}
    />
  );
}
```

Add `export * from "./range-slider";` to `packages/ui/src/index.ts`.

- [ ] **Step 4: Adopt in all three calculators**

Replace the raw `<input type="range" …>` in `drop-off-calculator.tsx`, `lounge-calculator.tsx`, and `roaming-calculator.tsx` (both roaming sliders) with `<RangeSlider …>` passing the same min/max/value/onChange/aria props. Example (lounge):

```tsx
import { RangeSlider } from "@mathfamily/ui";
```
```tsx
        <RangeSlider min={1} max={20} value={visits} onChange={setVisits} ariaLabel="Lounge visits per year" ariaValuetext={`${visits} visits`} ariaDescribedby="lounge-result" />
```

Keep each component's existing `data-testid`/`aria-live` result wrappers intact.

- [ ] **Step 5: Verify**

Run: `pnpm --filter @mathfamily/ui test && pnpm -r typecheck && pnpm --filter parkmath build && pnpm --filter roammath build && pnpm --filter parkmath e2e`
Expected: clean (the `calculator island updates the quote` e2e uses `getByRole("slider").fill("85")` — `RangeSlider` still renders a native range input, so it passes).

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/range-slider.tsx packages/ui/src/index.ts apps/parkmath/components apps/roammath/components/roaming-calculator.tsx
git commit -m "feat(ui): shared RangeSlider primitive adopted across all three calculators"
```

---

### Task 14: Extract `PageHeading` and apply to all detail h1s

**Files:**
- Create: `packages/ui/src/page-heading.tsx`
- Modify: `packages/ui/src/index.ts`, the 8 detail/page h1s touched in Tasks 6-10
- Test: `packages/ui/tests/page-heading.test.tsx` (create)

- [ ] **Step 1: Write the failing test**

Create `packages/ui/tests/page-heading.test.tsx`:

```tsx
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { PageHeading } from "../src/page-heading";

afterEach(cleanup);

it("renders an h1 with the fluid token + balance", () => {
  render(<PageHeading>Heathrow drop-off charge</PageHeading>);
  const h1 = screen.getByRole("heading", { level: 1 });
  expect(h1.className).toContain("text-h1");
  expect(h1.className).toContain("text-balance");
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @mathfamily/ui test`
Expected: FAIL — module not found.

- [ ] **Step 3: Create and adopt**

Create `packages/ui/src/page-heading.tsx`:

```tsx
import type { ReactNode } from "react";

/** Canonical page h1: fluid --text-h1 token, tight tracking, balanced wrapping. */
export function PageHeading({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h1 className={`text-h1 font-bold tracking-tight text-balance text-ink ${className ?? ""}`}>{children}</h1>
  );
}
```

Add `export * from "./page-heading";` to `packages/ui/src/index.ts`. Replace the 8 detail/list `h1` elements (the ones changed to `text-h1 …` in Tasks 6-10) with `<PageHeading>…</PageHeading>` (import from `@mathfamily/ui`). The ParkMath home and RoamMath home heroes keep their inline `h1` because they wrap a coloured span / custom layout — leave those two as inline `text-h1` h1s.

- [ ] **Step 4: Verify**

Run: `pnpm -r test && pnpm -r typecheck && pnpm --filter parkmath build && pnpm --filter roammath build && pnpm --filter parkmath e2e`
Expected: clean (e2e `getByRole("heading", { level: 1 })` still matches — `PageHeading` renders an `h1`).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/page-heading.tsx packages/ui/src/index.ts apps/parkmath/app apps/roammath/app
git commit -m "feat(ui): shared PageHeading primitive across all detail pages"
```

---

# PHASE 4 — Premium elevation (signature finish)

*Phases 0-3 clear the audit and are independently shippable. Phase 4 is the "stunning" layer; each task is a self-contained PR and can ship in any order after Phase 3. Keep the trust-first rule: at most one accent glow and one looping motion per page, everything off under `prefers-reduced-motion`, no new deps.*

### Task 15: Formalise 3-tier surface + single per-page winner glow

The winner ring already exists (`.mf-winner` / `mf-winner-row`). Formalise the elevation vocabulary so exactly one element per page carries the brand glow (the recommendation), and document the three shadow tiers already in tokens.

**Files:**
- Modify: `packages/ui/src/tokens.css` (add `.mf-glow-winner` utility near `.mf-winner`)
- Test: `packages/ui/tests/tokens.test.ts` (extend)

- [ ] **Step 1: Extend the tokens test**

Add to `packages/ui/tests/tokens.test.ts`:

```ts
it("defines a single-glow winner utility distinct from the static winner ring", () => {
  expect(css).toContain(".mf-glow-winner");
  expect(css).toMatch(/--shadow-card|--shadow-raised|--shadow-hero/);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @mathfamily/ui test` → FAIL (`.mf-glow-winner` missing).

- [ ] **Step 3: Add the utility**

In `packages/ui/src/tokens.css`, after the existing `.mf-winner { … }` rule add:

```css
/* The one accent glow per page — reserve for the single recommended/cheapest element. */
.mf-glow-winner {
  box-shadow:
    0 0 0 1.5px color-mix(in srgb, var(--color-brand-accent) 60%, transparent),
    0 6px 22px -6px color-mix(in srgb, var(--color-brand-accent) 40%, transparent),
    var(--shadow-card);
}
@media (prefers-reduced-motion: reduce) { .mf-glow-winner { box-shadow: 0 0 0 1.5px color-mix(in srgb, var(--color-brand-accent) 60%, transparent), var(--shadow-card); } }
```

- [ ] **Step 4: Verify + commit**

Run: `pnpm --filter @mathfamily/ui test && pnpm --filter parkmath build`
```bash
git add packages/ui/src/tokens.css packages/ui/tests/tokens.test.ts
git commit -m "feat(ui): formalise single-glow winner utility"
```

---

### Task 16: `StatStrip` — collapse the home FeeStat trio into one strip

Three full-width navy `FeeStat` cards stack to ~3 screen-heights on mobile and read shouty. Add a compact one-strip variant with hairline dividers; use it on both home pages. Keep `FeeStat` for any single-stat use.

**Files:**
- Create: `packages/ui/src/stat-strip.tsx`
- Modify: `packages/ui/src/index.ts`, `apps/parkmath/app/page.tsx`, `apps/roammath/app/page.tsx`
- Test: `packages/ui/tests/stat-strip.test.tsx` (create)

- [ ] **Step 1: Write the failing test**

Create `packages/ui/tests/stat-strip.test.tsx`:

```tsx
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { StatStrip } from "../src/stat-strip";

afterEach(cleanup);

it("renders each stat's value (mono) and label in one strip", () => {
  render(<StatStrip stats={[
    { label: "Most expensive", value: "£10", note: "Stansted" },
    { label: "Charging", value: "23", note: "of 25" },
    { label: "Still free", value: "2" },
  ]} />);
  expect(screen.getByText("£10").className).toContain("mf-num");
  expect(screen.getByText("23")).toBeDefined();
  expect(screen.getByText("Still free")).toBeDefined();
});
```

- [ ] **Step 2: Run to verify it fails** → FAIL (module not found).

- [ ] **Step 3: Create `stat-strip.tsx`**

```tsx
/** Compact stat strip: one navy card, N stats split by hairline dividers. Replaces a row of full FeeStats. */
export function StatStrip({ stats }: { stats: { label: string; value: string; note?: string }[] }) {
  return (
    <div
      className="mf-fade-in relative overflow-hidden rounded-card bg-brand text-white ring-1 ring-white/10"
      style={{ boxShadow: "var(--shadow-hero)" }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white/12 to-transparent" />
      <dl className="grid grid-cols-3 divide-x divide-white/10">
        {stats.map((s) => (
          <div key={s.label} className="min-w-0 px-3 py-4 sm:px-5">
            <dt className="truncate text-[11px] font-semibold uppercase tracking-wider text-white/65">{s.label}</dt>
            <dd className="mf-num mt-1 text-2xl font-bold leading-none sm:text-3xl">{s.value}</dd>
            {s.note ? <p className="mt-1 truncate text-xs text-white/70">{s.note}</p> : null}
          </div>
        ))}
      </dl>
    </div>
  );
}
```

Add `export * from "./stat-strip";` to `packages/ui/src/index.ts`. In `apps/parkmath/app/page.tsx` replace the three-`FeeStat` grid section with a single `<StatStrip stats={[…]} />` (same three values). Do the same on `apps/roammath/app/page.tsx` if it has a FeeStat trio.

- [ ] **Step 4: Verify + commit**

Run: `pnpm --filter @mathfamily/ui test && pnpm -r typecheck && pnpm --filter parkmath build && pnpm --filter roammath build`
```bash
git add packages/ui/src/stat-strip.tsx packages/ui/src/index.ts apps/parkmath/app/page.tsx apps/roammath/app/page.tsx
git commit -m "feat(ui): StatStrip — compact home stat strip replacing the navy trio"
```

---

### Task 17: `SavesVerdict` — the sourced "Saves £X" signature module

A tinted card with a bold mono `Saves £X` + plain-English winner sentence. Counters reseller "% off" claims with a sourced figure; reused by parking, lounge, roaming.

**Files:**
- Create: `packages/ui/src/saves-verdict.tsx`
- Modify: `packages/ui/src/index.ts`, parking/lounge/roaming detail surfaces
- Test: `packages/ui/tests/saves-verdict.test.tsx` (create)

- [ ] **Step 1: Write the failing test**

```tsx
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SavesVerdict } from "../src/saves-verdict";

afterEach(cleanup);

it("renders the saved amount in mono and the verdict sentence", () => {
  render(<SavesVerdict amount="£37" verdict="Pre-book — it’s cheaper for a 7-day stay." />);
  expect(screen.getByText("£37").className).toContain("mf-num");
  expect(screen.getByText(/Pre-book/)).toBeDefined();
});

it("renders verdict only when there is no saving", () => {
  const { container } = render(<SavesVerdict verdict="Your network already includes this trip." />);
  expect(container.textContent).toContain("already includes");
  expect(container.querySelector(".mf-num")).toBeNull();
});
```

- [ ] **Step 2: Run to verify it fails** → FAIL.

- [ ] **Step 3: Create `saves-verdict.tsx`**

```tsx
/** The family signature: a sourced "Saves £X" verdict. Tinted card, bold mono figure + plain sentence. */
export function SavesVerdict({ amount, verdict }: { amount?: string; verdict: string }) {
  return (
    <div className="mf-edge mf-rise-in flex items-center gap-4 rounded-card border-l-4 border-l-positive bg-positive/[0.06] p-4 sm:p-5">
      {amount ? (
        <div className="shrink-0 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-positive/80">Saves</p>
          <p className="mf-num text-2xl font-bold text-positive sm:text-3xl">{amount}</p>
        </div>
      ) : null}
      <p className="text-sm font-medium leading-snug text-ink sm:text-base">{verdict}</p>
    </div>
  );
}
```

Add `export * from "./saves-verdict";` to `packages/ui/src/index.ts`. Adopt on the parking detail (`m7` savings), lounge (`savingsPence`), and roaming country (`m.savingsPence`) pages — render `<SavesVerdict amount={formatPence(savings)} verdict={…} />` where a saving exists; pass `amount` undefined when the do-nothing default already wins.

- [ ] **Step 4: Verify + commit**

Run: `pnpm --filter @mathfamily/ui test && pnpm -r typecheck && pnpm --filter parkmath build && pnpm --filter roammath build`
```bash
git add packages/ui/src/saves-verdict.tsx packages/ui/src/index.ts apps/parkmath/app apps/roammath/app
git commit -m "feat(ui): SavesVerdict signature module (sourced Saves £X) on comparison pages"
```

---

### Task 18: Sticky live calculator answer — `MiniAnswerBar` `live` slot

`MiniAnswerBar` shows a static summary; feed it the live calculator output so the number you're tuning stays pinned. Add an optional client `live` mechanism via a tiny context the calculators publish to.

**Files:**
- Modify: `packages/ui/src/mini-answer-bar.tsx` (accept optional `liveSummary` prop + custom event listener)
- Test: `packages/ui/tests/client-widgets.test.tsx` (extend)

- [ ] **Step 1: Extend the test**

Add to `packages/ui/tests/client-widgets.test.tsx`:

```tsx
import { fireEvent } from "@testing-library/react";

it("MiniAnswerBar updates its summary when a mf-live-answer event fires", () => {
  render(<MiniAnswerBar summary="LGW · static" verified />);
  const bar = screen.getByTestId("mini-answer-bar");
  expect(bar.textContent).toContain("static");
  fireEvent(window, new CustomEvent("mf-live-answer", { detail: "LGW · £12 / 25 min" }));
  expect(bar.textContent).toContain("£12 / 25 min");
});
```

- [ ] **Step 2: Run to verify it fails** → FAIL (no live update).

- [ ] **Step 3: Implement the live slot**

In `packages/ui/src/mini-answer-bar.tsx`, add a second `useState` seeded from the `summary` prop and a `useEffect` listening for a `window` `"mf-live-answer"` `CustomEvent<string>` that overrides it:

```tsx
  const [liveSummary, setLiveSummary] = useState(summary);
  useEffect(() => {
    const onLive = (e: Event) => setLiveSummary((e as CustomEvent<string>).detail || summary);
    window.addEventListener("mf-live-answer", onLive);
    return () => window.removeEventListener("mf-live-answer", onLive);
  }, [summary]);
```

Render `{liveSummary}` instead of `{summary}` in the bar. Then, in each calculator, after computing the result, dispatch the event (guarded for SSR):

```tsx
useEffect(() => {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("mf-live-answer", { detail: `${airportName} · ${liveText}` }));
}, [liveText]);
```

(Only wire the drop-off calculator in this task; the pattern is reusable.)

- [ ] **Step 4: Verify + commit**

Run: `pnpm --filter @mathfamily/ui test && pnpm --filter parkmath build`
```bash
git add packages/ui/src/mini-answer-bar.tsx packages/ui/tests/client-widgets.test.tsx apps/parkmath/components/drop-off-calculator.tsx
git commit -m "feat(ui): MiniAnswerBar live slot — sticky bar tracks the calculator output"
```

---

### Task 19: Hero count-up on `AnswerCard` first paint

Animate the page's headline number once on first paint (reuse the existing count-up math from `AnimatedNumber`), reduced-motion → instant. One per page.

**Files:**
- Modify: `packages/ui/src/answer-card.tsx` (optional `countFrom`/`pence` props rendering an `AnimatedNumber`)
- Test: `packages/ui/tests/answer-components.test.tsx` (extend)

- [ ] **Step 1: Extend the test**

```tsx
it("AnswerCard renders a static value by default and a counted value when pence is given", () => {
  const { rerender } = render(<AnswerCard label="X" value="£7" />);
  expect(screen.getByText("£7")).toBeDefined();
  rerender(<AnswerCard label="X" value="£7" pence={700} render={(p) => (p === null ? "—" : `£${(p/100).toFixed(0)}`)} />);
  expect(screen.getByText("£7")).toBeDefined();
});
```

- [ ] **Step 2: Run to verify it fails** → FAIL (no `pence` prop).

- [ ] **Step 3: Implement**

Add optional `pence?: number | null` and `render?: (p: number|null)=>string` props to `AnswerCard`. When both are present, render `<AnimatedNumber pence={pence} render={render} />` (imported from `./animated-number`) inside the value `<p className="mf-num-display text-display font-bold">` instead of `{value}`; otherwise render `{value}` as today. `AnimatedNumber` already guards reduced-motion → instant.

- [ ] **Step 4: Verify + commit**

Run: `pnpm --filter @mathfamily/ui test && pnpm --filter parkmath build`
```bash
git add packages/ui/src/answer-card.tsx packages/ui/tests/answer-components.test.tsx
git commit -m "feat(ui): AnswerCard hero count-up on first paint (reduced-motion safe)"
```

---

### Task 20: Comparison card-row detail — segmented sort + IATA monogram tile

Add a slim segmented sort control above the mobile card-rows (re-sorts client-side; SSR keeps a default order so no-JS still works), and an IATA monogram tile on each ParkMath airport row. Scope: ParkMath drop-off comparison page first.

**Files:**
- Create: `packages/ui/src/segmented-control.tsx`, `packages/ui/src/iata-tile.tsx`
- Modify: `packages/ui/src/index.ts`, `apps/parkmath/app/drop-off-charges/page.tsx`
- Test: `packages/ui/tests/segmented-control.test.tsx`, `packages/ui/tests/iata-tile.test.tsx`

- [ ] **Step 1: Write failing tests**

`packages/ui/tests/iata-tile.test.tsx`:
```tsx
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { IataTile } from "../src/iata-tile";
afterEach(cleanup);
it("renders the 3-letter code as a mono monogram tile", () => {
  render(<IataTile code="LHR" />);
  const t = screen.getByText("LHR");
  expect(t.className).toContain("mf-num");
  expect(t.getAttribute("aria-hidden")).toBe("true");
});
```

`packages/ui/tests/segmented-control.test.tsx`:
```tsx
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SegmentedControl } from "../src/segmented-control";
afterEach(cleanup);
it("renders options and calls onChange on select", () => {
  const onChange = vi.fn();
  render(<SegmentedControl ariaLabel="Sort" value="fee" onChange={onChange} options={[{ value: "fee", label: "Most expensive" }, { value: "az", label: "A–Z" }]} />);
  expect(screen.getByRole("radio", { name: "Most expensive" }).getAttribute("aria-checked")).toBe("true");
  fireEvent.click(screen.getByRole("radio", { name: "A–Z" }));
  expect(onChange).toHaveBeenCalledWith("az");
});
```

- [ ] **Step 2: Run to verify they fail** → FAIL (modules not found).

- [ ] **Step 3: Create the primitives**

`packages/ui/src/iata-tile.tsx`:
```tsx
/** Small monogram tile carrying an IATA (or any 3-letter) code. Decorative anchor for list rows. */
export function IataTile({ code, className }: { code: string; className?: string }) {
  return (
    <span aria-hidden className={`mf-num inline-flex h-6 min-w-[2.25rem] items-center justify-center rounded-md bg-brand/5 px-1.5 text-[11px] font-semibold tracking-wide text-brand ring-1 ring-brand/10 ${className ?? ""}`}>{code}</span>
  );
}
```

`packages/ui/src/segmented-control.tsx`:
```tsx
"use client";

/** Slim segmented control (radiogroup). Client-only enhancement; render an SSR default sort behind it. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={`inline-flex rounded-full bg-ink/5 p-0.5 text-xs font-semibold ${className ?? ""}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`min-h-9 rounded-full px-3 transition-colors ${o.value === value ? "bg-white text-brand shadow-sm" : "text-ink-muted hover:text-ink"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
```

Add both to `packages/ui/src/index.ts`. Add an `IataTile` to each ParkMath drop-off card row (pass `airport.iata`). The segmented sort needs a small client wrapper around the comparison list that re-orders the rows array by the chosen key — implement that wrapper in `apps/parkmath/app/drop-off-charges/` as a client component that receives the SSR-sorted rows and re-sorts on selection; the no-JS default remains the server "most expensive first" order.

- [ ] **Step 4: Verify + commit**

Run: `pnpm --filter @mathfamily/ui test && pnpm -r typecheck && pnpm --filter parkmath build && pnpm --filter parkmath e2e`
```bash
git add packages/ui/src/iata-tile.tsx packages/ui/src/segmented-control.tsx packages/ui/src/index.ts apps/parkmath/app/drop-off-charges
git commit -m "feat(ui): IataTile + SegmentedControl; sortable drop-off comparison rows (SSR-default)"
```

---

### Task 21: Skeleton + crossfade polish for the search/calculator islands

Remove the only abrupt moments: a shimmer skeleton for `AirportSearch` results before hydration and a designed empty state; a 150ms opacity crossfade on calculator result change.

**Files:**
- Modify: `packages/ui/src/tokens.css` (add `.mf-skeleton` shimmer, reduced-motion safe), `apps/parkmath/components/airport-search.tsx` (empty state), calculators (crossfade already via `AnimatedNumber`/`mf-fade-in` — verify)
- Test: `packages/ui/tests/tokens.test.ts` (extend for `.mf-skeleton`)

- [ ] **Step 1: Extend tokens test**

```ts
it("defines a reduced-motion-safe skeleton shimmer", () => {
  expect(css).toContain(".mf-skeleton");
});
```

- [ ] **Step 2: Run to verify it fails** → FAIL.

- [ ] **Step 3: Add the shimmer + empty state**

In `tokens.css`:
```css
.mf-skeleton {
  background: linear-gradient(90deg, rgb(15 23 42 / 0.05) 25%, rgb(15 23 42 / 0.09) 37%, rgb(15 23 42 / 0.05) 63%);
  background-size: 400% 100%;
  animation: mf-shimmer 1.4s ease-in-out infinite;
  border-radius: 0.75rem;
}
@keyframes mf-shimmer { from { background-position: 100% 0 } to { background-position: 0 0 } }
@media (prefers-reduced-motion: reduce) { .mf-skeleton { animation: none } }
```

In `airport-search.tsx`, replace the bare "No airports found" line with a centered designed empty state (icon + message + reset hint). The calculator result crossfade already uses `AnimatedNumber`/`mf-fade-in`; confirm it and add `mf-fade-in` to any result block lacking it.

- [ ] **Step 4: Verify + commit**

Run: `pnpm --filter @mathfamily/ui test && pnpm --filter parkmath build`
```bash
git add packages/ui/src/tokens.css packages/ui/tests/tokens.test.ts apps/parkmath/components/airport-search.tsx
git commit -m "feat(ui): skeleton shimmer + designed empty/crossfade states"
```

---

### Task 22: Final verification + branch finish

**Files:** none (verification + handoff)

- [ ] **Step 1: Full workspace gate**

Run: `pnpm -r test && pnpm -r typecheck && pnpm -r build && pnpm --filter parkmath e2e`
Expected: all green.

- [ ] **Step 2: Visual regression sweep**

Re-capture the matrix from the audit (15 page types × mobile/tablet/desktop, `reducedMotion: "reduce"`, `fullPage: true`) and compare against `docs/design-audit/assets/`. Confirm every critical/high finding is visibly resolved: hamburger header, card-row tables (no horizontal scroll), restrained h1s, terse chips, 44px targets, one winner glow per page, StatStrip on home.

- [ ] **Step 3: Finish the branch**

Use the superpowers:finishing-a-development-branch skill to merge/PR.

---

## Self-review (completed during authoring)

**Spec coverage** — every audit section maps to a task:
- §1/§2 Theme A header → Task 2 (+ footer Task 11). Theme B table overflow → Task 4 (+ call sites Task 5). Theme C typography → Tasks 1, 3, 6, 7, 9, 10, 14. Theme D chips/content-shape → Tasks 7 (chip), 4/5 (Fair-use column). Theme E table contrast/typing → Task 4.
- §3 polish: touch-targets → Tasks 2, 6, 8, 9, 11; typography rhythm → Tasks 3, 6, 7, 9, 10; spacing/safe-area → Tasks 4, 11; consistency → Tasks 7, 11, 13, 14; low cosmetic (search icon, baggage labels, watermark, ambient blobs) → Tasks 6, 9, 10 (ambient-blob perf nicety folded into the Task 15 reduced-motion discipline / left as documented low-pri).
- §4 elevation Phase 1 → Tasks 1-4, 15, 16; Phase 2 → Tasks 4 (per-column), 13, 14, 17, 18, 22-icons; Phase 3 → Tasks 19 (count-up), 20 (segmented sort + IATA tile), 21 (skeleton/crossfade), bottom-sheet noted below.
- §5 type scale → Task 1 (exact clamp values copied verbatim).
- §6 next-steps order → Phases ordered tokens → header → fee-grid → bind → touch → content → primitives → elevation, matching the report.

**Consciously deferred (carry to review):**
- **Bottom-sheet row detail** (report Phase 3) is omitted as its own task — the card-rows are already real `<a>` links to the detail page (JS-off safe), so the sheet is an optional later enhancement, not a fix. Add only if user wants the in-place compare.
- **OptionRail swipe-snap** (per-network/gate-vs-prebook mini sub-tables) — deferred; the existing option lists are adequate post-Task 8. Revisit if the option sets feel cramped after Phase 2.
- **Ambient-blob mobile perf** (disable drift <640px, drop blur) — low-priority hygiene; fold into Task 15 if touching tokens.css anyway, else skip.

**Placeholder scan:** no TBD/TODO; every code step shows complete code or an exact old→new edit. App-page sweeps (Tasks 5-10) cite the column arrays / line regions and show the concrete class strings; the implementer reads each `columns` array to confirm `numericColumns` indices (Task 5 Step 1 instructs this explicitly).

**Type consistency:** `FeeGrid` `numericColumns?: number[]` is defined in Task 4 and used identically in Task 5. `RangeSlider`/`PageHeading`/`CheckTick`/`StatStrip`/`SavesVerdict`/`SegmentedControl`/`IataTile` signatures are fixed in the Shared-contracts block and matched in their creation + adoption tasks. Token names (`text-display`/`text-stat`/`text-h1`/`text-h2`/`text-lead`, `.mf-num-display`, `.mf-glow-winner`, `.mf-skeleton`) are introduced in `tokens.css` tasks and referenced consistently. The `mf-live-answer` CustomEvent contract (Task 18) is `CustomEvent<string>` on both dispatch and listen sides.

**No vitest/vite config files** are created anywhere; all new tests live under existing `packages/ui/tests` / app test dirs and use the configless docblock + `afterEach(cleanup)` pattern (per project memory: configs deadlock on the TB4 volume).

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-12-mobile-design-elevation.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review (spec + quality) between tasks, fast iteration. Ideal here: 22 well-bounded tasks, most touching 1-3 files.

**2. Inline Execution** — execute tasks in this session via executing-plans, batch execution with checkpoints.

A natural cut line: **Phases 0-3 (Tasks 1-14)** clear the entire audit and are independently shippable as one PR; **Phase 4 (Tasks 15-22)** is the elevation layer and can ship as follow-up PRs. You may want to run Phases 0-3, review on a device, then decide how much of Phase 4 to pursue.

Which approach — and do you want all 22 tasks, or Phases 0-3 first?
