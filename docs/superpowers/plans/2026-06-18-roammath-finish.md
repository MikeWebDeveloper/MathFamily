# RoamMath Finish Sprint — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Activate RoamMath's affiliate layer (Airalo / Saily / Holafly direct programmes), ship an `EsimPickCard` UI component, and replace the home page pill grid with a live trip-cost calculator island.

**Architecture:** Three sequential pieces — (1) data/resolver layer (`partners.json` + `partners.ts`), (2) UI component (`EsimPickCard` in `packages/ui`), (3) surface wiring (home island, country page call site). Each task is independently testable and committable.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4, Vitest + Testing Library (jsdom), TypeScript strict, `@mathfamily/engine` (pure calculators), `@mathfamily/data` (Zod-validated JSON).

---

## Testing conventions (read before writing any test)

- No `vitest.config.*` anywhere — esbuild deadlocks on this volume. Tests are found by default discovery.
- `packages/ui` tests need `// @vitest-environment jsdom` as the **first line** and use `@testing-library/react`.
- `apps/roammath` tests use plain Vitest; app-level page tests use `renderToStaticMarkup` (no jsdom).
- Import via relative paths in tests — the `@/` alias does not resolve in config-less Vitest.
- Run a single test file: `cd packages/ui && pnpm exec vitest run tests/EsimPickCard.test.tsx`
- Run roammath tests: `cd apps/roammath && pnpm exec vitest run tests`

---

## Task 1 — Restructure `partners.json`

**Files:**
- Modify: `apps/roammath/lib/partners.json`

- [ ] **Replace the file contents** with the new per-provider structure. The `slots` array is gone; each provider carries its own deeplink template.

```json
{
  "partners": {
    "airalo": {
      "name": "Airalo",
      "active": false,
      "deeplinkTemplate": "",
      "trackingNote": "fill after partners.airalo.com signup — use {countrySlug} and {clickref} placeholders"
    },
    "saily": {
      "name": "Saily",
      "active": false,
      "deeplinkTemplate": "",
      "trackingNote": "fill after saily.com/affiliate signup"
    },
    "holafly": {
      "name": "Holafly",
      "active": false,
      "deeplinkTemplate": "",
      "trackingNote": "fill after holafly.com/affiliate signup"
    }
  }
}
```

- [ ] **Commit**

```bash
git add apps/roammath/lib/partners.json
git commit -m "config(roammath): restructure partners.json — per-provider deeplinks, drop slots array"
```

---

## Task 2 — Refactor `partners.ts` (TDD)

**Files:**
- Modify: `apps/roammath/lib/partners.ts`
- Modify: `apps/roammath/tests/partners.test.ts`

- [ ] **Write the failing tests** — replace the entire contents of `apps/roammath/tests/partners.test.ts`:

```ts
import { describe, test, expect } from "vitest";
import { resolveSlot, buildAffiliateUrl } from "../lib/partners";

describe("buildAffiliateUrl", () => {
  test("substitutes {countrySlug} and {clickref}", () => {
    const url = buildAffiliateUrl(
      "https://airalo.com/esim/{countrySlug}?click={clickref}",
      "spain"
    );
    expect(url).toBe("https://airalo.com/esim/spain?click=esim-spain");
  });

  test("handles template with only countrySlug", () => {
    const url = buildAffiliateUrl("https://example.com/{countrySlug}", "france");
    expect(url).toBe("https://example.com/france");
  });

  test("handles template with no placeholders (returns as-is)", () => {
    const url = buildAffiliateUrl("https://example.com/store", "germany");
    expect(url).toBe("https://example.com/store");
  });
});

describe("resolveSlot", () => {
  const officialUrl = "https://airalo.com";

  test("returns official fallback when providerName is null", () => {
    const result = resolveSlot(null, "spain", officialUrl);
    expect(result.kind).toBe("official");
    expect(result.url).toBe(officialUrl);
    expect(result.disclosureRequired).toBe(false);
    expect(result.partnerName).toBeNull();
  });

  test("returns official fallback for unknown provider name", () => {
    const result = resolveSlot("UnknownProvider", "spain", officialUrl);
    expect(result.kind).toBe("official");
    expect(result.url).toBe(officialUrl);
  });

  test("returns official fallback when partner is inactive (real JSON has active: false)", () => {
    const result = resolveSlot("Airalo", "spain", officialUrl);
    expect(result.kind).toBe("official");
  });

  test("returns official fallback when provider name is empty string", () => {
    const result = resolveSlot("", "spain", officialUrl);
    expect(result.kind).toBe("official");
  });

  test("official fallback label is 'Check live eSIM prices'", () => {
    const result = resolveSlot(null, "spain", officialUrl);
    expect(result.label).toBe("Check live eSIM prices");
  });
});
```

- [ ] **Run the tests to confirm they fail**

```bash
cd apps/roammath && pnpm exec vitest run tests/partners.test.ts
```

Expected: errors about `buildAffiliateUrl` not exported, and the old `resolveSlot` signature mismatches.

- [ ] **Replace `apps/roammath/lib/partners.ts`** with the new implementation:

```ts
import partnersJson from "./partners.json";

export interface ResolvedSlot {
  kind: "affiliate" | "official";
  url: string;
  label: string;
  partnerName: string | null;
  disclosureRequired: boolean;
}

interface PartnerConfig {
  name: string;
  active: boolean;
  deeplinkTemplate: string;
  trackingNote: string;
}

export function buildAffiliateUrl(template: string, countrySlug: string): string {
  const clickref = `esim-${countrySlug}`;
  return template
    .replaceAll("{countrySlug}", countrySlug)
    .replaceAll("{clickref}", clickref);
}

export function resolveSlot(
  providerName: string | null,
  countrySlug: string,
  officialUrl: string
): ResolvedSlot {
  const fallback: ResolvedSlot = {
    kind: "official",
    url: officialUrl,
    label: "Check live eSIM prices",
    partnerName: null,
    disclosureRequired: false,
  };

  if (!providerName) return fallback;

  const key = providerName.toLowerCase();
  const partner = (partnersJson.partners as Record<string, PartnerConfig>)[key];

  if (!partner?.active || !partner.deeplinkTemplate.startsWith("http")) {
    return fallback;
  }

  return {
    kind: "affiliate",
    url: buildAffiliateUrl(partner.deeplinkTemplate, countrySlug),
    label: `Buy with ${partner.name}`,
    partnerName: partner.name,
    disclosureRequired: true,
  };
}
```

- [ ] **Run the tests to confirm they pass**

```bash
cd apps/roammath && pnpm exec vitest run tests/partners.test.ts
```

Expected: all tests pass.

- [ ] **Commit**

```bash
git add apps/roammath/lib/partners.ts apps/roammath/tests/partners.test.ts
git commit -m "feat(roammath): refactor resolveSlot — provider-keyed, add buildAffiliateUrl"
```

---

## Task 3 — `EsimPickCard` component (TDD)

**Files:**
- Create: `packages/ui/src/EsimPickCard.tsx`
- Create: `packages/ui/tests/EsimPickCard.test.tsx`
- Modify: `packages/ui/src/index.ts`

- [ ] **Write the failing test** — create `packages/ui/tests/EsimPickCard.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, cleanup, screen } from "@testing-library/react";
import { afterEach, test, expect } from "vitest";
import { EsimPickCard } from "../src/EsimPickCard";

afterEach(cleanup);

test("affiliate variant: renders best pick badge, price, provider, CTA, and disclosure", () => {
  render(
    <EsimPickCard
      providerName="Airalo"
      bundleName="Spain 5GB 7-Day"
      totalFormatted="£14.99"
      countryName="Spain"
      affiliateUrl="https://airalo.com/spain?ref=test"
      disclosureRequired={true}
    />
  );
  expect(screen.getByText(/Best eSIM pick/i)).toBeTruthy();
  expect(screen.getByText("Airalo")).toBeTruthy();
  expect(screen.getByText("£14.99")).toBeTruthy();
  expect(screen.getByText(/Spain · Spain 5GB 7-Day/i)).toBeTruthy();
  expect(screen.getByRole("link", { name: /Buy with Airalo/i })).toBeTruthy();
  expect(screen.getByText(/Affiliate link/i)).toBeTruthy();
  expect(screen.queryByText(/Affiliate link/i)?.textContent).toContain("Airalo");
});

test("affiliate variant: link has rel=sponsored", () => {
  render(
    <EsimPickCard
      providerName="Airalo"
      bundleName="Spain 5GB"
      totalFormatted="£14.99"
      countryName="Spain"
      affiliateUrl="https://airalo.com/spain?ref=test"
      disclosureRequired={true}
    />
  );
  const link = screen.getByRole("link", { name: /Buy with Airalo/i }) as HTMLAnchorElement;
  expect(link.rel).toContain("sponsored");
  expect(link.href).toBe("https://airalo.com/spain?ref=test");
});

test("fallback variant: renders official link, no badge, no disclosure", () => {
  render(
    <EsimPickCard
      providerName={null}
      bundleName={null}
      totalFormatted={null}
      countryName="Spain"
      affiliateUrl="https://airalo.com"
      disclosureRequired={false}
    />
  );
  expect(screen.getByRole("link", { name: /Check live eSIM prices/i })).toBeTruthy();
  expect(screen.queryByText(/Best eSIM pick/i)).toBeNull();
  expect(screen.queryByText(/Affiliate link/i)).toBeNull();
});

test("fallback variant: link does not have rel=sponsored", () => {
  render(
    <EsimPickCard
      providerName={null}
      bundleName={null}
      totalFormatted={null}
      countryName="Spain"
      affiliateUrl="https://airalo.com"
      disclosureRequired={false}
    />
  );
  const link = screen.getByRole("link", { name: /Check live eSIM prices/i }) as HTMLAnchorElement;
  expect(link.rel).not.toContain("sponsored");
});
```

- [ ] **Run the test to confirm it fails**

```bash
cd packages/ui && pnpm exec vitest run tests/EsimPickCard.test.tsx
```

Expected: FAIL — `EsimPickCard` not found.

- [ ] **Create `packages/ui/src/EsimPickCard.tsx`**:

```tsx
export interface EsimPickCardProps {
  providerName: string | null;
  bundleName: string | null;
  totalFormatted: string | null;
  countryName: string;
  affiliateUrl: string;
  disclosureRequired: boolean;
}

export function EsimPickCard({
  providerName,
  bundleName,
  totalFormatted,
  countryName,
  affiliateUrl,
  disclosureRequired,
}: EsimPickCardProps) {
  if (!providerName || !disclosureRequired) {
    return (
      <div className="rounded-card border border-ink/10 bg-card p-4">
        <p className="mb-2 text-sm font-medium text-ink-muted">eSIM option</p>
        <a
          href={affiliateUrl}
          rel="noopener noreferrer"
          target="_blank"
          className="font-semibold text-brand-accent underline underline-offset-4"
        >
          Check live eSIM prices ↗
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-brand-accent/30 bg-brand-accent/[0.06] p-4 dark:border-brand-accent/20 dark:bg-brand-accent/[0.08]">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-accent">
        ✦ Best eSIM pick
      </p>
      <p className="text-lg font-bold text-ink">{providerName}</p>
      {totalFormatted !== null && (
        <p className="text-3xl font-bold tracking-tight text-ink">{totalFormatted}</p>
      )}
      {bundleName && (
        <p className="mt-0.5 text-sm text-ink-muted">
          {countryName} · {bundleName}
        </p>
      )}
      <a
        href={affiliateUrl}
        rel="sponsored noopener noreferrer"
        target="_blank"
        className="mt-4 inline-flex min-h-11 items-center rounded-full bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Buy with {providerName} ↗
      </a>
      <p className="mt-3 text-xs text-ink-muted">
        Affiliate link — if you buy through {providerName}, RoamMath may earn a commission at no cost to you.
        This never affects which option we show as cheapest.
      </p>
    </div>
  );
}
```

- [ ] **Export from `packages/ui/src/index.ts`** — add this line to the exports (alongside the existing exports):

```ts
export { EsimPickCard } from "./EsimPickCard";
export type { EsimPickCardProps } from "./EsimPickCard";
```

- [ ] **Run the test to confirm it passes**

```bash
cd packages/ui && pnpm exec vitest run tests/EsimPickCard.test.tsx
```

Expected: all 4 tests pass.

- [ ] **Commit**

```bash
git add packages/ui/src/EsimPickCard.tsx packages/ui/tests/EsimPickCard.test.tsx packages/ui/src/index.ts
git commit -m "feat(ui): add EsimPickCard component — affiliate pick card with fallback mode"
```

---

## Task 4 — Refactor `AffiliateBlock` + update country page call site

**Files:**
- Modify: `apps/roammath/components/affiliate-block.tsx`
- Modify: `apps/roammath/app/roaming/[country]/page.tsx`
- Modify: `apps/roammath/tests/roaming-answer.test.tsx`

- [ ] **Replace `apps/roammath/components/affiliate-block.tsx`**:

```tsx
import { formatPence } from "@mathfamily/engine";
import { EsimPickCard } from "@mathfamily/ui";
import { resolveSlot } from "@/lib/partners";

interface AffiliateBlockProps {
  providerName: string | null;
  countrySlug: string;
  officialUrl: string;
  bundleName: string | null;
  totalPence: number | null;
  countryName: string;
}

export function AffiliateBlock({
  providerName,
  countrySlug,
  officialUrl,
  bundleName,
  totalPence,
  countryName,
}: AffiliateBlockProps) {
  const slot = resolveSlot(providerName, countrySlug, officialUrl);
  const totalFormatted = totalPence !== null ? formatPence(totalPence) : null;
  return (
    <EsimPickCard
      providerName={slot.partnerName}
      bundleName={bundleName}
      totalFormatted={totalFormatted}
      countryName={countryName}
      affiliateUrl={slot.url}
      disclosureRequired={slot.disclosureRequired}
    />
  );
}
```

- [ ] **Update the `AffiliateBlock` call site in `apps/roammath/app/roaming/[country]/page.tsx`** — find this block (around line 146):

```tsx
      {esim ? (
        <AffiliateBlock slotId="esim" airportSlug={destination.countrySlug} officialUrl={esim.sourceUrl} />
      ) : null}
```

Replace with:

```tsx
      {esim ? (
        <AffiliateBlock
          providerName={m.esimChoice?.provider ?? null}
          countrySlug={destination.countrySlug}
          officialUrl={esim.sourceUrl}
          bundleName={m.esimChoice?.bundleName ?? null}
          totalPence={m.esimChoice?.totalPence ?? null}
          countryName={destination.countryName}
        />
      ) : null}
```

- [ ] **Read `apps/roammath/tests/roaming-answer.test.tsx`** first. The file may test the `RoamingAnswer` component or the `AffiliateBlock` directly. Identify any line that references `slotId`, `airportSlug`, or the old `AffiliateBlock` props (`slotId="esim"`), and update only those lines. If the file tests `AffiliateBlock` directly with the old signature, replace with:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { test, expect } from "vitest";
import { AffiliateBlock } from "../components/affiliate-block";

test("AffiliateBlock renders fallback (official link) when all partners inactive", () => {
  const html = renderToStaticMarkup(
    <AffiliateBlock
      providerName="Airalo"
      countrySlug="spain"
      officialUrl="https://airalo.com/spain"
      bundleName="Spain 5GB"
      totalPence={1499}
      countryName="Spain"
    />
  );
  // All partners are active: false in partners.json, so fallback mode
  expect(html).toContain("Check live eSIM prices");
  expect(html).not.toContain("Affiliate link");
  expect(html).not.toContain("Best eSIM pick");
});

test("AffiliateBlock renders eSIM option section regardless", () => {
  const html = renderToStaticMarkup(
    <AffiliateBlock
      providerName={null}
      countrySlug="france"
      officialUrl="https://airalo.com/france"
      bundleName={null}
      totalPence={null}
      countryName="France"
    />
  );
  expect(html).toContain("Check live eSIM prices");
});
```

- [ ] **Run all roammath tests**

```bash
cd apps/roammath && pnpm exec vitest run tests
```

Expected: all pass (partners, roaming-content, baggage-content, open-data, roaming-answer).

- [ ] **Commit**

```bash
git add apps/roammath/components/affiliate-block.tsx apps/roammath/app/roaming/[country]/page.tsx apps/roammath/tests/roaming-answer.test.tsx
git commit -m "feat(roammath): wire EsimPickCard into AffiliateBlock, update country page call site"
```

---

## Task 5 — `HomeTripCalculator` client island

**Files:**
- Create: `apps/roammath/components/home-trip-calculator.tsx`

- [ ] **Create `apps/roammath/components/home-trip-calculator.tsx`**:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { roamingTripCost, formatPence } from "@mathfamily/engine";
import type { RoamingDestination, EsimCountry } from "@mathfamily/data";
import { CountryFlag } from "@mathfamily/ui";
import { NETWORK_LABELS } from "@/lib/roaming-content";

interface HomeTripCalculatorProps {
  destinations: RoamingDestination[];
  esimRecords: Pick<EsimCountry, "countrySlug" | "bundles">[];
}

const DATA_GB_OPTIONS = [1, 3, 5, 10] as const;

export function HomeTripCalculator({ destinations, esimRecords }: HomeTripCalculatorProps) {
  const defaultSlug = destinations.find((d) => d.countrySlug === "spain")?.countrySlug
    ?? destinations[0]?.countrySlug
    ?? "";

  const [selectedSlug, setSelectedSlug] = useState(defaultSlug);
  const [days, setDays] = useState(7);
  const [dataGb, setDataGb] = useState(5);

  const destination = destinations.find((d) => d.countrySlug === selectedSlug);
  const esimRecord = esimRecords.find((r) => r.countrySlug === selectedSlug);
  const result = destination
    ? roamingTripCost(destination.perNetwork, esimRecord?.bundles ?? [], days, dataGb)
    : null;

  const cheapest = result?.cheapestNetwork;
  const esimPick = result?.esimChoice;

  return (
    <div className="space-y-5 rounded-card border border-ink/10 bg-card p-4 sm:p-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4">
        {/* Destination */}
        <label className="flex min-w-48 flex-1 flex-col gap-1">
          <span className="text-xs font-medium text-ink-muted">Destination</span>
          <select
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
            className="min-h-10 rounded-lg border border-ink/15 bg-surface px-3 py-2 text-sm text-ink"
          >
            {destinations.map((d) => (
              <option key={d.countrySlug} value={d.countrySlug}>
                {d.countryName}
              </option>
            ))}
          </select>
        </label>

        {/* Days */}
        <label className="flex min-w-36 flex-col gap-1">
          <span className="text-xs font-medium text-ink-muted">
            Days: <strong>{days}</strong>
          </span>
          <input
            type="range"
            min={1}
            max={30}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="accent-brand-accent"
            aria-label="Number of days"
          />
        </label>

        {/* Data */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-ink-muted">Data per day</span>
          <div className="flex gap-1">
            {DATA_GB_OPTIONS.map((gb) => (
              <button
                key={gb}
                type="button"
                onClick={() => setDataGb(gb)}
                className={`min-h-10 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  dataGb === gb
                    ? "bg-brand-accent text-white"
                    : "border border-ink/15 bg-surface text-ink hover:border-brand-accent/40"
                }`}
              >
                {gb}GB
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Inline results */}
      {result && destination && (
        <>
          <div className="flex flex-wrap gap-3">
            {/* Cheapest network card */}
            <div className="min-w-40 flex-1 rounded-lg border border-ink/10 bg-surface p-3">
              <p className="text-xs font-medium text-ink-muted">Cheapest network</p>
              <p className="text-2xl font-bold tracking-tight text-ink">
                {cheapest?.included
                  ? "£0"
                  : cheapest?.totalPence != null
                    ? formatPence(cheapest.totalPence)
                    : "—"}
              </p>
              <p className="text-xs text-ink-muted">
                {cheapest
                  ? cheapest.included
                    ? `${NETWORK_LABELS[cheapest.network] ?? cheapest.network} — included`
                    : NETWORK_LABELS[cheapest.network] ?? cheapest.network
                  : "No standard pass"}
              </p>
            </div>

            {/* Best eSIM card */}
            {esimPick && (
              <div className="min-w-40 flex-1 rounded-lg border border-brand-accent/20 bg-brand-accent/[0.06] p-3">
                <p className="text-xs font-medium text-brand-accent">Best eSIM</p>
                <p className="text-2xl font-bold tracking-tight text-ink">
                  {formatPence(esimPick.totalPence)}
                </p>
                <p className="text-xs text-ink-muted">
                  {esimPick.provider} · {esimPick.bundleName}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {destination.iso2 && (
              <CountryFlag iso2={destination.iso2} size={20} className="shrink-0" />
            )}
            <Link
              href={`/roaming/${destination.countrySlug}`}
              className="text-sm font-semibold text-brand-accent underline underline-offset-4"
            >
              See full breakdown for {destination.countryName} →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Verify typecheck passes** (no test for client islands — covered by build):

```bash
cd apps/roammath && pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Commit**

```bash
git add apps/roammath/components/home-trip-calculator.tsx
git commit -m "feat(roammath): HomeTripCalculator client island — destination/days/GB → inline result"
```

---

## Task 6 — Update home page to integrate `HomeTripCalculator`

**Files:**
- Modify: `apps/roammath/app/page.tsx`

- [ ] **Open `apps/roammath/app/page.tsx`** and add the import at the top alongside existing imports:

```ts
import { HomeTripCalculator } from "@/components/home-trip-calculator";
```

- [ ] **Derive the eSIM records for the calculator** — after the existing `const esimDataset = loadEsimDataset();` line, add:

```ts
const calculatorEsimRecords = esimDataset.records.map((r) => ({
  countrySlug: r.countrySlug,
  bundles: r.bundles,
}));
```

- [ ] **Add `HomeTripCalculator` to the JSX** — in the returned JSX, add a new `<section>` between the hero `<section>` (which ends with the `<p className="max-w-2xl ...">` paragraph) and the existing `<section>` that contains `<StatStrip>`. The result should look like:

```tsx
      {/* hero section stays exactly as-is above this */}

      <section>
        <HomeTripCalculator
          destinations={destinations}
          esimRecords={calculatorEsimRecords}
        />
      </section>

      <section>
        <StatStrip stats={[
          { label: "Destinations tracked", value: String(destinationCount), note: "roaming charges per destination" },
          { label: "Networks compared", value: "4 + 3", note: "EE, O2, Vodafone, Three + eSIM providers" },
          { label: "Cheapest week in Spain", value: spainStatValue, note: spainStatNote },
        ]} />
      </section>

      {/* rest of the page stays exactly as-is below */}
```

- [ ] **Run all roammath tests one final time**

```bash
cd apps/roammath && pnpm exec vitest run tests
```

Expected: all pass.

- [ ] **Run the full build to confirm all routes are still static**

```bash
pnpm --filter roammath build 2>&1 | grep -E "Route|Error|warn"
```

Expected: `/`, `/roaming`, `/roaming/[country]`, `/baggage-fees`, `/baggage-fees/[airline]` all show as `●` (static). No errors.

- [ ] **Commit**

```bash
git add apps/roammath/app/page.tsx
git commit -m "feat(roammath): add HomeTripCalculator hero to home page — trip cost above the fold"
```

---

## Task 7 — Run the full test suite and typecheck

- [ ] **Run the workspace-wide test suite**

```bash
pnpm test
```

Expected: all packages pass. If `packages/ui` tests fail, re-run isolated:
```bash
cd packages/ui && pnpm exec vitest run tests/EsimPickCard.test.tsx
```

- [ ] **Run typecheck across all packages**

```bash
pnpm typecheck
```

Expected: clean. Common issue: if `packages/ui/src/index.ts` export line has a syntax error, fix it and re-run.

- [ ] **Manual smoke test** (run the dev server and visit the pages):

```bash
pnpm --filter roammath dev
```

Open `http://localhost:3001`:
- Calculator renders with Spain / 7 days / 5GB defaults and shows two result cards.
- Changing destination updates both result cards immediately.
- "See full breakdown" link points to the right country slug.

Open `http://localhost:3001/roaming/spain`:
- `EsimPickCard` shows in fallback mode: "Check live eSIM prices" link, no badge, no disclosure.
- All other sections (AnswerLead, FeeGrid, FAQ) render as before.

- [ ] **Final commit if any fixups needed**

```bash
git add -p   # stage only intentional changes
git commit -m "fix(roammath): finish sprint fixups"
```

---

## Activation runbook (after this plan is merged)

Once the code ships, activating any affiliate partner requires only a JSON change — no code deployment needed beyond the redeploy:

1. Sign up and obtain deeplink URL from the partner dashboard:
   - Airalo: `partners.airalo.com`
   - Saily: `saily.com/affiliate`
   - Holafly: `holafly.com/affiliate`

2. In `apps/roammath/lib/partners.json`, set:
   ```json
   "deeplinkTemplate": "https://<provider-deeplink>/{countrySlug}?clickref={clickref}",
   "active": true
   ```

3. Open a PR. The diff is one JSON file. Merge → Vercel redeploy → affiliate card goes live on every country page where the engine picks that provider as the cheapest eSIM.

**Affiliate links on-site only** — never in social/forum/email copy (same rule as ParkMath/Holiday Extras).
