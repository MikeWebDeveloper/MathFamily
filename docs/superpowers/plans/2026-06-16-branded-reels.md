# Branded Reel Factory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `tools/reels/` — a governed pipeline that turns verified ParkMath dataset numbers into on-brand 1080×1920 MP4 reels (Remotion) with local AI voice-over (VibeVoice via MLX), as review artifacts a human approves before posting.

**Architecture:** A new `tools/*` workspace package. Pure TS units read `@mathfamily/data` and emit a Zod-validated `ReelScript` JSON; a Python step synthesises voice-over locally via MLX; Remotion renders the script + audio to MP4; Canva MCP makes static covers. Nothing auto-publishes. Mirrors the existing `content-factory`/`freshness` tool + skill pattern.

**Tech Stack:** TypeScript (config-less vitest, per repo), Zod (via `@mathfamily/data`), `@mathfamily/engine` (`formatPence`), Remotion + `@remotion/tailwind-v4`, Python + `mlx-audio` (VibeVoice/Kokoro), Claude Code skill + `tools/freshness/run-agent.sh`.

**Spec:** `docs/superpowers/specs/2026-06-16-branded-reels-design.md`

> **Refinement of the spec:** the spec's `captions: CaptionCue[]` is implemented as `captions: string[]` (caption lines); timing is computed at render time by `buildTimeline()` from the real audio duration — there's no reliable per-word timing at script-generation time. Documented here so spec and code agree.

> **Critical environment constraint (read before Task 2 / Task 9):** esbuild's `build()` deadlocks on `/Volumes/TB4 Workstation` (see `docs/engineering-notes.md`). Remotion bundles with esbuild, so `remotion studio`/`render` may hang on this volume. The render is therefore designed to run from an internal-disk checkout or in CI. **Do not assume local render works until Task 2 proves it.**

---

## File structure

```
tools/reels/
  package.json                 # workspace pkg; deps + scripts
  tsconfig.json                # extends @mathfamily/config base
  .gitignore                   # out/ and review artifacts
  README.md                    # run + render-env notes
  remotion.config.ts           # Remotion config (Tailwind v4)
  render.mjs                    # bundle + render + mux → MP4 (Task 9)
  src/
    schema.ts                  # ReelScript Zod schema + types (Task 4)
    formats/
      shock-fee.ts             # drop-off "shock fee → the fix" (Task 5)
      how-to.ts                # parking gate-vs-prebook saving (Task 6)
      news.ts                  # "this week in airport costs" (Task 6)
    batch.ts                   # weekly rotation across the three formats (Task 6)
    timeline.ts                # buildTimeline(script, audioMs) (Task 8)
    cli.ts                     # `tsx src/cli.ts` → write review folder (Task 10)
    Root.tsx                   # Remotion compositions (Task 8)
    scenes/
      Reel.tsx                 # top-level scene sequencer (Task 8)
      theme.ts                 # brand token values per brand (Task 8)
  tts/
    synth.py                   # narration → voice.wav + timing.json (Task 7)
    README.md                  # pinned MLX/VibeVoice install (Task 3/7)
  tests/
    schema.test.ts
    shock-fee.test.ts
    how-to.test.ts
    news.test.ts
    timeline.test.ts
    scene.test.tsx
  out/                         # gitignored render output

.claude/skills/reel-factory/SKILL.md   # orchestration skill (Task 10)
tools/freshness/run-agent.sh           # add reel-factory mode (Task 10)
```

---

## Task 1: Scaffold the `tools/reels` workspace package

**Files:**
- Create: `tools/reels/package.json`
- Create: `tools/reels/tsconfig.json`
- Create: `tools/reels/.gitignore`
- Create: `tools/reels/README.md`

- [ ] **Step 1: Create `tools/reels/package.json`**

```json
{
  "name": "@mathfamily/reels",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "generate": "tsx src/cli.ts",
    "render": "node render.mjs",
    "studio": "remotion studio"
  },
  "dependencies": {
    "@mathfamily/data": "workspace:*",
    "@mathfamily/engine": "workspace:*",
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "remotion": "^4.0.0",
    "@remotion/bundler": "^4.0.0",
    "@remotion/renderer": "^4.0.0",
    "@remotion/cli": "^4.0.0",
    "@remotion/tailwind-v4": "^4.0.0"
  },
  "devDependencies": {
    "@mathfamily/config": "workspace:*",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^4.1.0",
    "tsx": "^4.19.0",
    "typescript": "^5.8.0",
    "vitest": "^3.2.0"
  }
}
```

- [ ] **Step 2: Create `tools/reels/tsconfig.json`** (matches `tools/freshness/tsconfig.json`)

```json
{ "extends": "@mathfamily/config/tsconfig.base.json", "include": ["src", "tests", "render.mjs", "remotion.config.ts"] }
```

- [ ] **Step 3: Create `tools/reels/.gitignore`**

```
out/
review/
*.wav
*.mp4
timing.json
```

- [ ] **Step 4: Create `tools/reels/README.md`**

````markdown
# tools/reels — branded reel factory

Verified dataset numbers → on-brand 1080×1920 MP4 reels (Remotion) with local
VibeVoice voice-over. Review artifacts only — **nothing auto-publishes**.

## Run
```bash
pnpm --filter @mathfamily/reels generate              # write ReelScripts to review/<date>/
pnpm --filter @mathfamily/reels test                  # unit tests (config-less vitest)
python tools/reels/tts/synth.py review/<date>/<slug>.json   # → voice.wav + timing.json
pnpm --filter @mathfamily/reels render -- <slug>      # → out/<date>/<slug>.mp4
```

## Render environment (IMPORTANT)
Remotion bundles with esbuild, which **deadlocks on `/Volumes/TB4 Workstation`**
(see `docs/engineering-notes.md`). Render from an internal-disk checkout or in CI.
`RENDER_DIR=/Users/<you>/reels-render pnpm ... render` overrides the bundle dir.
````

- [ ] **Step 5: Install and verify the workspace picks it up**

Run: `pnpm install`
Expected: completes; `pnpm --filter @mathfamily/reels exec node -e "console.log('ok')"` prints `ok`.

- [ ] **Step 6: Commit**

```bash
git add tools/reels/package.json tools/reels/tsconfig.json tools/reels/.gitignore tools/reels/README.md pnpm-lock.yaml
git commit -m "feat(reels): scaffold tools/reels workspace package"
```

---

## Task 2: SPIKE — prove a Remotion render works (or pin the workaround)

This is an **investigation**, not TDD. The TB4 esbuild deadlock is the top project risk; resolve it before building scenes.

**Files:**
- Create (temporary): `tools/reels/src/Root.tsx` (minimal placeholder composition)
- Modify: `tools/reels/README.md` (record the working render command)

- [ ] **Step 1: Add a one-second placeholder composition**

```tsx
// tools/reels/src/Root.tsx
import { Composition } from "remotion";

const Hello: React.FC = () => (
  <div style={{ flex: 1, background: "#0A2540", color: "white", fontSize: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
    ParkMath
  </div>
);

export const RemotionRoot: React.FC = () => (
  <Composition id="Hello" component={Hello} durationInFrames={30} fps={30} width={1080} height={1920} />
);
```

Also create `tools/reels/remotion.config.ts`:
```ts
import { Config } from "@remotion/cli/config";
Config.setVideoImageFormat("jpeg");
```

And register the root — create `tools/reels/src/index.ts`:
```ts
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";
registerRoot(RemotionRoot);
```

- [ ] **Step 2: Try the render on the TB4 volume first (establish the baseline)**

Run: `pnpm --filter @mathfamily/reels exec remotion render src/index.ts Hello out/hello.mp4`
Observe: does it produce `out/hello.mp4`, or hang (no output > 60s)?

- [ ] **Step 3: If it hangs, render from internal disk**

Run:
```bash
mkdir -p /Users/$(whoami)/reels-render && cp -R tools/reels/src tools/reels/package.json tools/reels/tsconfig.json /Users/$(whoami)/reels-render/
cd /Users/$(whoami)/reels-render && pnpm install && pnpm exec remotion render src/index.ts Hello out/hello.mp4
```
Expected: `out/hello.mp4` exists (≈1s navy clip).

- [ ] **Step 4: Record the verdict in README**

Document which path worked (in-place vs internal-disk vs "CI only") and the exact command. This becomes the contract for Task 9's `render.mjs` (it must use the proven path, e.g. honour `RENDER_DIR`).

- [ ] **Step 5: Commit**

```bash
git add tools/reels/src/Root.tsx tools/reels/src/index.ts tools/reels/remotion.config.ts tools/reels/README.md
git commit -m "spike(reels): prove Remotion render path on this machine"
```

**Acceptance:** an `hello.mp4` exists via a documented, repeatable command. If no local path works, the verdict is "render in CI" and Task 9 targets CI — do not block the rest of the plan.

---

## Task 3: SPIKE — prove local VibeVoice (MLX) synthesis, with Kokoro fallback

Investigation. Resolve "does VibeVoice run on this Mac" before wiring Task 7.

**Files:**
- Create: `tools/reels/tts/README.md`

- [ ] **Step 1: Create a Python venv on internal disk (avoids TB4 quirks for model caches)**

Run:
```bash
python3 -m venv /Users/$(whoami)/reels-venv && source /Users/$(whoami)/reels-venv/bin/activate
pip install mlx-audio
```

- [ ] **Step 2: Smoke-test VibeVoice via mlx-audio**

Run a 10-second synthesis to `/tmp/vv.wav` using the mlx-audio CLI/API for a VibeVoice model (e.g. the Realtime-0.5B port). Observe quality + speed.

- [ ] **Step 3: If VibeVoice is unstable/too slow, smoke-test Kokoro via mlx-audio**

Synthesize the same line with a Kokoro British voice (e.g. `bf_*`). Confirm a usable wav.

- [ ] **Step 4: Pin and document in `tools/reels/tts/README.md`**

Record: the chosen default engine, the exact pip install + pinned `mlx-audio` version, the exact model id/revision, the British voice id, and the command that produced a wav. This is the reproducibility contract (spec: "pin the TTS model port + revision").

- [ ] **Step 5: Commit**

```bash
git add tools/reels/tts/README.md
git commit -m "spike(reels): pin local TTS (VibeVoice/Kokoro via MLX)"
```

**Acceptance:** a documented command produces an intelligible British-voiced wav locally, free, offline.

---

## Task 4: `ReelScript` schema + types

**Files:**
- Create: `tools/reels/src/schema.ts`
- Test: `tools/reels/tests/schema.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tools/reels/tests/schema.test.ts
import { describe, it, expect } from "vitest";
import { ReelScriptSchema, type ReelScript } from "../src/schema";

const valid: ReelScript = {
  version: "1",
  brand: "parkmath",
  format: "shock-fee",
  slug: "stansted",
  figures: [{ id: "fee", label: "Drop-off fee", pence: 700 }],
  scenes: [
    { kind: "intro", onScreenText: "Drop-off rip-off", figureIds: [], durationHintMs: 1500 },
    { kind: "stat", onScreenText: "£7", figureIds: ["fee"], durationHintMs: 2500 },
    { kind: "cta", onScreenText: "parkmath.co.uk", figureIds: [], durationHintMs: 1500 }
  ],
  narration: "It costs seven pounds just to drop someone off at Stansted. Full list at parkmath.co.uk.",
  captions: ["£7 to drop off at Stansted", "Full list at parkmath.co.uk"],
  cta: "Full list at parkmath.co.uk",
  sourceUrl: "https://www.stanstedairport.com/x",
  verifiedAt: "2026-06-14"
};

describe("ReelScriptSchema", () => {
  it("accepts a valid script", () => {
    expect(ReelScriptSchema.parse(valid)).toEqual(valid);
  });
  it("rejects an affiliate/awin URL anywhere in the spoken/visible copy", () => {
    const bad = { ...valid, narration: valid.narration + " https://www.awin1.com/cread.php?awinmid=3496" };
    expect(() => ReelScriptSchema.parse(bad)).toThrow(/affiliate/i);
  });
  it("requires the brand domain to appear in narration or cta", () => {
    const bad = { ...valid, narration: "It costs seven pounds.", cta: "See more" };
    expect(() => ReelScriptSchema.parse(bad)).toThrow(/parkmath\.co\.uk/);
  });
  it("rejects non-integer pence", () => {
    const bad = { ...valid, figures: [{ id: "fee", label: "Fee", pence: 7.5 }] };
    expect(() => ReelScriptSchema.parse(bad)).toThrow();
  });
  it("rejects a scene referencing an unknown figure id", () => {
    const bad = { ...valid, scenes: [...valid.scenes, { kind: "stat", onScreenText: "x", figureIds: ["nope"], durationHintMs: 1000 }] };
    expect(() => ReelScriptSchema.parse(bad)).toThrow(/figureIds/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @mathfamily/reels exec vitest run tests/schema.test.ts`
Expected: FAIL — cannot find `../src/schema`.

- [ ] **Step 3: Write the schema**

```ts
// tools/reels/src/schema.ts
import { z } from "zod";

export const BRANDS = ["parkmath", "roammath"] as const;
export const FORMATS = ["shock-fee", "how-to", "news"] as const;
export const SCENE_KINDS = ["intro", "stat", "alternative", "verified", "cta"] as const;

const BRAND_DOMAIN: Record<(typeof BRANDS)[number], string> = {
  parkmath: "parkmath.co.uk",
  roammath: "roammath.co.uk"
};

// Anything that would make a social asset an affiliate placement (spec CAN'T rule).
const AFFILIATE = /(awin1\.com|cread\.php|awclick\.php|awinmid=|[?&]ref=)/i;

const Slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "expected lowercase-kebab slug");
const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");
const HttpUrl = z.string().regex(/^https?:\/\/\S+$/, "expected absolute http(s) URL");

export const FigureSchema = z.strictObject({
  id: z.string().min(1),
  label: z.string().min(1),
  pence: z.number().int().nonnegative()
});
export type Figure = z.infer<typeof FigureSchema>;

export const SceneSchema = z.strictObject({
  kind: z.enum(SCENE_KINDS),
  onScreenText: z.string().min(1),
  figureIds: z.array(z.string().min(1)),
  durationHintMs: z.number().int().positive()
});
export type Scene = z.infer<typeof SceneSchema>;

export const ReelScriptSchema = z
  .strictObject({
    version: z.string().min(1),
    brand: z.enum(BRANDS),
    format: z.enum(FORMATS),
    slug: Slug,
    figures: z.array(FigureSchema).min(1),
    scenes: z.array(SceneSchema).min(2),
    narration: z.string().min(1),
    captions: z.array(z.string().min(1)).min(1),
    cta: z.string().min(1),
    sourceUrl: HttpUrl,
    verifiedAt: IsoDate
  })
  .superRefine((s, ctx) => {
    // Governance: no affiliate link in any spoken or visible copy.
    const copy = [s.narration, s.cta, ...s.captions, ...s.scenes.map((x) => x.onScreenText)].join("\n");
    if (AFFILIATE.test(copy)) {
      ctx.addIssue({ code: "custom", message: "affiliate/merchant link is not allowed in reel copy" });
    }
    // Governance: the brand domain must be present (narration or cta).
    const domain = BRAND_DOMAIN[s.brand];
    if (!`${s.narration}\n${s.cta}`.includes(domain)) {
      ctx.addIssue({ code: "custom", message: `brand domain ${domain} must appear in narration or cta` });
    }
    // Integrity: every scene figureId must reference a declared figure.
    const ids = new Set(s.figures.map((f) => f.id));
    for (const scene of s.scenes) {
      for (const fid of scene.figureIds) {
        if (!ids.has(fid)) ctx.addIssue({ code: "custom", path: ["scenes"], message: `figureIds references unknown figure '${fid}'` });
      }
    }
  });
export type ReelScript = z.infer<typeof ReelScriptSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @mathfamily/reels exec vitest run tests/schema.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add tools/reels/src/schema.ts tools/reels/tests/schema.test.ts
git commit -m "feat(reels): ReelScript schema with governance refinements"
```

---

## Task 5: `shock-fee` format builder (drop-off → the fix)

**Files:**
- Create: `tools/reels/src/formats/shock-fee.ts`
- Test: `tools/reels/tests/shock-fee.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tools/reels/tests/shock-fee.test.ts
import { describe, it, expect } from "vitest";
import { pickShockFeeRecord, buildShockFeeReel } from "../src/formats/shock-fee";
import { ReelScriptSchema } from "../src/schema";
import type { DropOffRecord, Airport } from "@mathfamily/data";

const airport: Airport = { name: "Stansted", slug: "stansted", iata: "STN", region: "East", lat: 51.88, lng: 0.24 };
const record: DropOffRecord = {
  airportSlug: "stansted", isFree: false, feeSummary: "£7 for 15 min",
  bands: [{ upToMinutes: 15, totalPence: 700 }],
  maxStayMinutes: 15, perMinuteAfterPence: null, maxChargePence: null,
  penaltyPence: null, penaltyNotes: null, paymentDeadline: null,
  blueBadgePolicy: "Same as standard",
  freeAlternative: { name: "Mid Stay car park", minutesFree: 60, details: "Free for 60 min" },
  priorYearFeePence: 600, sourceUrl: "https://www.stanstedairport.com/x", verifiedAt: "2026-06-14"
};
const cheaper: DropOffRecord = { ...record, airportSlug: "luton", bands: [{ upToMinutes: 10, totalPence: 500 }], feeSummary: "£5" };
const lutonAirport: Airport = { ...airport, name: "Luton", slug: "luton", iata: "LTN" };

describe("shock-fee builder", () => {
  it("picks the highest-fee eligible record (has a fee + a free alternative)", () => {
    const picked = pickShockFeeRecord([cheaper, record]);
    expect(picked.airportSlug).toBe("stansted");
  });
  it("builds a valid ReelScript that names the free alternative and the fee", () => {
    const script = buildShockFeeReel(record, airport);
    expect(() => ReelScriptSchema.parse(script)).not.toThrow();
    expect(script.format).toBe("shock-fee");
    expect(script.figures.find((f) => f.id === "fee")?.pence).toBe(700);
    expect(script.narration).toContain("£7");
    expect(script.narration).toContain("Mid Stay car park"); // free alternative named (hard rule)
    expect(script.narration).toContain("parkmath.co.uk");
  });
  it("ignores free airports and those without a free alternative", () => {
    const free: DropOffRecord = { ...record, airportSlug: "cardiff", isFree: true, bands: [] };
    const noAlt: DropOffRecord = { ...record, airportSlug: "leeds", freeAlternative: null };
    expect(() => pickShockFeeRecord([free, noAlt])).toThrow(/no eligible/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @mathfamily/reels exec vitest run tests/shock-fee.test.ts`
Expected: FAIL — cannot find `../src/formats/shock-fee`.

- [ ] **Step 3: Write the builder**

```ts
// tools/reels/src/formats/shock-fee.ts
import { formatPence } from "@mathfamily/engine";
import type { DropOffRecord, Airport } from "@mathfamily/data";
import type { ReelScript } from "../schema";

/** Eligible = charges a fee, has at least one band, and has a free alternative to point to. */
function isEligible(r: DropOffRecord): boolean {
  return !r.isFree && r.bands.length > 0 && r.freeAlternative !== null;
}

/** The biggest first-band fee makes the best "shock". Throws if nothing is eligible. */
export function pickShockFeeRecord(records: DropOffRecord[]): DropOffRecord {
  const eligible = records.filter(isEligible);
  if (eligible.length === 0) throw new Error("no eligible drop-off record for a shock-fee reel");
  return eligible.reduce((a, b) => (b.bands[0]!.totalPence > a.bands[0]!.totalPence ? b : a));
}

export function buildShockFeeReel(record: DropOffRecord, airport: Airport): ReelScript {
  const band = record.bands[0]!;
  const alt = record.freeAlternative!;
  const fee = formatPence(band.totalPence);
  const narration =
    `It costs ${fee} just to drop someone off at ${airport.name} — for ${band.upToMinutes} minutes. ` +
    `But ${alt.name} is free for ${alt.minutesFree} minutes. Full list and sources at parkmath.co.uk.`;
  return {
    version: "1",
    brand: "parkmath",
    format: "shock-fee",
    slug: airport.slug,
    figures: [
      { id: "fee", label: `${airport.name} drop-off`, pence: band.totalPence },
      { id: "freeMinutes", label: `${alt.name} free minutes`, pence: 0 }
    ],
    scenes: [
      { kind: "intro", onScreenText: `Dropping off at ${airport.name}?`, figureIds: [], durationHintMs: 1500 },
      { kind: "stat", onScreenText: `${fee} for ${band.upToMinutes} min`, figureIds: ["fee"], durationHintMs: 2500 },
      { kind: "alternative", onScreenText: `${alt.name}: free ${alt.minutesFree} min`, figureIds: ["freeMinutes"], durationHintMs: 2500 },
      { kind: "verified", onScreenText: `Verified ${record.verifiedAt}`, figureIds: [], durationHintMs: 1500 },
      { kind: "cta", onScreenText: "parkmath.co.uk", figureIds: [], durationHintMs: 1500 }
    ],
    narration,
    captions: [
      `${fee} to drop off at ${airport.name}`,
      `(${band.upToMinutes} minutes)`,
      `${alt.name}: free for ${alt.minutesFree} min`,
      "Full list at parkmath.co.uk"
    ],
    cta: "Full list and sources at parkmath.co.uk",
    sourceUrl: record.sourceUrl,
    verifiedAt: record.verifiedAt
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @mathfamily/reels exec vitest run tests/shock-fee.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add tools/reels/src/formats/shock-fee.ts tools/reels/tests/shock-fee.test.ts
git commit -m "feat(reels): shock-fee format builder (drop-off → free alternative)"
```

---

## Task 6: `how-to` (parking saving) + `news` builders + weekly rotation

**Files:**
- Create: `tools/reels/src/formats/how-to.ts`, `tools/reels/src/formats/news.ts`, `tools/reels/src/batch.ts`
- Test: `tools/reels/tests/how-to.test.ts`, `tools/reels/tests/news.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// tools/reels/tests/how-to.test.ts
import { describe, it, expect } from "vitest";
import { gatePrebookSaving, buildHowToReel } from "../src/formats/how-to";
import { ReelScriptSchema } from "../src/schema";
import type { ParkingRecord, Airport } from "@mathfamily/data";

const airport: Airport = { name: "Gatwick", slug: "gatwick", iata: "LGW", region: "South", lat: 51.15, lng: -0.18 };
const record: ParkingRecord = {
  airportSlug: "gatwick",
  products: [
    { productType: "gate", name: "Drive-up", prices: [{ days: 7, totalPence: 12000 }], snapshotDate: null, notes: null },
    { productType: "prebook", name: "Long Stay", prices: [{ days: 7, totalPence: 7000 }], snapshotDate: "2026-06-10", notes: null }
  ],
  sourceUrl: "https://www.gatwickairport.com/x", verifiedAt: "2026-06-14"
};

describe("how-to builder", () => {
  it("computes gate-vs-prebook saving for a duration", () => {
    expect(gatePrebookSaving(record, 7)).toEqual({ gatePence: 12000, prebookPence: 7000, savingPence: 5000 });
  });
  it("returns null when a duration has no gate or no prebook price", () => {
    expect(gatePrebookSaving(record, 3)).toBeNull();
  });
  it("builds a valid ReelScript led by the saving", () => {
    const script = buildHowToReel(record, airport, 7);
    expect(() => ReelScriptSchema.parse(script)).not.toThrow();
    expect(script.format).toBe("how-to");
    expect(script.figures.find((f) => f.id === "saving")?.pence).toBe(5000);
    expect(script.narration).toContain("£50"); // 5000p saving
    expect(script.narration).toContain("parkmath.co.uk");
  });
});
```

```ts
// tools/reels/tests/news.test.ts
import { describe, it, expect } from "vitest";
import { buildNewsReel } from "../src/formats/news";
import { ReelScriptSchema } from "../src/schema";
import type { NewsItem, Airport } from "@mathfamily/data";

const airport: Airport = { name: "Luton", slug: "luton", iata: "LTN", region: "East", lat: 51.87, lng: -0.36 };
const item: NewsItem = {
  id: "luton-dropoff-jun-2026", airportSlug: "luton", category: "fee-change",
  title: "Luton raises drop-off to £6", summary: "Up from £5.",
  body: null, change: { label: "Drop-off", from: "£5", to: "£6" },
  sourceUrl: "https://www.london-luton.co.uk/x", sourceLabel: "Luton Airport",
  publishedAt: "2026-06-12", verifiedAt: "2026-06-14", supersedes: null
};

describe("news builder", () => {
  it("builds a valid ReelScript from a news change", () => {
    const script = buildNewsReel(item, airport);
    expect(() => ReelScriptSchema.parse(script)).not.toThrow();
    expect(script.format).toBe("news");
    expect(script.narration).toContain("£6");
    expect(script.narration).toContain("parkmath.co.uk");
  });
  it("throws on a news item with no quantified change (nothing to show)", () => {
    expect(() => buildNewsReel({ ...item, change: null }, airport)).toThrow(/change/i);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @mathfamily/reels exec vitest run tests/how-to.test.ts tests/news.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write `how-to.ts`**

```ts
// tools/reels/src/formats/how-to.ts
import { formatPence } from "@mathfamily/engine";
import type { ParkingRecord, Airport } from "@mathfamily/data";
import type { ReelScript } from "../schema";

function priceFor(record: ParkingRecord, productType: "gate" | "prebook", days: number): number | null {
  const prices = record.products
    .filter((p) => p.productType === productType)
    .flatMap((p) => p.prices)
    .filter((pr) => pr.days === days)
    .map((pr) => pr.totalPence);
  return prices.length ? Math.min(...prices) : null;
}

export function gatePrebookSaving(record: ParkingRecord, days: number): { gatePence: number; prebookPence: number; savingPence: number } | null {
  const gatePence = priceFor(record, "gate", days);
  const prebookPence = priceFor(record, "prebook", days);
  if (gatePence === null || prebookPence === null || gatePence <= prebookPence) return null;
  return { gatePence, prebookPence, savingPence: gatePence - prebookPence };
}

export function buildHowToReel(record: ParkingRecord, airport: Airport, days: number): ReelScript {
  const s = gatePrebookSaving(record, days);
  if (!s) throw new Error(`no gate-vs-prebook saving for ${airport.slug} at ${days} days`);
  const saving = formatPence(s.savingPence);
  const narration =
    `Pre-book ${days}-day parking at ${airport.name} and save ${saving} versus turning up at the gate ` +
    `(${formatPence(s.prebookPence)} instead of ${formatPence(s.gatePence)}). Compare every option at parkmath.co.uk.`;
  return {
    version: "1",
    brand: "parkmath",
    format: "how-to",
    slug: airport.slug,
    figures: [
      { id: "saving", label: `${airport.name} ${days}-day saving`, pence: s.savingPence },
      { id: "gate", label: "At the gate", pence: s.gatePence },
      { id: "prebook", label: "Pre-booked", pence: s.prebookPence }
    ],
    scenes: [
      { kind: "intro", onScreenText: `Parking at ${airport.name}?`, figureIds: [], durationHintMs: 1500 },
      { kind: "stat", onScreenText: `Save ${saving}`, figureIds: ["saving"], durationHintMs: 2500 },
      { kind: "alternative", onScreenText: `${formatPence(s.prebookPence)} pre-book vs ${formatPence(s.gatePence)} gate`, figureIds: ["prebook", "gate"], durationHintMs: 2500 },
      { kind: "verified", onScreenText: `Verified ${record.verifiedAt}`, figureIds: [], durationHintMs: 1500 },
      { kind: "cta", onScreenText: "parkmath.co.uk", figureIds: [], durationHintMs: 1500 }
    ],
    narration,
    captions: [`Save ${saving} on ${days}-day parking at ${airport.name}`, `Pre-book ${formatPence(s.prebookPence)} vs gate ${formatPence(s.gatePence)}`, "Compare at parkmath.co.uk"],
    cta: "Compare every option at parkmath.co.uk",
    sourceUrl: record.sourceUrl,
    verifiedAt: record.verifiedAt
  };
}
```

- [ ] **Step 4: Write `news.ts`**

```ts
// tools/reels/src/formats/news.ts
import type { NewsItem, Airport } from "@mathfamily/data";
import type { ReelScript } from "../schema";

/** News reels need a quantified before→after change to put on screen. */
export function buildNewsReel(item: NewsItem, airport: Airport | null): ReelScript {
  if (!item.change) throw new Error(`news item ${item.id} has no quantified change to show`);
  const where = airport?.name ?? "a UK airport";
  const { label, from, to } = item.change;
  const narration =
    `${where}: ${label.toLowerCase()} just changed from ${from} to ${to}. ` +
    `We verified it against the official source. Track every UK airport at parkmath.co.uk.`;
  return {
    version: "1",
    brand: "parkmath",
    format: "news",
    slug: item.airportSlug ?? item.id,
    figures: [{ id: "change", label, pence: 0 }],
    scenes: [
      { kind: "intro", onScreenText: item.title, figureIds: [], durationHintMs: 1800 },
      { kind: "stat", onScreenText: `${from} → ${to}`, figureIds: ["change"], durationHintMs: 2500 },
      { kind: "verified", onScreenText: `Verified ${item.verifiedAt} · ${item.sourceLabel}`, figureIds: [], durationHintMs: 1800 },
      { kind: "cta", onScreenText: "parkmath.co.uk", figureIds: [], durationHintMs: 1500 }
    ],
    narration,
    captions: [item.title, `${label}: ${from} → ${to}`, `Source: ${item.sourceLabel}`, "Track it at parkmath.co.uk"],
    cta: "Track every UK airport at parkmath.co.uk",
    sourceUrl: item.sourceUrl,
    verifiedAt: item.verifiedAt
  };
}
```

- [ ] **Step 5: Write `batch.ts` (the weekly rotation)**

```ts
// tools/reels/src/batch.ts
import { loadAirports, loadDropOffDataset, loadParkingDataset, recentNews } from "@mathfamily/data";
import type { Airport } from "@mathfamily/data";
import type { ReelScript } from "./schema";
import { pickShockFeeRecord, buildShockFeeReel } from "./formats/shock-fee";
import { gatePrebookSaving, buildHowToReel } from "./formats/how-to";
import { buildNewsReel } from "./formats/news";

const bySlug = (airports: Airport[]) => new Map(airports.map((a) => [a.slug, a]));
const DURATIONS = [7, 14, 3];

/** Produce up to `count` reels rotating shock-fee → how-to → news, skipping any slot that
 *  has no verified data (never fabricate to fill a slot — content-factory hard rule). */
export function buildWeeklyBatch(count = 5): ReelScript[] {
  const airports = bySlug(loadAirports());
  const out: ReelScript[] = [];
  const usedSlugs = new Set<string>();

  // shock-fee: highest fee not already used
  try {
    const recs = loadDropOffDataset().records.filter((r) => !usedSlugs.has(r.airportSlug));
    const rec = pickShockFeeRecord(recs);
    const air = airports.get(rec.airportSlug);
    if (air) { out.push(buildShockFeeReel(rec, air)); usedSlugs.add(rec.airportSlug); }
  } catch { /* no eligible record — skip the slot, never fabricate */ }

  // how-to: first airport+duration with a real saving
  for (const rec of loadParkingDataset().records) {
    if (out.length >= count) break;
    if (usedSlugs.has(rec.airportSlug)) continue;
    const air = airports.get(rec.airportSlug);
    const days = DURATIONS.find((d) => gatePrebookSaving(rec, d) !== null);
    if (air && days) { out.push(buildHowToReel(rec, air, days)); usedSlugs.add(rec.airportSlug); }
  }

  // news: recent items with a quantified change
  for (const item of recentNews(10)) {
    if (out.length >= count) break;
    if (!item.change) continue;
    const air = item.airportSlug ? airports.get(item.airportSlug) ?? null : null;
    out.push(buildNewsReel(item, air));
  }

  return out.slice(0, count);
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm --filter @mathfamily/reels exec vitest run tests/how-to.test.ts tests/news.test.ts`
Expected: PASS (5 tests). Then run the whole suite: `pnpm --filter @mathfamily/reels test` → all green.

- [ ] **Step 7: Commit**

```bash
git add tools/reels/src/formats/how-to.ts tools/reels/src/formats/news.ts tools/reels/src/batch.ts tools/reels/tests/how-to.test.ts tools/reels/tests/news.test.ts
git commit -m "feat(reels): how-to + news builders and weekly rotation"
```

---

## Task 7: TTS wrapper — narration → `voice.wav` + `timing.json`

**Files:**
- Create: `tools/reels/tts/synth.py`
- Create: `tools/reels/src/tts.mjs` (Node wrapper that shells out to Python)
- Test: `tools/reels/tests/tts.test.ts` (tests the pure arg/parse logic only — not the model)

- [ ] **Step 1: Write `synth.py`** (reads a ReelScript JSON, writes wav + timing next to it)

```python
# tools/reels/tts/synth.py
# Usage: python synth.py <reelscript.json>  -> writes voice.wav + timing.json beside it.
# Engine via env REELS_TTS=vibevoice|kokoro|say (default vibevoice). See tts/README.md for pinned versions.
import json, os, sys, subprocess, wave, contextlib

def synth(engine: str, text: str, out_wav: str) -> None:
    if engine == "say":  # zero-dep macOS draft voice (timing only)
        aiff = out_wav.replace(".wav", ".aiff")
        subprocess.run(["say", "-o", aiff, text], check=True)
        subprocess.run(["afconvert", aiff, out_wav, "-d", "LEI16", "-f", "WAVE"], check=True)
        os.remove(aiff)
        return
    # vibevoice / kokoro via mlx-audio (exact model id/voice are pinned in tts/README.md)
    from mlx_audio.tts.generate import generate_audio  # type: ignore
    model = os.environ.get("REELS_TTS_MODEL", "")  # set per tts/README.md
    voice = os.environ.get("REELS_TTS_VOICE", "")
    generate_audio(text=text, model_path=model, voice=voice, file_path=out_wav)

def wav_duration_ms(path: str) -> int:
    with contextlib.closing(wave.open(path, "r")) as w:
        return round(w.getnframes() / float(w.getframerate()) * 1000)

def main() -> int:
    script_path = sys.argv[1]
    with open(script_path) as f:
        script = json.load(f)
    out_dir = os.path.dirname(os.path.abspath(script_path))
    out_wav = os.path.join(out_dir, "voice.wav")
    engine = os.environ.get("REELS_TTS", "vibevoice")
    synth(engine, script["narration"], out_wav)
    timing = {"engine": engine, "audioDurationMs": wav_duration_ms(out_wav)}
    with open(os.path.join(out_dir, "timing.json"), "w") as f:
        json.dump(timing, f)
    print(f"voice.wav ({timing['audioDurationMs']}ms) + timing.json written to {out_dir}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 2: Write the Node wrapper `src/tts.mjs`** (builds the command; used by the CLI/render)

```js
// tools/reels/src/tts.mjs
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
export const SYNTH_PY = join(here, "..", "tts", "synth.py");

/** Build the argv for synthesising a ReelScript's audio. Pure — unit-tested. */
export function synthCommand(scriptJsonPath, python = process.env.REELS_PYTHON || "python3") {
  return [python, [SYNTH_PY, scriptJsonPath]];
}

export function synth(scriptJsonPath) {
  const [cmd, args] = synthCommand(scriptJsonPath);
  const r = spawnSync(cmd, args, { stdio: "inherit" });
  if (r.status !== 0) throw new Error(`TTS synth failed for ${scriptJsonPath}`);
}
```

- [ ] **Step 3: Write the failing test for the pure wrapper logic**

```ts
// tools/reels/tests/tts.test.ts
import { describe, it, expect } from "vitest";
import { synthCommand, SYNTH_PY } from "../src/tts.mjs";

describe("synthCommand", () => {
  it("builds python argv pointing at synth.py and the script path", () => {
    const [cmd, args] = synthCommand("/tmp/review/stansted.json", "python3");
    expect(cmd).toBe("python3");
    expect(args[0]).toBe(SYNTH_PY);
    expect(args[1]).toBe("/tmp/review/stansted.json");
  });
});
```

- [ ] **Step 4: Run test, expect PASS**

Run: `pnpm --filter @mathfamily/reels exec vitest run tests/tts.test.ts`
Expected: PASS.

- [ ] **Step 5: Manual integration check** (uses Task 3's pinned engine)

Run: `REELS_TTS=say pnpm --filter @mathfamily/reels exec node -e "import('./src/tts.mjs').then(m=>m.synth(process.argv[1]))" review/<date>/<slug>.json`
Expected: `voice.wav` + `timing.json` appear beside the script (draft voice via `say`). Then repeat with the pinned `REELS_TTS=vibevoice` env from `tts/README.md`.

- [ ] **Step 6: Commit**

```bash
git add tools/reels/tts/synth.py tools/reels/src/tts.mjs tools/reels/tests/tts.test.ts
git commit -m "feat(reels): pluggable local TTS wrapper (vibevoice/kokoro/say)"
```

---

## Task 8: Remotion scenes + `buildTimeline`

**Files:**
- Create: `tools/reels/src/timeline.ts`, `tools/reels/src/scenes/theme.ts`, `tools/reels/src/scenes/Reel.tsx`
- Modify: `tools/reels/src/Root.tsx` (replace the Task-2 placeholder with the real composition)
- Test: `tools/reels/tests/timeline.test.ts`, `tools/reels/tests/scene.test.tsx`

- [ ] **Step 1: Write the failing timeline test**

```ts
// tools/reels/tests/timeline.test.ts
import { describe, it, expect } from "vitest";
import { buildTimeline } from "../src/timeline";
import type { Scene } from "../src/schema";

const scenes: Scene[] = [
  { kind: "intro", onScreenText: "a", figureIds: [], durationHintMs: 1000 },
  { kind: "stat", onScreenText: "b", figureIds: [], durationHintMs: 3000 }
];

describe("buildTimeline", () => {
  it("scales scene hints to fill the real audio duration and is contiguous", () => {
    const timed = buildTimeline(scenes, 8000);
    expect(timed[0].startMs).toBe(0);
    expect(timed[1].startMs).toBe(timed[0].endMs);
    expect(timed[timed.length - 1].endMs).toBe(8000);
    expect(timed[1].endMs - timed[1].startMs).toBeGreaterThan(timed[0].endMs - timed[0].startMs);
  });
});
```

- [ ] **Step 2: Run test, expect FAIL** (`../src/timeline` missing)

Run: `pnpm --filter @mathfamily/reels exec vitest run tests/timeline.test.ts`

- [ ] **Step 3: Write `timeline.ts`**

```ts
// tools/reels/src/timeline.ts
import type { Scene } from "./schema";

export interface TimedScene extends Scene { startMs: number; endMs: number }

/** Distribute scenes across the real audio duration proportional to durationHintMs, contiguous,
 *  ending exactly at audioDurationMs (last scene absorbs rounding). */
export function buildTimeline(scenes: Scene[], audioDurationMs: number): TimedScene[] {
  const totalHint = scenes.reduce((n, s) => n + s.durationHintMs, 0);
  let cursor = 0;
  return scenes.map((s, i) => {
    const startMs = cursor;
    const span = i === scenes.length - 1 ? audioDurationMs - startMs : Math.round((s.durationHintMs / totalHint) * audioDurationMs);
    cursor = startMs + span;
    return { ...s, startMs, endMs: cursor };
  });
}
```

- [ ] **Step 4: Write `scenes/theme.ts`** (brand token values, from `DESIGN.md`)

```ts
// tools/reels/src/scenes/theme.ts
import type { ReelScript } from "../schema";

export const THEME: Record<ReelScript["brand"], { ink: string; surface: string; accent: string; verified: string }> = {
  parkmath: { ink: "#0A2540", surface: "#F8FAFC", accent: "#2563EB", verified: "#16A34A" },
  roammath: { ink: "#134E4A", surface: "#F8FAFC", accent: "#0D9488", verified: "#16A34A" }
};
export const MONO = "IBM Plex Mono, monospace";
export const SANS = "IBM Plex Sans, sans-serif";
```

- [ ] **Step 5: Write `scenes/Reel.tsx`** (renders timed scenes + audio; big mono figure)

```tsx
// tools/reels/src/scenes/Reel.tsx
import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import type { ReelScript } from "../schema";
import { buildTimeline } from "../timeline";
import { THEME, MONO, SANS } from "./theme";

export interface ReelProps { script: ReelScript; audioDurationMs: number; audioSrc?: string }

const msToFrames = (ms: number, fps: number) => Math.round((ms / 1000) * fps);

export const Reel: React.FC<ReelProps> = ({ script, audioDurationMs, audioSrc }) => {
  const { fps } = useVideoConfig();
  const theme = THEME[script.brand];
  const timed = buildTimeline(script.scenes, audioDurationMs);
  return (
    <AbsoluteFill style={{ backgroundColor: theme.surface, fontFamily: SANS }}>
      {audioSrc ? <Audio src={staticFile(audioSrc)} /> : null}
      {timed.map((scene, i) => {
        const from = msToFrames(scene.startMs, fps);
        const dur = Math.max(1, msToFrames(scene.endMs - scene.startMs, fps));
        const isStat = scene.kind === "stat";
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 64, textAlign: "center" }}>
              <span style={{
                fontFamily: isStat ? MONO : SANS,
                fontSize: isStat ? 180 : 64,
                fontWeight: 700,
                color: scene.kind === "verified" ? theme.verified : theme.ink
              }}>
                {scene.onScreenText}
              </span>
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
```

- [ ] **Step 6: Replace `src/Root.tsx`** with the real composition (driven by input props)

```tsx
// tools/reels/src/Root.tsx
import { Composition } from "remotion";
import { Reel, type ReelProps } from "./scenes/Reel";
import type { ReelScript } from "./schema";

const FPS = 30;
const placeholder: ReelScript = {
  version: "1", brand: "parkmath", format: "shock-fee", slug: "preview",
  figures: [{ id: "fee", label: "Fee", pence: 700 }],
  scenes: [
    { kind: "intro", onScreenText: "Preview", figureIds: [], durationHintMs: 1500 },
    { kind: "stat", onScreenText: "£7", figureIds: ["fee"], durationHintMs: 2500 },
    { kind: "cta", onScreenText: "parkmath.co.uk", figureIds: [], durationHintMs: 1500 }
  ],
  narration: "Preview. parkmath.co.uk.", captions: ["Preview"], cta: "parkmath.co.uk",
  sourceUrl: "https://example.com", verifiedAt: "2026-06-16"
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Reel"
    component={Reel}
    durationInFrames={FPS * 6}
    fps={FPS}
    width={1080}
    height={1920}
    defaultProps={{ script: placeholder, audioDurationMs: 6000, audioSrc: undefined } as ReelProps}
    calculateMetadata={({ props }) => ({ durationInFrames: Math.max(1, Math.round((props.audioDurationMs / 1000) * FPS)) })}
  />
);
```

- [ ] **Step 7: Write the scene render test** (`renderToStaticMarkup`, no jsdom — like the app `*-answer` tests)

```tsx
// tools/reels/tests/scene.test.tsx
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { buildTimeline } from "../src/timeline";
import { buildShockFeeReel } from "../src/formats/shock-fee";
import type { DropOffRecord, Airport } from "@mathfamily/data";

// Renders the pure scene text layer (not the Remotion <Sequence> runtime) to assert content.
const airport: Airport = { name: "Stansted", slug: "stansted", iata: "STN", region: "East", lat: 51.88, lng: 0.24 };
const record: DropOffRecord = {
  airportSlug: "stansted", isFree: false, feeSummary: "£7", bands: [{ upToMinutes: 15, totalPence: 700 }],
  maxStayMinutes: 15, perMinuteAfterPence: null, maxChargePence: null, penaltyPence: null, penaltyNotes: null,
  paymentDeadline: null, blueBadgePolicy: "x", freeAlternative: { name: "Mid Stay", minutesFree: 60, details: "x" },
  priorYearFeePence: null, sourceUrl: "https://www.stanstedairport.com/x", verifiedAt: "2026-06-14"
};

describe("reel scenes", () => {
  it("the timed scenes carry the fee, the free alternative and the verified date", () => {
    const script = buildShockFeeReel(record, airport);
    const timed = buildTimeline(script.scenes, 9000);
    const html = renderToStaticMarkup(
      <>{timed.map((s, i) => <p key={i} data-kind={s.kind}>{s.onScreenText}</p>)}</>
    );
    expect(html).toContain("£7 for 15 min");
    expect(html).toContain("Mid Stay");
    expect(html).toContain("Verified 2026-06-14");
  });
});
```

- [ ] **Step 8: Run tests, expect PASS**

Run: `pnpm --filter @mathfamily/reels exec vitest run tests/timeline.test.ts tests/scene.test.tsx`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add tools/reels/src/timeline.ts tools/reels/src/scenes tools/reels/src/Root.tsx tools/reels/tests/timeline.test.ts tools/reels/tests/scene.test.tsx
git commit -m "feat(reels): Remotion scenes + audio-driven timeline"
```

---

## Task 9: `render.mjs` — bundle + render + mux to MP4

**Files:**
- Create: `tools/reels/render.mjs`

Uses the render path proven in **Task 2** (honour `RENDER_DIR`). Reads a generated ReelScript JSON + its `voice.wav`/`timing.json`, renders, and writes `out/<date>/<brand>-<slug>.mp4`.

- [ ] **Step 1: Write `render.mjs`**

```js
// tools/reels/render.mjs
// Usage: node render.mjs review/<date>/<slug>.json
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const scriptPath = process.argv[2];
if (!scriptPath) { console.error("usage: node render.mjs <reelscript.json>"); process.exit(1); }

const script = JSON.parse(readFileSync(scriptPath, "utf8"));
const reviewDir = dirname(scriptPath);
const timing = JSON.parse(readFileSync(join(reviewDir, "timing.json"), "utf8"));

const entry = join(here, "src", "index.ts");
const outDir = join(here, "out", basename(reviewDir));
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, `${script.brand}-${script.slug}.mp4`);

// staticDir = the review folder so <Audio src={staticFile("voice.wav")}/> resolves.
const serveUrl = await bundle({ entryPoint: entry, publicDir: reviewDir });
const inputProps = { script, audioDurationMs: timing.audioDurationMs, audioSrc: "voice.wav" };
const composition = await selectComposition({ serveUrl, id: "Reel", inputProps });

await renderMedia({
  serveUrl,
  composition,
  codec: "h264",
  outputLocation: outPath,
  inputProps
});
console.log(`rendered ${outPath}`);
```

- [ ] **Step 2: Render the golden reel end-to-end**

Run (from the render path proven in Task 2):
```bash
pnpm --filter @mathfamily/reels generate
REELS_TTS=vibevoice python tools/reels/tts/synth.py review/<date>/parkmath-<slug>.json
pnpm --filter @mathfamily/reels render -- review/<date>/parkmath-<slug>.json
```
Expected: `tools/reels/out/<date>/parkmath-<slug>.mp4` — a 1080×1920 clip with the navy brand, the big mono fee, the free-alternative scene, the green verified stamp, the parkmath.co.uk card, and VibeVoice narration.

- [ ] **Step 3: Commit**

```bash
git add tools/reels/render.mjs
git commit -m "feat(reels): render+mux ReelScript to 1080x1920 MP4"
```

---

## Task 10: `reel-factory` skill + CLI + runner wiring

**Files:**
- Create: `tools/reels/src/cli.ts`
- Create: `.claude/skills/reel-factory/SKILL.md`
- Modify: `tools/freshness/run-agent.sh` (add a `reel-factory` mode)

- [ ] **Step 1: Write `cli.ts`** (writes the weekly batch to a dated review folder)

```ts
// tools/reels/src/cli.ts
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildWeeklyBatch } from "./batch";
import { ReelScriptSchema } from "./schema";

const date = process.env.REELS_DATE; // injected by the skill/runner; fail loud if absent (no Date.now reliance)
if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) { console.error("set REELS_DATE=YYYY-MM-DD"); process.exit(1); }

const count = Number(process.env.REELS_COUNT ?? "5");
const dir = join("tools", "reels", "review", date);
mkdirSync(dir, { recursive: true });

const scripts = buildWeeklyBatch(count);
for (const s of scripts) {
  ReelScriptSchema.parse(s); // belt-and-braces: never write an invalid/ungoverned script
  writeFileSync(join(dir, `${s.brand}-${s.slug}.json`), JSON.stringify(s, null, 2));
}
console.log(`wrote ${scripts.length} ReelScript(s) to ${dir}: ${scripts.map((s) => `${s.format}:${s.slug}`).join(", ")}`);
```

- [ ] **Step 2: Write `.claude/skills/reel-factory/SKILL.md`** (mirrors `content-factory`'s governance/contract)

````markdown
---
name: reel-factory
description: Generate a week of ParkMath vertical reels (script + voice-over + MP4) from live datasets as review artifacts a human approves before posting. Use when asked to run the reel factory / generate the weekly reel batch.
---

# Reel-factory routine

Generates a weekly batch of **on-brand vertical reels** (TikTok/IG/FB) from the live ParkMath
datasets, as **review artifacts** in `tools/reels/review/<date>/` — Mike watches and posts manually.
Read-only on datasets; **never** modifies code, ranking, or any dataset; **never** auto-publishes.

## Hard rules (non-negotiable)
- **Verified numbers only.** Every figure comes from a dataset record; never invented or rounded for
  effect. If a slot has no verified figure, skip it — never fabricate (the generator already enforces this).
- **`parkmath.co.uk` in every reel; NO affiliate/merchant link, ever** (the `ReelScriptSchema` rejects both).
- **Drop-off reels name the free alternative; parking reels lead with the gate-vs-pre-book saving.**
- **Never touch `partners.json` / affiliate ranking.**
- **Review only — nothing auto-publishes.** Do not post, DM, or call any publishing API.

## Steps
1. `REELS_DATE=$(date +%F) pnpm --filter @mathfamily/reels generate` → writes validated ReelScripts.
2. For each script: `REELS_TTS=vibevoice python tools/reels/tts/synth.py <script.json>` → `voice.wav` + `timing.json`.
3. For each script: `pnpm --filter @mathfamily/reels render -- <script.json>` (from the proven render path — see `tools/reels/README.md`; use internal disk / CI if local bundling hangs).
4. (Optional) Generate an on-brand cover per reel via the Canva MCP (see Task 11 / `tools/reels/README.md`).
5. Report the review folder path, the reels produced (`format:slug`), and any slot skipped for lack of verified data. Nothing is published.

## Output
`tools/reels/review/<date>/` — one `<brand>-<slug>.json` + `voice.wav` + `timing.json` per reel, and `tools/reels/out/<date>/<brand>-<slug>.mp4`. All gitignored (transient, reviewed locally).
````

- [ ] **Step 3: Add the runner mode** — in `tools/freshness/run-agent.sh`, extend the `case` block:

```bash
  reel-factory)    PROMPT="/reel-factory" ;;       # marketing: weekly reel batch → tools/reels/review/
```
(Place it alongside the existing `content-factory)` / `forum-scout)` lines, and add a usage comment at the top mirroring those.)

- [ ] **Step 4: Verify generation + dry-run the runner**

Run:
```bash
REELS_DATE=2026-06-16 pnpm --filter @mathfamily/reels generate
PRINT_CMD=1 tools/freshness/run-agent.sh reel-factory
```
Expected: review JSONs written and validated; `PRINT_CMD=1` prints `claude -p /reel-factory …` without side effects.

- [ ] **Step 5: Commit**

```bash
git add tools/reels/src/cli.ts .claude/skills/reel-factory/SKILL.md tools/freshness/run-agent.sh
git commit -m "feat(reels): reel-factory skill, CLI, and runner mode"
```

---

## Task 11: Canva complement — brand kit + covers (documented procedure)

The Canva MCP can't author the video (no audio/motion), but it makes on-brand **covers/carousels** and the static social. These steps are **operator/skill actions via the Canva MCP**, not code, so they're documented and added to the skill — not unit-tested.

**Files:**
- Modify: `tools/reels/README.md` (add the Canva section)
- Modify: `.claude/skills/reel-factory/SKILL.md` (optional cover step already referenced in Task 10 Step 4)

- [ ] **Step 1: Document the one-time brand-kit setup** in `tools/reels/README.md`:

```markdown
## Canva (covers/carousels only — never the video)
Brand kit is currently empty (`list-brand-kits` → []). One-time: create a Canva brand kit with the
ParkMath palette (#0A2540 ink, #2563EB accent, #16A34A verified) + IBM Plex Sans/Mono + logo, then
note its id here. Per reel, generate a cover via the Canva MCP `generate-design` (`your_story`,
1080×1920) using that brand kit and the reel's headline number; export and drop into the review folder.
RoamMath swaps to teal (#134E4A / #0D9488).
```

- [ ] **Step 2: Record the brand-kit id** once created (so `generate-design` calls can pass `brand_kit_id`).

- [ ] **Step 3: Commit**

```bash
git add tools/reels/README.md .claude/skills/reel-factory/SKILL.md
git commit -m "docs(reels): Canva brand-kit + cover procedure"
```

---

## Self-review

**Spec coverage:**
- Six architecture units → Tasks 4 (schema/generator schema), 5–6 (script generator), 7 (TTS), 8–9 (Remotion scenes + render), 10 (orchestration skill), 11 (Canva). ✓
- Governance (verified-only, no affiliate, brand URL, never auto-publish) → enforced in Task 4 schema + Task 6 batch (skip-don't-fabricate) + Task 10 CLI re-validation + skill hard rules. ✓
- Three rotating formats → Tasks 5 (shock-fee), 6 (how-to + news + rotation). ✓
- Testing (schema, generator, scene) under config-less vitest; render/TTS as integration → Tasks 4–8 unit, Tasks 7/9 manual integration. ✓
- Risks: TB4 esbuild deadlock → Task 2 spike + Task 9 `RENDER_DIR`; VibeVoice on MLX → Task 3 spike; golden reel first → Task 9 Step 2. ✓
- ParkMath first / RoamMath via token swap → `THEME` map (Task 8) + builders hard-code `brand: "parkmath"` for v1. ✓

**Placeholder scan:** No "TBD"/"handle edge cases"/"similar to". Spikes (Tasks 2, 3) are explicitly investigations with acceptance criteria and fallbacks, not faked TDD — this is intentional, not a placeholder.

**Type consistency:** `ReelScript`, `Figure`, `Scene` (Task 4) used unchanged in 5/6/8/10; `buildTimeline(scenes, audioDurationMs)` signature consistent in Task 8 + `Reel.tsx` + `render.mjs` (`audioDurationMs` from `timing.json`). `gatePrebookSaving`/`buildHowToReel`/`buildShockFeeReel`/`pickShockFeeRecord`/`buildNewsReel`/`buildWeeklyBatch` names consistent across tasks and tests. Data symbols (`loadDropOffDataset`, `loadParkingDataset`, `loadAirports`, `recentNews`, types) verified against `packages/data`. `formatPence` from `@mathfamily/engine`.

---

## Execution handoff

(See "Execution Handoff" below — choose subagent-driven or inline.)
