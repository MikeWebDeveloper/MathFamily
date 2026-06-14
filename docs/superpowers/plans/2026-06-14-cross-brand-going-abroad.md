# Cross-brand "Going abroad by car" — ParkMath combined-cost hub — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add ParkMath `/abroad` (index) + `/abroad/[airport]` (per-airport) static pages answering the combined "drive to the airport + go abroad" cost, plus a home 4th hub card.

**Architecture:** A pure builder (`abroadModel`) composes the existing parking/drop-off/roaming/baggage datasets into one serializable per-airport model. A presentational `AbroadAnswer` component renders it. Thin async server pages wrap the builder + emit JSON-LD. Roaming is shown as a compact summary (airport-independent) with a RoamMath CTA — never a per-airport table — so the 27 pages don't become duplicate content.

**Tech stack:** Next 16 App Router, React 19, Tailwind v4, Zod datasets, Vitest. Conventions: `apps/parkmath` lib tests = plain vitest with **relative imports** (config-less vitest can't resolve `@/`); component tests = `renderToStaticMarkup` from `react-dom/server` (NO jsdom/@testing-library — parkmath has neither). **Never create a vitest/vite config file.** Build via `pnpm --filter parkmath exec next build` (NOT `pnpm --filter parkmath build` — that pings IndexNow). All routes stay `●` SSG.

**Spec:** `docs/superpowers/specs/2026-06-14-cross-brand-going-abroad-design.md`

---

## File structure

- `apps/parkmath/lib/abroad-content.ts` — NEW. `abroadModel(slug)` builder + `abroadAirportSlugs()` + `AbroadModel` type. Pure, dataset-only. Imports `@mathfamily/data`, `@mathfamily/engine`, and `./parking-content` (relative).
- `apps/parkmath/tests/abroad-content.test.ts` — NEW. Plain vitest.
- `apps/parkmath/components/abroad-answer.tsx` — NEW. Presentational, takes `AbroadModel`, renders answer passage + panels + roaming summary + CTA.
- `apps/parkmath/tests/abroad-answer.test.tsx` — NEW. `renderToStaticMarkup`.
- `apps/parkmath/app/abroad/[airport]/page.tsx` — NEW. SSG detail page.
- `apps/parkmath/app/abroad/page.tsx` — NEW. SSG index page.
- `apps/parkmath/components/tile-icons.tsx` — MODIFY. Add `GlobeIcon`.
- `apps/parkmath/app/page.tsx` — MODIFY. 4th primary tile (Price index & data) + secondary "Going abroad by car" link.
- `apps/parkmath/components/family-links.tsx` — MODIFY. Point at `/abroad`? No — FamilyLinks points to RoamMath; instead add an in-app "Going abroad" link block on parking + drop-off pages (Task 5).
- `apps/parkmath/app/airport-parking/[airport]/page.tsx` + `apps/parkmath/app/drop-off-charges/[airport]/page.tsx` — MODIFY. Add a "Going abroad from {airport}?" link → `/abroad/{slug}`.

---

## Task 1: `abroadModel` builder + tests

**Files:**
- Create: `apps/parkmath/lib/abroad-content.ts`
- Test: `apps/parkmath/tests/abroad-content.test.ts`

- [ ] **Step 1: Write the failing test** (`apps/parkmath/tests/abroad-content.test.ts`)

```ts
import { describe, it, expect } from "vitest";
import { abroadModel, abroadAirportSlugs } from "../lib/abroad-content";

describe("abroadAirportSlugs", () => {
  it("covers every drop-off and parking airport (union, unique)", () => {
    const slugs = abroadAirportSlugs();
    expect(slugs.length).toBeGreaterThan(0);
    expect(new Set(slugs).size).toBe(slugs.length); // unique
    expect(slugs).toContain("manchester");
  });
});

describe("abroadModel", () => {
  it("returns null for an unknown airport", () => {
    expect(abroadModel("not-an-airport")).toBeNull();
  });

  it("builds a combined model for a parking+drop-off airport", () => {
    const m = abroadModel("manchester");
    expect(m).not.toBeNull();
    expect(m!.airport.slug).toBe("manchester");
    // parking present → cheapest 7-day pre-book is a positive pence figure
    expect(m!.hasParking).toBe(true);
    expect(m!.cheapestParkingPence === null || m!.cheapestParkingPence > 0).toBe(true);
    // drop-off branch is well-formed
    expect(typeof m!.dropOff.isFree).toBe("boolean");
    // roaming summary derived from the dataset
    expect(m!.roaming.totalDestinations).toBeGreaterThan(0);
    expect(m!.roaming.includedCount).toBeGreaterThanOrEqual(0);
    expect(m!.roaming.includedCount).toBeLessThanOrEqual(m!.roaming.totalDestinations);
    // baggage cabin range present
    expect(m!.baggage.cabinMinPence === null || m!.baggage.cabinMinPence >= 0).toBe(true);
    // at least one FAQ, and a verifiedAt date string
    expect(m!.faqs.length).toBeGreaterThan(0);
    expect(m!.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
```

- [ ] **Step 2: Run, verify it fails** — `pnpm --filter parkmath test` → FAIL (module not found).

- [ ] **Step 3: Implement** (`apps/parkmath/lib/abroad-content.ts`)

```ts
import {
  loadAirports,
  loadDropOffDataset,
  loadParkingDataset,
  loadBaggageDataset,
  loadRoamingDataset,
  type Airport
} from "@mathfamily/data";
import { parkingPageModel } from "./parking-content";

export interface AbroadModel {
  airport: Airport;
  hasParking: boolean;
  cheapestParkingPence: number | null; // cheapest 7-day pre-book
  cheapestParkingName: string | null;
  gateParkingPence: number | null;
  dropOff: { isFree: boolean; chargePence: number | null };
  roaming: { totalDestinations: number; includedCount: number; rowDailyFromPence: number | null };
  baggage: { cabinMinPence: number | null; cabinMaxPence: number | null };
  verifiedAt: string;
  faqs: { question: string; answer: string }[];
}

/** Union of every airport that has a drop-off OR parking record. */
export function abroadAirportSlugs(): string[] {
  const slugs = new Set(loadDropOffDataset().records.map((r) => r.airportSlug));
  for (const r of loadParkingDataset().records) slugs.add(r.airportSlug);
  return [...slugs];
}

export function abroadModel(slug: string): AbroadModel | null {
  const airport = loadAirports().find((a) => a.slug === slug);
  if (!airport) return null;

  const parkingRecord = loadParkingDataset().records.find((r) => r.airportSlug === slug) ?? null;
  const dropOffRecord = loadDropOffDataset().records.find((r) => r.airportSlug === slug) ?? null;
  if (!parkingRecord && !dropOffRecord) return null;

  // Parking: cheapest 7-day pre-book + gate, via the existing model.
  const pm = parkingRecord ? parkingPageModel(parkingRecord, 7) : null;
  const cheapestParkingPence = pm?.cheapest?.totalPence ?? null;
  const cheapestParkingName = pm?.cheapest?.name ?? null;
  const gateParkingPence = pm?.gate?.totalPence ?? null;

  // Drop-off: first band charge, or free.
  const dropOff = dropOffRecord
    ? { isFree: dropOffRecord.isFree, chargePence: dropOffRecord.isFree ? null : (dropOffRecord.bands[0]?.totalPence ?? null) }
    : { isFree: false, chargePence: null };

  // Roaming summary — airport-independent. Derived ONLY from the `included` flag
  // (the dataset does not label EU vs rest-of-world; do not assert "EU is free").
  const roam = loadRoamingDataset();
  const totalDestinations = roam.destinations.length;
  const includedCount = roam.destinations.filter((d) => d.perNetwork.some((n) => n.included)).length;
  const rowPasses = roam.destinations
    .filter((d) => !d.perNetwork.some((n) => n.included))
    .flatMap((d) => d.perNetwork.map((n) => n.dailyPassPence))
    .filter((p): p is number => p !== null && p > 0);
  const rowDailyFromPence = rowPasses.length ? Math.min(...rowPasses) : null;

  // Baggage cabin range across all airlines.
  const bag = loadBaggageDataset();
  const cabinFees = bag.records.flatMap((r) => r.fees.filter((f) => f.item.toLowerCase().includes("cabin")));
  const cabinMins = cabinFees.map((f) => f.minPence).filter((p): p is number => p !== null);
  const cabinMaxs = cabinFees.map((f) => f.maxPence).filter((p): p is number => p !== null);
  const baggage = {
    cabinMinPence: cabinMins.length ? Math.min(...cabinMins) : null,
    cabinMaxPence: cabinMaxs.length ? Math.max(...cabinMaxs) : null
  };

  // Latest verified date across every source used (ISO dates sort lexicographically).
  const dates = [
    parkingRecord?.verifiedAt,
    dropOffRecord?.verifiedAt,
    bag.lastUpdated,
    ...roam.networkSources.map((s) => s.verifiedAt)
  ].filter((d): d is string => Boolean(d));
  const verifiedAt = dates.sort().at(-1) ?? roam.lastUpdated;

  const faqs = [
    {
      question: `What's the cheapest way to get to ${airport.name} for a trip abroad?`,
      answer:
        cheapestParkingPence !== null
          ? `Pre-booked parking from ${cheapestParkingName} at ${pounds(cheapestParkingPence)} for 7 days, or a drop-off ${dropOff.isFree ? "(free at the forecourt)" : dropOff.chargePence !== null ? `charge of ${pounds(dropOff.chargePence)}` : ""}.`
          : dropOff.isFree
            ? `Drop-off is free at the forecourt; ${airport.name} parking prices aren't in our verified data yet.`
            : `A drop-off ${dropOff.chargePence !== null ? `charge of ${pounds(dropOff.chargePence)}` : "fee applies"}.`
    },
    {
      question: `Will using my phone abroad cost extra from ${airport.name}?`,
      answer: `Roaming is included on the major UK networks for ${includedCount} of the ${totalDestinations} destinations we track${rowDailyFromPence !== null ? `; elsewhere, daily passes start from ${pounds(rowDailyFromPence)} per day` : ""}. Check the exact cost for your destination on RoamMath.`
    },
    {
      question: `How much is a bag on top?`,
      answer:
        baggage.cabinMinPence !== null && baggage.cabinMaxPence !== null
          ? `A cabin bag ranges ${pounds(baggage.cabinMinPence)}–${pounds(baggage.cabinMaxPence)} across the airlines we track, depending on carrier and fare.`
          : `Cabin-bag fees vary by airline — see RoamMath's baggage comparison.`
    }
  ];

  return {
    airport,
    hasParking: parkingRecord !== null,
    cheapestParkingPence,
    cheapestParkingName,
    gateParkingPence,
    dropOff,
    roaming: { totalDestinations, includedCount, rowDailyFromPence },
    baggage,
    verifiedAt,
    faqs
  };
}

function pounds(pence: number): string {
  // Mirror engine formatPence's £-with-pennies style without importing it here for a string-only helper.
  return `£${(pence / 100).toFixed(2).replace(/\.00$/, "")}`;
}
```

> Note: prefer importing `formatPence` from `@mathfamily/engine` if the implementer wants exact parity — it's already a dependency. The local `pounds()` is acceptable but if used, keep it consistent. **Implementer: use `formatPence` from `@mathfamily/engine` instead of the local helper** for consistency, and delete `pounds`. (Replace `pounds(x)` calls with `formatPence(x)` and add `formatPence` to the `@mathfamily/engine` import.)

- [ ] **Step 4: Run, verify pass** — `pnpm --filter parkmath test` → abroad-content tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/parkmath/lib/abroad-content.ts apps/parkmath/tests/abroad-content.test.ts
git commit -m "feat(parkmath): abroadModel builder — combined going-abroad cost from shared datasets

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: `AbroadAnswer` presentational component + test

**Files:**
- Create: `apps/parkmath/components/abroad-answer.tsx`
- Test: `apps/parkmath/tests/abroad-answer.test.tsx`

- [ ] **Step 1: Write the failing test** (`renderToStaticMarkup`, no jsdom)

```tsx
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AbroadAnswer } from "../components/abroad-answer";
import type { AbroadModel } from "../lib/abroad-content";

const model: AbroadModel = {
  airport: { slug: "manchester", name: "Manchester", iata: "MAN", lat: 53.36, lng: -2.27 } as AbroadModel["airport"],
  hasParking: true,
  cheapestParkingPence: 5999,
  cheapestParkingName: "Jet Parks 1",
  gateParkingPence: 9000,
  dropOff: { isFree: false, chargePence: 500 },
  roaming: { totalDestinations: 40, includedCount: 30, rowDailyFromPence: 200 },
  baggage: { cabinMinPence: 0, cabinMaxPence: 4500 },
  verifiedAt: "2026-06-14",
  faqs: [{ question: "Q?", answer: "A." }]
};

describe("AbroadAnswer", () => {
  const html = renderToStaticMarkup(<AbroadAnswer model={model} roammathUrl="https://roammath.co.uk" />);
  it("renders a speakable answer with the airport name and parking figure", () => {
    expect(html).toContain("mf-speakable");
    expect(html).toContain("Manchester");
    expect(html).toContain("£59.99");
  });
  it("links to RoamMath for per-destination detail", () => {
    expect(html).toContain("https://roammath.co.uk/roaming");
    expect(html).toContain("rel=\"noopener noreferrer\"");
  });
  it("does NOT render a per-destination roaming table (compact summary only)", () => {
    // guard against duplicate-content regression: no <table> of destinations
    expect(html).not.toContain("<table");
  });
});
```

- [ ] **Step 2: Run, verify fail** — `pnpm --filter parkmath test` → FAIL (component missing).

- [ ] **Step 3: Implement** (`apps/parkmath/components/abroad-answer.tsx`)

```tsx
import { formatPence } from "@mathfamily/engine";
import { AnswerPassage } from "@mathfamily/ui";
import type { AbroadModel } from "../lib/abroad-content";

export function AbroadAnswer({ model, roammathUrl }: { model: AbroadModel; roammathUrl?: string }) {
  const { airport, cheapestParkingPence, cheapestParkingName, dropOff, roaming, baggage } = model;
  const parkClause = cheapestParkingPence !== null
    ? `a week's parking is ${formatPence(cheapestParkingPence)} (cheapest verified pre-book${cheapestParkingName ? `, ${cheapestParkingName}` : ""})`
    : null;
  const dropClause = dropOff.isFree ? "drop-off is free at the forecourt" : dropOff.chargePence !== null ? `drop-off costs ${formatPence(dropOff.chargePence)}` : null;
  const lead = [parkClause, dropClause].filter(Boolean).join(" — or ");
  const baggageClause = baggage.cabinMinPence !== null && baggage.cabinMaxPence !== null
    ? ` One cabin bag adds ${formatPence(baggage.cabinMinPence)}–${formatPence(baggage.cabinMaxPence)} depending on airline.`
    : "";

  return (
    <div className="space-y-6">
      <AnswerPassage question={`How much to drive to ${airport.name} and go abroad?`}>
        {`Getting to ${airport.name}: ${lead || "see the airport's own pages"}. Using your phone abroad is included on the major UK networks for ${roaming.includedCount} of the ${roaming.totalDestinations} destinations we track${roaming.rowDailyFromPence !== null ? `, or from ${formatPence(roaming.rowDailyFromPence)} a day where it isn't` : ""}.${baggageClause} All figures are official and date-stamped.`}
      </AnswerPassage>

      {/* Parking & drop-off mini panel — airport-specific (the unique substance) */}
      <div className="rounded-card border border-ink/10 bg-card p-4">
        <h3 className="text-sm font-semibold text-ink">Getting to {airport.name}</h3>
        <ul className="mt-2 space-y-1 text-sm text-ink-muted">
          {cheapestParkingPence !== null ? (
            <li>
              Cheapest 7-day parking: <span className="font-medium text-ink">{formatPence(cheapestParkingPence)}</span>{" "}
              <a href={`/airport-parking/${airport.slug}`} className="text-brand-accent underline underline-offset-4">full parking comparison →</a>
            </li>
          ) : null}
          <li>
            Drop-off: <span className="font-medium text-ink">{dropOff.isFree ? "Free" : dropOff.chargePence !== null ? formatPence(dropOff.chargePence) : "see page"}</span>{" "}
            <a href={`/drop-off-charges/${airport.slug}`} className="text-brand-accent underline underline-offset-4">drop-off details →</a>
          </li>
        </ul>
      </div>

      {/* Compact roaming summary + RoamMath CTA — NOT a per-destination table */}
      <div className="rounded-card border border-ink/10 bg-surface-muted p-4">
        <h3 className="text-sm font-semibold text-ink">Using your phone abroad</h3>
        <p className="mt-1 text-sm text-ink-muted">
          Roaming is included on the major UK networks for {roaming.includedCount} of {roaming.totalDestinations} tracked destinations
          {roaming.rowDailyFromPence !== null ? <>, or from <span className="font-medium text-ink">{formatPence(roaming.rowDailyFromPence)}/day</span> elsewhere</> : null}.
        </p>
        {roammathUrl ? (
          <p className="mt-2 text-sm">
            <a href={`${roammathUrl}/roaming`} rel="noopener noreferrer" className="font-medium text-brand-accent underline underline-offset-4">
              See the exact cost for your destination → RoamMath
            </a>
          </p>
        ) : null}
      </div>
    </div>
  );
}
```

> `bg-surface-muted` is the token added in P5b — renders correctly in light + dark.

- [ ] **Step 4: Run, verify pass** — `pnpm --filter parkmath test` → AbroadAnswer tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/parkmath/components/abroad-answer.tsx apps/parkmath/tests/abroad-answer.test.tsx
git commit -m "feat(parkmath): AbroadAnswer component — answer passage + airport panel + roaming summary/CTA

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: `/abroad/[airport]` detail page + `/abroad` index page

**Files:**
- Create: `apps/parkmath/app/abroad/[airport]/page.tsx`
- Create: `apps/parkmath/app/abroad/page.tsx`

No new unit test (async server pages aren't unit-tested here; the builder + component are covered). Verification is `next build` static + typecheck.

- [ ] **Step 1: Implement detail page** (`apps/parkmath/app/abroad/[airport]/page.tsx`)

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { breadcrumbLd, faqPageLd, speakableLd, JsonLd } from "@mathfamily/geo";
import { FaqAccordion, FreshnessBadge, PageHeading, SourcesBlock, EmailCaptureSlot } from "@mathfamily/ui";
import { abroadModel, abroadAirportSlugs } from "@/lib/abroad-content";
import { AbroadAnswer } from "@/components/abroad-answer";

export const dynamicParams = false;
export function generateStaticParams() {
  return abroadAirportSlugs().map((airport) => ({ airport }));
}

export async function generateMetadata({ params }: { params: Promise<{ airport: string }> }): Promise<Metadata> {
  const { airport } = await params;
  const m = abroadModel(airport);
  if (!m) return {};
  return {
    title: `Going abroad from ${m.airport.name}? Parking + roaming + bags — total cost 2026`,
    description: `What it really costs to drive to ${m.airport.name} and go abroad: cheapest parking or drop-off, phone roaming and baggage — every figure verified and date-stamped.`,
    alternates: { canonical: `/abroad/${airport}` }
  };
}

export default async function AbroadAirportPage({ params }: { params: Promise<{ airport: string }> }) {
  const { airport: slug } = await params;
  const m = abroadModel(slug);
  if (!m) notFound();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const roammathUrl = process.env.NEXT_PUBLIC_ROAMMATH_URL;
  const url = `${siteUrl}/abroad/${m.airport.slug}`;

  return (
    <article className="space-y-6">
      <JsonLd data={faqPageLd(m.faqs)} />
      <JsonLd data={speakableLd({ url })} />
      <JsonLd data={breadcrumbLd([
        { name: "Home", url: siteUrl },
        { name: "Going abroad by car", url: `${siteUrl}/abroad` },
        { name: m.airport.name, url }
      ])} />

      <header className="space-y-3">
        <PageHeading>Going abroad from {m.airport.name}? The full travel cost</PageHeading>
        <FreshnessBadge verifiedAt={m.verifiedAt} />
      </header>

      <AbroadAnswer model={m} roammathUrl={roammathUrl} />

      <section id="faq" className="space-y-3 scroll-mt-20">
        <h2 className="text-xl font-semibold text-ink">Frequently asked questions</h2>
        <FaqAccordion items={m.faqs} />
      </section>

      <p className="text-sm">
        <Link href="/abroad" className="text-brand-accent underline underline-offset-4">← All airports: going abroad by car</Link>
      </p>

      <EmailCaptureSlot formAction={process.env.NEXT_PUBLIC_MAILERLITE_FORM_ACTION} hook={`Get notified when ${m.airport.name} parking or drop-off prices change`} />

      <SourcesBlock
        sources={[{ label: `Official ${m.airport.name} parking & drop-off pages`, url: siteUrl, verifiedAt: m.verifiedAt }]}
        method="Parking and drop-off figures are ParkMath's verified airport data; roaming and baggage are RoamMath's verified datasets. Nothing is scraped from aggregators."
      />
    </article>
  );
}
```

- [ ] **Step 2: Implement index page** (`apps/parkmath/app/abroad/page.tsx`)

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, itemListLd, JsonLd } from "@mathfamily/geo";
import { PageHeading } from "@mathfamily/ui";
import { abroadModel, abroadAirportSlugs } from "@/lib/abroad-content";

export const metadata: Metadata = {
  title: "Going abroad by car — what the whole trip costs from each UK airport",
  description: "The combined cost of driving to a UK airport and going abroad: parking or drop-off, phone roaming and baggage — verified per airport.",
  alternates: { canonical: "/abroad" }
};

export default function AbroadIndexPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const rows = abroadAirportSlugs()
    .map((slug) => abroadModel(slug))
    .filter((m): m is NonNullable<typeof m> => m !== null)
    .sort((a, b) => a.airport.name.localeCompare(b.airport.name));

  return (
    <article className="space-y-6">
      <JsonLd data={breadcrumbLd([
        { name: "Home", url: siteUrl },
        { name: "Going abroad by car", url: `${siteUrl}/abroad` }
      ])} />
      <JsonLd data={itemListLd({
        name: "Going abroad by car — UK airports",
        items: rows.map((m) => ({ name: `Going abroad from ${m.airport.name}`, url: `${siteUrl}/abroad/${m.airport.slug}` }))
      })} />

      <header className="space-y-3">
        <PageHeading>Going abroad by car — what the whole trip costs</PageHeading>
        <p className="text-ink-muted">Pick your airport for the combined cost: parking or drop-off, using your phone abroad, and baggage — every figure verified.</p>
      </header>

      <ul className="grid gap-2 sm:grid-cols-2">
        {rows.map((m) => (
          <li key={m.airport.slug}>
            <Link href={`/abroad/${m.airport.slug}`} className="mf-press flex items-center justify-between rounded-card border border-ink/10 bg-card px-4 py-3 hover:border-brand-accent/40">
              <span className="font-medium text-ink">{m.airport.name}</span>
              <span className="text-sm text-ink-muted">
                {m.cheapestParkingPence !== null ? `parking from ${formatPence(m.cheapestParkingPence)}` : m.dropOff.isFree ? "free drop-off" : "see costs"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
```

- [ ] **Step 3: Build + verify static** — `pnpm --filter parkmath exec next build`. Expect `/abroad` as `○`/SSG and `/abroad/[airport]` as `●` SSG with one path per airport. typecheck clean.

- [ ] **Step 4: Commit**

```bash
git add "apps/parkmath/app/abroad"
git commit -m "feat(parkmath): /abroad index + /abroad/[airport] combined going-abroad cost pages (static)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Entry-point links from parking + drop-off pages

**Files:**
- Modify: `apps/parkmath/app/airport-parking/[airport]/page.tsx`
- Modify: `apps/parkmath/app/drop-off-charges/[airport]/page.tsx`

- [ ] **Step 1: Add the link to the parking page.** In `apps/parkmath/app/airport-parking/[airport]/page.tsx`, add — directly after the existing drop-off cross-link `<p>` (the "Just dropping someone off…" paragraph) — a sibling paragraph:

```tsx
<p className="mf-reveal text-sm" style={{ "--mf-delay": "0ms" } as React.CSSProperties}>
  <Link href={`/abroad/${airport.slug}`} className="text-brand-accent underline underline-offset-4">
    Going abroad from {airport.name}? See parking + roaming + baggage together →
  </Link>
</p>
```
(`Link` and `airport` are already in scope on that page.)

- [ ] **Step 2: Add the link to the drop-off page.** In `apps/parkmath/app/drop-off-charges/[airport]/page.tsx`, add — directly after the existing `<p>` containing the "Compare drop-off charges at all UK airports →" link — a sibling paragraph:

```tsx
<p className="text-sm">
  <Link href={`/abroad/${airport.slug}`} className="text-brand-accent underline underline-offset-4">
    Going abroad from {airport.name}? See the full travel cost →
  </Link>
</p>
```
(`Link` and `airport` are already imported/in scope.)

- [ ] **Step 3: Build + verify** — `pnpm --filter parkmath exec next build` succeeds, routes still static. typecheck clean.

- [ ] **Step 4: Commit**

```bash
git add "apps/parkmath/app/airport-parking/[airport]/page.tsx" "apps/parkmath/app/drop-off-charges/[airport]/page.tsx"
git commit -m "feat(parkmath): link parking + drop-off pages to the /abroad combined-cost page

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Home 4th hub card (Price index & data) + "Going abroad" secondary link

**Files:**
- Modify: `apps/parkmath/components/tile-icons.tsx` (add `GlobeIcon`)
- Modify: `apps/parkmath/app/page.tsx`

- [ ] **Step 1: Add a `GlobeIcon`** to `apps/parkmath/components/tile-icons.tsx`. Match the existing icon style (the file already exports `CarIcon`, `ParkingIcon`, `LoungeIcon`, `PriceIndexIcon`, `NewsIcon`, `DataIcon`, `HotelIcon`, `TransferIcon` — follow their exact prop/stroke pattern). Add:

```tsx
export function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-6 w-6">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18" />
    </svg>
  );
}
```
> Match the actual stroke-width/size/className used by the sibling icons in that file — read one first and copy its exact shell.

- [ ] **Step 2: Promote Price index to a 4th primary tile + add Going-abroad secondary link.** In `apps/parkmath/app/page.tsx`:
  - Add `GlobeIcon` to the `tile-icons` import.
  - Change `primaryTiles` to include a 4th tile:
    ```tsx
    { href: "/parking-price-index-2026", title: "Price index & data", descriptor: "Track UK airport price trends + open data", icon: <PriceIndexIcon /> },
    ```
    (append after the lounges tile).
  - Change `secondaryTiles` to drop the now-promoted price-index and add Going-abroad first:
    ```tsx
    const secondaryTiles = [
      { href: "/abroad", title: "Going abroad by car", icon: <GlobeIcon /> },
      { href: "/news", title: "Travel news", icon: <NewsIcon /> },
      { href: "/data/drop-off-charges.csv", title: "Open data (CSV)", icon: <DataIcon />, download: true },
    ];
    ```

- [ ] **Step 3: Build + verify** — `pnpm --filter parkmath exec next build` succeeds; home renders 4 primary tiles. typecheck clean. Existing parkmath tests still pass (`pnpm --filter parkmath test`).

- [ ] **Step 4: Commit**

```bash
git add apps/parkmath/components/tile-icons.tsx apps/parkmath/app/page.tsx
git commit -m "feat(parkmath): home 4th hub card (Price index & data) + Going-abroad secondary link

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Full verification + finish

- [ ] **Step 1: Typecheck** — `pnpm --filter parkmath typecheck` → clean.
- [ ] **Step 2: Tests** — `pnpm --filter parkmath test` → all pass (incl. new abroad-content + abroad-answer). `pnpm --filter @mathfamily/ui test` unaffected.
- [ ] **Step 3: Build** — `pnpm --filter parkmath exec next build` → `/abroad` + `/abroad/[airport]` static (`○`/`●`), no `ƒ`. roammath unaffected.
- [ ] **Step 4: graphify** — `graphify update .`.
- [ ] **Step 5: finish** — superpowers:finishing-a-development-branch → merge `design-upgrade-abroad` to `main` (standing "merge each as it goes green").

## Acceptance (from spec)

- `/abroad` index + `/abroad/[airport]` per covered airport, all static; each detail page leads with an airport-specific verified figure and a 40–75-word `.mf-speakable` answer.
- No per-airport duplicate roaming table (component test guards `<table` absence); roaming/baggage are compact summaries + a RoamMath CTA.
- Home shows 4 primary cards (4th = Price index & data); "Going abroad" reachable from parking + drop-off pages and the home secondary row.
- Every figure traces to a dataset; the answer states what's included.
- `pnpm test` + typecheck green; routes static; roammath + ui unaffected.

## Self-review notes

- **Spec coverage:** §1 detail page → Tasks 2–3; §2 index → Task 3; §3 uniqueness → airport-specific hero + `<table` guard test (Task 2) + index rows (Task 3); §4 entry points → Tasks 4 & 5 (FamilyLinks already links RoamMath; in-app entry is the parking/drop-off links + home secondary tile — spec's FamilyLinks "upgrade" is satisfied by the dedicated in-app links, which is better UX than repurposing the cross-brand link); §5 home 4th card → Task 5; data/engine/schema/static → Tasks 1–3.
- **No `@/` in unit-tested modules:** `abroad-content.ts` imports `./parking-content` (relative) + real packages; tests import `../lib/...`/`../components/...` (relative). Pages may use `@/` (not unit-tested).
- **Type consistency:** `AbroadModel` fields are identical across builder (Task 1), component (Task 2), and pages (Task 3).
- **Decision recorded:** spec §4 said "upgrade FamilyLinks to point at /abroad". Refined here: keep `FamilyLinks` pointing at RoamMath (its purpose is the cross-brand bridge) and add dedicated in-app `/abroad` links on parking/drop-off pages + the home secondary tile. If you'd rather also repoint FamilyLinks, that's a one-line change — flag during execution.
