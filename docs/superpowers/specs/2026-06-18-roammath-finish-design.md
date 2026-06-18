# RoamMath Finish Sprint — Affiliate Activation + Home Redesign + EsimPickCard

**Date:** 2026-06-18
**Approved through brainstorming with Mike.**
**Scope:** Polish and monetise RoamMath as-built. No new routes or datasets. Three deliverables: affiliate layer live, home calculator hero, EsimPickCard component.

---

## 1. Context and current state

RoamMath has a full routing structure (`/`, `/roaming`, `/roaming/[country]`, `/roaming/[country]/[network]`, `/baggage-fees`, `/baggage-fees/[airline]`), complete datasets (`roaming.json`, `esim.json`, `baggage.json`), a working `roamingTripCost` engine, and well-structured country hub pages. Two things prevent it from being "finished":

1. **All three affiliate partners are `active: false` with empty `deeplinkTemplate`** — zero revenue.
2. **The home page is a basic pill grid** — no interactive entry point, no calculator, no visual hierarchy.

This spec fixes both, plus upgrades the bare `AffiliateBlock` link into a proper `EsimPickCard` component.

**Out of scope (stay deferred):** card-fees-abroad, `/abroad/[country]` mirror, per-network spoke page audit, MailerLite activation.

---

## 2. Affiliate layer

### 2.1 Programmes to join (Mike's action items)

| Provider | Sign-up URL | Commission | Notes |
|---|---|---|---|
| Airalo | `partners.airalo.com` | ~10% | Largest catalogue (190+ countries), clean deeplink format, most mature programme. Issues `partner_code` + per-country links. |
| Saily | `saily.com/affiliate` | varies | NordVPN-backed, runs on Impact Radius. Strong EU/US coverage. |
| Holafly | `holafly.com/affiliate` | ~15% | Unlimited-data differentiator. Direct programme or Commission Junction. |

**None are on AWIN.** AWIN does not carry eSIM providers. All three are direct or via Impact/CJ.

After signing up to each, fill in the `deeplinkTemplate` in `partners.json` and flip `active: true`. The code is already wired to fall back to the official site while inactive — so deploying this spec with all three still `active: false` is safe.

### 2.2 `partners.json` — new structure

Replace the current slot-array model with a provider-keyed map. The eSIM slot is implicit — resolved by matching `esimChoice.provider` from the engine result.

```json
{
  "partners": {
    "airalo": {
      "name": "Airalo",
      "active": false,
      "deeplinkTemplate": "",
      "trackingNote": "fill after partners.airalo.com signup — use {countrySlug} and {clickref}"
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

`deeplinkTemplate` supports `{countrySlug}` and `{clickref}` substitutions. `clickref` is set to `esim-{countrySlug}` for per-destination attribution tracking (mirrors ParkMath's clickref pattern).

### 2.3 `resolveSlot` — updated signature and logic

```ts
// apps/roammath/lib/partners.ts
export function resolveSlot(
  providerName: string | null,
  countrySlug: string,
  officialUrl: string
): ResolvedSlot
```

Logic:
1. If `providerName` is null → return official fallback immediately.
2. Look up `partners[providerName.toLowerCase()]`.
3. If found, `active: true`, and `deeplinkTemplate` starts with `"http"` → substitute `{countrySlug}` and `{clickref}` → return affiliate result.
4. Otherwise → return official fallback.

The old `slots` array and `SlotConfig` interface are removed. `SlotId` type is removed (slot type is now always `"esim"`, implicit from the call site).

### 2.4 Call site on the country page

```tsx
// /roaming/[country]/page.tsx — existing line:
<AffiliateBlock slotId="esim" airportSlug={destination.countrySlug} officialUrl={esim.sourceUrl} />

// replaced with:
<AffiliateBlock
  providerName={m.esimChoice?.provider ?? null}
  countrySlug={destination.countrySlug}
  officialUrl={esim?.sourceUrl ?? ""}
  bundleName={m.esimChoice?.bundleName ?? null}
  totalPence={m.esimChoice?.totalPence ?? null}
  countryName={destination.countryName}
/>
```

`AffiliateBlock` calls `resolveSlot` and passes resolved props into `EsimPickCard` (§4).

---

## 3. Home page redesign

### 3.1 Architecture

The home page stays a server component. It serialises destination data and eSIM records into plain JSON props, which it passes to a `HomeTripCalculator` client island. No data loading happens on the client — the island receives everything it needs as props.

### 3.2 Page structure (top → bottom)

```
[Hero section]
  H1: "What does your phone cost abroad?"
  Subhead: (existing verified-data copy, unchanged)

[HomeTripCalculator — 'use client' island]
  Input row: destination <select> | days slider (1–30, default 7) | data presets (1 · 3 · 5 · 10 GB, default 5)
  Default: Spain / 7 days / 5 GB (matches existing StatStrip example — not blank on load)
  
  Inline result (rendered from engine, no navigation):
  ┌── Cheapest network ─────┐  ┌── Best eSIM ─────────────┐
  │  £0  (Three)            │  │  £14.99  (Airalo)        │
  │  Included in plan       │  │  5 GB · 7-day bundle     │
  └─────────────────────────┘  └──────────────────────────┘
  "See full breakdown for Spain →"  (href="/roaming/{countrySlug}")

[StatStrip — moved below calculator, kept unchanged]

[40 destinations pill grid — kept, secondary browsing]

[Baggage fees CTA + EmailCaptureSlot + FamilyLinks — kept]
```

### 3.3 `HomeTripCalculator` implementation

**File:** `apps/roammath/components/home-trip-calculator.tsx`

**Props:**
```ts
interface HomeTripCalculatorProps {
  destinations: Array<{
    countrySlug: string;
    countryName: string;
    iso2: string;
    perNetwork: NetworkEntry[];
  }>;
  esimRecords: Array<{
    countrySlug: string;
    bundles: EsimBundle[];
  }>;
}
```

**Behaviour:**
- State: `selectedSlug`, `days` (number), `dataGb` (number).
- On any state change: call `roamingTripCost(perNetwork, bundles, days, dataGb)` synchronously — engine is a pure function, instant.
- Renders two result mini-cards (cheapest network, best eSIM) using simple styled divs. Not `EsimPickCard` — that's the full affiliate card for country pages. Home cards are lightweight display only.
- "See full breakdown" link: `href={/roaming/${selectedSlug}}`. Days/GB are **not** passed as query params (inline results = no navigation; the link is secondary). Keeps the implementation simple.
- Destination select: plain `<select>` (40 destinations, alphabetical). Accessible, no JS bundle overhead from a combobox library.
- Days: `<input type="range" min={1} max={30} />` with a numeric readout.
- Data presets: four `<button>` toggles (1 / 3 / 5 / 10 GB).

**Server home page change:** the Spain stat computation (lines 16–63 of current `page.tsx`) is kept as-is — it feeds the `StatStrip` which stays unchanged. The `HomeTripCalculator` island computes Spain/7d/5GB independently on the client using the same engine, so the default inline result matches what the StatStrip already shows. No duplication problem: server renders one and client hydrates the other.

---

## 4. EsimPickCard component

**File:** `packages/ui/src/EsimPickCard.tsx`
**Export:** added to `packages/ui/src/index.ts`

### 4.1 Props

```ts
interface EsimPickCardProps {
  providerName: string | null;        // null → official fallback mode
  bundleName: string | null;
  totalPence: number | null;
  countryName: string;
  affiliateUrl: string;               // affiliate URL or official URL
  disclosureRequired: boolean;        // true only when affiliateUrl is affiliate
}
```

### 4.2 Visual design

```
┌─────────────────────────────────────────────────────┐
│  ✦ Best eSIM pick              [teal accent border]  │
│                                                     │
│  Airalo                        [provider name, bold]│
│  £14.99                        [FeeStat-scale text] │
│  Spain · 5 GB · 7-day bundle   [muted subtitle]     │
│                                                     │
│  [  Buy with Airalo  ↗  ]      [teal filled button] │
│                                                     │
│  Affiliate link — RoamMath may earn a commission    │  ← only when disclosureRequired
│  at no cost to you. This never affects rankings.   │
└─────────────────────────────────────────────────────┘
```

**Fallback (no active affiliate):**
```
┌─────────────────────────────────────────────────────┐
│  eSIM option                                        │
│  [  Check live eSIM prices  ↗  ]                   │
│  (no disclosure, no "Best pick" badge)              │
└─────────────────────────────────────────────────────┘
```

The `"Best eSIM pick"` badge only renders when `disclosureRequired` is true (i.e. an affiliate link is active). The badge is honest: it's the cheapest eSIM the engine found, not a sponsored placement.

### 4.3 `AffiliateBlock` refactor

`apps/roammath/components/affiliate-block.tsx` is refactored to:
1. Call `resolveSlot(providerName, countrySlug, officialUrl)` to get `ResolvedSlot`.
2. Map `ResolvedSlot` fields to `EsimPickCard` props.
3. Render `<EsimPickCard>`.

The component name `AffiliateBlock` is kept at the call site (no changes to the country page import) — it just renders richer markup inside.

---

## 5. Testing

### Unit tests

| Test file | What it covers |
|---|---|
| `packages/ui/tests/EsimPickCard.test.tsx` | Renders affiliate variant: "Best eSIM pick" badge present, button text "Buy with Airalo", disclosure text present. Renders fallback: no badge, no disclosure, "Check live eSIM prices" text. Uses `// @vitest-environment jsdom`. |
| `apps/roammath/tests/partners.test.ts` | `resolveSlot("Airalo", "spain", url)` → affiliate result when partner active. `resolveSlot("Airalo", ...)` → fallback when `active: false`. `resolveSlot(null, ...)` → fallback. Unknown provider name → fallback. |
| `apps/roammath/tests/roaming-answer.test.tsx` | Extend existing smoke test: rendered HTML contains `EsimPickCard` fallback markup (official link) when no active affiliate. |
| `apps/roammath/tests/home-trip-calculator.test.tsx` | Not needed — client island, covered by E2E or manual test. Add a note in the test directory. |

### Acceptance criteria

- `pnpm test` and `pnpm typecheck` pass across all workspaces.
- `pnpm build` shows `/`, `/roaming`, `/roaming/[country]` as static (`●`).
- Home page: Spain / 7 days / 5 GB inline result renders on load (default state visible without interaction).
- Country page: `EsimPickCard` renders in fallback mode (all partners still `active: false` at ship time); flips to affiliate mode when a partner is activated in `partners.json` without any code change.
- `resolveSlot` with an active partner and a `deeplinkTemplate` containing `{countrySlug}` + `{clickref}` returns the substituted URL.

---

## 6. Activation runbook (Mike's steps after signing up)

For each provider after approval:
1. Obtain the deeplink base URL and any required tracking params from the partner dashboard.
2. In `apps/roammath/lib/partners.json`, set `deeplinkTemplate` to the full URL with `{countrySlug}` and `{clickref}` placeholders where the provider supports them.
3. Set `active: true` for that provider.
4. Open a PR — the diff is one JSON file. Merge triggers a Vercel redeploy. No code change required.

**Affiliate links must not appear in social/forum/email copy** (same rule as ParkMath/Holiday Extras). On-site only, with disclosure rendered by `EsimPickCard`.

---

## 7. Out of scope

- Card-fees-abroad (`/card-fees-abroad/[bank]`) — deferred.
- RoamMath `/abroad/[country]` mirror — deferred.
- Per-network spoke page (`/roaming/[country]/[network]`) audit — deferred.
- MailerLite activation — deferred (slot already wired, inert).
- Combobox search for destination select — YAGNI at 40 destinations; revisit at 80+.
