# P0b — Shared Component Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Finish the shared `packages/ui` foundation that P1–P4 build on: flexible `StatStrip` columns, whole-card-clickable `FeeGrid` rows, an optional highlight column, and a few shared semantic line-art icons.

**Architecture:** Small, additive, backward-compatible changes to two existing components + the line-glyph set + one CSS helper token. No visual change to existing usages (new behaviour is opt-in via new optional props).

**Tech Stack:** React 19, Tailwind v4, Vitest + jsdom + `@testing-library/react` (`// @vitest-environment jsdom` first line).

**Branch:** `design-upgrade-p0b` (already checked out; stacked on `design-upgrade-p0`).

**Scope notes (deliberate):** The **dark-mode token split** is deferred to **P5** (where dark mode actually ships — building the scaffold now is premature/YAGNI). **Density/cell tokens** are deferred until a consuming page needs them. `FeeGrid` already has a cross-breakpoint winner (`highlightRow` on both table + card layouts) — not re-done here.

**Constraints:** Never create a vitest/vite config file (esbuild deadlock); no `pnpm install`. Commit messages end with `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`. Do NOT touch the pre-existing dirty files `packages/ui/src/line-glyphs.tsx`'s siblings `ambient.test.tsx`… actually `line-glyphs.tsx` IS edited here (Task 2) — that file's pre-existing uncommitted change must be reconciled: run `git diff packages/ui/src/line-glyphs.tsx` first; if it already contains unrelated edits, preserve them and ADD the new icons; never discard existing content. Leave `packages/ui/tests/ambient.test.tsx` untouched.

---

## File Structure
- Modify: `packages/ui/src/stat-strip.tsx` (dynamic columns).
- Modify: `packages/ui/src/line-glyphs.tsx` (add icons — preserve existing/dirty content).
- Modify: `packages/ui/src/tokens.css` (`.mf-row-link` helper).
- Modify: `packages/ui/src/fee-grid.tsx` (`rowHref`, `highlightColumn`).
- Tests: `packages/ui/tests/stat-strip.test.tsx` (extend), `packages/ui/tests/line-glyphs.test.tsx` (new), `packages/ui/tests/fee-grid.test.tsx` (extend).

---

## Task 1: StatStrip — flexible 2–4 columns

**Files:** Modify `packages/ui/src/stat-strip.tsx`; Test `packages/ui/tests/stat-strip.test.tsx`.

- [ ] **Step 1: Write/extend the failing test**

In `packages/ui/tests/stat-strip.test.tsx` add (jsdom; create the file with the header if it doesn't exist):

```tsx
// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { StatStrip } from "../src/stat-strip";

afterEach(cleanup);

describe("StatStrip columns", () => {
  it("uses a 4-column grid for 4 stats", () => {
    const stats = [1, 2, 3, 4].map((n) => ({ label: `L${n}`, value: `${n}` }));
    const { container } = render(<StatStrip stats={stats} />);
    expect(container.querySelector(".grid")!.className).toContain("grid-cols-4");
  });
  it("uses a 2-column grid for 2 stats", () => {
    const { container } = render(<StatStrip stats={[{ label: "A", value: "1" }, { label: "B", value: "2" }]} />);
    expect(container.querySelector(".grid")!.className).toContain("grid-cols-2");
  });
});
```

- [ ] **Step 2: Run, expect FAIL** — `pnpm --filter @mathfamily/ui exec vitest run tests/stat-strip.test.tsx` (FAIL: hardcoded `grid-cols-3`).

- [ ] **Step 3: Implement** — in `stat-strip.tsx`, replace the `<dl className="grid grid-cols-3 divide-x divide-white/10">` with a computed column class. Add before the `return` (inside the function):

```tsx
  const cols = stats.length <= 2 ? "grid-cols-2" : stats.length === 3 ? "grid-cols-3" : "grid-cols-4";
```
and change the `<dl>` className to:
```tsx
className={`grid ${cols} divide-x divide-white/10`}
```
(These three literal classes are safe for Tailwind's scan. Stats > 4 fall back to 4 columns — acceptable; callers pass 2–4.)

- [ ] **Step 4: Run, expect PASS.** **Step 5: Commit** `fix(ui): StatStrip flexible 2-4 columns`.

---

## Task 2: line-glyphs — shared semantic icons

**Files:** Modify `packages/ui/src/line-glyphs.tsx`; Test `packages/ui/tests/line-glyphs.test.tsx`.

- [ ] **Step 0: Reconcile dirty file** — `git diff packages/ui/src/line-glyphs.tsx`. If it has uncommitted edits, keep them; only ADD the new exports below.

- [ ] **Step 1: Write the failing test** — create `packages/ui/tests/line-glyphs.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { PlaneGlyph, TowerGlyph, LuggageGlyph, GlobeGlyph, ChevronGlyph } from "../src/line-glyphs";

afterEach(cleanup);

describe("line-glyph icons", () => {
  it("each renders a decorative aria-hidden svg using currentColor", () => {
    for (const G of [PlaneGlyph, TowerGlyph, LuggageGlyph, GlobeGlyph, ChevronGlyph]) {
      const { container, unmount } = render(<G />);
      const svg = container.querySelector("svg")!;
      expect(svg.getAttribute("aria-hidden")).toBe("true");
      expect(container.querySelector('[stroke="currentColor"]')).not.toBeNull();
      unmount();
    }
  });
});
```

- [ ] **Step 2: Run, expect FAIL** (exports don't exist).

- [ ] **Step 3: Implement** — append to `packages/ui/src/line-glyphs.tsx` (preserve existing `RunwayDivider`):

```tsx
const glyphBase = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function PlaneGlyph({ className }: { className?: string }) {
  return (<svg {...glyphBase} className={className}><path d="M10.5 13.5 3 12l2-3 5 1 5-6a2 2 0 0 1 3 3l-6 5 1 5-3 2-1.5-7.5z" /></svg>);
}
export function TowerGlyph({ className }: { className?: string }) {
  return (<svg {...glyphBase} className={className}><path d="M12 3v4M9 7h6l-1 7H10z" /><path d="M8 21l1.5-7M16 21l-1.5-7M7 21h10" /></svg>);
}
export function LuggageGlyph({ className }: { className?: string }) {
  return (<svg {...glyphBase} className={className}><rect x="6" y="7" width="12" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M9 20v1M15 20v1" /></svg>);
}
export function GlobeGlyph({ className }: { className?: string }) {
  return (<svg {...glyphBase} className={className}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" /></svg>);
}
export function ChevronGlyph({ className }: { className?: string }) {
  return (<svg {...glyphBase} className={className}><path d="M9 6l6 6-6 6" /></svg>);
}
```

- [ ] **Step 4: Run, expect PASS.** **Step 5: Commit** `feat(ui): shared semantic line-glyph icons (plane/tower/luggage/globe/chevron)`.

---

## Task 3: `.mf-row-link` token (whole-card clickable overlay)

**Files:** Modify `packages/ui/src/tokens.css`.

- [ ] **Step 1: Add the CSS** — append to `packages/ui/src/tokens.css`:

```css
/* ── Whole-card click target: a single real link whose ::after covers its
   positioned ancestor. Put `.mf-row-link` on the <a>, `relative` on the card. ── */
.mf-row-link {
  text-decoration: none;
  color: inherit;
}
.mf-row-link::after {
  content: "";
  position: absolute;
  inset: 0;
}
```

- [ ] **Step 2: Commit** (CSS-only) `feat(ui): .mf-row-link whole-card click overlay token`.

---

## Task 4: FeeGrid — `rowHref` (clickable rows) + `highlightColumn`

**Files:** Modify `packages/ui/src/fee-grid.tsx`; Test `packages/ui/tests/fee-grid.test.tsx` (extend).

Backward-compatible: both props optional. On the mobile card layout, the whole card becomes one accessible link (via `.mf-row-link` ::after on a `relative` card). On the desktop table, the first-cell name becomes the link (clickable table rows are not reliably wrappable; a focusable name link is the accessible choice). `highlightColumn` tints a numeric column header + cells.

- [ ] **Step 1: Extend the test** — add to `packages/ui/tests/fee-grid.test.tsx`:

```tsx
  it("rowHref makes each card a single covering link and the table name a link", () => {
    const { container } = render(
      <FeeGrid
        columns={["Airport", "Fee"]}
        rows={[["Gatwick", "£6"], ["Luton", "£5"]]}
        rowHref={(i) => `/a/${i}`}
      />,
    );
    // mobile cards: one .mf-row-link per row, card is relative
    const cardLinks = container.querySelectorAll('[data-testid="fee-grid-card"] a.mf-row-link');
    expect(cardLinks.length).toBe(2);
    expect((cardLinks[0] as HTMLAnchorElement).getAttribute("href")).toBe("/a/0");
    // desktop table: first-cell name is a link
    expect(container.querySelector('table th[scope="row"] a')).not.toBeNull();
  });
  it("highlightColumn tints that column's cells", () => {
    const { container } = render(
      <FeeGrid columns={["Airport", "Fee"]} rows={[["Gatwick", "£6"]]} highlightColumn={1} />,
    );
    expect(container.querySelector("td.mf-col-hi")).not.toBeNull();
  });
```

(Check the existing `fee-grid.test.tsx` header for the jsdom pragma + imports; if absent, mirror the other ui tests.)

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement** — in `packages/ui/src/fee-grid.tsx`:
  - Extend the props type with: `rowHref?: (rowIndex: number) => string | undefined;` and `highlightColumn?: number;`.
  - Add a helper near the other consts: `const colHi = (j: number) => (j === highlightColumn ? " mf-col-hi" : "");` and define the tint class once: add to the numeric/prose cell usage `${colHi(j)}`. Add a CSS rule `.mf-col-hi { background: color-mix(in srgb, var(--color-brand-accent) 6%, transparent); }` to `tokens.css` (fold into Task 3's commit or add here).
  - **Table:** in the first-cell branch (`j === 0`), when `rowHref?.(i)` is defined, render the cell content as `<a href={rowHref(i)!} className="mf-press text-ink no-underline outline-none hover:text-brand-accent focus-visible:ring-2 focus-visible:ring-brand-accent/40">{cell}</a>` instead of bare `{cell}`. Append `${colHi(j)}` to numeric/prose `<td>` classNames.
  - **Card (<md):** add `relative` to the card `<div>` className when `rowHref?.(i)` is set, and render the name (`cells[0]`) as `<a href={rowHref(i)!} className="mf-row-link font-semibold text-ink">{cells[0]}</a>` (so its `::after` covers the relative card); when no `rowHref`, keep the current `<span>`.

- [ ] **Step 4: Run, expect PASS.** **Step 5: Commit** `feat(ui): FeeGrid rowHref (clickable rows) + highlightColumn`.

---

## Task 5: Verification

- [ ] `pnpm --filter @mathfamily/ui typecheck` → exit 0.
- [ ] `pnpm test` (root) → all tasks pass (ui count grows by the new tests; no regressions).
- [ ] `pnpm --filter parkmath exec next build` and `pnpm --filter roammath exec next build` → succeed (new props are additive; existing FeeGrid/StatStrip call sites unaffected).
- [ ] Commit any stragglers; report SHAs.

---

## Self-Review

**Coverage:** StatStrip flexible columns (T1) ✓; shared icons (T2) ✓; clickable rows `rowHref` (T4) ✓; `highlightColumn` (T4) ✓; cross-breakpoint winner already present (noted) ✓. Dark-token split + density tokens explicitly deferred (P5 / on-demand) ✓.
**Placeholders:** none — exact code per step. Task 4 references `.mf-col-hi` defined in Task 3/4's CSS.
**Type consistency:** `rowHref?: (i:number)=>string|undefined`, `highlightColumn?: number` used identically in props + test. StatStrip/line-glyph signatures additive.
**Backward-compat:** all new props optional; existing call sites (home StatStrip with 3 stats, existing FeeGrid usages without rowHref) render unchanged.
