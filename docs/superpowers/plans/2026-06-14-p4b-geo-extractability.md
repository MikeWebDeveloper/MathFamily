# P4b — GEO / schema / extractability (deferred remainder) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Finish the approved P4 GEO scope — real Person/Organization entity graph, Speakable schema, RoamMath open-data CSV export (closing its dangling `datasetLd`), and 40–75-word answer-first passages with question-form H2s on the core answer pages.

**Architecture:** Pure structured-data + small server-component additions. No client JS, no new routes that aren't `force-static`. Schema builders live in `packages/geo/src/builders.ts` (barrel auto-exports via `index.ts`). New shared UI lands in `packages/ui/src/*` and is exported from `packages/ui/src/index.ts`. Every route stays `○`/`●` static.

**Tech stack:** Next 16 App Router, React 19, Tailwind v4, Zod datasets, Vitest. Test conventions: `packages/ui` = vitest + jsdom (`// @vitest-environment jsdom` first line) + @testing-library; `packages/geo`/`apps/*` content+lib = plain vitest; app components = `renderToStaticMarkup`. **Never create a vitest/vite config file** (esbuild deadlocks on this volume). Config-less vitest cannot resolve `@/` — unit-tested modules must use **relative** imports. Build via `pnpm --filter <app> exec next build` (NOT `pnpm --filter <app> build`, which pings IndexNow).

**Decisions (locked by user 2026-06-14):**
- **Authorship = named real Person** — "Michal Latal", founder/editor, `worksFor` the Organization, **no fabricated `sameAs`/social URLs**. Site-wide via `Organization.founder`; as `author` on news articles.
- **Answer passages = build now** across the 5 core answer pages.

---

## Constants

- Person name: `Michal Latal`. jobTitle: `Founder & editor`. Person `@id`: `${siteUrl}/#person`.
- Speakable selector convention: `["h1", ".mf-speakable"]`. The answer passage element carries class `mf-speakable`.
- ParkMath siteUrl default `http://localhost:3000`; RoamMath `http://localhost:3001` (already used in pages).

---

## Task 1: geo builders — `personLd`, `speakableLd`, founder + author wiring

**Files:**
- Modify: `packages/geo/src/builders.ts`
- Test: `packages/geo/tests/builders.test.ts`

- [ ] **Step 1: Write failing tests** (append to existing test file; plain vitest)

```ts
import { personLd, speakableLd, organizationLd, newsArticleLd } from "../src/builders";

describe("personLd", () => {
  it("emits a Person with @id, name, jobTitle and worksFor the org @id, no sameAs when none given", () => {
    const p = personLd({ siteUrl: "https://parkmath.co.uk", name: "Michal Latal", jobTitle: "Founder & editor" });
    expect(p["@type"]).toBe("Person");
    expect(p["@id"]).toBe("https://parkmath.co.uk/#person");
    expect(p.name).toBe("Michal Latal");
    expect(p.jobTitle).toBe("Founder & editor");
    expect(p.worksFor["@id"]).toBe("https://parkmath.co.uk/#organization");
    expect("sameAs" in p).toBe(false);
  });
  it("includes sameAs only when non-empty", () => {
    const p = personLd({ siteUrl: "https://x.co", name: "A", jobTitle: "B", sameAs: ["https://x.co/a"] });
    expect(p.sameAs).toEqual(["https://x.co/a"]);
  });
});

describe("speakableLd", () => {
  it("emits a WebPage with a SpeakableSpecification of cssSelectors", () => {
    const s = speakableLd({ url: "https://x.co/p" });
    expect(s["@type"]).toBe("WebPage");
    expect(s.url).toBe("https://x.co/p");
    expect(s.speakable["@type"]).toBe("SpeakableSpecification");
    expect(s.speakable.cssSelector).toEqual(["h1", ".mf-speakable"]);
  });
  it("accepts custom selectors", () => {
    const s = speakableLd({ url: "https://x.co/p", cssSelectors: ["#a"] });
    expect(s.speakable.cssSelector).toEqual(["#a"]);
  });
});

describe("organizationLd founder", () => {
  it("includes founder Person when provided", () => {
    const org = organizationLd({
      siteUrl: "https://parkmath.co.uk", name: "ParkMath", logoUrl: "https://parkmath.co.uk/logo",
      founder: { name: "Michal Latal", jobTitle: "Founder & editor" }
    });
    expect(org.founder["@type"]).toBe("Person");
    expect(org.founder["@id"]).toBe("https://parkmath.co.uk/#person");
    expect(org.founder.name).toBe("Michal Latal");
  });
  it("omits founder when not provided", () => {
    const org = organizationLd({ siteUrl: "https://x.co", name: "X", logoUrl: "https://x.co/l" });
    expect("founder" in org).toBe(false);
  });
});

describe("newsArticleLd author", () => {
  it("uses a Person author when authorName given, org stays publisher", () => {
    const a = newsArticleLd({
      headline: "H", description: "D", url: "https://parkmath.co.uk/news/x", datePublished: "2026-01-01",
      dateModified: "2026-01-02", sourceUrl: "https://src", siteUrl: "https://parkmath.co.uk",
      imageUrl: "https://img", authorName: "Michal Latal", authorJobTitle: "Founder & editor"
    });
    expect(a.author["@type"]).toBe("Person");
    expect(a.author["@id"]).toBe("https://parkmath.co.uk/#person");
    expect(a.author.name).toBe("Michal Latal");
    expect(a.publisher["@type"]).toBe("Organization");
  });
  it("falls back to org author when no authorName", () => {
    const a = newsArticleLd({
      headline: "H", description: "D", url: "u", datePublished: "p", dateModified: "m",
      sourceUrl: "s", siteUrl: "https://x.co", imageUrl: "i"
    });
    expect(a.author["@type"]).toBe("Organization");
  });
});
```

- [ ] **Step 2: Run, verify fail** — `pnpm --filter @mathfamily/geo test` → FAIL (personLd/speakableLd undefined).

- [ ] **Step 3: Implement** in `packages/geo/src/builders.ts`:

```ts
export function personLd(input: { siteUrl: string; name: string; jobTitle: string; sameAs?: string[]; url?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Person" as const,
    "@id": `${input.siteUrl}/#person`,
    name: input.name,
    jobTitle: input.jobTitle,
    url: input.url ?? input.siteUrl,
    worksFor: { "@type": "Organization" as const, "@id": `${input.siteUrl}/#organization` },
    ...(input.sameAs && input.sameAs.length ? { sameAs: input.sameAs } : {})
  };
}

export function speakableLd(input: { url: string; cssSelectors?: string[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage" as const,
    url: input.url,
    speakable: { "@type": "SpeakableSpecification" as const, cssSelector: input.cssSelectors ?? ["h1", ".mf-speakable"] }
  };
}
```

- Extend `organizationLd` input with `founder?: { name: string; jobTitle: string; sameAs?: string[] }`; when present add a nested Person (inline, sharing the `#person` @id):
```ts
...(input.founder ? { founder: { "@type": "Person" as const, "@id": `${input.siteUrl}/#person`, name: input.founder.name, jobTitle: input.founder.jobTitle, ...(input.founder.sameAs?.length ? { sameAs: input.founder.sameAs } : {}) } } : {})
```
- Extend `newsArticleLd` input with `authorName?: string; authorJobTitle?: string`; when `authorName` present, set `author` to a Person `{ "@type":"Person", "@id":`${siteUrl}/#person`, name, jobTitle }`; else keep the existing `org` author. `publisher` stays `org` always.

- [ ] **Step 4: Run, verify pass** — `pnpm --filter @mathfamily/geo test` PASS.

- [ ] **Step 5: Commit** — `feat(geo): personLd + speakableLd builders; Organization.founder + NewsArticle Person author`.

---

## Task 2: RoamMath open-data CSV export

**Files:**
- Create: `apps/roammath/lib/csv.ts` (copy of parkmath's `toCsv`)
- Create: `apps/roammath/lib/open-data.ts` (testable row builders)
- Create: `apps/roammath/app/data/roaming-charges.csv/route.ts`
- Create: `apps/roammath/app/data/baggage-fees.csv/route.ts`
- Modify: `apps/roammath/app/roaming/page.tsx` (add OpenDataBand)
- Modify: `apps/roammath/app/baggage-fees/page.tsx` (add datasetLd + OpenDataBand)
- Test: `apps/roammath/tests/open-data.test.ts`

- [ ] **Step 1: csv helper** — copy `apps/parkmath/lib/csv.ts` verbatim to `apps/roammath/lib/csv.ts`.

- [ ] **Step 2: Failing tests** (`apps/roammath/tests/open-data.test.ts`, plain vitest, **relative imports**):

```ts
import { describe, it, expect } from "vitest";
import { roamingCsv, baggageCsv } from "../lib/open-data";

describe("roamingCsv", () => {
  const { header, rows } = roamingCsv();
  it("has the expected header", () => {
    expect(header).toEqual(["country","iso2","network","included","daily_pass_gbp","pass_name","verified_at","source_url"]);
  });
  it("emits one row per destination x 4 networks with GBP-formatted pass prices", () => {
    // 4 networks per destination
    expect(rows.length % 4).toBe(0);
    for (const r of rows) {
      expect(r.length).toBe(header.length);
      expect(["yes","no"]).toContain(r[3]);            // included
      if (r[4] !== "") expect(r[4]).toMatch(/^\d+\.\d{2}$/); // daily_pass_gbp or ""
    }
  });
});

describe("baggageCsv", () => {
  const { header, rows } = baggageCsv();
  it("has the expected header", () => {
    expect(header).toEqual(["airline","item","min_gbp","max_gbp","note","verified_at","source_url"]);
  });
  it("emits one row per airline x fee with GBP min/max or blank", () => {
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      expect(r.length).toBe(header.length);
      if (r[2] !== "") expect(r[2]).toMatch(/^\d+\.\d{2}$/);
      if (r[3] !== "") expect(r[3]).toMatch(/^\d+\.\d{2}$/);
    }
  });
});
```

- [ ] **Step 3: Run, verify fail** — `pnpm --filter roammath test` → FAIL (no open-data module).

- [ ] **Step 4: Implement `apps/roammath/lib/open-data.ts`** (relative imports of `@mathfamily/data` package are fine — it's a real package, not the `@/` alias):

```ts
import { loadRoamingDataset, loadBaggageDataset } from "@mathfamily/data";

const gbp = (pence: number | null | undefined) => (pence === null || pence === undefined ? "" : (pence / 100).toFixed(2));

export function roamingCsv(): { header: string[]; rows: (string | number | null)[][] } {
  const { destinations, networkSources } = loadRoamingDataset();
  const src = new Map(networkSources.map((s) => [s.network, s]));
  const header = ["country","iso2","network","included","daily_pass_gbp","pass_name","verified_at","source_url"];
  const rows = destinations.flatMap((d) =>
    d.perNetwork.map((n) => {
      const s = src.get(n.network);
      return [d.countryName, d.iso2, n.network, n.included ? "yes" : "no", gbp(n.dailyPassPence), n.passName ?? "", s?.verifiedAt ?? "", s?.sourceUrl ?? ""];
    })
  );
  return { header, rows };
}

export function baggageCsv(): { header: string[]; rows: (string | number | null)[][] } {
  const { records } = loadBaggageDataset();
  const header = ["airline","item","min_gbp","max_gbp","note","verified_at","source_url"];
  const rows = records.flatMap((r) =>
    r.fees.map((f) => [r.airlineName, f.item, gbp(f.minPence), gbp(f.maxPence), f.note ?? "", r.verifiedAt, r.sourceUrl])
  );
  return { header, rows };
}
```

- [ ] **Step 5: Implement the two route handlers** (mirror parkmath's `force-static` route):

`apps/roammath/app/data/roaming-charges.csv/route.ts`:
```ts
import { toCsv } from "@/lib/csv";
import { roamingCsv } from "@/lib/open-data";
export const dynamic = "force-static";
export function GET() {
  const { header, rows } = roamingCsv();
  return new Response(toCsv(header, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="roammath-roaming-charges.csv"',
      "Cache-Control": "public, max-age=3600, s-maxage=86400"
    }
  });
}
```
`apps/roammath/app/data/baggage-fees.csv/route.ts` — same shape, `baggageCsv()`, filename `roammath-baggage-fees.csv`.
(Routes may use the `@/` alias — Next resolves it; only the *vitest*-imported `lib/open-data.ts` matters for the alias rule, and it imports `@mathfamily/data`, a real package.)

- [ ] **Step 6: Wire OpenDataBand into pages.**
  - `roaming/page.tsx`: import `OpenDataBand` from `@mathfamily/ui`; render at the end of the `<article>`:
    ```tsx
    <OpenDataBand
      downloads={[{ href: "/data/roaming-charges.csv", label: "Roaming charges (CSV)" }]}
      citation={`RoamMath, "UK mobile roaming charges by destination", verified ${latestVerified}, roammath.co.uk`}
    />
    ```
  - `baggage-fees/page.tsx`: add `datasetLd` (import it) + `OpenDataBand`:
    ```tsx
    <JsonLd data={datasetLd({ name: "UK airline baggage fees 2026", description: "Cabin and checked bag fees for 12 UK-popular airlines — official published min–max ranges, date-stamped.", url: `${siteUrl}/baggage-fees`, dateModified: lastUpdated, siteUrl, creatorName: "RoamMath" })} />
    ...
    <OpenDataBand downloads={[{ href: "/data/baggage-fees.csv", label: "Baggage fees (CSV)" }]} citation={`RoamMath, "UK airline baggage fees 2026", verified ${lastUpdated}, roammath.co.uk`} />
    ```

- [ ] **Step 7: Run tests + build** — `pnpm --filter roammath test` PASS; `pnpm --filter roammath exec next build` → new `/data/*.csv` routes appear as `○`/static.

- [ ] **Step 8: Commit** — `feat(roammath): open-data CSV export (roaming + baggage) + OpenDataBand + baggage Dataset schema`.

---

## Task 3: Person/Organization entity graph wiring (site-wide + news byline)

**Files:**
- Create: `packages/ui/src/compiled-byline.tsx` + export from `packages/ui/src/index.ts`
- Test: `packages/ui/tests/compiled-byline.test.tsx` (jsdom + @testing-library)
- Modify: `apps/parkmath/app/layout.tsx` (organizationLd `founder`)
- Modify: `apps/roammath/app/layout.tsx` (ADD organizationLd with `founder`; import `organizationLd, JsonLd` from `@mathfamily/geo`)
- Modify: parkmath news article page (`apps/parkmath/app/news/[id]/page.tsx`) — pass `authorName`/`authorJobTitle` to `newsArticleLd`; render `<CompiledByline>`

- [ ] **Step 1: Failing test for CompiledByline** (`// @vitest-environment jsdom` first line):
```tsx
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { CompiledByline } from "../src/compiled-byline";
it("renders the compiler name and verified date", () => {
  render(<CompiledByline name="Michal Latal" verifiedAt="2026-06-14" />);
  expect(screen.getByText(/Michal Latal/)).toBeTruthy();
  expect(screen.getByText(/2026-06-14/)).toBeTruthy();
});
it("renders without a date", () => {
  render(<CompiledByline name="Michal Latal" />);
  expect(screen.getByText(/Michal Latal/)).toBeTruthy();
});
```

- [ ] **Step 2: Run, verify fail.** `pnpm --filter @mathfamily/ui test`

- [ ] **Step 3: Implement `compiled-byline.tsx`** (server component, token-safe, dark-safe):
```tsx
export function CompiledByline({ name, verifiedAt }: { name: string; verifiedAt?: string }) {
  return (
    <p className="text-sm text-ink-muted">
      Compiled by <span className="font-medium text-ink">{name}</span>
      {verifiedAt ? <> · last verified {verifiedAt}</> : null}
    </p>
  );
}
```
Export from `packages/ui/src/index.ts`.

- [ ] **Step 4: Wire layouts.**
  - parkmath `layout.tsx`: add `founder: { name: "Michal Latal", jobTitle: "Founder & editor" }` to the existing `organizationLd({...})` call.
  - roammath `layout.tsx`: import `{ organizationLd, JsonLd }` from `@mathfamily/geo`; emit `<JsonLd data={organizationLd({ siteUrl: SITE_URL, name: "RoamMath", logoUrl: \`${SITE_URL}/opengraph-image\`, founder: { name: "Michal Latal", jobTitle: "Founder & editor" } })} />` in `<body>` (mirror parkmath placement).

- [ ] **Step 5: Wire news article.** In `apps/parkmath/app/news/[id]/page.tsx`, add `authorName: "Michal Latal", authorJobTitle: "Founder & editor"` to the `newsArticleLd({...})` call, and render `<CompiledByline name="Michal Latal" verifiedAt={<article verified/updated date>} />` near the article header/footer.

- [ ] **Step 6: Tests + build** — ui test PASS; `pnpm --filter parkmath exec next build` + `pnpm --filter roammath exec next build` static.

- [ ] **Step 7: Commit** — `feat(geo/ui): site-wide Person/Organization entity graph (founder) + compiled-by byline on news`.

---

## Task 4: Answer-first 40–75-word passages + Speakable on the 5 core answer pages

**Files:**
- Create: `packages/ui/src/answer-passage.tsx` + export from index
- Test: `packages/ui/tests/answer-passage.test.tsx` (jsdom)
- Modify (add question-H2 + `<AnswerPassage>` + `speakableLd`):
  - `apps/parkmath/app/airport-parking/[airport]/page.tsx`
  - `apps/parkmath/app/airport-lounges/[airport]/page.tsx`
  - `apps/parkmath/app/drop-off-charges/[airport]/page.tsx`
  - `apps/roammath/app/roaming/[country]/page.tsx`
  - `apps/roammath/app/baggage-fees/[airline]/page.tsx`

- [ ] **Step 1: Failing test** (jsdom):
```tsx
// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { AnswerPassage } from "../src/answer-passage";
it("renders a question-form H2 and a passage carrying the mf-speakable class", () => {
  const { container } = render(<AnswerPassage question="How much is parking at Heathrow?">Short answer text.</AnswerPassage>);
  const h2 = container.querySelector("h2");
  expect(h2?.textContent).toContain("How much");
  expect(container.querySelector(".mf-speakable")?.textContent).toContain("Short answer text.");
});
```

- [ ] **Step 2: Run, verify fail.**

- [ ] **Step 3: Implement `answer-passage.tsx`** (server component; H2 also speakable-tagged):
```tsx
export function AnswerPassage({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1.5">
      <h2 className="mf-speakable text-lg font-semibold text-ink">{question}</h2>
      <p className="mf-speakable text-[15px] leading-relaxed text-ink-muted">{children}</p>
    </section>
  );
}
```
Export from index.

- [ ] **Step 4: Per page — add a 40–75-word passage built from the verified figures**, placed directly under the `<header>` (above the reactive answer block / fold). Question-form H2. Use the page's existing model/record numbers (peak/cheapest, durations, daily pass, fee range). Keep factual, no marketing %, lead with the figure. Add `<JsonLd data={speakableLd({ url: \`${siteUrl}/<path>\` })} />` near the other JsonLd. **Each passage MUST be 40–75 words** — the implementer counts words.

  Guidance per page:
  - parking hub: "How much is parking at {airport}?" — gate drive-up vs cheapest pre-book for 7 days, the saving, that figures are official date-stamped snapshots.
  - lounge: "How much is a lounge at {airport}?" — walk-up vs pre-book / Priority Pass framing from the model.
  - drop-off: "What does it cost to drop someone off at {airport}?" — the charge, free alternative if any.
  - roaming country: "How much is roaming in {country}?" — included networks vs cheapest daily pass, eSIM alternative.
  - baggage airline: "What are {airline}'s baggage fees?" — cabin range, checked range, dynamic-pricing caveat.

- [ ] **Step 5: Tests + builds** — ui test PASS; both apps `next build` static; spot-check one built page HTML contains the `mf-speakable` text and `SpeakableSpecification`.

- [ ] **Step 6: Commit** — `feat(ui/parkmath/roammath): answer-first 40–75-word passages + Speakable schema on core answer pages`.

---

## Task 5: Full verification + finish

- [ ] `pnpm -r typecheck` (or per-package) — clean.
- [ ] `pnpm -r test` (packages) + `pnpm --filter parkmath --filter roammath test` — all green.
- [ ] `pnpm --filter parkmath exec next build` + `pnpm --filter roammath exec next build` — all routes `○`/`●` static, new `/data/*.csv` present.
- [ ] `graphify update .` to refresh the graph.
- [ ] Update `docs/superpowers/specs/2026-06-14-p4-geo-schema-design.md` "Deferred (P4b)" section to mark these done; note any residual (e.g. dark OG, cross-brand combined answer) still open.
- [ ] superpowers:finishing-a-development-branch → merge to main (per standing "merge each as it goes green").

## Acceptance

- Person/Organization entity graph valid (Organization.founder = Person `#person`; news author = Person, publisher = Organization); **no fabricated `sameAs`**.
- Speakable `SpeakableSpecification` present on the 5 answer pages targeting `h1`+`.mf-speakable`; the passages actually carry `.mf-speakable`.
- RoamMath `/data/roaming-charges.csv` + `/data/baggage-fees.csv` download (static), `OpenDataBand` on both index pages, baggage index now emits `datasetLd` (no dangling Dataset claim).
- Each answer passage is 40–75 words, factual, leads with the verified figure, question-form H2.
- typecheck/test/build green; all routes static; light + dark unaffected.
