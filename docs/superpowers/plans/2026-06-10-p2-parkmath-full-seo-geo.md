# P2: ParkMath Full Build + SEO/GEO Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete ParkMath (parking + lounge spokes with calculators, OG images, affiliate slots) and harden the whole site for current search engines and AI answer engines, growing it from 33 to ~85 high-value static pages.

**Architecture:** Same monorepo patterns as P1 — strict Zod datasets with sourceUrl + verifiedAt, pure-TS engines with typed warnings, fully static pages, client islands. New: parking/lounge datasets and engines, an answer-first content layer (GEO), `next/og` build-time OG images, and an affiliate-slot config that ships inactive. Spec: `docs/superpowers/specs/2026-06-10-parkmath-roammath-design.md` §6 P2.

**Tech Stack:** Existing P1 stack (Next.js 16, Tailwind v4, Zod 4, Vitest 3, Playwright) + `next/og` (bundled with Next).

## Research basis (June 2026) — why the SEO/GEO tasks look like this

**Classic search.** Google's March 2026 core update enforced the scaled-content-abuse policy hard: template-with-variable-substitution sites lost 60–90% of traffic. Survivors are pages built on unique structured data (comparison tools with verified pricing) where **each page answers a distinct query with substantially distinct content**. Consequences for this plan: duration pages are generated ONLY for high-intent durations (3/7/14 days), every programmatic page renders data-driven content that differs materially between pages (distinct tariff tables, computed verdicts, per-page FAQs), and a unit test enforces content distinctness. Sources: Google spam policies (developers.google.com/search/docs/essentials/spam-policies), digitalapplied.com programmatic-SEO post-March-2026 analyses, breaklineagency.com scaled-content guide.

**AI answer engines (ChatGPT Search ~70% of AI-search usage, Perplexity, Google AI Overviews).** Princeton GEO research + 2026 practitioner guides agree on what wins citations: (1) the first ~200 words directly and completely answer the primary query (extractable answer block above the fold); (2) cited sources, concrete statistics and quotations boost AI visibility 30–40%; (3) FAQ/ItemList/Dataset schema stacking; (4) visible freshness (dateModified) — stale pages lose citation share fast; (5) `llms.txt` site index; (6) AI crawlers must not be blocked (GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended); (7) Bing matters because it feeds ChatGPT Search — IndexNow/Bing Webmaster go in the at-domain-attach checklist. Sources: llmrefs.com, enrichlabs.ai, gen-optima.com GEO guides 2026.

P1 already delivers: static answer-complete HTML, JSON-LD (FAQPage/Dataset/Breadcrumb/WebSite), visible + machine-readable verification dates, llms.txt, per-record source citations. P2 adds: answer-first lead blocks, a sources-and-method block, ItemList schema, explicit AI-crawler robots rules, OG images, and the distinctness guard.

**Conventions (same as P1, non-negotiable):**
- Work from `/Volumes/TB4 Workstation/Users/mike/Desktop/Projects/MathFamily` (quote the path — space inside).
- NEVER create `vitest.config.*` files (esbuild deadlocks on this volume — `docs/engineering-notes.md`). Run package tests from inside the package: `./node_modules/.bin/vitest run --reporter=basic` (app: `./node_modules/.bin/vitest run tests`).
- Money = integer pence. Engines never throw on user input. Every dataset record: `sourceUrl` (official only) + `verifiedAt`.
- All work on branch `p2-parkmath-full` (create from main at start: `git checkout -b p2-parkmath-full`).

---

### Task 1: `@mathfamily/geo` — ItemList builder

**Files:**
- Modify: `packages/geo/src/builders.ts` (append)
- Test: `packages/geo/tests/builders.test.ts` (append)

- [ ] **Step 1: Add failing test** (append to the existing file's imports `itemListLd` and add):

```ts
describe("itemListLd", () => {
  it("builds an ItemList with positioned items", () => {
    const ld = itemListLd({
      name: "Cheapest 7-day parking at Manchester",
      items: [
        { name: "JetParks 1 — £42", url: "https://example.com/a" },
        { name: "Short Stay — £90", url: "https://example.com/b" }
      ]
    });
    expect(ld["@type"]).toBe("ItemList");
    expect(ld.itemListElement).toHaveLength(2);
    expect(ld.itemListElement[1]).toMatchObject({ "@type": "ListItem", position: 2, name: "Short Stay — £90" });
  });
});
```

- [ ] **Step 2: Run to verify failure** — from `packages/geo`: `./node_modules/.bin/vitest run --reporter=basic`. Expected: FAIL (itemListLd not exported).

- [ ] **Step 3: Implement** (append to `packages/geo/src/builders.ts`):

```ts
export function itemListLd(input: { name: string; items: { name: string; url: string }[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList" as const,
    name: input.name,
    itemListElement: input.items.map((item, index) => ({
      "@type": "ListItem" as const,
      position: index + 1,
      name: item.name,
      url: item.url
    }))
  };
}
```

- [ ] **Step 4: Run to verify pass** — expected 7 tests passing (6 existing + 1).

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(geo): ItemList builder"`

---

### Task 2: `@mathfamily/ui` — AnswerLead and SourcesBlock components

**Files:**
- Create: `packages/ui/src/answer-lead.tsx`, `packages/ui/src/sources-block.tsx`
- Modify: `packages/ui/src/index.ts`
- Test: `packages/ui/tests/components.test.tsx` (append)

- [ ] **Step 1: Failing tests** (append inside the existing test file):

```tsx
import { AnswerLead } from "../src/answer-lead";
import { SourcesBlock } from "../src/sources-block";

describe("AnswerLead", () => {
  it("renders the direct answer and key facts", () => {
    render(
      <AnswerLead answer="Dropping off at Gatwick costs £10 for up to 10 minutes.">
        {["Penalty: £100", "Free alternative: Long Stay (2h)"]}
      </AnswerLead>
    );
    expect(screen.getByText(/costs £10/)).toBeDefined();
    expect(screen.getByText("Penalty: £100")).toBeDefined();
  });
});

describe("SourcesBlock", () => {
  it("lists each source with its verification date", () => {
    render(
      <SourcesBlock
        sources={[{ label: "Official Gatwick drop-off page", url: "https://www.gatwickairport.com/x", verifiedAt: "2026-06-10" }]}
        method="Fees read from the official airport page and re-checked on the date shown."
      />
    );
    expect(screen.getByRole("link", { name: /Official Gatwick/ })).toBeDefined();
    expect(screen.getByText(/2026-06-10/)).toBeDefined();
  });
});
```

- [ ] **Step 2: Run to verify failure** — from `packages/ui`. Expected: FAIL (modules missing).

- [ ] **Step 3: Implement.**

`packages/ui/src/answer-lead.tsx` (the GEO answer-first block — must be the FIRST content element on every spoke page):

```tsx
export function AnswerLead({ answer, children }: { answer: string; children?: string[] }) {
  return (
    <div className="rounded-card border-l-4 border-brand-accent bg-surface p-5">
      <p className="text-lg font-medium text-ink">{answer}</p>
      {children && children.length > 0 ? (
        <ul className="mt-3 space-y-1 text-sm text-ink-muted">
          {children.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
```

`packages/ui/src/sources-block.tsx`:

```tsx
export function SourcesBlock({
  sources,
  method
}: {
  sources: { label: string; url: string; verifiedAt: string }[];
  method: string;
}) {
  return (
    <section aria-label="Sources and methodology" className="rounded-card bg-surface p-4 text-sm text-ink-muted">
      <h2 className="font-semibold text-ink">Sources &amp; method</h2>
      <ul className="mt-2 space-y-1">
        {sources.map((s) => (
          <li key={s.url}>
            <a href={s.url} rel="noopener noreferrer" target="_blank" className="underline decoration-dotted underline-offset-4 hover:text-brand-accent">
              {s.label}
            </a>{" "}
            — verified {s.verifiedAt}
          </li>
        ))}
      </ul>
      <p className="mt-2">{method}</p>
    </section>
  );
}
```

Append to `packages/ui/src/index.ts`:

```ts
export * from "./answer-lead";
export * from "./sources-block";
```

- [ ] **Step 4: Run to verify pass** — expected 7 ui tests (5 existing + 2).

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(ui): AnswerLead + SourcesBlock (GEO answer-first + cited sources)"`

---

### Task 3: SEO/GEO pass on existing pages

**Files:**
- Modify: `apps/parkmath/app/robots.ts`, `apps/parkmath/app/drop-off-charges/[airport]/page.tsx`, `apps/parkmath/app/drop-off-charges/page.tsx`

- [ ] **Step 1: Robots — explicit AI-crawler welcome.** Replace `apps/parkmath/app/robots.ts` content:

```ts
import type { MetadataRoute } from "next";

// Explicitly allow the AI answer-engine crawlers (they feed ChatGPT Search,
// Perplexity, Claude and Google AI Overviews — being cited there is the product).
const AI_CRAWLERS = ["GPTBot", "OAI-SearchBot", "PerplexityBot", "ClaudeBot", "Google-Extended", "Bingbot"];

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: "/" }))
    ],
    sitemap: `${base}/sitemap.xml`
  };
}
```

- [ ] **Step 2: Answer-first lead on airport drop-off pages.** In `apps/parkmath/app/drop-off-charges/[airport]/page.tsx`: import `AnswerLead, SourcesBlock` from `@mathfamily/ui`; immediately AFTER the `<header>` element (so it is the first body content), insert:

```tsx
<AnswerLead
  answer={
    record.isFree
      ? `Dropping off at ${airport.name} is free at the forecourt.`
      : `Dropping off at ${airport.name} costs ${record.feeSummary.charAt(0).toLowerCase()}${record.feeSummary.slice(1)}.`
  }
>
  {[
    ...(record.penaltyPence !== null ? [`Penalty if unpaid: ${formatPence(record.penaltyPence)}`] : []),
    ...(record.freeAlternative ? [`Free alternative: ${record.freeAlternative.name} (${record.freeAlternative.minutesFree} min)`] : []),
    ...(record.paymentDeadline ? [`Pay by: ${record.paymentDeadline}`] : [])
  ]}
</AnswerLead>
```

And before the closing `</article>`, insert:

```tsx
<SourcesBlock
  sources={[{ label: `Official ${airport.name} drop-off page`, url: record.sourceUrl, verifiedAt: record.verifiedAt }]}
  method="Every figure is read from the airport's official page and re-verified on the date shown. We never republish unverified prices."
/>
```

- [ ] **Step 3: ItemList on the master table.** In `apps/parkmath/app/drop-off-charges/page.tsx`: import `itemListLd` from `@mathfamily/geo` and `formatPence` is already imported. After the existing `datasetLd` JsonLd, add:

```tsx
<JsonLd
  data={itemListLd({
    name: "UK airport drop-off charges, highest first",
    items: records.map((r) => ({
      name: `${airports.get(r.airportSlug)?.name ?? r.airportSlug} — ${r.isFree ? "free" : formatPence(r.bands[0]?.totalPence ?? 0)}`,
      url: `${siteUrl}/drop-off-charges/${r.airportSlug}`
    }))
  })}
/>
```

- [ ] **Step 4: Verify.** `pnpm --filter parkmath build` (root). Expected: clean build. Inspect `apps/parkmath/.next/server/app/drop-off-charges/gatwick.html`: AnswerLead text appears BEFORE the FeeStat markup; SourcesBlock present. `robots.txt` build output lists the AI crawlers.

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(parkmath): answer-first leads, sources blocks, ItemList, AI-crawler robots"`

---

### Task 4: `@mathfamily/data` — parking schemas and loaders

**Files:**
- Create: `packages/data/src/parking.ts`, `packages/data/datasets/parkmath/parking-tariffs.json` (seed)
- Modify: `packages/data/src/index.ts`
- Test: `packages/data/tests/parking.test.ts`

- [ ] **Step 1: Failing tests** at `packages/data/tests/parking.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ParkingRecordSchema, loadParkingDataset } from "../src/parking";

const validRecord = {
  airportSlug: "manchester",
  products: [
    {
      productType: "gate",
      name: "Multi-Storey T1 (drive-up)",
      prices: [
        { days: 1, totalPence: 4500 },
        { days: 3, totalPence: 13500 },
        { days: 7, totalPence: 31500 },
        { days: 14, totalPence: 63000 }
      ],
      snapshotDate: null,
      notes: null
    },
    {
      productType: "prebook",
      name: "JetParks 1 (pre-book)",
      prices: [
        { days: 3, totalPence: 2400 },
        { days: 7, totalPence: 4200 },
        { days: 14, totalPence: 8000 }
      ],
      snapshotDate: "2026-06-10",
      notes: "Quote snapshot from the official pre-booking portal"
    }
  ],
  sourceUrl: "https://www.manchesterairport.co.uk/parking/",
  verifiedAt: "2026-06-10"
};

describe("ParkingRecordSchema", () => {
  it("accepts a valid record", () => {
    expect(() => ParkingRecordSchema.parse(validRecord)).not.toThrow();
  });
  it("rejects a prebook product without a snapshotDate", () => {
    const bad = structuredClone(validRecord);
    bad.products[1]!.snapshotDate = null;
    expect(() => ParkingRecordSchema.parse(bad)).toThrow();
  });
  it("rejects unknown product types", () => {
    const bad = structuredClone(validRecord);
    (bad.products[0] as { productType: string }).productType = "valet";
    expect(() => ParkingRecordSchema.parse(bad)).toThrow();
  });
  it("rejects non-integer pence", () => {
    const bad = structuredClone(validRecord);
    bad.products[0]!.prices[0]!.totalPence = 45.5;
    expect(() => ParkingRecordSchema.parse(bad)).toThrow();
  });
});

describe("loadParkingDataset", () => {
  it("loads and validates the dataset; every slug is a known airport", () => {
    const dataset = loadParkingDataset();
    expect(dataset.records.length).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run to verify failure** — from `packages/data`. Expected: FAIL (module missing).

- [ ] **Step 3: Implement** `packages/data/src/parking.ts`:

```ts
import { z } from "zod";
import parkingJson from "../datasets/parkmath/parking-tariffs.json";

const IsoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD")
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }, "not a real calendar date");
const Slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "expected lowercase-kebab slug");
const HttpUrl = z.string().regex(/^https?:\/\/\S+$/, "expected absolute http(s) URL");

export const ParkingPriceSchema = z.strictObject({
  days: z.number().int().positive(),
  totalPence: z.number().int().nonnegative()
});

export const ParkingProductSchema = z
  .strictObject({
    productType: z.enum(["gate", "prebook", "meet-greet", "park-ride"]),
    name: z.string().min(1),
    prices: z.array(ParkingPriceSchema).min(1),
    snapshotDate: IsoDate.nullable(),
    notes: z.string().nullable()
  })
  .refine((p) => p.productType !== "prebook" || p.snapshotDate !== null, {
    message: "prebook products must carry the snapshotDate of the quote"
  });
export type ParkingProduct = z.infer<typeof ParkingProductSchema>;

export const ParkingRecordSchema = z.strictObject({
  airportSlug: Slug,
  products: z.array(ParkingProductSchema).min(1),
  sourceUrl: HttpUrl,
  verifiedAt: IsoDate
});
export type ParkingRecord = z.infer<typeof ParkingRecordSchema>;

export const ParkingDatasetSchema = z.strictObject({
  version: z.string().min(1),
  lastUpdated: IsoDate,
  records: z.array(ParkingRecordSchema).min(1)
});
export type ParkingDataset = z.infer<typeof ParkingDatasetSchema>;

export function loadParkingDataset(): ParkingDataset {
  return ParkingDatasetSchema.parse(parkingJson);
}
```

Seed `packages/data/datasets/parkmath/parking-tariffs.json` with ONE record — copy the `validRecord` from the test verbatim into `{ "version": "0.1.0", "lastUpdated": "2026-06-10", "records": [ ...manchester record... ] }` (values are placeholders re-verified in Task 8; the Manchester gate prices here are NOT real — Task 8 replaces them).

Append to `packages/data/src/index.ts`:

```ts
export * from "./parking";
```

- [ ] **Step 4: Run to verify pass** — expected 24 existing + 5 new = 29 data tests. (The freshness live-gate test only covers drop-off records; Task 8 extends it.)

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(data): parking tariff schemas + loaders (gate/prebook/meet-greet/park-ride)"`

---

### Task 5: `@mathfamily/data` — lounge schemas, Priority Pass config

**Files:**
- Create: `packages/data/src/lounges.ts`, `packages/data/datasets/parkmath/lounges.json` (seed), `packages/data/datasets/parkmath/priority-pass.json` (seed)
- Modify: `packages/data/src/index.ts`
- Test: `packages/data/tests/lounges.test.ts`

- [ ] **Step 1: Failing tests** at `packages/data/tests/lounges.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { LoungeRecordSchema, loadLoungeDataset, loadPriorityPass } from "../src/lounges";

const validRecord = {
  airportSlug: "manchester",
  lounges: [
    { name: "Escape Lounge T1", walkInPence: 3500, priorityPass: true, notes: null },
    { name: "1903 Lounge", walkInPence: 5000, priorityPass: false, notes: "Premium lounge" }
  ],
  sourceUrl: "https://www.manchesterairport.co.uk/at-the-airport/lounges/",
  verifiedAt: "2026-06-10"
};

describe("LoungeRecordSchema", () => {
  it("accepts a valid record", () => {
    expect(() => LoungeRecordSchema.parse(validRecord)).not.toThrow();
  });
  it("rejects unknown fields (strict)", () => {
    expect(() => LoungeRecordSchema.parse({ ...validRecord, extra: 1 })).toThrow();
  });
});

describe("loaders", () => {
  it("loads the lounge dataset", () => {
    expect(loadLoungeDataset().records.length).toBeGreaterThanOrEqual(1);
  });
  it("loads Priority Pass tiers with positive fees", () => {
    const pp = loadPriorityPass();
    expect(pp.tiers.length).toBeGreaterThanOrEqual(2);
    for (const t of pp.tiers) expect(t.annualFeePence).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run to verify failure.**

- [ ] **Step 3: Implement** `packages/data/src/lounges.ts`:

```ts
import { z } from "zod";
import loungesJson from "../datasets/parkmath/lounges.json";
import priorityPassJson from "../datasets/parkmath/priority-pass.json";

const IsoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD")
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }, "not a real calendar date");
const Slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const HttpUrl = z.string().regex(/^https?:\/\/\S+$/);

export const LoungeSchema = z.strictObject({
  name: z.string().min(1),
  walkInPence: z.number().int().positive().nullable(),
  priorityPass: z.boolean(),
  notes: z.string().nullable()
});
export type Lounge = z.infer<typeof LoungeSchema>;

export const LoungeRecordSchema = z.strictObject({
  airportSlug: Slug,
  lounges: z.array(LoungeSchema).min(1),
  sourceUrl: HttpUrl,
  verifiedAt: IsoDate
});
export type LoungeRecord = z.infer<typeof LoungeRecordSchema>;

export const LoungeDatasetSchema = z.strictObject({
  version: z.string().min(1),
  lastUpdated: IsoDate,
  records: z.array(LoungeRecordSchema).min(1)
});
export type LoungeDataset = z.infer<typeof LoungeDatasetSchema>;

export const PriorityPassTierSchema = z.strictObject({
  tier: z.string().min(1),
  annualFeePence: z.number().int().positive(),
  includedVisits: z.number().int().nonnegative().nullable(), // null = unlimited
  perVisitPence: z.number().int().nonnegative()
});
export type PriorityPassTier = z.infer<typeof PriorityPassTierSchema>;

export const PriorityPassSchema = z.strictObject({
  tiers: z.array(PriorityPassTierSchema).min(1),
  sourceUrl: HttpUrl,
  verifiedAt: IsoDate
});
export type PriorityPass = z.infer<typeof PriorityPassSchema>;

export function loadLoungeDataset(): LoungeDataset {
  return LoungeDatasetSchema.parse(loungesJson);
}
export function loadPriorityPass(): PriorityPass {
  return PriorityPassSchema.parse(priorityPassJson);
}
```

Seed `lounges.json` with the test's `validRecord` wrapped in `{ "version": "0.1.0", "lastUpdated": "2026-06-10", "records": [...] }` (placeholder — Task 9 replaces). Seed `priority-pass.json`:

```json
{
  "tiers": [
    { "tier": "Standard", "annualFeePence": 6900, "includedVisits": 0, "perVisitPence": 2400 },
    { "tier": "Standard Plus", "annualFeePence": 22900, "includedVisits": 10, "perVisitPence": 2400 },
    { "tier": "Prestige", "annualFeePence": 45900, "includedVisits": null, "perVisitPence": 0 }
  ],
  "sourceUrl": "https://www.prioritypass.com/",
  "verifiedAt": "2026-06-10"
}
```

(Placeholder values from the operating guide — Task 9 re-verifies against prioritypass.com.)

Append to `packages/data/src/index.ts`: `export * from "./lounges";`

- [ ] **Step 4: Run to verify pass** — 29 + 4 = 33 data tests.

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(data): lounge + Priority Pass schemas and loaders"`

---

### Task 6: `@mathfamily/engine` — parking comparison

**Files:**
- Create: `packages/engine/src/parking.ts`
- Modify: `packages/engine/src/index.ts`
- Test: `packages/engine/tests/parking.test.ts`

- [ ] **Step 1: Failing tests** at `packages/engine/tests/parking.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { compareParking, type ParkingTariff } from "../src/parking";

const NOW = new Date("2026-06-10T12:00:00Z");

const manchester: ParkingTariff = {
  products: [
    {
      productType: "gate",
      name: "Multi-Storey (drive-up)",
      prices: [
        { days: 3, totalPence: 13500 },
        { days: 7, totalPence: 31500 }
      ],
      snapshotDate: null
    },
    {
      productType: "prebook",
      name: "JetParks 1 (pre-book)",
      prices: [
        { days: 3, totalPence: 2400 },
        { days: 7, totalPence: 4200 }
      ],
      snapshotDate: "2026-06-01"
    }
  ],
  verifiedAt: "2026-06-01"
};

describe("compareParking", () => {
  it("returns options sorted cheapest first for the requested duration", () => {
    const c = compareParking(manchester, 7, NOW);
    expect(c.options[0]).toMatchObject({ name: "JetParks 1 (pre-book)", totalPence: 4200 });
    expect(c.options[1]).toMatchObject({ totalPence: 31500 });
  });
  it("computes savings vs the gate price", () => {
    const c = compareParking(manchester, 7, NOW);
    expect(c.savingsVsGatePence).toBe(31500 - 4200);
  });
  it("skips products that don't quote the requested duration", () => {
    const c = compareParking(manchester, 14, NOW);
    expect(c.options).toHaveLength(0);
    expect(c.warnings.map((w) => w.code)).toContain("DURATION_NOT_COVERED");
  });
  it("flags pre-book prices as snapshots", () => {
    const c = compareParking(manchester, 3, NOW);
    expect(c.warnings.map((w) => w.code)).toContain("PREBOOK_SNAPSHOT");
  });
  it("flags stale verification", () => {
    const stale = { ...manchester, verifiedAt: "2026-01-01" };
    expect(compareParking(stale, 3, NOW).warnings.map((w) => w.code)).toContain("DATA_UNVERIFIED_RECENTLY");
  });
  it("never throws on out-of-range duration — clamps to a positive integer", () => {
    expect(() => compareParking(manchester, -2, NOW)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run to verify failure.**

- [ ] **Step 3: Implement** `packages/engine/src/parking.ts`:

```ts
export interface ParkingPrice {
  days: number;
  totalPence: number;
}

export interface ParkingTariffProduct {
  productType: "gate" | "prebook" | "meet-greet" | "park-ride";
  name: string;
  prices: ParkingPrice[];
  snapshotDate: string | null;
}

export interface ParkingTariff {
  products: ParkingTariffProduct[];
  verifiedAt: string; // YYYY-MM-DD
}

export type ParkingWarningCode = "PREBOOK_SNAPSHOT" | "DATA_UNVERIFIED_RECENTLY" | "DURATION_NOT_COVERED";

export interface ParkingWarning {
  code: ParkingWarningCode;
  message: string;
}

export interface ParkingOption {
  productType: ParkingTariffProduct["productType"];
  name: string;
  totalPence: number;
  snapshotDate: string | null;
}

export interface ParkingComparison {
  days: number;
  options: ParkingOption[]; // cheapest first
  gate: ParkingOption | null;
  cheapest: ParkingOption | null;
  savingsVsGatePence: number | null;
  warnings: ParkingWarning[];
}

const STALE_AFTER_DAYS = 60;

export function compareParking(tariff: ParkingTariff, requestedDays: number, now: Date = new Date()): ParkingComparison {
  const warnings: ParkingWarning[] = [];
  const days = Math.max(1, Math.round(Number.isFinite(requestedDays) ? requestedDays : 1));

  const verified = new Date(`${tariff.verifiedAt}T00:00:00Z`).getTime();
  const ageDays = Math.floor((now.getTime() - verified) / 86_400_000);
  if (Number.isNaN(ageDays) || ageDays > STALE_AFTER_DAYS) {
    warnings.push({
      code: "DATA_UNVERIFIED_RECENTLY",
      message: `Last verified ${tariff.verifiedAt} — check live prices before you book.`
    });
  }

  const options: ParkingOption[] = [];
  for (const product of tariff.products) {
    const price = product.prices.find((p) => p.days === days);
    if (!price) continue;
    options.push({ productType: product.productType, name: product.name, totalPence: price.totalPence, snapshotDate: product.snapshotDate });
  }
  options.sort((a, b) => a.totalPence - b.totalPence);

  if (options.length === 0) {
    warnings.push({ code: "DURATION_NOT_COVERED", message: `No published prices for ${days} day(s) — see the official site.` });
  }
  if (options.some((o) => o.productType === "prebook")) {
    const snap = options.find((o) => o.productType === "prebook")?.snapshotDate;
    warnings.push({
      code: "PREBOOK_SNAPSHOT",
      message: `Pre-book prices are a snapshot${snap ? ` from ${snap}` : ""} — live prices vary by date.`
    });
  }

  const gate = options.find((o) => o.productType === "gate") ?? null;
  const cheapest = options[0] ?? null;
  const savingsVsGatePence = gate && cheapest && gate !== cheapest ? gate.totalPence - cheapest.totalPence : null;

  return { days, options, gate, cheapest, savingsVsGatePence, warnings };
}
```

Append to `packages/engine/src/index.ts`: `export * from "./parking";`

- [ ] **Step 4: Run to verify pass** — 28 existing + 6 = 34 engine tests.

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(engine): parking comparison with snapshot + staleness warnings"`

---

### Task 7: `@mathfamily/engine` — lounge break-even

**Files:**
- Create: `packages/engine/src/lounge.ts`
- Modify: `packages/engine/src/index.ts`
- Test: `packages/engine/tests/lounge.test.ts`

- [ ] **Step 1: Failing tests** at `packages/engine/tests/lounge.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { loungeBreakEven, type MembershipTier } from "../src/lounge";

const tiers: MembershipTier[] = [
  { tier: "Standard", annualFeePence: 6900, includedVisits: 0, perVisitPence: 2400 },
  { tier: "Standard Plus", annualFeePence: 22900, includedVisits: 10, perVisitPence: 2400 },
  { tier: "Prestige", annualFeePence: 45900, includedVisits: null, perVisitPence: 0 }
];

describe("loungeBreakEven", () => {
  it("computes pay-as-you-go total", () => {
    expect(loungeBreakEven(3500, 4, tiers).payAsYouGoPence).toBe(14000);
  });
  it("computes each tier's annual cost (fee + visits beyond included)", () => {
    const r = loungeBreakEven(3500, 4, tiers);
    expect(r.tierCosts.find((t) => t.tier === "Standard")?.totalPence).toBe(6900 + 4 * 2400);
    expect(r.tierCosts.find((t) => t.tier === "Standard Plus")?.totalPence).toBe(22900);
    expect(r.tierCosts.find((t) => t.tier === "Prestige")?.totalPence).toBe(45900);
  });
  it("verdict is payg when walk-ins are cheaper", () => {
    const r = loungeBreakEven(3500, 2, tiers);
    expect(r.verdict).toBe("payg");
  });
  it("verdict is membership with the best tier when a tier wins", () => {
    const r = loungeBreakEven(3500, 12, tiers);
    expect(r.verdict).toBe("membership");
    expect(r.best?.tier).toBe("Standard Plus"); // 22900 + 2*2400 = 27700 vs payg 42000
    expect(r.savingsPence).toBe(42000 - 27700);
  });
  it("clamps nonsense input instead of throwing", () => {
    expect(() => loungeBreakEven(3500, -3, tiers)).not.toThrow();
    expect(loungeBreakEven(3500, -3, tiers).visitsPerYear).toBe(1);
  });
});
```

- [ ] **Step 2: Run to verify failure.**

- [ ] **Step 3: Implement** `packages/engine/src/lounge.ts`:

```ts
export interface MembershipTier {
  tier: string;
  annualFeePence: number;
  includedVisits: number | null; // null = unlimited
  perVisitPence: number;
}

export interface LoungeBreakEven {
  visitsPerYear: number;
  payAsYouGoPence: number;
  tierCosts: { tier: string; totalPence: number }[];
  best: { tier: string; totalPence: number } | null;
  verdict: "payg" | "membership";
  savingsPence: number;
}

export function loungeBreakEven(walkInPence: number, visitsPerYear: number, tiers: MembershipTier[]): LoungeBreakEven {
  const visits = Math.max(1, Math.round(Number.isFinite(visitsPerYear) ? visitsPerYear : 1));
  const walkIn = Number.isInteger(walkInPence) && walkInPence > 0 ? walkInPence : 0;
  const payAsYouGoPence = walkIn * visits;

  const tierCosts = tiers.map((t) => {
    const extraVisits = t.includedVisits === null ? 0 : Math.max(0, visits - t.includedVisits);
    return { tier: t.tier, totalPence: t.annualFeePence + extraVisits * t.perVisitPence };
  });

  const best = [...tierCosts].sort((a, b) => a.totalPence - b.totalPence)[0] ?? null;
  const membershipWins = best !== null && best.totalPence < payAsYouGoPence;

  return {
    visitsPerYear: visits,
    payAsYouGoPence,
    tierCosts,
    best,
    verdict: membershipWins ? "membership" : "payg",
    savingsPence: membershipWins && best ? payAsYouGoPence - best.totalPence : 0
  };
}
```

Append to `packages/engine/src/index.ts`: `export * from "./lounge";`

- [ ] **Step 4: Run to verify pass** — 34 + 5 = 39 engine tests.

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(engine): lounge membership break-even"`

---

### Task 8: Research — parking datasets for the top 10 airports

**Files:**
- Modify: `packages/data/datasets/parkmath/parking-tariffs.json`
- Create: `docs/verification/2026-06-parking-research-notes.md`
- Test: `packages/data/tests/parking-coverage.test.ts`

**Research rules (same regime as P1 drop-off research — they are the brand):**
1. Gate (drive-up) tariffs: from the airport's OFFICIAL published tariff/parking pages only. Several were already captured in `docs/verification/2026-06-drop-off-research-notes.md` during re-verification — reuse where the duration coverage fits.
2. Pre-book prices: dated quote snapshots from the airports' OWN official pre-booking portals only (spec §3.4 explicitly bans third-party aggregators). Pick entry dates ~4 weeks out, durations 3/7/14 days, record `snapshotDate` = quote date. If the portal is WAF-blocked, use the transport ladder that worked in re-verification: reader proxy (`https://r.jina.ai/<url>`) → Wayback snapshot → official tariff PDFs. Document transport per airport in the notes file.
3. `meet-greet` / `park-ride` products only where the airport itself offers them officially.
4. Never invent a price. A product with unobtainable prices is omitted, with the gap noted.
5. Airports (10): heathrow, gatwick, manchester, stansted, luton, edinburgh, birmingham, glasgow, bristol, newcastle.

- [ ] **Step 1: Research and fill the dataset.** Replace the seed record. Each airport: 1+ gate product and (where obtainable) 1+ prebook product with prices for days 3, 7, 14 (1 and 28 welcome where published). Bump `version` to `1.0.0`, set `lastUpdated` to the research date.

- [ ] **Step 2: Write the notes file** — per airport: products captured, official URLs, transport used, snapshot dates, gaps.

- [ ] **Step 3: Coverage + freshness gate** at `packages/data/tests/parking-coverage.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { loadAirports, loadParkingDataset, freshnessReport } from "../src/index";

describe("parking dataset", () => {
  it("covers all 10 launch airports with no duplicates", () => {
    const expected = ["heathrow", "gatwick", "manchester", "stansted", "luton", "edinburgh", "birmingham", "glasgow", "bristol", "newcastle"].sort();
    const slugs = loadParkingDataset().records.map((r) => r.airportSlug).sort();
    expect(slugs).toEqual(expected);
  });
  it("every slug is a known airport", () => {
    const known = new Set(loadAirports().map((a) => a.slug));
    for (const r of loadParkingDataset().records) expect(known.has(r.airportSlug)).toBe(true);
  });
  it("every record offers the three standard durations on at least one product", () => {
    for (const r of loadParkingDataset().records) {
      for (const days of [3, 7, 14]) {
        expect(
          r.products.some((p) => p.prices.some((x) => x.days === days)),
          `${r.airportSlug} missing ${days}-day price`
        ).toBe(true);
      }
    }
  });
  it("no record breaches the freshness failure threshold", () => {
    const report = freshnessReport(
      loadParkingDataset().records.map((r) => ({ label: `parking:${r.airportSlug}`, verifiedAt: r.verifiedAt })),
      new Date()
    );
    expect(report.errors).toEqual([]);
  });
});
```

- [ ] **Step 4: Run all data tests** — everything green.

- [ ] **Step 5: Commit** — `git add -A && git commit -m "data(parkmath): parking tariffs for 10 airports (official sources, dated snapshots)"`

---

### Task 9: Research — lounges + Priority Pass

**Files:**
- Modify: `packages/data/datasets/parkmath/lounges.json`, `packages/data/datasets/parkmath/priority-pass.json`
- Modify: `docs/verification/2026-06-parking-research-notes.md` (append lounge section)
- Test: `packages/data/tests/lounges-coverage.test.ts`

- [ ] **Step 1: Research.** Same 10 airports. Lounge names + current walk-in prices from the airport's or the lounge operator's OFFICIAL pages; Priority Pass participation from prioritypass.com's official lounge directory; PP tier pricing (Standard / Standard Plus / Prestige UK pricing + per-visit fees + included visits) from prioritypass.com. Replace both seed files; bump lounges version to `1.0.0`. Walk-in price genuinely unpublished → `walkInPence: null` with a note.

- [ ] **Step 2: Coverage test** at `packages/data/tests/lounges-coverage.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { loadAirports, loadLoungeDataset, loadPriorityPass } from "../src/index";

describe("lounge dataset", () => {
  it("covers the 10 launch airports", () => {
    const expected = ["heathrow", "gatwick", "manchester", "stansted", "luton", "edinburgh", "birmingham", "glasgow", "bristol", "newcastle"].sort();
    expect(loadLoungeDataset().records.map((r) => r.airportSlug).sort()).toEqual(expected);
  });
  it("every slug is a known airport", () => {
    const known = new Set(loadAirports().map((a) => a.slug));
    for (const r of loadLoungeDataset().records) expect(known.has(r.airportSlug)).toBe(true);
  });
  it("Priority Pass has the three tiers", () => {
    expect(loadPriorityPass().tiers.map((t) => t.tier).sort()).toEqual(["Prestige", "Standard", "Standard Plus"]);
  });
});
```

- [ ] **Step 3: Run all data tests** — green. **Step 4: Commit** — `git add -A && git commit -m "data(parkmath): lounges + Priority Pass tiers (official sources)"`

---

### Task 10: Affiliate slots — partners config + AffiliateBlock

**Files:**
- Create: `apps/parkmath/lib/partners.json`, `apps/parkmath/lib/partners.ts`, `apps/parkmath/components/affiliate-block.tsx`
- Test: `apps/parkmath/tests/partners.test.ts`

- [ ] **Step 1: Failing tests** at `apps/parkmath/tests/partners.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { resolveSlot } from "../lib/partners";

describe("resolveSlot", () => {
  it("returns the official fallback when no partner is active", () => {
    const r = resolveSlot("parking-prebook", "gatwick", "https://www.gatwickairport.com/parking");
    expect(r.kind).toBe("official");
    expect(r.url).toBe("https://www.gatwickairport.com/parking");
    expect(r.disclosureRequired).toBe(false);
  });
  it("never returns an affiliate link while all slots ship inactive", () => {
    for (const slot of ["parking-prebook", "lounge-membership"] as const) {
      expect(resolveSlot(slot, "manchester", "https://example.com").kind).toBe("official");
    }
  });
});
```

- [ ] **Step 2: Run to verify failure** (from `apps/parkmath`: `./node_modules/.bin/vitest run tests`).

- [ ] **Step 3: Implement.**

`apps/parkmath/lib/partners.json` (every slot ships INACTIVE — flipping `active` + filling `deeplinkTemplate` happens only after the Ltd + Awin exist; `{officialUrl}` is substituted at render time):

```json
{
  "partners": {
    "holiday-extras": { "name": "Holiday Extras", "active": false },
    "heathrow-official": { "name": "Heathrow Official Parking", "active": false },
    "priority-pass": { "name": "Priority Pass", "active": false }
  },
  "slots": [
    { "id": "parking-prebook", "partnerId": "holiday-extras", "deeplinkTemplate": "", "active": false },
    { "id": "lounge-membership", "partnerId": "priority-pass", "deeplinkTemplate": "", "active": false }
  ]
}
```

`apps/parkmath/lib/partners.ts`:

```ts
import partnersJson from "./partners.json";

export type SlotId = "parking-prebook" | "lounge-membership";

export interface ResolvedSlot {
  kind: "affiliate" | "official";
  url: string;
  label: string;
  partnerName: string | null;
  disclosureRequired: boolean;
}

interface SlotConfig {
  id: string;
  partnerId: string;
  deeplinkTemplate: string;
  active: boolean;
}

export function resolveSlot(slotId: SlotId, airportSlug: string, officialUrl: string): ResolvedSlot {
  const slot = (partnersJson.slots as SlotConfig[]).find((s) => s.id === slotId);
  const partner = slot ? (partnersJson.partners as Record<string, { name: string; active: boolean }>)[slot.partnerId] : undefined;
  if (slot?.active && partner?.active && slot.deeplinkTemplate) {
    return {
      kind: "affiliate",
      url: slot.deeplinkTemplate.replaceAll("{airportSlug}", airportSlug).replaceAll("{officialUrl}", officialUrl),
      label: `Check prices with ${partner.name}`,
      partnerName: partner.name,
      disclosureRequired: true
    };
  }
  return {
    kind: "official",
    url: officialUrl,
    label: "Check live prices on the official site",
    partnerName: null,
    disclosureRequired: false
  };
}
```

`apps/parkmath/components/affiliate-block.tsx`:

```tsx
import { resolveSlot, type SlotId } from "@/lib/partners";

export function AffiliateBlock({ slotId, airportSlug, officialUrl }: { slotId: SlotId; airportSlug: string; officialUrl: string }) {
  const slot = resolveSlot(slotId, airportSlug, officialUrl);
  return (
    <div className="rounded-card border border-brand-accent/30 bg-blue-50 p-4">
      <a
        href={slot.url}
        rel={slot.kind === "affiliate" ? "sponsored noopener noreferrer" : "noopener noreferrer"}
        target="_blank"
        className="font-semibold text-brand-accent underline underline-offset-4"
      >
        {slot.label} ↗
      </a>
      {slot.disclosureRequired ? (
        <p className="mt-2 text-xs text-ink-muted">
          Affiliate link: if you book through {slot.partnerName}, ParkMath may earn a commission at no cost to you. This
          never affects which option we show as cheapest.
        </p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Run to verify pass** — 9 existing + 2 = 11 app tests.

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(parkmath): affiliate slot config + AffiliateBlock (ships inactive, official fallback)"`

---

### Task 11: Parking pages + calculator island

**Files:**
- Create: `apps/parkmath/lib/parking-content.ts`, `apps/parkmath/components/parking-calculator.tsx`
- Create: `apps/parkmath/app/airport-parking/page.tsx`, `apps/parkmath/app/airport-parking/[airport]/page.tsx`, `apps/parkmath/app/airport-parking/[airport]/[duration]/page.tsx`
- Test: `apps/parkmath/tests/parking-content.test.ts`

**Anti-scaled-content rules implemented here:** duration pages exist ONLY for `3-days`, `7-days`, `14-days`; every page's content is computed from that airport's actual products (tables, verdicts, savings differ per page); a distinctness test proves duration pages cannot render identical bodies.

- [ ] **Step 1: Failing tests** at `apps/parkmath/tests/parking-content.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { ParkingRecord } from "@mathfamily/data";
import { DURATION_SLUGS, buildParkingFaqs, durationFromSlug, parkingPageModel } from "../lib/parking-content";

const record: ParkingRecord = {
  airportSlug: "manchester",
  products: [
    {
      productType: "gate",
      name: "Multi-Storey (drive-up)",
      prices: [
        { days: 3, totalPence: 13500 },
        { days: 7, totalPence: 31500 },
        { days: 14, totalPence: 63000 }
      ],
      snapshotDate: null,
      notes: null
    },
    {
      productType: "prebook",
      name: "JetParks 1 (pre-book)",
      prices: [
        { days: 3, totalPence: 2400 },
        { days: 7, totalPence: 4200 },
        { days: 14, totalPence: 8000 }
      ],
      snapshotDate: "2026-06-10",
      notes: null
    }
  ],
  sourceUrl: "https://www.manchesterairport.co.uk/parking/",
  verifiedAt: "2026-06-10"
};

describe("durationFromSlug", () => {
  it("parses valid slugs and rejects others", () => {
    expect(durationFromSlug("7-days")).toBe(7);
    expect(durationFromSlug("2-weeks")).toBeNull();
  });
});

describe("parkingPageModel", () => {
  it("produces a cheapest verdict for the duration", () => {
    const m = parkingPageModel(record, 7);
    expect(m.cheapest?.name).toBe("JetParks 1 (pre-book)");
    expect(m.savingsVsGatePence).toBe(27300);
    expect(m.answer).toContain("£42");
  });
  it("produces materially different models per duration (anti-thin-content guard)", () => {
    const bodies = DURATION_SLUGS.map((slug) => JSON.stringify(parkingPageModel(record, durationFromSlug(slug)!)));
    expect(new Set(bodies).size).toBe(DURATION_SLUGS.length);
  });
});

describe("buildParkingFaqs", () => {
  it("includes cheapest + gate-vs-prebook questions", () => {
    const faqs = buildParkingFaqs(record, "Manchester", 7);
    expect(faqs[0]?.question).toContain("cheapest");
    expect(faqs.some((f) => f.question.includes("pre-book"))).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify failure.**

- [ ] **Step 3: Implement** `apps/parkmath/lib/parking-content.ts`:

```ts
import { compareParking, formatPence, type ParkingComparison } from "@mathfamily/engine";
import type { ParkingRecord } from "@mathfamily/data";

export const DURATION_SLUGS = ["3-days", "7-days", "14-days"] as const;
export type DurationSlug = (typeof DURATION_SLUGS)[number];

export function durationFromSlug(slug: string): number | null {
  const m = /^(\d+)-days$/.exec(slug);
  if (!m) return null;
  const days = Number(m[1]);
  return (DURATION_SLUGS as readonly string[]).includes(slug) ? days : null;
}

export interface ParkingPageModel extends ParkingComparison {
  answer: string;
}

export function parkingPageModel(record: ParkingRecord, days: number): ParkingPageModel {
  const comparison = compareParking(record, days);
  const answer = comparison.cheapest
    ? `The cheapest ${days}-day parking option in our verified data is ${comparison.cheapest.name} at ${formatPence(comparison.cheapest.totalPence)}${
        comparison.savingsVsGatePence ? `, saving ${formatPence(comparison.savingsVsGatePence)} against the drive-up gate price` : ""
      }.`
    : `No published prices cover ${days} days — check the official site.`;
  return { ...comparison, answer };
}

export function buildParkingFaqs(record: ParkingRecord, airportName: string, days: number): { question: string; answer: string }[] {
  const model = parkingPageModel(record, days);
  const faqs: { question: string; answer: string }[] = [];
  if (model.cheapest) {
    faqs.push({
      question: `What is the cheapest ${days}-day parking at ${airportName}?`,
      answer: `${model.cheapest.name}: ${formatPence(model.cheapest.totalPence)} for ${days} days (verified ${record.verifiedAt}).`
    });
  }
  if (model.gate && model.cheapest && model.savingsVsGatePence) {
    faqs.push({
      question: `Is pre-booking ${airportName} parking cheaper than paying at the gate?`,
      answer: `Yes — for ${days} days, pre-booking (${formatPence(model.cheapest.totalPence)}) beats the gate rate (${formatPence(model.gate.totalPence)}) by ${formatPence(model.savingsVsGatePence)} in our latest verified snapshot.`
    });
  }
  faqs.push({
    question: `Where do these ${airportName} parking prices come from?`,
    answer: `Gate tariffs come from the airport's official published prices; pre-book figures are dated quote snapshots from the official booking portal. Nothing is scraped from third-party aggregators.`
  });
  return faqs;
}
```

(Note `compareParking(record, days)` works because `ParkingRecord` structurally satisfies `ParkingTariff`.)

- [ ] **Step 4: Run to verify pass** — 11 + 5 = 16 app tests.

- [ ] **Step 5: Calculator island** at `apps/parkmath/components/parking-calculator.tsx`:

```tsx
"use client";

import { useState } from "react";
import { compareParking, formatPence, type ParkingTariff } from "@mathfamily/engine";

const CHOICES = [1, 3, 7, 14, 28];

export function ParkingCalculator({ tariff, airportName, buildDate }: { tariff: ParkingTariff; airportName: string; buildDate: string }) {
  const [days, setDays] = useState(7);
  const c = compareParking(tariff, days, new Date(buildDate));

  return (
    <section aria-label={`${airportName} parking cost comparison`} className="rounded-card border border-ink/10 p-6">
      <h2 className="text-lg font-semibold text-ink">How long are you going for?</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {CHOICES.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDays(d)}
            aria-pressed={days === d}
            className={
              days === d
                ? "rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white"
                : "rounded-lg border border-ink/20 px-4 py-2 text-sm font-medium text-ink hover:border-brand-accent"
            }
          >
            {d} day{d > 1 ? "s" : ""}
          </button>
        ))}
      </div>
      <div aria-live="polite" data-testid="parking-result" className="mt-4 space-y-2">
        {c.options.length === 0 ? (
          <p className="text-ink-muted">No published price for {days} days — check the official site.</p>
        ) : (
          c.options.map((o, i) => (
            <div key={o.name} className="flex items-baseline justify-between rounded-lg border border-ink/10 px-4 py-2">
              <span className="text-sm font-medium text-ink">
                {i === 0 ? "🏆 " : ""}
                {o.name}
              </span>
              <span className="text-lg font-bold tabular-nums text-brand">{formatPence(o.totalPence)}</span>
            </div>
          ))
        )}
      </div>
      <ul className="mt-3 space-y-1 text-xs text-ink-muted">
        {c.warnings.map((w) => (
          <li key={w.code}>{w.message}</li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 6: Pages.**

`apps/parkmath/app/airport-parking/page.tsx` (index hub):

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { loadAirports, loadParkingDataset } from "@mathfamily/data";
import { formatPence, compareParking } from "@mathfamily/engine";
import { itemListLd, JsonLd } from "@mathfamily/geo";
import { FeeGrid, FreshnessBadge } from "@mathfamily/ui";

export const metadata: Metadata = {
  title: "UK airport parking compared — verified gate vs pre-book prices",
  description: "Gate (drive-up) vs pre-book parking prices at major UK airports for 3, 7 and 14 days — verified against official airport tariffs and dated portal snapshots."
};

export default function ParkingIndexPage() {
  const airports = new Map(loadAirports().map((a) => [a.slug, a]));
  const dataset = loadParkingDataset();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const latestVerified = dataset.records.map((r) => r.verifiedAt).sort().at(-1) ?? dataset.lastUpdated;

  const rows = dataset.records.map((r) => {
    const c = compareParking(r, 7);
    return { slug: r.airportSlug, name: airports.get(r.airportSlug)?.name ?? r.airportSlug, cheapest: c.cheapest, verifiedAt: r.verifiedAt };
  });

  return (
    <article className="space-y-6">
      <JsonLd
        data={itemListLd({
          name: "Cheapest 7-day airport parking (verified)",
          items: rows.filter((r) => r.cheapest).map((r) => ({ name: `${r.name} — from ${formatPence(r.cheapest!.totalPence)}`, url: `${siteUrl}/airport-parking/${r.slug}` }))
        })}
      />
      <header className="space-y-3">
        <h1 className="text-3xl font-bold text-ink">UK airport parking, compared honestly</h1>
        <FreshnessBadge verifiedAt={latestVerified} />
      </header>
      <FeeGrid
        caption="7-day cheapest verified option per airport. Click through for all durations, gate prices and the full comparison."
        columns={["Airport", "Cheapest 7-day option", "From", "Verified"]}
        rows={rows.map((r) => [
          <Link key="a" href={`/airport-parking/${r.slug}`} className="font-medium text-brand-accent underline-offset-4 hover:underline">{r.name}</Link>,
          r.cheapest?.name ?? "—",
          r.cheapest ? formatPence(r.cheapest.totalPence) : "—",
          r.verifiedAt
        ])}
      />
    </article>
  );
}
```

`apps/parkmath/app/airport-parking/[airport]/page.tsx` (per-airport hub):

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadAirports, loadParkingDataset, type Airport, type ParkingRecord } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, faqPageLd, JsonLd } from "@mathfamily/geo";
import { AnswerLead, FaqAccordion, FeeGrid, FreshnessBadge, SourceCitation, SourcesBlock, EmailCaptureSlot } from "@mathfamily/ui";
import { AffiliateBlock } from "@/components/affiliate-block";
import { ParkingCalculator } from "@/components/parking-calculator";
import { DURATION_SLUGS, buildParkingFaqs, parkingPageModel } from "@/lib/parking-content";

export const dynamicParams = false;

export function generateStaticParams() {
  return loadParkingDataset().records.map((r) => ({ airport: r.airportSlug }));
}

function getData(slug: string): { airport: Airport; record: ParkingRecord } | null {
  const airport = loadAirports().find((a) => a.slug === slug);
  const record = loadParkingDataset().records.find((r) => r.airportSlug === slug);
  return airport && record ? { airport, record } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ airport: string }> }): Promise<Metadata> {
  const { airport } = await params;
  const data = getData(airport);
  if (!data) return {};
  const m = parkingPageModel(data.record, 7);
  return {
    title: `${data.airport.name} parking prices 2026 — gate vs pre-book, verified`,
    description: `${data.airport.name} parking compared for 3, 7 and 14 days. ${m.answer} Verified ${data.record.verifiedAt}.`
  };
}

export default async function ParkingHubPage({ params }: { params: Promise<{ airport: string }> }) {
  const { airport: slug } = await params;
  const data = getData(slug);
  if (!data) notFound();
  const { airport, record } = data;
  const m7 = parkingPageModel(record, 7);
  const faqs = buildParkingFaqs(record, airport.name, 7);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <article className="space-y-8">
      <JsonLd data={faqPageLd(faqs)} />
      <JsonLd data={breadcrumbLd([
        { name: "Home", url: siteUrl },
        { name: "Airport parking", url: `${siteUrl}/airport-parking` },
        { name: airport.name, url: `${siteUrl}/airport-parking/${airport.slug}` }
      ])} />

      <header className="space-y-3">
        <h1 className="text-3xl font-bold text-ink">{airport.name} parking: gate vs pre-book</h1>
        <div className="flex flex-wrap items-center gap-3">
          <FreshnessBadge verifiedAt={record.verifiedAt} />
          <SourceCitation url={record.sourceUrl} label={`Official ${airport.name} parking`} />
        </div>
      </header>

      <AnswerLead answer={m7.answer}>
        {DURATION_SLUGS.map((s) => {
          const days = Number(s.split("-")[0]);
          const m = parkingPageModel(record, days);
          return m.cheapest ? `${days} days: from ${formatPence(m.cheapest.totalPence)} (${m.cheapest.name})` : `${days} days: see official site`;
        })}
      </AnswerLead>

      <ParkingCalculator tariff={record} airportName={airport.name} buildDate={new Date().toISOString()} />

      <FeeGrid
        caption={`All published ${airport.name} options by duration. Pre-book figures are dated snapshots from the official portal.`}
        columns={["Option", "3 days", "7 days", "14 days"]}
        rows={record.products.map((p) => [
          p.name,
          ...[3, 7, 14].map((d) => {
            const price = p.prices.find((x) => x.days === d);
            return price ? formatPence(price.totalPence) : "—";
          })
        ])}
      />

      <AffiliateBlock slotId="parking-prebook" airportSlug={airport.slug} officialUrl={record.sourceUrl} />

      <nav aria-label="Duration pages" className="flex gap-3 text-sm">
        {DURATION_SLUGS.map((s) => (
          <Link key={s} href={`/airport-parking/${airport.slug}/${s}`} className="font-medium text-brand-accent underline underline-offset-4">
            {s.replace("-", " ")} guide →
          </Link>
        ))}
      </nav>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-ink">Frequently asked questions</h2>
        <FaqAccordion items={faqs} />
      </section>

      <p className="text-sm">
        <Link href={`/drop-off-charges/${airport.slug}`} className="text-brand-accent underline underline-offset-4">
          Just dropping someone off at {airport.name}? See the drop-off charge →
        </Link>
      </p>

      <EmailCaptureSlot formAction={process.env.NEXT_PUBLIC_MAILERLITE_FORM_ACTION} hook={`Get notified when ${airport.name} parking prices change`} />

      <SourcesBlock
        sources={[{ label: `Official ${airport.name} parking pages`, url: record.sourceUrl, verifiedAt: record.verifiedAt }]}
        method="Gate tariffs are the airport's official published prices. Pre-book figures are dated quote snapshots taken on the airport's own booking portal — never scraped from third-party aggregators."
      />
    </article>
  );
}
```

`apps/parkmath/app/airport-parking/[airport]/[duration]/page.tsx` (high-intent duration pages — 10 airports × 3 = 30 pages):

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadAirports, loadParkingDataset, type Airport, type ParkingRecord } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, faqPageLd, JsonLd } from "@mathfamily/geo";
import { AnswerLead, Callout, FaqAccordion, FeeGrid, FreshnessBadge, SourcesBlock } from "@mathfamily/ui";
import { AffiliateBlock } from "@/components/affiliate-block";
import { DURATION_SLUGS, buildParkingFaqs, durationFromSlug, parkingPageModel } from "@/lib/parking-content";

export const dynamicParams = false;

export function generateStaticParams() {
  return loadParkingDataset().records.flatMap((r) => DURATION_SLUGS.map((duration) => ({ airport: r.airportSlug, duration })));
}

function getData(slug: string): { airport: Airport; record: ParkingRecord } | null {
  const airport = loadAirports().find((a) => a.slug === slug);
  const record = loadParkingDataset().records.find((r) => r.airportSlug === slug);
  return airport && record ? { airport, record } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ airport: string; duration: string }> }): Promise<Metadata> {
  const { airport, duration } = await params;
  const data = getData(airport);
  const days = durationFromSlug(duration);
  if (!data || days === null) return {};
  const m = parkingPageModel(data.record, days);
  return {
    title: `${days}-day parking at ${data.airport.name} — cheapest verified price`,
    description: `${m.answer} Gate vs pre-book for ${days} days at ${data.airport.name}, verified ${data.record.verifiedAt}.`
  };
}

export default async function DurationPage({ params }: { params: Promise<{ airport: string; duration: string }> }) {
  const { airport: slug, duration } = await params;
  const data = getData(slug);
  const days = durationFromSlug(duration);
  if (!data || days === null) notFound();
  const { airport, record } = data;
  const m = parkingPageModel(record, days);
  const faqs = buildParkingFaqs(record, airport.name, days);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <article className="space-y-8">
      <JsonLd data={faqPageLd(faqs)} />
      <JsonLd data={breadcrumbLd([
        { name: "Home", url: siteUrl },
        { name: "Airport parking", url: `${siteUrl}/airport-parking` },
        { name: airport.name, url: `${siteUrl}/airport-parking/${airport.slug}` },
        { name: `${days} days`, url: `${siteUrl}/airport-parking/${airport.slug}/${duration}` }
      ])} />

      <header className="space-y-3">
        <h1 className="text-3xl font-bold text-ink">{days}-day parking at {airport.name}</h1>
        <FreshnessBadge verifiedAt={record.verifiedAt} />
      </header>

      <AnswerLead answer={m.answer}>
        {m.options.map((o) => `${o.name}: ${formatPence(o.totalPence)}${o.snapshotDate ? ` (snapshot ${o.snapshotDate})` : " (published gate rate)"}`)}
      </AnswerLead>

      {m.savingsVsGatePence && m.cheapest && m.gate ? (
        <Callout variant="free" title={`Pre-booking saves ${formatPence(m.savingsVsGatePence)}`}>
          Turning up and paying the gate rate ({m.gate.name}, {formatPence(m.gate.totalPence)}) costs {formatPence(m.savingsVsGatePence)} more than the
          cheapest verified option ({m.cheapest.name}, {formatPence(m.cheapest.totalPence)}) for {days} days.
        </Callout>
      ) : null}

      <FeeGrid
        caption={`${airport.name} options priced for exactly ${days} days.`}
        columns={["Option", "Type", `${days}-day total`]}
        rows={m.options.map((o) => [o.name, o.productType === "gate" ? "Drive-up" : o.productType === "prebook" ? "Pre-book" : o.productType, formatPence(o.totalPence)])}
      />

      <AffiliateBlock slotId="parking-prebook" airportSlug={airport.slug} officialUrl={record.sourceUrl} />

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-ink">Frequently asked questions</h2>
        <FaqAccordion items={faqs} />
      </section>

      <p className="text-sm">
        <Link href={`/airport-parking/${airport.slug}`} className="text-brand-accent underline underline-offset-4">
          All durations and options at {airport.name} →
        </Link>
      </p>

      <SourcesBlock
        sources={[{ label: `Official ${airport.name} parking pages`, url: record.sourceUrl, verifiedAt: record.verifiedAt }]}
        method="Gate tariffs are official published prices; pre-book figures are dated official-portal snapshots."
      />
    </article>
  );
}
```

- [ ] **Step 7: Build & verify.** `pnpm --filter parkmath build`. Expected: `/airport-parking` static, `/airport-parking/[airport]` 10 paths, `/airport-parking/[airport]/[duration]` 30 paths. Inspect manchester 7-days HTML: AnswerLead first, options table, savings callout, official-fallback affiliate link (rel WITHOUT `sponsored`).

- [ ] **Step 8: Commit** — `git add -A && git commit -m "feat(parkmath): parking index + airport hubs + 3/7/14-day pages + calculator"`

---

### Task 12: Lounge pages + calculator, cross-links, nav, llms.txt, sitemap

**Files:**
- Create: `apps/parkmath/components/lounge-calculator.tsx`, `apps/parkmath/app/airport-lounges/page.tsx`, `apps/parkmath/app/airport-lounges/[airport]/page.tsx`
- Modify: `apps/parkmath/app/layout.tsx` (nav), `apps/parkmath/app/drop-off-charges/[airport]/page.tsx` (cross-links), `apps/parkmath/app/sitemap.ts`, `apps/parkmath/app/llms.txt/route.ts`, `apps/parkmath/app/page.tsx` (home links)

- [ ] **Step 1: Lounge calculator island** at `apps/parkmath/components/lounge-calculator.tsx`:

```tsx
"use client";

import { useState } from "react";
import { formatPence, loungeBreakEven, type MembershipTier } from "@mathfamily/engine";

export function LoungeCalculator({ walkInPence, tiers, airportName }: { walkInPence: number; tiers: MembershipTier[]; airportName: string }) {
  const [visits, setVisits] = useState(3);
  const r = loungeBreakEven(walkInPence, visits, tiers);

  return (
    <section aria-label={`${airportName} lounge membership break-even`} className="rounded-card border border-ink/10 p-6">
      <h2 className="text-lg font-semibold text-ink">How many lounge visits a year?</h2>
      <div className="mt-4 flex items-center gap-4">
        <input type="range" min={1} max={20} value={visits} aria-valuetext={`${visits} visits`} aria-describedby="lounge-result"
          onChange={(e) => setVisits(Number(e.target.value))} className="w-full accent-brand-accent" />
        <span className="w-20 shrink-0 text-right text-sm font-medium text-ink-muted">{visits}×</span>
      </div>
      <div id="lounge-result" aria-live="polite" data-testid="lounge-result" className="mt-4 space-y-1 text-sm">
        <p className="text-ink">Pay-as-you-go: <strong className="tabular-nums">{formatPence(r.payAsYouGoPence)}</strong>/year</p>
        {r.tierCosts.map((t) => (
          <p key={t.tier} className="text-ink-muted">Priority Pass {t.tier}: <span className="tabular-nums">{formatPence(t.totalPence)}</span>/year</p>
        ))}
        <p className="mt-2 text-lg font-bold text-brand">
          {r.verdict === "payg" ? "Paying per visit wins at this frequency." : `${r.best?.tier} membership wins — saves ${formatPence(r.savingsPence)}/year.`}
        </p>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Lounge pages.**

`apps/parkmath/app/airport-lounges/[airport]/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadAirports, loadLoungeDataset, loadPriorityPass, type Airport, type LoungeRecord } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, faqPageLd, JsonLd } from "@mathfamily/geo";
import { AnswerLead, FaqAccordion, FeeGrid, FreshnessBadge, SourceCitation, SourcesBlock } from "@mathfamily/ui";
import { AffiliateBlock } from "@/components/affiliate-block";
import { LoungeCalculator } from "@/components/lounge-calculator";

export const dynamicParams = false;

export function generateStaticParams() {
  return loadLoungeDataset().records.map((r) => ({ airport: r.airportSlug }));
}

function getData(slug: string): { airport: Airport; record: LoungeRecord } | null {
  const airport = loadAirports().find((a) => a.slug === slug);
  const record = loadLoungeDataset().records.find((r) => r.airportSlug === slug);
  return airport && record ? { airport, record } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ airport: string }> }): Promise<Metadata> {
  const { airport } = await params;
  const data = getData(airport);
  if (!data) return {};
  const cheapest = data.record.lounges.filter((l) => l.walkInPence !== null).sort((a, b) => a.walkInPence! - b.walkInPence!)[0];
  return {
    title: `${data.airport.name} lounges 2026 — prices & Priority Pass break-even`,
    description: `${data.airport.name} lounge walk-in prices${cheapest ? ` from ${formatPence(cheapest.walkInPence!)}` : ""}, which take Priority Pass, and when membership beats paying per visit. Verified ${data.record.verifiedAt}.`
  };
}

export default async function LoungePage({ params }: { params: Promise<{ airport: string }> }) {
  const { airport: slug } = await params;
  const data = getData(slug);
  if (!data) notFound();
  const { airport, record } = data;
  const pp = loadPriorityPass();
  const priced = record.lounges.filter((l) => l.walkInPence !== null);
  const cheapest = [...priced].sort((a, b) => a.walkInPence! - b.walkInPence!)[0];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const faqs = [
    {
      question: `How much does an airport lounge cost at ${airport.name}?`,
      answer: cheapest
        ? `Walk-in prices start at ${formatPence(cheapest.walkInPence!)} (${cheapest.name}), verified ${record.verifiedAt}.`
        : `Walk-in prices are not published for ${airport.name} lounges — check the official pages.`
    },
    {
      question: `Which ${airport.name} lounges accept Priority Pass?`,
      answer: record.lounges.some((l) => l.priorityPass)
        ? record.lounges.filter((l) => l.priorityPass).map((l) => l.name).join(", ")
        : "None of the tracked lounges currently list Priority Pass access."
    }
  ];

  return (
    <article className="space-y-8">
      <JsonLd data={faqPageLd(faqs)} />
      <JsonLd data={breadcrumbLd([
        { name: "Home", url: siteUrl },
        { name: "Airport lounges", url: `${siteUrl}/airport-lounges` },
        { name: airport.name, url: `${siteUrl}/airport-lounges/${airport.slug}` }
      ])} />

      <header className="space-y-3">
        <h1 className="text-3xl font-bold text-ink">{airport.name} lounges: pay per visit or join?</h1>
        <div className="flex flex-wrap items-center gap-3">
          <FreshnessBadge verifiedAt={record.verifiedAt} />
          <SourceCitation url={record.sourceUrl} label={`Official lounge pages`} />
        </div>
      </header>

      <AnswerLead
        answer={
          cheapest
            ? `A lounge visit at ${airport.name} costs from ${formatPence(cheapest.walkInPence!)} walk-in — frequent flyers may pay less with a membership.`
            : `${airport.name} lounge walk-in prices aren't published online — memberships may still beat on-the-day rates.`
        }
      >
        {record.lounges.map((l) => `${l.name}: ${l.walkInPence !== null ? formatPence(l.walkInPence) : "price on the day"}${l.priorityPass ? " · Priority Pass" : ""}`)}
      </AnswerLead>

      <FeeGrid
        caption={`${airport.name} lounges, verified ${record.verifiedAt}.`}
        columns={["Lounge", "Walk-in", "Priority Pass"]}
        rows={record.lounges.map((l) => [l.name, l.walkInPence !== null ? formatPence(l.walkInPence) : "—", l.priorityPass ? "Yes" : "No"])}
      />

      {cheapest ? <LoungeCalculator walkInPence={cheapest.walkInPence!} tiers={pp.tiers} airportName={airport.name} /> : null}

      <AffiliateBlock slotId="lounge-membership" airportSlug={airport.slug} officialUrl={pp.sourceUrl} />

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-ink">Frequently asked questions</h2>
        <FaqAccordion items={faqs} />
      </section>

      <p className="text-sm">
        <Link href={`/airport-parking/${airport.slug}`} className="text-brand-accent underline underline-offset-4">
          Parking at {airport.name} compared →
        </Link>
      </p>

      <SourcesBlock
        sources={[
          { label: `Official ${airport.name} lounge pages`, url: record.sourceUrl, verifiedAt: record.verifiedAt },
          { label: "Priority Pass official pricing", url: pp.sourceUrl, verifiedAt: pp.verifiedAt }
        ]}
        method="Walk-in prices from the lounge operators' official pages; membership pricing from Priority Pass's official site."
      />
    </article>
  );
}
```

`apps/parkmath/app/airport-lounges/page.tsx` (index):

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { loadAirports, loadLoungeDataset } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { itemListLd, JsonLd } from "@mathfamily/geo";
import { FeeGrid } from "@mathfamily/ui";

export const metadata: Metadata = {
  title: "UK airport lounge prices compared — walk-in costs & Priority Pass",
  description: "Walk-in lounge prices at major UK airports, which lounges take Priority Pass, and break-even calculators for membership."
};

export default function LoungeIndexPage() {
  const airports = new Map(loadAirports().map((a) => [a.slug, a]));
  const dataset = loadLoungeDataset();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const rows = dataset.records.map((r) => {
    const priced = r.lounges.filter((l) => l.walkInPence !== null).sort((a, b) => a.walkInPence! - b.walkInPence!);
    return { slug: r.airportSlug, name: airports.get(r.airportSlug)?.name ?? r.airportSlug, from: priced[0]?.walkInPence ?? null, count: r.lounges.length };
  });

  return (
    <article className="space-y-6">
      <JsonLd data={itemListLd({
        name: "UK airport lounges by cheapest walk-in price",
        items: rows.map((r) => ({ name: `${r.name} — ${r.from !== null ? `from ${formatPence(r.from)}` : "price on the day"}`, url: `${siteUrl}/airport-lounges/${r.slug}` }))
      })} />
      <h1 className="text-3xl font-bold text-ink">UK airport lounges, compared</h1>
      <FeeGrid
        caption="Cheapest verified walk-in price per airport."
        columns={["Airport", "Lounges", "Walk-in from"]}
        rows={rows.map((r) => [
          <Link key="a" href={`/airport-lounges/${r.slug}`} className="font-medium text-brand-accent underline-offset-4 hover:underline">{r.name}</Link>,
          String(r.count),
          r.from !== null ? formatPence(r.from) : "—"
        ])}
      />
    </article>
  );
}
```

- [ ] **Step 3: Wire navigation + cross-links.**
- `apps/parkmath/app/layout.tsx`: NAV becomes `[{ label: "Drop-off charges", href: "/drop-off-charges" }, { label: "Parking", href: "/airport-parking" }, { label: "Lounges", href: "/airport-lounges" }, { label: "Privacy", href: "/privacy" }]`.
- `apps/parkmath/app/drop-off-charges/[airport]/page.tsx`: before the EmailCaptureSlot add a "More at this airport" block — links to `/airport-parking/${airport.slug}` and `/airport-lounges/${airport.slug}` ONLY when those datasets contain the slug (import `loadParkingDataset`, `loadLoungeDataset`, compute booleans at render).
- `apps/parkmath/app/page.tsx`: under the stats grid add two links: "Compare airport parking →" (`/airport-parking`) and "Lounge or membership? →" (`/airport-lounges`).

- [ ] **Step 4: sitemap + llms.txt.**
- `sitemap.ts`: append entries for `/airport-parking`, each parking airport hub, each duration page, `/airport-lounges`, each lounge page — `lastModified` from each record's `verifiedAt` (same pattern as drop-off entries).
- `llms.txt/route.ts`: add to Datasets: parking (`${parking.records.length} airports, version ${parking.version}`) and lounges; add the three new page patterns with one-line cite guidance each.

- [ ] **Step 5: Build & verify.** Expected total ≈ 85 static pages (33 existing + 1 + 10 + 30 + 1 + 10). Check one drop-off page links to its parking hub; nav shows 4 items.

- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat(parkmath): lounge pages + break-even calculator, nav + cross-links, sitemap + llms.txt"`

---

### Task 13: OG images

**Files:**
- Create: `apps/parkmath/app/drop-off-charges/[airport]/opengraph-image.tsx`, `apps/parkmath/app/airport-parking/[airport]/opengraph-image.tsx`, `apps/parkmath/app/opengraph-image.tsx`

- [ ] **Step 1: Implement the drop-off OG image** at `apps/parkmath/app/drop-off-charges/[airport]/opengraph-image.tsx`:

```tsx
import { ImageResponse } from "next/og";
import { loadAirports, loadDropOffDataset } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return loadDropOffDataset().records.map((r) => ({ airport: r.airportSlug }));
}

export default async function OgImage({ params }: { params: Promise<{ airport: string }> }) {
  const { airport: slug } = await params;
  const record = loadDropOffDataset().records.find((r) => r.airportSlug === slug);
  const airport = loadAirports().find((a) => a.slug === slug);
  const fee = record ? (record.isFree ? "Free" : formatPence(record.bands[0]?.totalPence ?? 0)) : "";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, backgroundColor: "#0a2540", color: "white", fontFamily: "sans-serif" }}>
        <div style={{ fontSize: 36, opacity: 0.8 }}>{airport?.name ?? slug} drop-off charge</div>
        <div style={{ fontSize: 140, fontWeight: 700, marginTop: 12 }}>{fee}</div>
        <div style={{ fontSize: 28, marginTop: 18, opacity: 0.85 }}>{record?.feeSummary ?? ""}</div>
        <div style={{ fontSize: 24, marginTop: 40, color: "#7fd1a8" }}>✓ Verified {record?.verifiedAt} · ParkMath</div>
      </div>
    ),
    size
  );
}
```

- [ ] **Step 2: Parking OG image** at `apps/parkmath/app/airport-parking/[airport]/opengraph-image.tsx` — identical structure; headline `7-day parking from {cheapest}` using `parkingPageModel(record, 7)` (import from `@/lib/parking-content`), subtitle the cheapest option name, same verified footer.

```tsx
import { ImageResponse } from "next/og";
import { loadAirports, loadParkingDataset } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { parkingPageModel } from "@/lib/parking-content";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return loadParkingDataset().records.map((r) => ({ airport: r.airportSlug }));
}

export default async function OgImage({ params }: { params: Promise<{ airport: string }> }) {
  const { airport: slug } = await params;
  const record = loadParkingDataset().records.find((r) => r.airportSlug === slug);
  const airport = loadAirports().find((a) => a.slug === slug);
  const m = record ? parkingPageModel(record, 7) : null;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, backgroundColor: "#0a2540", color: "white", fontFamily: "sans-serif" }}>
        <div style={{ fontSize: 36, opacity: 0.8 }}>{airport?.name ?? slug} parking · 7 days</div>
        <div style={{ fontSize: 120, fontWeight: 700, marginTop: 12 }}>{m?.cheapest ? `from ${formatPence(m.cheapest.totalPence)}` : "compared"}</div>
        <div style={{ fontSize: 28, marginTop: 18, opacity: 0.85 }}>{m?.cheapest?.name ?? ""}</div>
        <div style={{ fontSize: 24, marginTop: 40, color: "#7fd1a8" }}>✓ Verified {record?.verifiedAt} · ParkMath</div>
      </div>
    ),
    size
  );
}
```

- [ ] **Step 3: Site default OG** at `apps/parkmath/app/opengraph-image.tsx` — brand card: "ParkMath — what Britain pays at the airport, verified" on the navy background, same style, no params.

```tsx
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, backgroundColor: "#0a2540", color: "white", fontFamily: "sans-serif" }}>
        <div style={{ fontSize: 88, fontWeight: 700 }}>ParkMath</div>
        <div style={{ fontSize: 40, marginTop: 16, opacity: 0.9 }}>UK airport drop-off, parking &amp; lounge costs</div>
        <div style={{ fontSize: 28, marginTop: 40, color: "#7fd1a8" }}>✓ Every figure verified against official airport pages</div>
      </div>
    ),
    size
  );
}
```

- [ ] **Step 4: Build & verify.** `pnpm --filter parkmath build` — OG routes listed; spot-check one image renders (open `.next` output or `pnpm dev` + curl the og route; PNG bytes returned).

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(parkmath): build-time OG images with live fee numbers"`

---

### Task 14: E2E extension, launch checklist, full gate

**Files:**
- Create: `apps/parkmath/e2e/p2.spec.ts` (the P1 spec file stays untouched)
- Create: `docs/launch-checklist.md`

- [ ] **Step 1: New E2E specs** at `apps/parkmath/e2e/p2.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("parking hub renders comparison and updates on duration change", async ({ page }) => {
  await page.goto("/airport-parking/manchester");
  const result = page.getByTestId("parking-result");
  await expect(result).toBeVisible();
  const before = await result.textContent();
  await page.getByRole("button", { name: "3 days" }).click();
  await expect(result).not.toHaveText(before ?? "");
});

test("duration page shows answer-first lead without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/airport-parking/manchester/7-days");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("7-day parking");
  await expect(page.locator("article > div").first()).toContainText(/£/);
  await context.close();
});

test("lounge page break-even verdict reacts to slider", async ({ page }) => {
  await page.goto("/airport-lounges/manchester");
  const result = page.getByTestId("lounge-result");
  await expect(result).toBeVisible();
  await page.getByRole("slider").fill("18");
  await expect(result).toContainText(/wins/);
});

test("affiliate block falls back to official link with no sponsored rel", async ({ page }) => {
  await page.goto("/airport-parking/manchester");
  const link = page.getByRole("link", { name: /official site/ });
  await expect(link).toBeVisible();
  await expect(link).not.toHaveAttribute("rel", /sponsored/);
});

test("cross-link from drop-off page to parking hub", async ({ page }) => {
  await page.goto("/drop-off-charges/manchester");
  await page.getByRole("link", { name: /Parking at Manchester|parking compared/i }).click();
  await expect(page).toHaveURL(/airport-parking\/manchester$/);
});
```

(Selector texts may need minimal adjustment to the real DOM — adjust the SPEC, not the app, and report any change.)

- [ ] **Step 2: Launch checklist** at `docs/launch-checklist.md`:

```markdown
# At-domain-attach checklist (P2 → production)

When parkmath.co.uk (+ .uk / maths twins) exists and DNS points at Vercel:

1. Set `NEXT_PUBLIC_SITE_URL=https://parkmath.co.uk` in Vercel (Production), redeploy `--prod`.
2. Verify robots.txt serves WITHOUT the preview `x-robots-tag: noindex` header.
3. Google Search Console: verify domain property, submit `https://parkmath.co.uk/sitemap.xml`.
4. Bing Webmaster Tools: verify, submit sitemap, enable IndexNow (Bing feeds ChatGPT Search).
5. Set `NEXT_PUBLIC_MAILERLITE_FORM_ACTION` once the MailerLite account + group exist.
6. Activate affiliate slots only after Ltd + Awin approval: fill `deeplinkTemplate`, set `active: true` in `apps/parkmath/lib/partners.json` (disclosure renders automatically).
7. Analytics: confirm Vercel Analytics events; create a GA4/analytics segment for AI-referral traffic (chatgpt.com, perplexity.ai, copilot.microsoft.com referrers).
8. Lighthouse pass on /, /drop-off-charges/gatwick, /airport-parking/manchester — budget LCP < 1.2s, CLS ≈ 0.
9. Re-run the 5-airport human spot-check if any data is >30 days old (esp. London City).
10. Monitor Search Console for scaled-content/spam manual actions weekly for the first month (expected: none — every page is data-distinct).
```

- [ ] **Step 3: Full gate.** From root: `pnpm test && pnpm typecheck && pnpm build`; from `apps/parkmath`: `CI=true pnpm e2e` (9 tests: 4 P1 + 5 P2). All green.

- [ ] **Step 4: Commit** — `git add -A && git commit -m "test(parkmath): P2 E2E + launch checklist"`

---

### Task 15: Finish branch

- [ ] Merge `p2-parkmath-full` → `main` after the full gate passes on the merged result (use superpowers:finishing-a-development-branch), tag `p2-complete`.

---

## Out of scope for P2 (per spec)

RoamMath (P3); n8n automation (P4); `/getting-to/` spokes; SkyParkSecure live API; travel insurance and any amber/red affiliate content; actual affiliate activation (needs Ltd + Awin); domain purchase and production deploy (checklist ready, blocked on accounts); marketing strategy (separately, later, per Mike).
