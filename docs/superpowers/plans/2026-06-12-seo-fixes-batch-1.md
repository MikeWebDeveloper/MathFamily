# ParkMath SEO Fixes — Batch 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the audit's quick-wins + P0: canonical/OpenGraph metadata, security headers, Organization + NewsArticle schema, an LCP font-preload fix, answer-first index summaries, self-citing FAQ, a skip link, the `/news` heading fix, title trims, and caret-pinned deps.

**Architecture:** Schema/builder changes land in `packages/geo` (unit-tested); metadata/headers/font changes are Next config that's live/preview-verified; index-summary + FAQ logic is unit-tested pure helpers. The Organization entity is rendered once in the root layout and `@id`-referenced by NewsArticle/Dataset.

**Tech Stack:** Next 16 App Router (RSC, static), TypeScript, config-less vitest (**never** create a vitest/vite config on this `/Volumes/TB4` volume — it deadlocks).

**Branch:** `feat/seo-fixes-batch-1` (exists; spec + audit committed at `c19d7de`).

**Reference:** `docs/superpowers/specs/2026-06-12-seo-fixes-batch-1-design.md` · `docs/seo-audit/2026-06-12-seo-code-audit.md`

**GUARDRAILS — do NOT change:** apex→www/trailing-slash 308s; `hreflang` (absent is correct); 404 behaviour; sitemap/robots/`llms.txt`; existing valid schema; no fabricated reviews; **no images/alt** (none exist — only the `aria-hidden` `UkMap` SVG).

---

## File Structure

| File | Change | Task |
|---|---|---|
| `packages/geo/src/builders.ts` | `organizationLd()`; fix `newsArticleLd`/`datasetLd` to `@id`-ref Organization | 1 |
| `packages/geo/tests/builders.test.ts` (or existing geo test) | tests for the above | 1 |
| `apps/parkmath/app/layout.tsx` | render Organization JSON-LD; canonical+OG; font preload; skip link | 1,2,5,6 |
| `apps/parkmath/app/news/[id]/page.tsx` | new `newsArticleLd` args; canonical+article OG | 1,2 |
| `apps/parkmath/app/{page,drop-off-charges/page,airport-parking/page,airport-lounges/page,news/page}.tsx` + `[airport]`/`[duration]` routes | `alternates.canonical` per route; title trims | 2 |
| `apps/parkmath/next.config.ts` | `headers()` (security headers + CSP) | 3 |
| `apps/parkmath/lib/content.ts` | index-summary helper + FAQ date | 4 |
| index pages (drop-off/parking/lounge) | render answer-first summary above table | 4 |
| `packages/ui/src/news-card.tsx` + `packages/ui/tests/news.test.tsx` | `headingLevel` prop + test | 6 |
| `apps/parkmath/app/news/page.tsx` | pass `headingLevel="h2"` | 6 |
| `apps/parkmath/package.json`, `apps/roammath/package.json` | caret-pin `next`/`react`/`react-dom` | 7 |

---

## Task 1: Organization + NewsArticle/Dataset schema

**Files:** `packages/geo/src/builders.ts`; `packages/geo/tests/builders.test.ts`; `apps/parkmath/app/layout.tsx`; `apps/parkmath/app/news/[id]/page.tsx`

- [ ] **Step 1: Write failing tests**

Find the geo test file (`ls packages/geo/tests/`). Add to it (create `packages/geo/tests/builders.test.ts` with the docblock pattern below only if no geo test exists):

```ts
import { describe, expect, it } from "vitest";
import { organizationLd, newsArticleLd, datasetLd } from "../src/builders";

describe("organizationLd", () => {
  it("has a stable @id, url and logo", () => {
    const o = organizationLd({ siteUrl: "https://www.parkmath.co.uk", name: "ParkMath", logoUrl: "https://www.parkmath.co.uk/opengraph-image" });
    expect(o["@type"]).toBe("Organization");
    expect(o["@id"]).toBe("https://www.parkmath.co.uk/#organization");
    expect(o.url).toBe("https://www.parkmath.co.uk");
    expect(o.logo).toEqual({ "@type": "ImageObject", url: "https://www.parkmath.co.uk/opengraph-image" });
  });
});

describe("newsArticleLd", () => {
  it("includes image, author and an @id-referenced publisher", () => {
    const a = newsArticleLd({
      headline: "h", description: "d", url: "https://www.parkmath.co.uk/news/x",
      datePublished: "2026-06-01", dateModified: "2026-06-10", sourceUrl: "https://airport/x",
      siteUrl: "https://www.parkmath.co.uk", imageUrl: "https://www.parkmath.co.uk/opengraph-image",
    });
    expect(a.image).toEqual(["https://www.parkmath.co.uk/opengraph-image"]);
    expect(a.author).toEqual({ "@type": "Organization", "@id": "https://www.parkmath.co.uk/#organization", name: "ParkMath" });
    expect(a.publisher).toEqual({ "@type": "Organization", "@id": "https://www.parkmath.co.uk/#organization", name: "ParkMath" });
  });
});

describe("datasetLd", () => {
  it("creator references the Organization @id", () => {
    const d = datasetLd({ name: "n", description: "d", url: "https://www.parkmath.co.uk/drop-off-charges", dateModified: "2026-06-10", siteUrl: "https://www.parkmath.co.uk", creatorName: "ParkMath" });
    expect(d.creator).toEqual({ "@type": "Organization", "@id": "https://www.parkmath.co.uk/#organization", name: "ParkMath" });
  });
});
```

- [ ] **Step 2: Run — expect FAIL** (`organizationLd` not exported; `newsArticleLd`/`datasetLd` old shape).

Run: `pnpm --filter @mathfamily/geo test`

- [ ] **Step 3: Implement in `packages/geo/src/builders.ts`**

Add `organizationLd`; replace `datasetLd` and `newsArticleLd` with these (keep all other builders unchanged):

```ts
export function organizationLd(input: { siteUrl: string; name: string; logoUrl: string; sameAs?: string[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization" as const,
    "@id": `${input.siteUrl}/#organization`,
    name: input.name,
    url: input.siteUrl,
    logo: { "@type": "ImageObject" as const, url: input.logoUrl },
    ...(input.sameAs && input.sameAs.length ? { sameAs: input.sameAs } : {})
  };
}

export function datasetLd(input: {
  name: string; description: string; url: string; dateModified: string; siteUrl: string; creatorName: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset" as const,
    name: input.name,
    description: input.description,
    url: input.url,
    dateModified: input.dateModified,
    isAccessibleForFree: true,
    creator: { "@type": "Organization" as const, "@id": `${input.siteUrl}/#organization`, name: input.creatorName }
  };
}

export function newsArticleLd(input: {
  headline: string; description: string; url: string; datePublished: string; dateModified: string;
  sourceUrl: string; siteUrl: string; imageUrl: string; publisherName?: string;
}) {
  const org = { "@type": "Organization" as const, "@id": `${input.siteUrl}/#organization`, name: input.publisherName ?? "ParkMath" };
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle" as const,
    headline: input.headline,
    description: input.description,
    url: input.url,
    mainEntityOfPage: input.url,
    image: [input.imageUrl],
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    isBasedOn: input.sourceUrl,
    isAccessibleForFree: true,
    author: org,
    publisher: org
  };
}
```

- [ ] **Step 4: Update the two call sites so the app still typechecks**

In `apps/parkmath/app/news/[id]/page.tsx`, change the `newsArticleLd(...)` call (line 31) to:

```tsx
      <JsonLd data={newsArticleLd({ headline: item.title, description: item.summary, url, datePublished: item.publishedAt, dateModified: item.verifiedAt, sourceUrl: item.sourceUrl, siteUrl, imageUrl: `${siteUrl}/opengraph-image` })} />
```

In `apps/parkmath/app/drop-off-charges/page.tsx`, change the `datasetLd(...)` call (lines 43-49) to add `siteUrl`:

```tsx
        data={datasetLd({
          name: "UK airport drop-off charges",
          description: `Drop-off fees, time limits, penalties and free alternatives at ${records.length} UK airports, verified against official airport pages.`,
          url: `${siteUrl}/drop-off-charges`,
          dateModified: latestVerified,
          siteUrl,
          creatorName: "ParkMath"
        })}
```

- [ ] **Step 5: Render Organization once in the root layout**

In `apps/parkmath/app/layout.tsx`: import `organizationLd` + `JsonLd` from `@mathfamily/geo`, and render it as the first child inside `<body>` (before `<ScrollProgress/>`):

```tsx
        <JsonLd data={organizationLd({ siteUrl: SITE_URL, name: "ParkMath", logoUrl: `${SITE_URL}/opengraph-image` })} />
```

- [ ] **Step 6: Run tests + typecheck**

Run: `pnpm --filter @mathfamily/geo test && pnpm --filter parkmath typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/geo/src/builders.ts packages/geo/tests/builders.test.ts "apps/parkmath/app/news/[id]/page.tsx" apps/parkmath/app/drop-off-charges/page.tsx apps/parkmath/app/layout.tsx
git commit -m "feat(geo): Organization entity + image/author/@id on NewsArticle + Dataset"
```

---

## Task 2: Canonical + OpenGraph metadata + title trims

**Files:** `apps/parkmath/app/layout.tsx`; `apps/parkmath/app/page.tsx`; the three index pages; `news/page.tsx`; `news/[id]/page.tsx`; the `[airport]` + `[duration]` route `generateMetadata`s.

No unit tests (Next metadata) — verified live in Task 8. Each edit adds `alternates: { canonical: "<exact path>" }` to that route's metadata object (and, where noted, `openGraph`).

- [ ] **Step 1: Root layout — baseline canonical + site OpenGraph**

In `apps/parkmath/app/layout.tsx`, replace the `metadata` export's `alternates` and add `openGraph`:

```tsx
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": "/news/feed.xml" }
  },
  openGraph: {
    type: "website",
    siteName: "ParkMath",
    locale: "en_GB",
    url: SITE_URL
  }
```

- [ ] **Step 2: Per-route canonicals**

Add `alternates: { canonical: "<path>" }` to each route's metadata. For static `export const metadata` objects, add the key inline. For `generateMetadata`, add it to the returned object. Exact paths:

- `apps/parkmath/app/page.tsx` (home) → `canonical: "/"`
- `apps/parkmath/app/drop-off-charges/page.tsx` → `canonical: "/drop-off-charges"`
- `apps/parkmath/app/airport-parking/page.tsx` → `canonical: "/airport-parking"`
- `apps/parkmath/app/airport-lounges/page.tsx` → `canonical: "/airport-lounges"`
- `apps/parkmath/app/news/page.tsx` → `canonical: "/news"`
- `apps/parkmath/app/drop-off-charges/[airport]/page.tsx` `generateMetadata` → `canonical: \`/drop-off-charges/${airport}\`` (the `airport` slug is already destructured)
- `apps/parkmath/app/airport-parking/[airport]/page.tsx` → `canonical: \`/airport-parking/${airport}\``
- `apps/parkmath/app/airport-parking/[airport]/[duration]/page.tsx` → `canonical: \`/airport-parking/${airport}/${duration}\`` (read its `generateMetadata` for the param names)
- `apps/parkmath/app/airport-lounges/[airport]/page.tsx` → `canonical: \`/airport-lounges/${airport}\``

Example (drop-off `[airport]`, whose `generateMetadata` returns `{ title, description }`):
```tsx
  return {
    title: `${data.airport.name} drop-off charge 2026 — fee, limit & free alternative`,
    description: `${data.airport.name} drop-off: ${data.record.feeSummary}. Penalty, payment deadline, Blue Badge rules and how to avoid the fee — verified ${data.record.verifiedAt}.`,
    alternates: { canonical: `/drop-off-charges/${airport}` }
  };
```
(Note the **shortened title** — see Step 4.)

- [ ] **Step 3: News article OpenGraph**

In `apps/parkmath/app/news/[id]/page.tsx` `generateMetadata`, return:

```tsx
  return {
    title: `${item.title} — ParkMath update`,
    description: item.summary,
    alternates: { canonical: `/news/${id}` },
    openGraph: { type: "article", publishedTime: item.publishedAt, modifiedTime: item.verifiedAt }
  };
```

- [ ] **Step 4: Shorten overflowing titles**

- Drop-off `[airport]` (Step 2 example): `${name} drop-off charge 2026 — fee, limit & free alternative` (was "…fee, time limit & the free alternative", ~60 vs ~87 chars).
- Read the lounge `[airport]`, lounge index, and parking `[airport]` titles; trim any > ~62 chars by removing filler (keep the keyword + year front-loaded). Keep each unique.

- [ ] **Step 5: Typecheck + commit**

Run: `pnpm --filter parkmath typecheck`
```bash
git add apps/parkmath/app
git commit -m "feat(parkmath): self-referencing canonicals + OpenGraph + trimmed titles"
```

---

## Task 3: Security headers

**Files:** `apps/parkmath/next.config.ts`

- [ ] **Step 1: Add `headers()`**

Replace `apps/parkmath/next.config.ts` with:

```ts
import type { NextConfig } from "next";

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com https://www.dwin1.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "connect-src 'self' https://cloudflareinsights.com https://static.cloudflareinsights.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests"
].join("; ");

const nextConfig: NextConfig = {
  transpilePackages: ["@mathfamily/ui", "@mathfamily/engine", "@mathfamily/data", "@mathfamily/geo"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Content-Security-Policy", value: csp }
        ]
      }
    ];
  }
};

export default nextConfig;
```

- [ ] **Step 2: Build locally to confirm the config is valid**

Run: `pnpm --filter parkmath typecheck`
Expected: clean. (The CSP is **mandatorily verified for zero console violations on a Vercel preview in Task 8** before merge — do not skip that.)

- [ ] **Step 3: Commit**

```bash
git add apps/parkmath/next.config.ts
git commit -m "feat(parkmath): security headers (nosniff, Referrer-Policy, XFO, Permissions-Policy, HSTS, CSP)"
```

---

## Task 4: Answer-first index summaries + self-citing FAQ

**Files:** `apps/parkmath/lib/content.ts`; `apps/parkmath/tests/content.test.ts`; the three index pages.

- [ ] **Step 1: Write failing tests**

Add to `apps/parkmath/tests/content.test.ts` (create with the same import style as the existing parkmath tests if absent):

```ts
import { describe, expect, it } from "vitest";
import { dropOffIndexSummary, buildDropOffFaqs } from "../lib/content";

describe("dropOffIndexSummary", () => {
  it("summarises free count, cheapest paid and dearest", () => {
    const s = dropOffIndexSummary([
      { name: "Birmingham", isFree: true, feePence: 0 },
      { name: "Inverness", isFree: true, feePence: 0 },
      { name: "Bristol", isFree: false, feePence: 850 },
      { name: "Gatwick", isFree: false, feePence: 1000 }
    ]);
    expect(s).toContain("2 of 4");
    expect(s).toContain("Bristol");
    expect(s).toContain("£8.50");
    expect(s).toContain("Gatwick");
    expect(s).toContain("£10.00");
  });
});

describe("buildDropOffFaqs fee answer", () => {
  it("cites the verified date and the official source", () => {
    const faqs = buildDropOffFaqs({ feeSummary: "£6 for 15 minutes", verifiedAt: "2026-06-10", paymentDeadline: null, penaltyNotes: null, blueBadgePolicy: "x", freeAlternative: null, bands: [], priorYearFeePence: null, isFree: false, penaltyPence: null } as never, "Test Airport");
    expect(faqs[0]!.answer).toContain("verified 2026-06-10");
    expect(faqs[0]!.answer).toContain("official Test Airport");
  });
});
```

- [ ] **Step 2: Run — expect FAIL** (`dropOffIndexSummary` not exported; FAQ answer is bare).

Run: `pnpm --filter parkmath test`

- [ ] **Step 3: Implement in `apps/parkmath/lib/content.ts`**

Add the helper and update the FAQ answer:

```ts
export function dropOffIndexSummary(rows: { name: string; isFree: boolean; feePence: number }[]): string {
  const freeCount = rows.filter((r) => r.isFree).length;
  const paid = rows.filter((r) => !r.isFree).sort((a, b) => a.feePence - b.feePence);
  if (paid.length === 0) return `All ${rows.length} major UK airports let you drop off free.`;
  const cheapest = paid[0]!;
  const dearest = paid[paid.length - 1]!;
  return `${freeCount} of ${rows.length} major UK airports let you drop off free. Of those that charge, the cheapest is ${cheapest.name} at ${formatPence(cheapest.feePence)}; the most expensive is ${dearest.name} at ${formatPence(dearest.feePence)} (per drop-off, 2026).`;
}
```

And change the first FAQ (line 6) to:

```ts
    { question: `How much is the drop-off charge at ${airportName}?`, answer: `${record.feeSummary} (verified ${record.verifiedAt}, per the official ${airportName} page).` },
```

- [ ] **Step 4: Render the summary above the drop-off index table**

In `apps/parkmath/app/drop-off-charges/page.tsx`, import `dropOffIndexSummary` from `@/lib/content`, and inside the `<header>` (after `<FreshnessBadge/>`, before `</header>`) add:

```tsx
        <p className="text-lead text-ink">
          {dropOffIndexSummary(records.map((r) => ({ name: airports.get(r.airportSlug)?.name ?? r.airportSlug, isFree: r.isFree, feePence: r.bands[0]?.totalPence ?? 0 })))}
        </p>
```
Then add an `<h2 className="text-h2 font-semibold text-ink">Every UK airport, compared</h2>` immediately before `<SortableFeeTable rows={rows} />`.

- [ ] **Step 5: Parking + lounge index intros**

In `apps/parkmath/app/airport-parking/page.tsx`, after `<FreshnessBadge/>` inside `<header>`, add an answer-first sentence from the existing `rows` (compute the cheapest across airports):
```tsx
        <p className="text-lead text-ink">
          {(() => {
            const priced = rows.filter((r) => r.cheapest);
            const min = priced.reduce((m, r) => (r.cheapest!.totalPence < m.totalPence ? { name: r.name, totalPence: r.cheapest!.totalPence } : m), { name: "", totalPence: Number.POSITIVE_INFINITY });
            return min.name ? `Pre-booking beats the drive-up gate price at every UK airport we track. The cheapest 7-day pre-book is ${formatPence(min.totalPence)} at ${min.name}.` : "Compare gate vs pre-book parking prices at every major UK airport.";
          })()}
        </p>
```
Read `apps/parkmath/app/airport-lounges/page.tsx` and add an analogous one-sentence intro derived from its existing rows (cheapest published lounge from-price across airports; if none priced, a definite "walk-in prices aren't published — membership may beat per-visit" sentence). Add an `<h2>` over each index table too.

- [ ] **Step 6: Run tests + typecheck**

Run: `pnpm --filter parkmath test && pnpm --filter parkmath typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/parkmath/lib/content.ts apps/parkmath/tests/content.test.ts apps/parkmath/app/drop-off-charges/page.tsx apps/parkmath/app/airport-parking/page.tsx apps/parkmath/app/airport-lounges/page.tsx
git commit -m "feat(parkmath): answer-first index summaries + self-citing drop-off FAQ"
```

---

## Task 5: LCP font preload

**Files:** `apps/parkmath/app/layout.tsx`

- [ ] **Step 1: Stop preloading the mono font**

In `apps/parkmath/app/layout.tsx`, add `preload: false` to the `IBM_Plex_Mono` call (leave `IBM_Plex_Sans` as-is so its 600/700 weights stay in the preload budget):

```tsx
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-mono", preload: false });
```

- [ ] **Step 2: Typecheck + commit**

Run: `pnpm --filter parkmath typecheck`
```bash
git add apps/parkmath/app/layout.tsx
git commit -m "perf(parkmath): stop preloading mono font so the LCP H1 (Plex Sans) preloads"
```

- [ ] **Step 3: Preview-verify (in Task 8)**

On the Vercel preview, confirm the document head preloads a Plex **Sans** woff2 and no mono ones. *If the Sans 700 weight still isn't preloaded*, add an explicit `<link rel="preload" as="font" type="font/woff2" crossorigin href="<observed Sans-700 url>">` in `<head>` and re-verify.

---

## Task 6: Accessibility — skip link + `/news` heading

**Files:** `apps/parkmath/app/layout.tsx`; `packages/ui/src/news-card.tsx`; `packages/ui/tests/news.test.tsx`; `apps/parkmath/app/news/page.tsx`

- [ ] **Step 1: Write the failing NewsCard test**

In `packages/ui/tests/news.test.tsx` (the existing news component test — add to it; it uses the jsdom docblock + `@testing-library/react`), add:

```tsx
import { NewsCard } from "../src/news-card";
// ...
it("renders an h2 headline when headingLevel='h2'", () => {
  const item = { id: "x", airportSlug: null, category: "other", title: "T", summary: "S", body: null, change: null, sourceUrl: "https://x", sourceLabel: "x", publishedAt: "2026-06-01", verifiedAt: "2026-06-01", supersedes: null } as never;
  const { container } = render(<NewsCard item={item} href="/news/x" headingLevel="h2" />);
  expect(container.querySelector("h2")).not.toBeNull();
  expect(container.querySelector("h3")).toBeNull();
});
```

- [ ] **Step 2: Run — expect FAIL** (`headingLevel` not a prop; renders `h3`).

Run: `pnpm --filter @mathfamily/ui test`

- [ ] **Step 3: Add the `headingLevel` prop to `NewsCard`**

In `packages/ui/src/news-card.tsx`, change the signature and the heading element:

```tsx
export function NewsCard({ item, href, headingLevel = "h3" }: { item: NewsItem; href: string; headingLevel?: "h2" | "h3" }) {
```
and replace the `<h3 …>{item.title}</h3>` (line 22) with:
```tsx
        {headingLevel === "h2"
          ? <h2 className="mt-2 text-base font-semibold text-ink">{item.title}</h2>
          : <h3 className="mt-2 text-base font-semibold text-ink">{item.title}</h3>}
```

- [ ] **Step 4: `/news` hub passes `headingLevel="h2"`**

In `apps/parkmath/app/news/page.tsx` change the card render (line 47) to:
```tsx
            <NewsCard key={i.id} item={i} href={`/news/${i.id}`} headingLevel="h2" />
```

- [ ] **Step 5: Skip-to-content link + `<main id>`**

In `apps/parkmath/app/layout.tsx`: change `<main className="mx-auto max-w-5xl px-4 py-8">` to `<main id="main" className="mx-auto max-w-5xl px-4 py-8">`, and add — as the **first** child of `<body>** (before the `<noscript>`)** — :
```tsx
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-brand-accent focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white">Skip to content</a>
```

- [ ] **Step 6: Run tests + typecheck**

Run: `pnpm --filter @mathfamily/ui test && pnpm --filter parkmath typecheck`
Expected: PASS (UI news test + the rest).

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/news-card.tsx packages/ui/tests/news.test.tsx apps/parkmath/app/news/page.tsx apps/parkmath/app/layout.tsx
git commit -m "feat(a11y): skip-to-content link + valid /news heading outline"
```

---

## Task 7: Caret-pin `latest` deps

**Files:** `apps/parkmath/package.json`, `apps/roammath/package.json`

- [ ] **Step 1: Read installed versions**

Run: `pnpm --filter parkmath ls next react react-dom --depth 0` (or read `pnpm-lock.yaml`) to get the resolved versions (e.g. `next 16.2.9`, `react 19.2.0`, `react-dom 19.2.0`).

- [ ] **Step 2: Replace `"latest"` with caret ranges**

In `apps/parkmath/package.json` and `apps/roammath/package.json`, change the `dependencies` entries from `"next": "latest"`, `"react": "latest"`, `"react-dom": "latest"` to caret ranges pinned to the installed majors/minors, e.g. `"next": "^16.2.9"`, `"react": "^19.2.0"`, `"react-dom": "^19.2.0"` (use the actual versions from Step 1).

- [ ] **Step 3: Verify install is unchanged + typecheck**

Run: `pnpm install --frozen-lockfile && pnpm --filter parkmath typecheck`
Expected: lockfile unchanged (already resolves to those versions); typecheck clean.

- [ ] **Step 4: Commit**

```bash
git add apps/parkmath/package.json apps/roammath/package.json pnpm-lock.yaml
git commit -m "chore: caret-pin next/react/react-dom (was \"latest\") to prevent silent major bumps"
```

---

## Task 8: Full gate + live/preview verification + finish

- [ ] **Step 1: Full gate**

Run:
```bash
pnpm --filter parkmath test && pnpm --filter parkmath typecheck && \
pnpm --filter @mathfamily/ui test && pnpm --filter @mathfamily/ui typecheck && \
pnpm --filter @mathfamily/geo test && pnpm --filter @mathfamily/geo typecheck
```
Expected: all PASS.

- [ ] **Step 2: Push the branch and get a Vercel preview**

```bash
git push -u origin feat/seo-fixes-batch-1
```
Find the preview deployment (via the Vercel MCP `list_deployments` for project `prj_FOhagNfrcsDa1gm8Uip2A8GbEpUZ`, the `target: null` branch deploy).

- [ ] **Step 3: VERIFY ON THE PREVIEW (mandatory before merge)**

On the preview URL:
1. **CSP — zero console violations.** Load home, a drop-off airport page, a parking page, `/news`, and `/news/<id>`; confirm the browser console (or the deployed HTML + a headless check) shows **no `Content-Security-Policy` violation** and that the Cloudflare beacon, Google Fonts, JSON-LD, and the calculators all work. If anything is blocked, widen the matching CSP directive and re-verify. **Do not merge with violations.**
2. **Canonicals + og:url:** each page's HTML has exactly one `<link rel="canonical" href="https://www.parkmath.co.uk/<path>">` and a matching `og:url`.
3. **Security headers:** `curl -sI <preview>/` shows `content-security-policy`, `x-frame-options`, `x-content-type-options`, `referrer-policy`, `permissions-policy`, `strict-transport-security`.
4. **Schema:** the Organization JSON-LD appears once sitewide; a `/news/<id>` NewsArticle now has `image` + `author` + publisher `@id`.
5. **Font:** head preloads a Plex **Sans** woff2 (apply Task 5 Step 3 fallback if not).
6. **Index summary** + **skip link** + **`/news` H1→H2** render.

- [ ] **Step 4: Finish**

Use the **superpowers:finishing-a-development-branch** skill (tests already verified) and complete per the user's choice.

---

## Self-Review

**1. Spec coverage:** Canonical+OG (Task 2) ✓ · security headers/CSP (Task 3) ✓ · Organization+NewsArticle schema (Task 1) ✓ · index answer-first + FAQ date (Task 4) ✓ · LCP font preload (Task 5) ✓ · skip link + `/news` heading (Task 6) ✓ · title trims (Task 2) ✓ · dep caret-pin (Task 7) ✓ · guardrails restated in header; verification gate (Task 8) ✓. Deferred items explicitly out of scope.

**2. Placeholder scan:** No TBD/TODO. The two "read the file then add the analogous intro/title" steps (lounge index intro, lounge/parking title trims, dep versions) are concrete actions on specified files with the exact pattern given, not placeholders. CSP/font verification are real preview steps.

**3. Type consistency:** `organizationLd`/`datasetLd`/`newsArticleLd` signatures defined in Task 1 match the call-site updates (Task 1 Step 4). `dropOffIndexSummary(rows: {name,isFree,feePence}[])` matches its test (Task 4 Step 1) and call site (Step 4). `NewsCard` `headingLevel?: "h2"|"h3"` matches its test + the hub call (Task 6). `alternates.canonical` strings are exact per route (Task 2). Organization `@id` = `${siteUrl}/#organization` is identical across builder, call sites, and tests.
