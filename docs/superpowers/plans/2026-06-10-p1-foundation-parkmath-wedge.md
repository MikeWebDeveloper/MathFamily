# P1: Math Family Foundation + ParkMath Drop-Off Wedge — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Math family monorepo foundation (engine/data/geo/ui packages) and ship ParkMath's drop-off-charges wedge (~27 static pages) to a noindexed Vercel staging URL.

**Architecture:** Turborepo + pnpm monorepo. Four shared packages consumed by a Next.js (App Router) app. All pages fully static (`generateStaticParams` + `dynamicParams = false`); fee data lives as Zod-validated JSON with mandatory `sourceUrl` + `verifiedAt` on every record; the drop-off calculator is a small client island running the pure-TS engine in the browser. Spec: `docs/superpowers/specs/2026-06-10-parkmath-roammath-design.md`.

**Tech Stack:** pnpm, Turborepo, Next.js (latest stable, App Router), React, Tailwind CSS v4, Zod, Vitest, @testing-library/react, Playwright, Vercel.

**Conventions for the engineer:**
- All money values are **integer pence** (`number`). Never floats. Never strings.
- Engines never throw on user input — clamp and warn.
- Every dataset record needs `sourceUrl` (official page only) + `verifiedAt` (YYYY-MM-DD).
- Run all commands from the repo root `/Volumes/TB4 Workstation/Users/mike/Desktop/Projects/MathFamily` unless a step says otherwise. The path contains a space — always quote it in shell commands.
- Node ≥ 22 and pnpm ≥ 10 required (`corepack enable` if pnpm missing).

---

### Task 1: Monorepo scaffold

**Files:**
- Create: `pnpm-workspace.yaml`, `turbo.json`, `package.json`, `README.md`
- Create: `packages/config/package.json`, `packages/config/tsconfig.base.json`

- [ ] **Step 1: Create workspace files**

`package.json` (root):

```json
{
  "name": "mathfamily",
  "private": true,
  "engines": { "node": ">=22" },
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck",
    "dev": "turbo run dev"
  },
  "devDependencies": { "turbo": "^2.5.0" }
}
```

`pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

`turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "!.next/cache/**"] },
    "test": {},
    "typecheck": {},
    "dev": { "cache": false, "persistent": true }
  }
}
```

`README.md`:

```markdown
# Math Family

UK cost-calculator portfolio monorepo. First brand: **ParkMath** (airport drop-off,
parking & lounge costs). Spec: `docs/superpowers/specs/2026-06-10-parkmath-roammath-design.md`.

- `apps/parkmath` — Next.js site
- `packages/engine` — pure-TS calculators (integer pence, typed warnings)
- `packages/data` — Zod schemas + JSON datasets (every record: sourceUrl + verifiedAt)
- `packages/geo` — JSON-LD builders for answer engines
- `packages/ui` — design tokens + shared components

Rules: prices change only via reviewed git diffs. Never auto-publish a price.
```

- [ ] **Step 2: Create the config package**

`packages/config/package.json`:

```json
{
  "name": "@mathfamily/config",
  "version": "0.0.0",
  "private": true,
  "files": ["tsconfig.base.json"]
}
```

`packages/config/tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true
  }
}
```

- [ ] **Step 3: Install and verify**

Run: `cd "/Volumes/TB4 Workstation/Users/mike/Desktop/Projects/MathFamily" && pnpm install && pnpm exec turbo --version`
Expected: install succeeds; turbo prints a 2.x version.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: scaffold Turborepo + pnpm workspace"
```

---

### Task 2: `@mathfamily/data` — schemas and loaders

**Files:**
- Create: `packages/data/package.json`, `packages/data/tsconfig.json`, `packages/data/vitest.config.ts`
- Create: `packages/data/src/schemas.ts`, `packages/data/src/index.ts`
- Create: `packages/data/datasets/airports.json`, `packages/data/datasets/parkmath/drop-off-fees.json`
- Test: `packages/data/tests/schemas.test.ts`, `packages/data/tests/loaders.test.ts`

- [ ] **Step 1: Package boilerplate**

`packages/data/package.json`:

```json
{
  "name": "@mathfamily/data",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": { "test": "vitest run", "typecheck": "tsc --noEmit" },
  "dependencies": { "zod": "^4.0.0" },
  "devDependencies": {
    "@mathfamily/config": "workspace:*",
    "typescript": "^5.8.0",
    "vitest": "^3.2.0"
  }
}
```

`packages/data/tsconfig.json`:

```json
{ "extends": "@mathfamily/config/tsconfig.base.json", "include": ["src", "tests", "datasets"] }
```

`packages/data/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { include: ["tests/**/*.test.ts"] } });
```

- [ ] **Step 2: Write failing schema tests**

`packages/data/tests/schemas.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { AirportSchema, DropOffRecordSchema } from "../src/schemas";

const validRecord = {
  airportSlug: "gatwick",
  isFree: false,
  feeSummary: "£10 for up to 20 minutes",
  bands: [{ upToMinutes: 20, totalPence: 1000 }],
  maxStayMinutes: 20,
  penaltyPence: 10000,
  penaltyNotes: "Reduced to £50 if paid within 14 days",
  paymentDeadline: "23:59 the day after drop-off",
  blueBadgePolicy: "Exempt if registered with the airport in advance",
  freeAlternative: { name: "Long Stay car park", minutesFree: 30, details: "Free for 30 minutes, then shuttle to terminal" },
  priorYearFeePence: 700,
  sourceUrl: "https://www.gatwickairport.com/drop-off",
  verifiedAt: "2026-06-10"
};

describe("AirportSchema", () => {
  it("accepts a valid airport", () => {
    expect(() => AirportSchema.parse({ name: "London Gatwick", slug: "gatwick", iata: "LGW", region: "London" })).not.toThrow();
  });
  it("rejects an invalid slug", () => {
    expect(() => AirportSchema.parse({ name: "X", slug: "Bad Slug!", iata: "LGW", region: "London" })).toThrow();
  });
});

describe("DropOffRecordSchema", () => {
  it("accepts a valid record", () => {
    expect(() => DropOffRecordSchema.parse(validRecord)).not.toThrow();
  });
  it("rejects a record without sourceUrl", () => {
    const { sourceUrl: _omitted, ...rest } = validRecord;
    expect(() => DropOffRecordSchema.parse(rest)).toThrow();
  });
  it("rejects a bad verifiedAt date format", () => {
    expect(() => DropOffRecordSchema.parse({ ...validRecord, verifiedAt: "10/06/2026" })).toThrow();
  });
  it("rejects a non-free airport with no tariff bands", () => {
    expect(() => DropOffRecordSchema.parse({ ...validRecord, bands: [] })).toThrow();
  });
  it("accepts a free airport with no bands", () => {
    expect(() =>
      DropOffRecordSchema.parse({ ...validRecord, isFree: true, bands: [], feeSummary: "Free at the forecourt" })
    ).not.toThrow();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm --filter @mathfamily/data test`
Expected: FAIL — cannot resolve `../src/schemas`.

- [ ] **Step 4: Implement schemas**

`packages/data/src/schemas.ts`:

```ts
import { z } from "zod";

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");
const Slug = z.string().regex(/^[a-z0-9-]+$/, "expected lowercase-kebab slug");
const HttpUrl = z.string().regex(/^https?:\/\/\S+$/, "expected absolute http(s) URL");

export const AirportSchema = z.object({
  name: z.string().min(1),
  slug: Slug,
  iata: z.string().length(3),
  region: z.string().min(1)
});
export type Airport = z.infer<typeof AirportSchema>;
export const AirportsFileSchema = z.array(AirportSchema).min(1);

export const DropOffBandSchema = z.object({
  upToMinutes: z.number().int().positive(),
  totalPence: z.number().int().nonnegative()
});

export const DropOffRecordSchema = z
  .object({
    airportSlug: Slug,
    isFree: z.boolean(),
    feeSummary: z.string().min(1),
    bands: z.array(DropOffBandSchema),
    maxStayMinutes: z.number().int().positive().nullable(),
    penaltyPence: z.number().int().positive().nullable(),
    penaltyNotes: z.string().nullable(),
    paymentDeadline: z.string().nullable(),
    blueBadgePolicy: z.string().min(1),
    freeAlternative: z
      .object({ name: z.string().min(1), minutesFree: z.number().int().positive(), details: z.string().min(1) })
      .nullable(),
    priorYearFeePence: z.number().int().nonnegative().nullable(),
    sourceUrl: HttpUrl,
    verifiedAt: IsoDate
  })
  .refine((r) => r.isFree || r.bands.length > 0, { message: "non-free airports need at least one tariff band" });
export type DropOffRecord = z.infer<typeof DropOffRecordSchema>;

export const DropOffDatasetSchema = z.object({
  version: z.string().min(1),
  lastUpdated: IsoDate,
  records: z.array(DropOffRecordSchema).min(1)
});
export type DropOffDataset = z.infer<typeof DropOffDatasetSchema>;
```

- [ ] **Step 5: Run schema tests to verify they pass**

Run: `pnpm --filter @mathfamily/data test`
Expected: PASS (7 tests).

- [ ] **Step 6: Seed datasets and write failing loader tests**

`packages/data/datasets/airports.json` — all 25 launch airports:

```json
[
  { "name": "London Heathrow", "slug": "heathrow", "iata": "LHR", "region": "London" },
  { "name": "London Gatwick", "slug": "gatwick", "iata": "LGW", "region": "London" },
  { "name": "Manchester", "slug": "manchester", "iata": "MAN", "region": "North West" },
  { "name": "London Stansted", "slug": "stansted", "iata": "STN", "region": "London" },
  { "name": "London Luton", "slug": "luton", "iata": "LTN", "region": "London" },
  { "name": "Edinburgh", "slug": "edinburgh", "iata": "EDI", "region": "Scotland" },
  { "name": "Birmingham", "slug": "birmingham", "iata": "BHX", "region": "West Midlands" },
  { "name": "Glasgow", "slug": "glasgow", "iata": "GLA", "region": "Scotland" },
  { "name": "Bristol", "slug": "bristol", "iata": "BRS", "region": "South West" },
  { "name": "Belfast International", "slug": "belfast-international", "iata": "BFS", "region": "Northern Ireland" },
  { "name": "Newcastle", "slug": "newcastle", "iata": "NCL", "region": "North East" },
  { "name": "Liverpool John Lennon", "slug": "liverpool", "iata": "LPL", "region": "North West" },
  { "name": "London City", "slug": "london-city", "iata": "LCY", "region": "London" },
  { "name": "Leeds Bradford", "slug": "leeds-bradford", "iata": "LBA", "region": "Yorkshire" },
  { "name": "East Midlands", "slug": "east-midlands", "iata": "EMA", "region": "East Midlands" },
  { "name": "Aberdeen", "slug": "aberdeen", "iata": "ABZ", "region": "Scotland" },
  { "name": "Belfast City", "slug": "belfast-city", "iata": "BHD", "region": "Northern Ireland" },
  { "name": "Southampton", "slug": "southampton", "iata": "SOU", "region": "South East" },
  { "name": "Cardiff", "slug": "cardiff", "iata": "CWL", "region": "Wales" },
  { "name": "Exeter", "slug": "exeter", "iata": "EXT", "region": "South West" },
  { "name": "London Southend", "slug": "southend", "iata": "SEN", "region": "East of England" },
  { "name": "Bournemouth", "slug": "bournemouth", "iata": "BOH", "region": "South West" },
  { "name": "Norwich", "slug": "norwich", "iata": "NWI", "region": "East of England" },
  { "name": "Inverness", "slug": "inverness", "iata": "INV", "region": "Scotland" },
  { "name": "Teesside International", "slug": "teesside", "iata": "MME", "region": "North East" }
]
```

`packages/data/datasets/parkmath/drop-off-fees.json` — seed with ONE record (Gatwick, values from the operating guide; Task 9 re-verifies it against the official page along with all others):

```json
{
  "version": "0.1.0",
  "lastUpdated": "2026-06-10",
  "records": [
    {
      "airportSlug": "gatwick",
      "isFree": false,
      "feeSummary": "£10 for up to 20 minutes",
      "bands": [{ "upToMinutes": 20, "totalPence": 1000 }],
      "maxStayMinutes": 20,
      "penaltyPence": 10000,
      "penaltyNotes": "Reduced if paid within 14 days",
      "paymentDeadline": "23:59 the day after drop-off",
      "blueBadgePolicy": "Blue Badge holders should check Gatwick's published exemption process before travelling",
      "freeAlternative": { "name": "Long Stay car park", "minutesFree": 30, "details": "Park free for a short stay and take the shuttle to the terminal" },
      "priorYearFeePence": 700,
      "sourceUrl": "https://www.gatwickairport.com/",
      "verifiedAt": "2026-06-10"
    }
  ]
}
```

`packages/data/tests/loaders.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { loadAirports, loadDropOffDataset } from "../src/index";

describe("loaders", () => {
  it("loads and validates all airports", () => {
    const airports = loadAirports();
    expect(airports.length).toBe(25);
  });
  it("loads and validates the drop-off dataset", () => {
    const dataset = loadDropOffDataset();
    expect(dataset.records.length).toBeGreaterThanOrEqual(1);
  });
  it("every drop-off record references a known airport", () => {
    const slugs = new Set(loadAirports().map((a) => a.slug));
    for (const record of loadDropOffDataset().records) {
      expect(slugs.has(record.airportSlug), `unknown airport: ${record.airportSlug}`).toBe(true);
    }
  });
});
```

- [ ] **Step 7: Run loader tests to verify they fail**

Run: `pnpm --filter @mathfamily/data test`
Expected: FAIL — cannot resolve `../src/index`.

- [ ] **Step 8: Implement loaders**

`packages/data/src/index.ts`:

```ts
import airportsJson from "../datasets/airports.json";
import dropOffJson from "../datasets/parkmath/drop-off-fees.json";
import { AirportsFileSchema, DropOffDatasetSchema, type Airport, type DropOffDataset } from "./schemas";

export * from "./schemas";

export function loadAirports(): Airport[] {
  return AirportsFileSchema.parse(airportsJson);
}

export function loadDropOffDataset(): DropOffDataset {
  return DropOffDatasetSchema.parse(dropOffJson);
}
```

- [ ] **Step 9: Run all data tests to verify they pass**

Run: `pnpm --filter @mathfamily/data test`
Expected: PASS (10 tests).

- [ ] **Step 10: Commit**

```bash
git add -A && git commit -m "feat(data): Zod schemas, typed loaders, 25-airport seed"
```

---

### Task 3: `@mathfamily/data` — freshness gate

**Files:**
- Create: `packages/data/src/freshness.ts`
- Modify: `packages/data/src/index.ts` (add export)
- Test: `packages/data/tests/freshness.test.ts`

- [ ] **Step 1: Write failing tests**

`packages/data/tests/freshness.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { freshnessReport, FRESHNESS_FAIL_DAYS, FRESHNESS_WARN_DAYS } from "../src/freshness";
import { loadDropOffDataset } from "../src/index";

const NOW = new Date("2026-06-10T12:00:00Z");

describe("freshnessReport", () => {
  it("passes fresh records", () => {
    const report = freshnessReport([{ label: "gatwick", verifiedAt: "2026-06-01" }], NOW);
    expect(report.warnings).toEqual([]);
    expect(report.errors).toEqual([]);
  });
  it("warns past the warning threshold", () => {
    const report = freshnessReport([{ label: "gatwick", verifiedAt: "2026-03-01" }], NOW);
    expect(report.warnings.length).toBe(1);
    expect(report.errors).toEqual([]);
  });
  it("errors past the failure threshold", () => {
    const report = freshnessReport([{ label: "gatwick", verifiedAt: "2026-01-01" }], NOW);
    expect(report.errors.length).toBe(1);
  });
  it("thresholds match the spec", () => {
    expect(FRESHNESS_WARN_DAYS).toBe(60);
    expect(FRESHNESS_FAIL_DAYS).toBe(120);
  });
});

describe("live dataset freshness gate (CI)", () => {
  it("no record in the real dataset is older than the failure threshold", () => {
    const dataset = loadDropOffDataset();
    const report = freshnessReport(
      dataset.records.map((r) => ({ label: r.airportSlug, verifiedAt: r.verifiedAt })),
      new Date()
    );
    for (const warning of report.warnings) console.warn(`[freshness] ${warning}`);
    expect(report.errors).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @mathfamily/data test`
Expected: FAIL — cannot resolve `../src/freshness`.

- [ ] **Step 3: Implement**

`packages/data/src/freshness.ts`:

```ts
export const FRESHNESS_WARN_DAYS = 60;
export const FRESHNESS_FAIL_DAYS = 120;

export interface FreshnessReport {
  warnings: string[];
  errors: string[];
}

export function freshnessReport(
  items: { label: string; verifiedAt: string }[],
  now: Date = new Date()
): FreshnessReport {
  const report: FreshnessReport = { warnings: [], errors: [] };
  for (const item of items) {
    const verified = new Date(`${item.verifiedAt}T00:00:00Z`).getTime();
    const ageDays = Math.floor((now.getTime() - verified) / 86_400_000);
    if (ageDays > FRESHNESS_FAIL_DAYS) {
      report.errors.push(`${item.label}: ${ageDays} days since verification (limit ${FRESHNESS_FAIL_DAYS})`);
    } else if (ageDays > FRESHNESS_WARN_DAYS) {
      report.warnings.push(`${item.label}: ${ageDays} days since verification`);
    }
  }
  return report;
}
```

Append to `packages/data/src/index.ts`:

```ts
export * from "./freshness";
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm --filter @mathfamily/data test`
Expected: PASS (15 tests).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(data): freshness gate — warn 60d, fail 120d"
```

---

### Task 4: `@mathfamily/engine` — money formatting

**Files:**
- Create: `packages/engine/package.json`, `packages/engine/tsconfig.json`, `packages/engine/vitest.config.ts`
- Create: `packages/engine/src/money.ts`, `packages/engine/src/index.ts`
- Test: `packages/engine/tests/money.test.ts`

- [ ] **Step 1: Package boilerplate**

`packages/engine/package.json`:

```json
{
  "name": "@mathfamily/engine",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": { "test": "vitest run", "typecheck": "tsc --noEmit" },
  "devDependencies": {
    "@mathfamily/config": "workspace:*",
    "typescript": "^5.8.0",
    "vitest": "^3.2.0"
  }
}
```

`packages/engine/tsconfig.json`:

```json
{ "extends": "@mathfamily/config/tsconfig.base.json", "include": ["src", "tests"] }
```

`packages/engine/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { include: ["tests/**/*.test.ts"] } });
```

- [ ] **Step 2: Write failing tests**

`packages/engine/tests/money.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatPence } from "../src/money";

describe("formatPence", () => {
  it("formats whole pounds without decimals", () => {
    expect(formatPence(1000)).toBe("£10");
  });
  it("formats pence with two decimals", () => {
    expect(formatPence(750)).toBe("£7.50");
  });
  it("formats zero as £0", () => {
    expect(formatPence(0)).toBe("£0");
  });
  it("adds thousands separators", () => {
    expect(formatPence(2800000)).toBe("£28,000");
  });
  it("throws on non-integer input (programmer error, not user input)", () => {
    expect(() => formatPence(10.5)).toThrow();
  });
  it("throws on negative input", () => {
    expect(() => formatPence(-100)).toThrow();
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `pnpm --filter @mathfamily/engine test`
Expected: FAIL — cannot resolve `../src/money`.

- [ ] **Step 4: Implement**

`packages/engine/src/money.ts`:

```ts
export function formatPence(pence: number): string {
  if (!Number.isInteger(pence) || pence < 0) {
    throw new Error(`formatPence expects a non-negative integer of pence, got ${pence}`);
  }
  const pounds = Math.floor(pence / 100);
  const rem = pence % 100;
  const poundsStr = pounds.toLocaleString("en-GB");
  return rem === 0 ? `£${poundsStr}` : `£${poundsStr}.${String(rem).padStart(2, "0")}`;
}
```

`packages/engine/src/index.ts`:

```ts
export * from "./money";
```

- [ ] **Step 5: Run to verify pass**

Run: `pnpm install && pnpm --filter @mathfamily/engine test`
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(engine): formatPence — integer pence, GB locale"
```

---

### Task 5: `@mathfamily/engine` — drop-off quote engine

**Files:**
- Create: `packages/engine/src/drop-off.ts`
- Modify: `packages/engine/src/index.ts` (add export)
- Test: `packages/engine/tests/drop-off.test.ts`

- [ ] **Step 1: Write failing tests (table-driven)**

`packages/engine/tests/drop-off.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { quoteDropOff, type DropOffTariff } from "../src/drop-off";

const NOW = new Date("2026-06-10T12:00:00Z");

const gatwickLike: DropOffTariff = {
  isFree: false,
  bands: [{ upToMinutes: 20, totalPence: 1000 }],
  maxStayMinutes: 20,
  penaltyPence: 10000,
  freeAlternative: { name: "Long Stay car park", minutesFree: 30 },
  verifiedAt: "2026-06-01"
};

const stanstedLike: DropOffTariff = {
  isFree: false,
  bands: [
    { upToMinutes: 15, totalPence: 1000 },
    { upToMinutes: 60, totalPence: 2800 }
  ],
  maxStayMinutes: 60,
  penaltyPence: null,
  freeAlternative: null,
  verifiedAt: "2026-06-01"
};

const freeAirport: DropOffTariff = {
  isFree: true,
  bands: [],
  maxStayMinutes: null,
  penaltyPence: null,
  freeAlternative: null,
  verifiedAt: "2026-06-01"
};

describe("quoteDropOff", () => {
  it("quotes the first matching band", () => {
    const q = quoteDropOff(gatwickLike, 10, NOW);
    expect(q.costPence).toBe(1000);
    expect(q.beyondTariff).toBe(false);
  });
  it("picks the correct band in a multi-band tariff", () => {
    expect(quoteDropOff(stanstedLike, 30, NOW).costPence).toBe(2800);
  });
  it("a band boundary stay is included in that band", () => {
    expect(quoteDropOff(stanstedLike, 15, NOW).costPence).toBe(1000);
  });
  it("free airports quote zero", () => {
    expect(quoteDropOff(freeAirport, 45, NOW).costPence).toBe(0);
  });
  it("beyond all bands with a known penalty: null cost + PENALTY_RISK warning", () => {
    const q = quoteDropOff(gatwickLike, 25, NOW);
    expect(q.costPence).toBeNull();
    expect(q.beyondTariff).toBe(true);
    expect(q.warnings.map((w) => w.code)).toContain("PENALTY_RISK");
  });
  it("beyond all bands with unknown penalty: BEYOND_TARIFF_UNKNOWN warning", () => {
    const q = quoteDropOff(stanstedLike, 90, NOW);
    expect(q.costPence).toBeNull();
    expect(q.warnings.map((w) => w.code)).toContain("BEYOND_TARIFF_UNKNOWN");
  });
  it("surfaces the free alternative as a warning", () => {
    const q = quoteDropOff(gatwickLike, 10, NOW);
    const warning = q.warnings.find((w) => w.code === "FREE_ALTERNATIVE_EXISTS");
    expect(warning?.message).toContain("Long Stay car park");
  });
  it("flags stale data (verified more than 60 days ago)", () => {
    const stale = { ...gatwickLike, verifiedAt: "2026-01-01" };
    expect(quoteDropOff(stale, 10, NOW).warnings.map((w) => w.code)).toContain("DATA_UNVERIFIED_RECENTLY");
  });
  it("never throws on out-of-range user input — clamps instead", () => {
    expect(quoteDropOff(gatwickLike, -5, NOW).costPence).toBe(1000);
    expect(quoteDropOff(gatwickLike, 0.4, NOW).costPence).toBe(1000);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @mathfamily/engine test`
Expected: FAIL — cannot resolve `../src/drop-off`.

- [ ] **Step 3: Implement**

`packages/engine/src/drop-off.ts`:

```ts
import { formatPence } from "./money";

export interface DropOffBand {
  upToMinutes: number;
  totalPence: number;
}

export interface DropOffTariff {
  isFree: boolean;
  bands: DropOffBand[]; // ascending by upToMinutes
  maxStayMinutes: number | null;
  penaltyPence: number | null;
  freeAlternative: { name: string; minutesFree: number } | null;
  verifiedAt: string; // YYYY-MM-DD
}

export type DropOffWarningCode =
  | "PENALTY_RISK"
  | "FREE_ALTERNATIVE_EXISTS"
  | "DATA_UNVERIFIED_RECENTLY"
  | "BEYOND_TARIFF_UNKNOWN";

export interface DropOffWarning {
  code: DropOffWarningCode;
  message: string;
}

export interface DropOffQuote {
  costPence: number | null; // null when the published tariff doesn't cover the stay
  beyondTariff: boolean;
  warnings: DropOffWarning[];
}

export const STALE_AFTER_DAYS = 60;

export function quoteDropOff(tariff: DropOffTariff, stayMinutes: number, now: Date = new Date()): DropOffQuote {
  const warnings: DropOffWarning[] = [];
  // Engines never throw on user input: clamp to a sane positive integer.
  const minutes = Math.max(1, Math.round(Number.isFinite(stayMinutes) ? stayMinutes : 1));

  const verified = new Date(`${tariff.verifiedAt}T00:00:00Z`).getTime();
  const ageDays = Math.floor((now.getTime() - verified) / 86_400_000);
  if (ageDays > STALE_AFTER_DAYS) {
    warnings.push({
      code: "DATA_UNVERIFIED_RECENTLY",
      message: `Last verified ${tariff.verifiedAt} — check the official page before you travel.`
    });
  }
  if (tariff.freeAlternative) {
    warnings.push({
      code: "FREE_ALTERNATIVE_EXISTS",
      message: `${tariff.freeAlternative.name} is free for ${tariff.freeAlternative.minutesFree} minutes.`
    });
  }

  if (tariff.isFree) return { costPence: 0, beyondTariff: false, warnings };

  const band = tariff.bands.find((b) => minutes <= b.upToMinutes);
  if (band) return { costPence: band.totalPence, beyondTariff: false, warnings };

  const lastBand = tariff.bands[tariff.bands.length - 1];
  if (tariff.penaltyPence !== null && lastBand) {
    warnings.push({
      code: "PENALTY_RISK",
      message: `Stays beyond ${lastBand.upToMinutes} minutes risk a ${formatPence(tariff.penaltyPence)} charge notice.`
    });
  } else {
    warnings.push({
      code: "BEYOND_TARIFF_UNKNOWN",
      message: "The published tariff doesn't cover stays this long — check the official page."
    });
  }
  return { costPence: null, beyondTariff: true, warnings };
}
```

Update `packages/engine/src/index.ts`:

```ts
export * from "./money";
export * from "./drop-off";
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm --filter @mathfamily/engine test`
Expected: PASS (15 tests).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(engine): drop-off quote engine with typed warnings"
```

---

### Task 6: `@mathfamily/geo` — JSON-LD builders

**Files:**
- Create: `packages/geo/package.json`, `packages/geo/tsconfig.json`, `packages/geo/vitest.config.ts`
- Create: `packages/geo/src/builders.ts`, `packages/geo/src/jsonld.tsx`, `packages/geo/src/index.ts`
- Test: `packages/geo/tests/builders.test.ts`

- [ ] **Step 1: Package boilerplate**

`packages/geo/package.json`:

```json
{
  "name": "@mathfamily/geo",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": { "test": "vitest run", "typecheck": "tsc --noEmit" },
  "peerDependencies": { "react": "*" },
  "devDependencies": {
    "@mathfamily/config": "workspace:*",
    "@types/react": "^19.0.0",
    "react": "^19.0.0",
    "typescript": "^5.8.0",
    "vitest": "^3.2.0"
  }
}
```

`packages/geo/tsconfig.json`:

```json
{ "extends": "@mathfamily/config/tsconfig.base.json", "include": ["src", "tests"] }
```

`packages/geo/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { include: ["tests/**/*.test.ts"] } });
```

- [ ] **Step 2: Write failing tests**

`packages/geo/tests/builders.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { breadcrumbLd, datasetLd, faqPageLd, webSiteLd } from "../src/builders";

describe("faqPageLd", () => {
  it("builds a FAQPage with one Question per item", () => {
    const ld = faqPageLd([{ question: "Q1?", answer: "A1" }, { question: "Q2?", answer: "A2" }]);
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity).toHaveLength(2);
    expect(ld.mainEntity[0]).toMatchObject({ "@type": "Question", name: "Q1?" });
  });
});

describe("datasetLd", () => {
  it("builds a Dataset with dateModified", () => {
    const ld = datasetLd({
      name: "UK airport drop-off fees",
      description: "Current drop-off charges at 25 UK airports",
      url: "https://example.com/drop-off-charges",
      dateModified: "2026-06-10",
      creatorName: "ParkMath"
    });
    expect(ld["@type"]).toBe("Dataset");
    expect(ld.dateModified).toBe("2026-06-10");
    expect(ld.isAccessibleForFree).toBe(true);
  });
});

describe("breadcrumbLd", () => {
  it("numbers positions from 1", () => {
    const ld = breadcrumbLd([
      { name: "Home", url: "https://example.com" },
      { name: "Drop-off", url: "https://example.com/drop-off-charges" }
    ]);
    expect(ld.itemListElement[1]).toMatchObject({ position: 2, name: "Drop-off" });
  });
});

describe("webSiteLd", () => {
  it("builds a WebSite", () => {
    expect(webSiteLd({ name: "ParkMath", url: "https://example.com" })["@type"]).toBe("WebSite");
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `pnpm install && pnpm --filter @mathfamily/geo test`
Expected: FAIL — cannot resolve `../src/builders`.

- [ ] **Step 4: Implement**

`packages/geo/src/builders.ts`:

```ts
export function faqPageLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage" as const,
    mainEntity: items.map((i) => ({
      "@type": "Question" as const,
      name: i.question,
      acceptedAnswer: { "@type": "Answer" as const, text: i.answer }
    }))
  };
}

export function datasetLd(input: {
  name: string;
  description: string;
  url: string;
  dateModified: string;
  creatorName: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset" as const,
    name: input.name,
    description: input.description,
    url: input.url,
    dateModified: input.dateModified,
    isAccessibleForFree: true,
    creator: { "@type": "Organization" as const, name: input.creatorName }
  };
}

export function breadcrumbLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList" as const,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem" as const,
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

export function webSiteLd(input: { name: string; url: string }) {
  return { "@context": "https://schema.org", "@type": "WebSite" as const, name: input.name, url: input.url };
}
```

`packages/geo/src/jsonld.tsx`:

```tsx
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
```

`packages/geo/src/index.ts`:

```ts
export * from "./builders";
export * from "./jsonld";
```

- [ ] **Step 5: Run to verify pass**

Run: `pnpm --filter @mathfamily/geo test`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(geo): JSON-LD builders — FAQPage, Dataset, Breadcrumb, WebSite"
```

---

### Task 7: `@mathfamily/ui` — design tokens and components

**Files:**
- Create: `packages/ui/package.json`, `packages/ui/tsconfig.json`, `packages/ui/vitest.config.ts`
- Create: `packages/ui/src/tokens.css`, `packages/ui/src/index.ts`
- Create: `packages/ui/src/fee-stat.tsx`, `packages/ui/src/freshness-badge.tsx`, `packages/ui/src/source-citation.tsx`, `packages/ui/src/callout.tsx`, `packages/ui/src/fee-grid.tsx`, `packages/ui/src/faq-accordion.tsx`, `packages/ui/src/email-capture-slot.tsx`, `packages/ui/src/site-header.tsx`, `packages/ui/src/site-footer.tsx`
- Test: `packages/ui/tests/components.test.tsx`

Design DNA (from spec §1/§3.3): fintech clarity + data trust. Tokens below are the v1 ParkMath set; a Stitch design-system pass may refine values later — values live in ONE file, so refinement is a token swap.

- [ ] **Step 1: Package boilerplate**

`packages/ui/package.json`:

```json
{
  "name": "@mathfamily/ui",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./tokens.css": "./src/tokens.css"
  },
  "scripts": { "test": "vitest run", "typecheck": "tsc --noEmit" },
  "peerDependencies": { "react": "*" },
  "devDependencies": {
    "@mathfamily/config": "workspace:*",
    "@testing-library/react": "^16.3.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "jsdom": "^26.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "^5.8.0",
    "vitest": "^3.2.0"
  }
}
```

`packages/ui/tsconfig.json`:

```json
{ "extends": "@mathfamily/config/tsconfig.base.json", "include": ["src", "tests"] }
```

`packages/ui/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { include: ["tests/**/*.test.tsx"], environment: "jsdom" } });
```

- [ ] **Step 2: Design tokens**

`packages/ui/src/tokens.css` (Tailwind v4 `@theme` — utilities like `bg-brand`, `text-positive`, `rounded-card` derive from these):

```css
@theme {
  --color-brand: #0a2540;
  --color-brand-accent: #2563eb;
  --color-positive: #16a34a;
  --color-warning: #b45309;
  --color-surface: #f8fafc;
  --color-ink: #0f172a;
  --color-ink-muted: #475569;
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --radius-card: 1rem;
}
```

- [ ] **Step 3: Write failing component tests**

`packages/ui/tests/components.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmailCaptureSlot } from "../src/email-capture-slot";
import { FeeStat } from "../src/fee-stat";
import { FreshnessBadge } from "../src/freshness-badge";

describe("FeeStat", () => {
  it("renders label, value and note", () => {
    render(<FeeStat label="Drop-off charge" value="£10" note="for up to 20 minutes" />);
    expect(screen.getByText("£10")).toBeDefined();
    expect(screen.getByText("for up to 20 minutes")).toBeDefined();
  });
});

describe("FreshnessBadge", () => {
  it("shows Verified for fresh data", () => {
    render(<FreshnessBadge verifiedAt="2026-06-01" now={new Date("2026-06-10T12:00:00Z")} />);
    expect(screen.getByText(/^Verified 1 Jun 2026$/)).toBeDefined();
  });
  it("shows Last verified for stale data", () => {
    render(<FreshnessBadge verifiedAt="2026-01-01" now={new Date("2026-06-10T12:00:00Z")} />);
    expect(screen.getByText(/^Last verified 1 Jan 2026$/)).toBeDefined();
  });
});

describe("EmailCaptureSlot", () => {
  it("renders nothing when no formAction is configured (slot pattern)", () => {
    const { container } = render(<EmailCaptureSlot hook="Get notified when fees change" />);
    expect(container.innerHTML).toBe("");
  });
  it("renders a form when configured", () => {
    render(<EmailCaptureSlot formAction="https://assets.mailerlite.com/forms/x" hook="Get notified when fees change" />);
    expect(screen.getByRole("textbox")).toBeDefined();
  });
});
```

- [ ] **Step 4: Run to verify failure**

Run: `pnpm install && pnpm --filter @mathfamily/ui test`
Expected: FAIL — cannot resolve `../src/...` modules.

- [ ] **Step 5: Implement components**

`packages/ui/src/fee-stat.tsx`:

```tsx
export function FeeStat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-card bg-brand p-6 text-white">
      <p className="text-sm font-medium uppercase tracking-wide text-white/70">{label}</p>
      <p className="mt-1 text-5xl font-bold tabular-nums">{value}</p>
      {note ? <p className="mt-2 text-sm text-white/80">{note}</p> : null}
    </div>
  );
}
```

`packages/ui/src/freshness-badge.tsx`:

```tsx
export function FreshnessBadge({
  verifiedAt,
  staleAfterDays = 60,
  now = new Date()
}: {
  verifiedAt: string;
  staleAfterDays?: number;
  now?: Date;
}) {
  const date = new Date(`${verifiedAt}T00:00:00Z`);
  const ageDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  const stale = ageDays > staleAfterDays;
  const formatted = date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return (
    <span
      className={
        stale
          ? "inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-warning"
          : "inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-positive"
      }
    >
      {stale ? `Last verified ${formatted}` : `Verified ${formatted}`}
    </span>
  );
}
```

`packages/ui/src/source-citation.tsx`:

```tsx
export function SourceCitation({ url, label = "Official source" }: { url: string; label?: string }) {
  return (
    <a href={url} rel="noopener noreferrer" target="_blank" className="text-sm text-ink-muted underline decoration-dotted underline-offset-4 hover:text-brand-accent">
      {label} ↗
    </a>
  );
}
```

`packages/ui/src/callout.tsx`:

```tsx
import type { ReactNode } from "react";

const styles = {
  free: "border-positive/30 bg-green-50",
  warning: "border-warning/30 bg-amber-50",
  info: "border-brand-accent/30 bg-blue-50"
} as const;

export function Callout({ variant, title, children }: { variant: keyof typeof styles; title: string; children: ReactNode }) {
  return (
    <div className={`rounded-card border p-4 ${styles[variant]}`}>
      <p className="font-semibold text-ink">{title}</p>
      <div className="mt-1 text-sm text-ink-muted">{children}</div>
    </div>
  );
}
```

`packages/ui/src/fee-grid.tsx`:

```tsx
import type { ReactNode } from "react";

export function FeeGrid({ columns, rows, caption }: { columns: string[]; rows: ReactNode[][]; caption?: string }) {
  return (
    <div className="overflow-x-auto rounded-card border border-ink/10">
      <table className="w-full text-left text-sm">
        {caption ? <caption className="p-3 text-left text-xs text-ink-muted">{caption}</caption> : null}
        <thead className="bg-surface text-xs uppercase tracking-wide text-ink-muted">
          <tr>
            {columns.map((c) => (
              <th key={c} scope="col" className="px-4 py-3 font-semibold">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/5">
          {rows.map((cells, i) => (
            <tr key={i} className="hover:bg-surface">
              {cells.map((cell, j) => (
                <td key={j} className="px-4 py-3 tabular-nums">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

`packages/ui/src/faq-accordion.tsx` (native `<details>` — works without JavaScript):

```tsx
export function FaqAccordion({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <div className="divide-y divide-ink/10 rounded-card border border-ink/10">
      {items.map((item) => (
        <details key={item.question} className="group p-4">
          <summary className="cursor-pointer font-medium text-ink marker:content-none">{item.question}</summary>
          <p className="mt-2 text-sm text-ink-muted">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
```

`packages/ui/src/email-capture-slot.tsx` (slot pattern — renders nothing until MailerLite exists):

```tsx
export function EmailCaptureSlot({ formAction, hook }: { formAction?: string; hook: string }) {
  if (!formAction) return null;
  return (
    <form action={formAction} method="post" className="rounded-card bg-surface p-6">
      <p className="font-semibold text-ink">{hook}</p>
      <div className="mt-3 flex gap-2">
        <input
          type="email"
          name="fields[email]"
          required
          placeholder="you@example.com"
          aria-label="Email address"
          className="w-full rounded-lg border border-ink/20 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white">
          Notify me
        </button>
      </div>
      <p className="mt-2 text-xs text-ink-muted">No spam. Unsubscribe any time.</p>
    </form>
  );
}
```

`packages/ui/src/site-header.tsx`:

```tsx
export function SiteHeader({ brandName, links }: { brandName: string; links: { label: string; href: string }[] }) {
  return (
    <header className="border-b border-ink/10 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <a href="/" className="text-lg font-bold text-brand">{brandName}</a>
        <nav className="flex gap-4 text-sm font-medium text-ink-muted">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-brand-accent">{l.label}</a>
          ))}
        </nav>
      </div>
    </header>
  );
}
```

`packages/ui/src/site-footer.tsx`:

```tsx
export function SiteFooter({ brandName, links }: { brandName: string; links: { label: string; href: string }[] }) {
  return (
    <footer className="mt-16 border-t border-ink/10 bg-surface">
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 text-sm text-ink-muted">
        <nav className="flex gap-4">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-brand-accent">{l.label}</a>
          ))}
        </nav>
        <p>
          Prices change — always verify against the official airport page before you travel. {brandName} links to
          official sources on every page. Not financial advice.
        </p>
        <p>Part of the Math family of UK cost calculators.</p>
      </div>
    </footer>
  );
}
```

`packages/ui/src/index.ts`:

```ts
export * from "./fee-stat";
export * from "./freshness-badge";
export * from "./source-citation";
export * from "./callout";
export * from "./fee-grid";
export * from "./faq-accordion";
export * from "./email-capture-slot";
export * from "./site-header";
export * from "./site-footer";
```

- [ ] **Step 6: Run to verify pass**

Run: `pnpm --filter @mathfamily/ui test`
Expected: PASS (5 tests).

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(ui): design tokens + 9 shared components (fintech-clarity DNA)"
```

---

### Task 8: ParkMath Next.js app scaffold

**Files:**
- Create: `apps/parkmath/package.json`, `apps/parkmath/tsconfig.json`, `apps/parkmath/next.config.ts`, `apps/parkmath/next-env.d.ts` (generated), `apps/parkmath/postcss.config.mjs`
- Create: `apps/parkmath/app/layout.tsx`, `apps/parkmath/app/globals.css`, `apps/parkmath/app/page.tsx` (placeholder, replaced in Task 12)

- [ ] **Step 1: App boilerplate**

`apps/parkmath/package.json`:

```json
{
  "name": "parkmath",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@mathfamily/data": "workspace:*",
    "@mathfamily/engine": "workspace:*",
    "@mathfamily/geo": "workspace:*",
    "@mathfamily/ui": "workspace:*",
    "@vercel/analytics": "^1.5.0",
    "next": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {
    "@mathfamily/config": "workspace:*",
    "@tailwindcss/postcss": "^4.1.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^4.1.0",
    "typescript": "^5.8.0",
    "vitest": "^3.2.0"
  }
}
```

`apps/parkmath/tsconfig.json`:

```json
{
  "extends": "@mathfamily/config/tsconfig.base.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "allowJs": true,
    "incremental": true,
    "module": "esnext",
    "isolatedModules": true,
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`apps/parkmath/next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@mathfamily/ui", "@mathfamily/engine", "@mathfamily/data", "@mathfamily/geo"]
};

export default nextConfig;
```

`apps/parkmath/postcss.config.mjs`:

```js
export default { plugins: { "@tailwindcss/postcss": {} } };
```

- [ ] **Step 2: Global styles and layout**

`apps/parkmath/app/globals.css` (the `@source` path is relative to this CSS file — three levels up to the repo root; the `@theme` block maps Tailwind's `font-sans` onto the CSS variable `next/font` generates, since the real family name is hashed, not literally "Inter"):

```css
@import "tailwindcss";
@import "@mathfamily/ui/tokens.css";
@source "../../../packages/ui/src";

@theme {
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
}
```

`apps/parkmath/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SiteFooter, SiteHeader } from "@mathfamily/ui";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

// Not exported: Next.js layouts only allow framework-known exports.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "ParkMath — UK airport drop-off & parking costs, verified", template: "%s | ParkMath" },
  description:
    "Current UK airport drop-off charges, parking costs and the free alternatives — every figure verified against official airport pages and date-stamped."
};

const NAV = [
  { label: "Drop-off charges", href: "/drop-off-charges" },
  { label: "Privacy", href: "/privacy" }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={inter.variable}>
      <body className="bg-white font-sans text-ink antialiased">
        <SiteHeader brandName="ParkMath" links={NAV} />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <SiteFooter brandName="ParkMath" links={NAV} />
        <Analytics />
      </body>
    </html>
  );
}
```

`apps/parkmath/app/page.tsx` (placeholder — fully replaced in Task 12):

```tsx
export default function HomePage() {
  return <h1 className="text-3xl font-bold text-brand">ParkMath</h1>;
}
```

- [ ] **Step 3: Install and verify the app builds**

Run: `pnpm install && pnpm --filter parkmath build`
Expected: build succeeds; route `/` listed as static (`○`).

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(parkmath): Next.js app scaffold with shared layout + tokens"
```

---

### Task 9: Compile the drop-off dataset (research — part 1: top 10 airports)

**Files:**
- Modify: `packages/data/datasets/parkmath/drop-off-fees.json`
- Create: `docs/verification/2026-06-drop-off-research-notes.md`

**Research rules (non-negotiable, from spec §2.3/§3.4):**
1. `sourceUrl` must be the airport's **own official page** (e.g. heathrow.com, gatwickairport.com). Never a news article, never MSE/RAC, never an aggregator. RAC/news may help you *find* the official page, only the official page is citable.
2. Record values exactly as published. If a value is not published, use `null` and explain in `penaltyNotes` or the research-notes file. **Never invent or infer a fee.**
3. `verifiedAt` = the date you actually read the official page (today's date when executing).
4. The Gatwick seed record from Task 2 must be re-verified and corrected like any other airport.
5. If an airport's drop-off information genuinely cannot be confirmed from official pages, remove that airport from `airports.json` and note why in the research-notes file (it has no other P1 use).

- [ ] **Step 1: Research the top 10 airports**

For each of: heathrow, gatwick, manchester, stansted, luton, edinburgh, birmingham, glasgow, bristol, belfast-international —
use WebSearch (e.g. `Gatwick airport official drop-off charge site:gatwickairport.com`) and WebFetch on the official page. Capture per airport: fee bands (minutes → total pence), max stay, penalty + reduced-payment terms, payment deadline, Blue Badge policy, free alternative (name, free minutes, details), prior-year fee if the official page or its January announcement states it (else `null`).

- [ ] **Step 2: Record each airport in the dataset**

Append one record per airport to `records` in `packages/data/datasets/parkmath/drop-off-fees.json`, following the exact shape of the Gatwick record from Task 2 Step 6. Bump `version` to `0.2.0` and set `lastUpdated` to today.

- [ ] **Step 3: Write research notes**

`docs/verification/2026-06-drop-off-research-notes.md` — one line per airport: slug, official URL used, anything ambiguous, anything left `null` and why. This file is Mike's spot-check map.

- [ ] **Step 4: Validate**

Run: `pnpm --filter @mathfamily/data test`
Expected: PASS — all records validate, freshness gate clean.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "data(parkmath): drop-off fees for top 10 UK airports (official sources)"
```

---

### Task 10: Compile the drop-off dataset (research — part 2: remaining 15) + completeness gate

**Files:**
- Modify: `packages/data/datasets/parkmath/drop-off-fees.json`, `docs/verification/2026-06-drop-off-research-notes.md`
- Test: `packages/data/tests/coverage.test.ts`

- [ ] **Step 1: Research the remaining 15 airports**

Same rules and fields as Task 9, for: newcastle, liverpool, london-city, leeds-bradford, east-midlands, aberdeen, belfast-city, southampton, cardiff, exeter, southend, bournemouth, norwich, inverness, teesside. Several smaller airports may be free at the forecourt — record `isFree: true`, `bands: []`, with the official page as source. Bump `version` to `1.0.0`.

- [ ] **Step 2: Write the failing coverage test**

`packages/data/tests/coverage.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { loadAirports, loadDropOffDataset } from "../src/index";

describe("drop-off dataset coverage", () => {
  it("every airport has exactly one drop-off record", () => {
    const recordSlugs = loadDropOffDataset().records.map((r) => r.airportSlug);
    const airportSlugs = loadAirports().map((a) => a.slug).sort();
    expect([...recordSlugs].sort()).toEqual(airportSlugs);
    expect(new Set(recordSlugs).size).toBe(recordSlugs.length);
  });
});
```

- [ ] **Step 3: Run until green**

Run: `pnpm --filter @mathfamily/data test`
Expected: PASS once all 25 airports (or the documented reduced set, per research rule 5) are recorded.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "data(parkmath): complete 25-airport drop-off dataset + coverage gate"
```

---

### Task 11: Drop-off airport pages + calculator island

**Files:**
- Create: `apps/parkmath/lib/content.ts`, `apps/parkmath/vitest.config.ts`
- Create: `apps/parkmath/components/drop-off-calculator.tsx`
- Create: `apps/parkmath/app/drop-off-charges/[airport]/page.tsx`
- Test: `apps/parkmath/tests/content.test.ts`

- [ ] **Step 1: Write failing tests for the content helpers**

`apps/parkmath/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { include: ["tests/**/*.test.ts"] } });
```

`apps/parkmath/tests/content.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { DropOffRecord } from "@mathfamily/data";
import { buildDropOffFaqs, trendNote } from "../lib/content";

const record: DropOffRecord = {
  airportSlug: "gatwick",
  isFree: false,
  feeSummary: "£10 for up to 20 minutes",
  bands: [{ upToMinutes: 20, totalPence: 1000 }],
  maxStayMinutes: 20,
  penaltyPence: 10000,
  penaltyNotes: "Reduced to £50 if paid within 14 days",
  paymentDeadline: "23:59 the day after drop-off",
  blueBadgePolicy: "Exempt if registered in advance",
  freeAlternative: { name: "Long Stay car park", minutesFree: 30, details: "Shuttle to terminal" },
  priorYearFeePence: 700,
  sourceUrl: "https://www.gatwickairport.com/drop-off",
  verifiedAt: "2026-06-10"
};

describe("buildDropOffFaqs", () => {
  it("always includes the how-much question", () => {
    const faqs = buildDropOffFaqs(record, "London Gatwick");
    expect(faqs[0]?.question).toBe("How much is the drop-off charge at London Gatwick?");
    expect(faqs[0]?.answer).toContain("£10");
  });
  it("includes pay-after, blue badge and avoid questions when data exists", () => {
    const questions = buildDropOffFaqs(record, "London Gatwick").map((f) => f.question);
    expect(questions).toHaveLength(4);
    expect(questions.some((q) => q.includes("after"))).toBe(true);
    expect(questions.some((q) => q.includes("Blue Badge"))).toBe(true);
    expect(questions.some((q) => q.includes("avoid"))).toBe(true);
  });
  it("omits optional questions when data is null", () => {
    const sparse = { ...record, paymentDeadline: null, freeAlternative: null };
    expect(buildDropOffFaqs(sparse, "X")).toHaveLength(2);
  });
});

describe("trendNote", () => {
  it("describes a rise vs prior year", () => {
    expect(trendNote(record)).toBe("Up £3 vs 2025 (£7 → £10)");
  });
  it("returns null without prior-year data", () => {
    expect(trendNote({ ...record, priorYearFeePence: null })).toBeNull();
  });
  it("returns null for free airports", () => {
    expect(trendNote({ ...record, isFree: true, bands: [] })).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter parkmath test`
Expected: FAIL — cannot resolve `../lib/content`.

- [ ] **Step 3: Implement content helpers**

`apps/parkmath/lib/content.ts`:

```ts
import { formatPence } from "@mathfamily/engine";
import type { DropOffRecord } from "@mathfamily/data";

export function buildDropOffFaqs(record: DropOffRecord, airportName: string): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [
    { question: `How much is the drop-off charge at ${airportName}?`, answer: record.feeSummary }
  ];
  if (record.paymentDeadline) {
    faqs.push({
      question: `Can I pay the ${airportName} drop-off charge after I leave?`,
      answer: `Yes — pay by ${record.paymentDeadline}. ${record.penaltyNotes ?? ""}`.trim()
    });
  }
  faqs.push({
    question: `Are Blue Badge holders exempt from the ${airportName} drop-off fee?`,
    answer: record.blueBadgePolicy
  });
  if (record.freeAlternative) {
    faqs.push({
      question: `How do I avoid the ${airportName} drop-off fee?`,
      answer: `Use the ${record.freeAlternative.name} — free for ${record.freeAlternative.minutesFree} minutes. ${record.freeAlternative.details}`
    });
  }
  return faqs;
}

export function trendNote(record: DropOffRecord): string | null {
  const current = record.bands[0]?.totalPence;
  if (record.isFree || current === undefined || record.priorYearFeePence === null) return null;
  const diff = current - record.priorYearFeePence;
  if (diff === 0) return `Unchanged vs 2025 (${formatPence(current)})`;
  const direction = diff > 0 ? "Up" : "Down";
  return `${direction} ${formatPence(Math.abs(diff))} vs 2025 (${formatPence(record.priorYearFeePence)} → ${formatPence(current)})`;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm --filter parkmath test`
Expected: PASS (6 tests).

- [ ] **Step 5: Build the calculator island**

`apps/parkmath/components/drop-off-calculator.tsx`:

```tsx
"use client";

import { useState } from "react";
import { formatPence, quoteDropOff, type DropOffTariff } from "@mathfamily/engine";

export function DropOffCalculator({ tariff, airportName }: { tariff: DropOffTariff; airportName: string }) {
  const [minutes, setMinutes] = useState(10);
  const quote = quoteDropOff(tariff, minutes);
  const cost = quote.costPence === null ? "Beyond published tariff" : formatPence(quote.costPence);

  return (
    <section aria-label={`${airportName} drop-off cost calculator`} className="rounded-card border border-ink/10 p-6">
      <h2 className="text-lg font-semibold text-ink">How long will you stop?</h2>
      <div className="mt-4 flex items-center gap-4">
        <input
          type="range"
          min={1}
          max={90}
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
          aria-label="Minutes at the drop-off zone"
          className="w-full accent-brand-accent"
        />
        <span className="w-24 shrink-0 text-right text-sm font-medium text-ink-muted">{minutes} min</span>
      </div>
      <p data-testid="calculator-result" className="mt-4 text-3xl font-bold tabular-nums text-brand">
        {cost}
      </p>
      <ul className="mt-3 space-y-1 text-sm text-ink-muted">
        {quote.warnings.map((w) => (
          <li key={w.code}>{w.message}</li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 6: Build the airport page**

`apps/parkmath/app/drop-off-charges/[airport]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadAirports, loadDropOffDataset, type Airport, type DropOffRecord } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, faqPageLd, JsonLd } from "@mathfamily/geo";
import { Callout, FaqAccordion, FeeStat, FreshnessBadge, SourceCitation, EmailCaptureSlot } from "@mathfamily/ui";
import { DropOffCalculator } from "@/components/drop-off-calculator";
import { buildDropOffFaqs, trendNote } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return loadDropOffDataset().records.map((r) => ({ airport: r.airportSlug }));
}

function getData(slug: string): { airport: Airport; record: DropOffRecord } | null {
  const airport = loadAirports().find((a) => a.slug === slug);
  const record = loadDropOffDataset().records.find((r) => r.airportSlug === slug);
  return airport && record ? { airport, record } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ airport: string }> }): Promise<Metadata> {
  const { airport } = await params;
  const data = getData(airport);
  if (!data) return {};
  return {
    title: `${data.airport.name} drop-off charge 2026 — fee, time limit & the free alternative`,
    description: `${data.airport.name} drop-off: ${data.record.feeSummary}. Penalty, payment deadline, Blue Badge rules and how to avoid the fee — verified ${data.record.verifiedAt}.`
  };
}

export default async function DropOffPage({ params }: { params: Promise<{ airport: string }> }) {
  const { airport: slug } = await params;
  const data = getData(slug);
  if (!data) notFound();
  const { airport, record } = data;
  const faqs = buildDropOffFaqs(record, airport.name);
  const trend = trendNote(record);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <article className="space-y-8">
      <JsonLd data={faqPageLd(faqs)} />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Drop-off charges", url: `${siteUrl}/drop-off-charges` },
          { name: airport.name, url: `${siteUrl}/drop-off-charges/${airport.slug}` }
        ])}
      />

      <header className="space-y-3">
        <h1 className="text-3xl font-bold text-ink">{airport.name} drop-off charge</h1>
        <div className="flex flex-wrap items-center gap-3">
          <FreshnessBadge verifiedAt={record.verifiedAt} />
          <SourceCitation url={record.sourceUrl} label={`Official ${airport.name} page`} />
        </div>
      </header>

      <FeeStat
        label="Current drop-off charge"
        value={record.isFree ? "Free" : formatPence(record.bands[0]?.totalPence ?? 0)}
        note={record.isFree ? "No forecourt charge" : record.feeSummary}
      />

      {trend ? <p className="text-sm font-medium text-warning">{trend}</p> : null}

      {record.freeAlternative ? (
        <Callout variant="free" title={`The free alternative: ${record.freeAlternative.name}`}>
          Free for {record.freeAlternative.minutesFree} minutes. {record.freeAlternative.details}
        </Callout>
      ) : null}

      <DropOffCalculator tariff={record} airportName={airport.name} />

      {!record.isFree ? (
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-ink">If you don&apos;t pay</h2>
          <p className="text-sm text-ink-muted">
            {record.penaltyPence !== null ? `Penalty: ${formatPence(record.penaltyPence)}. ` : ""}
            {record.penaltyNotes ?? ""} {record.paymentDeadline ? `Payment deadline: ${record.paymentDeadline}.` : ""}
          </p>
        </section>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-ink">Frequently asked questions</h2>
        <FaqAccordion items={faqs} />
      </section>

      <EmailCaptureSlot
        formAction={process.env.NEXT_PUBLIC_MAILERLITE_FORM_ACTION}
        hook={`Get notified when ${airport.name} changes its fees`}
      />

      <p>
        <a href="/drop-off-charges" className="text-sm font-medium text-brand-accent underline underline-offset-4">
          Compare drop-off charges at all UK airports →
        </a>
      </p>
    </article>
  );
}
```

- [ ] **Step 7: Build and verify static generation**

Run: `pnpm --filter parkmath build`
Expected: build succeeds; `/drop-off-charges/[airport]` listed as SSG (`●`) with one path per dataset record.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat(parkmath): drop-off airport pages + calculator island"
```

---

### Task 12: Master table page + home page

**Files:**
- Create: `apps/parkmath/app/drop-off-charges/page.tsx`
- Create: `apps/parkmath/components/airport-search.tsx`
- Modify: `apps/parkmath/app/page.tsx` (replace placeholder)

- [ ] **Step 1: Master table page**

`apps/parkmath/app/drop-off-charges/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { loadAirports, loadDropOffDataset } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { datasetLd, JsonLd } from "@mathfamily/geo";
import { FeeGrid, FreshnessBadge } from "@mathfamily/ui";

export const metadata: Metadata = {
  title: "UK airport drop-off charges 2026 — every airport compared",
  description:
    "Current drop-off (kiss and fly) charges at every major UK airport: fee, time limit, penalty and the free alternative. Verified against official airport pages."
};

export default function MasterTablePage() {
  const airports = new Map(loadAirports().map((a) => [a.slug, a]));
  const dataset = loadDropOffDataset();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const records = [...dataset.records].sort(
    (a, b) => (b.bands[0]?.totalPence ?? 0) - (a.bands[0]?.totalPence ?? 0)
  );
  const latestVerified = records.map((r) => r.verifiedAt).sort().at(-1) ?? dataset.lastUpdated;

  return (
    <article className="space-y-6">
      <JsonLd
        data={datasetLd({
          name: "UK airport drop-off charges",
          description: `Drop-off fees, time limits, penalties and free alternatives at ${records.length} UK airports, verified against official airport pages.`,
          url: `${siteUrl}/drop-off-charges`,
          dateModified: latestVerified,
          creatorName: "ParkMath"
        })}
      />
      <header className="space-y-3">
        <h1 className="text-3xl font-bold text-ink">UK airport drop-off charges, compared</h1>
        <FreshnessBadge verifiedAt={latestVerified} />
      </header>
      <FeeGrid
        caption={`Sorted by fee, highest first. Data verified per airport — click through for details, sources and the free alternative.`}
        columns={["Airport", "Fee", "Time limit", "Penalty", "Free alternative", "Verified"]}
        rows={records.map((r) => {
          const airport = airports.get(r.airportSlug);
          return [
            <Link key="a" href={`/drop-off-charges/${r.airportSlug}`} className="font-medium text-brand-accent underline-offset-4 hover:underline">
              {airport?.name ?? r.airportSlug}
            </Link>,
            r.isFree ? "Free" : formatPence(r.bands[0]?.totalPence ?? 0),
            r.isFree ? "—" : `${r.bands[0]?.upToMinutes ?? "—"} min`,
            r.penaltyPence !== null ? formatPence(r.penaltyPence) : "—",
            r.freeAlternative ? `${r.freeAlternative.name} (${r.freeAlternative.minutesFree} min)` : "—",
            r.verifiedAt
          ];
        })}
      />
    </article>
  );
}
```

- [ ] **Step 2: Airport search island**

`apps/parkmath/components/airport-search.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { Airport } from "@mathfamily/data";

export function AirportSearch({ airports }: { airports: Airport[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const matches = q
    ? airports.filter((a) => a.name.toLowerCase().includes(q) || a.iata.toLowerCase() === q)
    : airports;

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search your airport — e.g. Gatwick or LGW"
        aria-label="Search airports"
        className="w-full rounded-lg border border-ink/20 px-4 py-3 text-base"
      />
      <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {matches.map((a) => (
          <li key={a.slug}>
            <a
              href={`/drop-off-charges/${a.slug}`}
              className="block rounded-lg border border-ink/10 px-3 py-2 text-sm font-medium text-ink hover:border-brand-accent hover:text-brand-accent"
            >
              {a.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Home page**

Replace `apps/parkmath/app/page.tsx` entirely:

```tsx
import Link from "next/link";
import { loadAirports, loadDropOffDataset } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { webSiteLd, JsonLd } from "@mathfamily/geo";
import { EmailCaptureSlot, FeeStat } from "@mathfamily/ui";
import { AirportSearch } from "@/components/airport-search";

export default function HomePage() {
  const airports = loadAirports();
  const records = loadDropOffDataset().records;
  const charging = records.filter((r) => !r.isFree);
  const maxFee = Math.max(...charging.map((r) => r.bands[0]?.totalPence ?? 0));
  const freeCount = records.length - charging.length;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <div className="space-y-10">
      <JsonLd data={webSiteLd({ name: "ParkMath", url: siteUrl })} />
      <section className="space-y-4">
        <h1 className="text-4xl font-bold text-ink">
          What does it cost to <span className="text-brand-accent">drop someone off</span> at a UK airport?
        </h1>
        <p className="max-w-2xl text-lg text-ink-muted">
          Every UK airport&apos;s drop-off charge, time limit, penalty and the free alternative — verified against
          official airport pages and date-stamped.
        </p>
        <AirportSearch airports={airports} />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <FeeStat label="Most expensive drop-off" value={formatPence(maxFee)} note="Highest current UK forecourt fee" />
        <FeeStat label="Airports charging a fee" value={String(charging.length)} note={`of ${records.length} tracked`} />
        <FeeStat label="Still free" value={String(freeCount)} note="Free at the forecourt" />
      </section>

      <p>
        <Link href="/drop-off-charges" className="text-base font-semibold text-brand-accent underline underline-offset-4">
          Compare all airports in one table →
        </Link>
      </p>

      <EmailCaptureSlot
        formAction={process.env.NEXT_PUBLIC_MAILERLITE_FORM_ACTION}
        hook="Get notified when any UK airport changes its drop-off fees"
      />
    </div>
  );
}
```

- [ ] **Step 4: Build and verify**

Run: `pnpm --filter parkmath build`
Expected: build succeeds; `/` and `/drop-off-charges` static.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(parkmath): master comparison table + home with airport search"
```

---

### Task 13: SEO/GEO plumbing — sitemap, robots, llms.txt, privacy page

**Files:**
- Create: `apps/parkmath/app/sitemap.ts`, `apps/parkmath/app/robots.ts`, `apps/parkmath/app/llms.txt/route.ts`, `apps/parkmath/app/privacy/page.tsx`

- [ ] **Step 1: Sitemap**

`apps/parkmath/app/sitemap.ts`:

```ts
import type { MetadataRoute } from "next";
import { loadDropOffDataset } from "@mathfamily/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const records = loadDropOffDataset().records;
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/drop-off-charges`, changeFrequency: "weekly", priority: 0.9 },
    ...records.map((r) => ({
      url: `${base}/drop-off-charges/${r.airportSlug}`,
      lastModified: new Date(`${r.verifiedAt}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.8
    }))
  ];
}
```

- [ ] **Step 2: Robots**

`apps/parkmath/app/robots.ts`:

```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${base}/sitemap.xml` };
}
```

(Staging stays unindexed because Vercel *preview* deployments send `X-Robots-Tag: noindex` automatically — see Task 15. Production deploys only happen once the real domain is attached, in P2.)

- [ ] **Step 3: llms.txt**

`apps/parkmath/app/llms.txt/route.ts`:

```ts
import { loadDropOffDataset } from "@mathfamily/data";

export const dynamic = "force-static";

export function GET() {
  const dataset = loadDropOffDataset();
  const body = `# ParkMath

UK airport drop-off, parking and lounge cost tracker. Every figure is read from the
airport's official page, carries a source URL and a verified date, and is updated via
reviewed changes only.

## Datasets

- UK airport drop-off charges (${dataset.records.length} airports, version ${dataset.version},
  updated ${dataset.lastUpdated}): /drop-off-charges

## Page patterns

- /drop-off-charges — master comparison table (schema.org Dataset)
- /drop-off-charges/[airport] — per-airport fee, time limit, penalty, Blue Badge policy,
  free alternative, FAQ (schema.org FAQPage)

Cite the per-airport page for airport-specific answers; cite /drop-off-charges for
comparisons. Each page displays its verification date.
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
```

- [ ] **Step 4: Privacy page**

`apps/parkmath/app/privacy/page.tsx`:

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <article className="prose max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold text-ink">Privacy</h1>
      <p className="text-ink-muted">
        ParkMath does not set advertising cookies and does not require an account. We use privacy-friendly,
        aggregate analytics to understand which pages help people. If you join our email list we store your email
        address with our email provider solely to send the updates you asked for; unsubscribe links are in every
        email.
      </p>
      <p className="text-ink-muted">
        Some pages may contain affiliate links in future, always labelled as such. Prices and fees shown are
        verified against official airport pages on the date shown next to each figure, but always confirm with the
        airport before you travel. Nothing on this site is financial advice.
      </p>
      <p className="text-ink-muted">Contact: privacy contact details will be published when the operating company is registered.</p>
    </article>
  );
}
```

- [ ] **Step 5: Build and verify**

Run: `pnpm --filter parkmath build`
Expected: build succeeds; `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/privacy` all listed as static.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(parkmath): sitemap, robots, llms.txt, privacy page"
```

---

### Task 14: Playwright end-to-end tests

**Files:**
- Create: `apps/parkmath/playwright.config.ts`, `apps/parkmath/e2e/drop-off.spec.ts`
- Modify: `apps/parkmath/package.json` (add devDep + script)

- [ ] **Step 1: Install Playwright**

Add to `apps/parkmath/package.json` devDependencies: `"@playwright/test": "^1.53.0"` and script `"e2e": "playwright test"`.

Run: `pnpm install && pnpm --filter parkmath exec playwright install chromium`
Expected: Chromium downloads successfully.

- [ ] **Step 2: Config**

`apps/parkmath/playwright.config.ts`:

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://localhost:3100" },
  webServer: {
    command: "pnpm build && pnpm start --port 3100",
    url: "http://localhost:3100",
    timeout: 180_000,
    reuseExistingServer: !process.env.CI
  }
});
```

- [ ] **Step 3: Write the E2E spec**

`apps/parkmath/e2e/drop-off.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("airport page shows the fee, source and freshness without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/drop-off-charges/gatwick");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Gatwick");
  await expect(page.getByText(/Verified|Last verified/)).toBeVisible();
  await expect(page.getByRole("link", { name: /Official/ })).toBeVisible();
  await context.close();
});

test("calculator island updates the quote", async ({ page }) => {
  await page.goto("/drop-off-charges/gatwick");
  const result = page.getByTestId("calculator-result");
  await expect(result).not.toBeEmpty();
  const before = await result.textContent();
  await page.getByRole("slider").fill("85");
  await expect(result).not.toHaveText(before ?? "");
});

test("master table lists every airport and links through", async ({ page }) => {
  await page.goto("/drop-off-charges");
  await expect(page.getByRole("table")).toBeVisible();
  await page.getByRole("link", { name: "London Heathrow" }).click();
  await expect(page).toHaveURL(/\/drop-off-charges\/heathrow$/);
});

test("home search filters airports", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("searchbox").fill("LGW");
  await expect(page.getByRole("link", { name: "London Gatwick" })).toBeVisible();
  await expect(page.getByRole("link", { name: "London Heathrow" })).toHaveCount(0);
});
```

- [ ] **Step 4: Run E2E**

Run: `pnpm --filter parkmath e2e`
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "test(parkmath): Playwright E2E — no-JS rendering, calculator, table, search"
```

---

### Task 15: Full verification + Vercel staging deploy

**Files:** none new (deploy configuration only)

- [ ] **Step 1: Run the full gate**

Run: `pnpm test && pnpm typecheck && pnpm build`
Expected: every package's tests pass, typecheck clean, all builds succeed.

- [ ] **Step 2: Deploy to Vercel staging (preview)**

Use the **deploy-to-vercel** skill (or **vercel-cli-with-tokens** if a token needs configuring), targeting `apps/parkmath` as the project root directory, project name `parkmath`. Deploy as a **preview** (NOT `--prod`): preview deployments get `X-Robots-Tag: noindex` automatically, which is exactly what staging needs before the real domain exists. Set the env var `NEXT_PUBLIC_SITE_URL` to the assigned preview URL afterwards and redeploy once so sitemap/JSON-LD URLs are correct.

Expected: a live preview URL serving `/`, `/drop-off-charges`, and all airport pages.

- [ ] **Step 3: Smoke-check the deployment**

Visit (curl or browser): the preview URL `/drop-off-charges/gatwick` — fee renders, freshness badge present; `/llms.txt` returns text; `/sitemap.xml` lists all airport pages; response headers on any page include `x-robots-tag: noindex` (preview).

- [ ] **Step 4: Hand over the spot-check list**

Send Mike `docs/verification/2026-06-drop-off-research-notes.md` plus the preview URL, asking him to spot-check **5 airports** (suggested: Gatwick, Heathrow, Manchester, Stansted, Luton — the highest-traffic pages) against official pages, per spec §5. **P1 is not "launch-ready" until this human check passes** — it is the launch gate for attaching a real domain in P2.

- [ ] **Step 5: Final commit and tag**

```bash
git add -A && git commit -m "chore: P1 complete — foundation + drop-off wedge on staging" --allow-empty
git tag p1-staging
```

---

## Out of scope for P1 (per spec phasing)

Parking/lounge datasets and pages, parking + lounge calculators, OG image generation, partners.json affiliate slots, `/getting-to/`, RoamMath app, n8n automation, GitHub Actions CI (no remote repo yet — the freshness gate runs in the local test suite), Lighthouse CI budget (manual check only in P1; formal budget at P2 launch).
