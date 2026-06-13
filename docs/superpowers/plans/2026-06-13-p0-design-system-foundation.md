# P0 Design-System Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the shared accessibility foundation — 44px touch targets, visible focus rings, accessible disclosure, a reusable live-region announcer, and route loading/error boundaries — that every later design-upgrade phase depends on.

**Architecture:** Mostly small, surgical edits to existing shared `packages/ui` components plus two new tiny pieces (a `LiveRegion` component and per-app `loading.tsx`). No visual redesign — only height/focus/semantics changes. Both apps inherit the `packages/ui` changes automatically.

**Tech Stack:** React 19, Next.js 16 App Router, Tailwind v4, Vitest. `packages/ui` tests run jsdom + `@testing-library/react` (first line `// @vitest-environment jsdom`); app component tests use `renderToStaticMarkup` from `react-dom/server`.

**Branch:** `design-upgrade-p0` (already checked out).

**Hard constraints:**
- Never create a vitest/vite config file on this volume (esbuild `build()` deadlocks). Vitest runs config-less; the commands below work as-is.
- Every commit message ends with the trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- Pre-existing dirty files `packages/ui/src/line-glyphs.tsx` and `packages/ui/tests/ambient.test.tsx` are unrelated — do NOT stage or touch them.

---

## File Structure

**Modify (`packages/ui/src`):** `segmented-control.tsx` (44px + ring), `faq-accordion.tsx` (summary focus ring), `email-capture-slot.tsx` (button+input rings), `index.ts` (export LiveRegion).
**Create (`packages/ui/src`):** `live-region.tsx`.
**Modify (`packages/ui/tests`):** add `segmented-control.a11y.test.tsx`, `faq-accordion.test.tsx`, `email-capture-slot.test.tsx`, `live-region.test.tsx` (or extend existing files if present — check first).
**Modify (`apps/parkmath`):** `components/nearby-airports.tsx` (wire LiveRegion + role=alert), `tests/nearby-airports.test.tsx` (assert live region).
**Create:** `apps/parkmath/app/loading.tsx`, `apps/roammath/app/loading.tsx`, `apps/roammath/app/error.tsx`, `apps/roammath/app/not-found.tsx`.

---

## Task 1: SegmentedControl — 44px target + focus ring

**Files:**
- Modify: `packages/ui/src/segmented-control.tsx`
- Test: `packages/ui/tests/segmented-control.a11y.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `packages/ui/tests/segmented-control.a11y.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { SegmentedControl } from "../src/segmented-control";

afterEach(cleanup);

describe("SegmentedControl a11y", () => {
  it("option buttons are 44px and have a focus-visible ring", () => {
    const { container } = render(
      <SegmentedControl
        ariaLabel="Sort"
        value="a"
        onChange={() => {}}
        options={[{ value: "a", label: "A" }, { value: "b", label: "B" }]}
      />,
    );
    const btn = container.querySelector('button[role="radio"]')!;
    expect(btn.className).toContain("min-h-11");
    expect(btn.className).toContain("focus-visible:ring-2");
    expect(btn.className).not.toContain("min-h-9");
  });
});
```

- [ ] **Step 2: Run the test, expect FAIL**

Run: `pnpm --filter @mathfamily/ui exec vitest run tests/segmented-control.a11y.test.tsx`
Expected: FAIL (`min-h-9` still present, no `focus-visible:ring-2`).

- [ ] **Step 3: Implement**

In `packages/ui/src/segmented-control.tsx`, change the button `className` (line 26) from:
```tsx
className={`min-h-9 rounded-full px-3 transition-colors ${o.value === value ? "bg-white text-brand shadow-sm" : "text-ink-muted hover:text-ink"}`}
```
to:
```tsx
className={`mf-press inline-flex min-h-11 items-center rounded-full px-3.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-accent/50 ${o.value === value ? "bg-white text-brand shadow-sm" : "text-ink-muted hover:text-ink"}`}
```

- [ ] **Step 4: Run the test, expect PASS**

Run: `pnpm --filter @mathfamily/ui exec vitest run tests/segmented-control.a11y.test.tsx`
Expected: PASS.

- [ ] **Step 5: Typecheck + commit**

Run: `pnpm --filter @mathfamily/ui typecheck` (expect exit 0).
```bash
git add packages/ui/src/segmented-control.tsx packages/ui/tests/segmented-control.a11y.test.tsx
git commit -m "$(printf 'fix(ui): SegmentedControl 44px target + focus-visible ring\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 2: FaqAccordion — visible focus ring on the disclosure (keep native `<details>`)

**Files:**
- Modify: `packages/ui/src/faq-accordion.tsx`
- Test: `packages/ui/tests/faq-accordion.test.tsx`

Native `<details>/<summary>` already provides keyboard + screen-reader disclosure semantics and works with JS off — we keep it. The only WCAG gap is a missing visible focus indicator on the `<summary>`.

- [ ] **Step 1: Write the failing test**

Create `packages/ui/tests/faq-accordion.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { FaqAccordion } from "../src/faq-accordion";

afterEach(cleanup);

describe("FaqAccordion", () => {
  it("renders native details/summary with a visible focus ring and the answer", () => {
    const { container, getByText } = render(
      <FaqAccordion items={[{ question: "How much?", answer: "Six pounds." }]} />,
    );
    const summary = container.querySelector("summary")!;
    expect(summary).not.toBeNull();
    expect(summary.className).toContain("focus-visible:ring-2");
    expect(getByText("Six pounds.")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test, expect FAIL**

Run: `pnpm --filter @mathfamily/ui exec vitest run tests/faq-accordion.test.tsx`
Expected: FAIL (no `focus-visible:ring-2` on summary).

- [ ] **Step 3: Implement**

In `packages/ui/src/faq-accordion.tsx`, change the `<summary>` className (line 9) from:
```tsx
className="flex cursor-pointer items-center justify-between gap-4 p-5 font-medium text-ink transition-colors hover:bg-surface marker:content-none"
```
to:
```tsx
className="flex min-h-11 cursor-pointer items-center justify-between gap-4 p-5 font-medium text-ink outline-none transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-accent/50 marker:content-none"
```

- [ ] **Step 4: Run the test, expect PASS**

Run: `pnpm --filter @mathfamily/ui exec vitest run tests/faq-accordion.test.tsx`
Expected: PASS.

- [ ] **Step 5: Typecheck + commit**

Run: `pnpm --filter @mathfamily/ui typecheck` (expect exit 0).
```bash
git add packages/ui/src/faq-accordion.tsx packages/ui/tests/faq-accordion.test.tsx
git commit -m "$(printf 'fix(ui): visible focus ring on FaqAccordion summary\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 3: EmailCaptureSlot — focus rings on input + button

**Files:**
- Modify: `packages/ui/src/email-capture-slot.tsx`
- Test: `packages/ui/tests/email-capture-slot.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `packages/ui/tests/email-capture-slot.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { EmailCaptureSlot } from "../src/email-capture-slot";

afterEach(cleanup);

describe("EmailCaptureSlot", () => {
  it("input and submit button expose focus rings", () => {
    const { container } = render(<EmailCaptureSlot formAction="https://example.com/sub" hook="Get alerts" />);
    const input = container.querySelector('input[type="email"]')!;
    const button = container.querySelector('button[type="submit"]')!;
    expect(input.className).toContain("focus:ring-2");
    expect(button.className).toContain("focus-visible:ring-2");
  });
  it("renders nothing without a formAction", () => {
    const { container } = render(<EmailCaptureSlot hook="Get alerts" />);
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test, expect FAIL**

Run: `pnpm --filter @mathfamily/ui exec vitest run tests/email-capture-slot.test.tsx`
Expected: FAIL (no ring classes).

- [ ] **Step 3: Implement**

In `packages/ui/src/email-capture-slot.tsx`:
- Input className (line 14) from:
  ```tsx
  className="w-full rounded-lg border border-ink/20 px-3 py-2 text-sm"
  ```
  to:
  ```tsx
  className="w-full rounded-lg border border-ink/20 px-3 py-2 text-sm outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/30"
  ```
- Button className (line 16) from:
  ```tsx
  className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white"
  ```
  to:
  ```tsx
  className="mf-press inline-flex min-h-11 items-center rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50"
  ```

- [ ] **Step 4: Run the test, expect PASS**

Run: `pnpm --filter @mathfamily/ui exec vitest run tests/email-capture-slot.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Typecheck + commit**

Run: `pnpm --filter @mathfamily/ui typecheck` (expect exit 0).
```bash
git add packages/ui/src/email-capture-slot.tsx packages/ui/tests/email-capture-slot.test.tsx
git commit -m "$(printf 'fix(ui): focus rings + 44px on EmailCaptureSlot input/button\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 4: LiveRegion announcer component

**Files:**
- Create: `packages/ui/src/live-region.tsx`
- Test: `packages/ui/tests/live-region.test.tsx`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/ui/tests/live-region.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { LiveRegion } from "../src/live-region";

afterEach(cleanup);

describe("LiveRegion", () => {
  it("polite (default) is an sr-only aria-live=polite region carrying the message", () => {
    const { container } = render(<LiveRegion message="3 airports found near you" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute("aria-live")).toBe("polite");
    expect(el.getAttribute("aria-atomic")).toBe("true");
    expect(el.className).toContain("sr-only");
    expect(el.textContent).toBe("3 airports found near you");
  });
  it("variant='alert' renders role=alert (assertive)", () => {
    const { container } = render(<LiveRegion message="Couldn't get your location" variant="alert" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute("role")).toBe("alert");
  });
});
```

- [ ] **Step 2: Run the test, expect FAIL**

Run: `pnpm --filter @mathfamily/ui exec vitest run tests/live-region.test.tsx`
Expected: FAIL (cannot resolve `../src/live-region`).

- [ ] **Step 3: Implement**

Create `packages/ui/src/live-region.tsx`:

```tsx
/** Visually-hidden status announcer for assistive tech. Use `polite` (default) for
 *  non-urgent updates (results loaded) and `alert` for errors that should interrupt. */
export function LiveRegion({
  message,
  variant = "polite",
  className,
}: {
  message: string;
  variant?: "polite" | "alert";
  className?: string;
}) {
  const common = `sr-only ${className ?? ""}`;
  if (variant === "alert") {
    return <div role="alert" aria-atomic="true" className={common}>{message}</div>;
  }
  return <div aria-live="polite" aria-atomic="true" className={common}>{message}</div>;
}
```

- [ ] **Step 4: Run the test, expect PASS**

Run: `pnpm --filter @mathfamily/ui exec vitest run tests/live-region.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Export + typecheck + commit**

Append to `packages/ui/src/index.ts`:
```ts
export * from "./live-region";
```
Run: `pnpm --filter @mathfamily/ui typecheck` (expect exit 0).
```bash
git add packages/ui/src/live-region.tsx packages/ui/tests/live-region.test.tsx packages/ui/src/index.ts
git commit -m "$(printf 'feat(ui): LiveRegion sr-only status announcer (polite/alert)\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 5: Wire LiveRegion + role=alert into NearbyAirports

**Files:**
- Modify: `apps/parkmath/components/nearby-airports.tsx`
- Modify: `apps/parkmath/tests/nearby-airports.test.tsx`

- [ ] **Step 1: Update the test (extend existing)**

In `apps/parkmath/tests/nearby-airports.test.tsx`, add this case inside the `describe("NearbyAirports", ...)` block:

```tsx
  it("renders a polite live-region for status announcements", () => {
    const html = renderToStaticMarkup(<NearbyAirports airports={airports} />);
    expect(html).toContain('aria-live="polite"');
  });
```

- [ ] **Step 2: Run the test, expect FAIL**

Run: `pnpm --filter parkmath exec vitest run tests/nearby-airports.test.tsx`
Expected: FAIL (no `aria-live="polite"` yet).

- [ ] **Step 3: Implement**

In `apps/parkmath/components/nearby-airports.tsx`:
- Add to the import from `@mathfamily/ui` (or add a new import line): `import { LiveRegion } from "@mathfamily/ui";`
- Add a `statusMessage` derived from `status`/`results` and render a `LiveRegion`. Inside the component, before the `return`, add:
  ```tsx
  const announcement =
    status === "locating" ? "Finding your location…"
    : status === "ready" ? `${results.length} airports found near you`
    : status === "error" ? "Couldn't get your location — search above instead"
    : "";
  ```
- Immediately inside the top-level `<div className="mt-3">`, add as the first child:
  ```tsx
  <LiveRegion message={announcement} variant={status === "error" ? "alert" : "polite"} />
  ```
- The existing visible error `<p>` (the `status === "error"` paragraph) gets `role="alert"` added to it so sighted-AT users also get it surfaced. (The `LiveRegion` alert variant is the sr-only announcement; the visible `<p>` keeps its text.)

- [ ] **Step 4: Run the test, expect PASS**

Run: `pnpm --filter parkmath exec vitest run tests/nearby-airports.test.tsx`
Expected: PASS.

- [ ] **Step 5: Typecheck + commit**

Run: `pnpm --filter parkmath typecheck` (expect exit 0).
```bash
git add apps/parkmath/components/nearby-airports.tsx apps/parkmath/tests/nearby-airports.test.tsx
git commit -m "$(printf 'feat(parkmath): announce NearbyAirports status via LiveRegion\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 6: Route loading boundaries + RoamMath error/not-found parity

**Files:**
- Create: `apps/parkmath/app/loading.tsx`, `apps/roammath/app/loading.tsx`
- Create: `apps/roammath/app/error.tsx`, `apps/roammath/app/not-found.tsx`

- [ ] **Step 1: Create the loading skeletons**

Create `apps/parkmath/app/loading.tsx`:

```tsx
export default function Loading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading">
      <span className="sr-only">Loading…</span>
      <div className="mf-skeleton h-10 w-3/4" aria-hidden />
      <div className="mf-skeleton h-28 w-full" aria-hidden />
      <div className="mf-skeleton h-48 w-full" aria-hidden />
    </div>
  );
}
```

Create `apps/roammath/app/loading.tsx` with identical content (the `.mf-skeleton` and spacing tokens are shared via `packages/ui` `tokens.css`, imported by both apps' `globals.css`).

- [ ] **Step 2: Read the parkmath boundaries to mirror them for roammath**

Run: `cat apps/parkmath/app/error.tsx apps/parkmath/app/not-found.tsx`
Then create `apps/roammath/app/error.tsx` and `apps/roammath/app/not-found.tsx` as copies of the parkmath versions, changing only brand-specific copy (e.g. "ParkMath" → "RoamMath", any `/drop-off-charges` home link → `/roaming`). Keep the same structure, `"use client"` directive (error.tsx is a client component in Next), props (`error`, `reset`), and class usage. If parkmath's files reference parkmath-only routes, swap them for the roammath equivalents (`/roaming`, `/baggage-fees`).

- [ ] **Step 3: Verify the build picks them up**

Run: `pnpm --filter parkmath exec next build` then `pnpm --filter roammath exec next build`
Expected: both builds succeed and the route output lists the new boundaries (no errors). (Do NOT run `pnpm --filter <app> build` — that runs `next build && node indexnow.mjs`, which pings the IndexNow API; use `next build` directly.)

- [ ] **Step 4: Commit**

```bash
git add apps/parkmath/app/loading.tsx apps/roammath/app/loading.tsx apps/roammath/app/error.tsx apps/roammath/app/not-found.tsx
git commit -m "$(printf 'feat(apps): loading skeletons + RoamMath error/not-found parity\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 7: GlintController no-op regression test

**Files:**
- Modify: `packages/ui/tests/glint-controller.test.tsx`

`GlintController` already early-returns when `IntersectionObserver` is absent (jsdom) and when zero `.mf-glint` nodes exist. Lock the "no nodes" no-op with a regression test so a future refactor can't make it throw on tile-less pages.

- [ ] **Step 1: Add the regression test**

In `packages/ui/tests/glint-controller.test.tsx`, add inside the existing `describe`:

```tsx
  it("no-ops without throwing when there are no .mf-glint nodes", () => {
    document.body.innerHTML = "<div>no tiles here</div>";
    const { container } = render(<GlintController />);
    expect(container.firstChild).toBeNull();
    expect(document.querySelectorAll(".mf-glint").length).toBe(0);
  });
```

- [ ] **Step 2: Run the test, expect PASS** (the guard already exists)

Run: `pnpm --filter @mathfamily/ui exec vitest run tests/glint-controller.test.tsx`
Expected: PASS (2 tests). If it throws, add an explicit `if (nodes.length === 0) return;` guard in `glint-controller.tsx` before the scheduling loop (it is already present — confirm).

- [ ] **Step 3: Commit**

```bash
git add packages/ui/tests/glint-controller.test.tsx
git commit -m "$(printf 'test(ui): lock GlintController no-op on tile-less pages\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 8: Full verification

- [ ] **Step 1: Whole suite + typecheck from repo root**

Run: `pnpm typecheck` → expect all packages clean.
Run: `pnpm test` → expect all package + app test tasks pass (including the new ui a11y tests + parkmath tests).

- [ ] **Step 2: Production builds (no IndexNow side effect)**

Run: `pnpm --filter parkmath exec next build` and `pnpm --filter roammath exec next build` → both succeed.

- [ ] **Step 3: e2e unaffected**

Run: `pnpm --filter parkmath exec playwright test e2e/home-dashboard.spec.ts` → 3/3 pass.

- [ ] **Step 4: graphify refresh + commit if changed**

Run: `graphify update .`
```bash
git add graphify-out 2>/dev/null && git commit -m "$(printf 'chore: graphify update for P0 foundation\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')" || echo "graphify-out untracked/unchanged — nothing to commit"
```
(Note: `graphify-out/` is untracked in this repo, so this will typically be a no-op — expected.)

---

## Self-Review (completed while writing)

**Spec coverage:** Touch targets §1 → Task 1 (SegmentedControl; other controls' heights addressed via EmailCaptureSlot/SegmentedControl — the two flagged). Focus rings §2 → Tasks 1–3. FaqAccordion §3 → Task 2 (kept native `<details>`, a deliberate improvement over the spec's button+aria-expanded, preserving no-JS disclosure — noted). LiveRegion §4 → Tasks 4–5. Loading boundaries §5 → Task 6. GlintController §6 → Task 7. ✓

**Deliberate spec deviation:** §3 kept native `<details>/<summary>` (already accessible + works JS-off) and only added the missing focus ring, rather than converting to a JS `button`+`aria-expanded` (which would lose the no-JS disclosure the brand requires). Flagged here.

**Placeholder scan:** none — every step has concrete code or an exact command. Task 6 Step 2 intentionally instructs reading parkmath's boundaries and copying them (their exact current content isn't reproduced to avoid drift); this is a concrete copy-with-named-substitutions instruction, not a placeholder.

**Type consistency:** `LiveRegion({ message, variant?: "polite"|"alert", className? })` is defined in Task 4 and consumed identically in Task 5. SegmentedControl/EmailCaptureSlot/FaqAccordion signatures are unchanged (class-only edits). ✓

**Scope:** Single PR's worth of foundation work; token-split/FeeGrid/StatStrip/icons explicitly deferred to P0b per the spec.
