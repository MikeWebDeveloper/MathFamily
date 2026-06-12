# ParkMath Affiliate Activation — Design Spec

*Activate AWIN affiliate links on ParkMath parking pages — one featured, fully-disclosed
Holiday Extras CTA per airport — and fix the production OG-image absolute URLs. ParkMath-scoped;
RoamMath and the lounge slot are untouched. Built so per-airport / highest-commission routing is a
later additive change, not a restructure.*

## Product intent

The affiliate skeleton already exists (`lib/partners.ts` `resolveSlot` + `partners.json` +
`AffiliateBlock`, rendered on parking/lounge pages) but ships inert. Three AWIN merchants were
approved (2026-06-12). This spec turns the skeleton on for **parking** with a single featured
merchant, correctly and compliantly, so the site earns commission on pre-book clicks without
compromising its impartial-comparison trust model.

## Decisions locked (with rationale)

- **Single featured merchant = Holiday Extras** (`awinmid 3496`). The other two approved merchants
  — Purple Parking (`12028`) and Airparks (`3494`) — are **the same company** (Holiday Extras owns
  both; same AWIN account managers). Presenting them as rival "compare" options would be misleading,
  which a trust-first comparison brand cannot do. So we feature one and keep the siblings in config,
  inactive, for later. HE also has the only rate upside (gated 2–15% band vs flat 2%); all three
  share a 30-day cookie.
- **Bare `cread.php` deep links, no `ued`.** A bare link is fully tracked and lands the user on the
  merchant's default landing page. `clickref=parkmath-<airportSlug>` carries per-airport
  attribution into AWIN reporting. (`clickref` ≤50 chars, lowercase alnum + `-` — guaranteed by our
  `Slug` zod type.) The `ued` destination parameter is **out of scope for v1**; when adopted later it
  MUST be `encodeURIComponent`-encoded and point at a *merchant* URL (never the airport's own site).
- **AWIN Publisher MasterTag is OPTIONAL — ship the seam OFF.** A `cread.php` click earns commission
  on its own (the advertiser's conversion tag credits publisher `2932035`); the publisher MasterTag
  is not in the attribution loop. Adding it later only recovers ~4–5% of clicks lost to browser
  cookie-blocking (ITP). The pasted plan's "required for attribution" is wrong.
- **Canonical domain = `https://www.parkmath.co.uk`.** The apex 308-redirects to `www`, so
  `NEXT_PUBLIC_SITE_URL` must be the `www` form or OG/canonical URLs fight the redirect.
- **Disclosure must be ASA/CMA-compliant.** Current wording fails. Required: lead with a recognised
  **"Ad"** label (ASA rules "affiliate" alone insufficient), and say **"earns"** not "may earn" (ASA
  ruled "may earn" misleading). `rel="sponsored"` is an SEO signal only — kept, but it is not
  disclosure. The price ranking stays commission-blind (it already is — prices come from the
  airport's own portal, not affiliates), so "never affects which we show as cheapest" is literally true.

*Sources:* [AWIN — affiliate link format](https://success.awin.com/articles/en_US/Knowledge/What-does-an-affiliate-link-look-like) ·
[AWIN — click reference](https://success.awin.com/articles/en_US/Knowledge/What-is-click-reference-and-what-can-I-use-this-for) ·
[AWIN — Bounceless tracking](https://www.awin.com/us/news-and-events/awin-news/awin-launches-bounceless-tracking-for-all-publishers) ·
[ASA — Affiliate marketing](https://www.asa.org.uk/advice-online/affiliate-marketing.html) ·
[ASA — Recognising ads](https://www.asa.org.uk/advice-online/recognising-ads-social-media.html) ·
[CMA — Online choice architecture](https://www.gov.uk/government/collections/online-choice-architecture)

---

## Architecture — five units

Changes are in `apps/parkmath`, plus **one** additive, null-safe touch to the shared
`packages/ui/src/site-analytics.tsx` (unit 4) — inert until its env var is set, so it stays safe for
RoamMath. RoamMath's own `lib/partners.*` and `components/affiliate-block.tsx` copies are left exactly
as they are.

### 1. Data model — `apps/parkmath/lib/partners.json`

Replace the free-form `deeplinkTemplate` (the URL-encoding footgun) with **structured AWIN config**.
The slot's `partnerIds` is an ordered list; the link is built in code from `awinmid` + `publisherId`.

```json
{
  "awin": { "publisherId": "2932035" },
  "partners": {
    "holiday-extras": { "name": "Holiday Extras", "awinmid": "3496",  "active": true  },
    "purple-parking": { "name": "Purple Parking", "awinmid": "12028", "active": false },
    "airparks":       { "name": "Airparks",       "awinmid": "3494",  "active": false },
    "priority-pass":  { "name": "Priority Pass",   "awinmid": null,    "active": false }
  },
  "slots": [
    { "id": "parking-prebook",   "partnerIds": ["holiday-extras"], "active": true  },
    { "id": "lounge-membership", "partnerIds": ["priority-pass"],  "active": false }
  ]
}
```

Reactivating a sibling later = flip its `active` and add its id to a slot's `partnerIds`. Per-airport
routing later = add an optional `airportOverrides` map to a slot (designed for, not built — see Future).

### 2. Link builder + `resolveSlot` — `apps/parkmath/lib/partners.ts`

`resolveSlot` keeps its **current signature and `ResolvedSlot` shape** — the diff is internal:

```ts
export type SlotId = "parking-prebook" | "lounge-membership";

export interface ResolvedSlot {
  kind: "affiliate" | "official";
  url: string;                 // built AWIN link (affiliate) | officialUrl (official)
  label: string;
  partnerName: string | null;
  disclosureRequired: boolean;
}

// Pure, unit-tested. clickref tags every click with its airport for AWIN reporting.
export function buildAwinLink(args: {
  awinmid: string; publisherId: string; airportSlug: string; ued?: string;
}): string {
  const params = new URLSearchParams({
    awinmid: args.awinmid,
    awinaffid: args.publisherId,
    clickref: `parkmath-${args.airportSlug}`,
  });
  if (args.ued) params.set("ued", args.ued); // URLSearchParams encodes the destination
  return `https://www.awin1.com/cread.php?${params.toString()}`;
}
```

`resolveSlot(slotId, airportSlug, officialUrl)`:
- Find the slot. If `slot.active`, take the **first** `partnerId` whose partner is `active` and has a
  non-null `awinmid`.
- If found → `kind:"affiliate"`, `url = buildAwinLink({ awinmid, publisherId, airportSlug })`,
  `partnerName = partner.name`, `disclosureRequired = true`,
  `label = \`Pre-book & compare prices with ${partner.name}\``.
- Otherwise → `kind:"official"`, `url = officialUrl`, `partnerName = null`,
  `disclosureRequired = false`, `label = "Check live prices on the official site"`.

(Using `URLSearchParams` means even the v1 params are correctly encoded, and the `ued` path is safe
by construction — no manual `replaceAll`.)

### 3. `AffiliateBlock` UI — `apps/parkmath/components/affiliate-block.tsx`

Single-link structure (unchanged shape), with compliant disclosure:

- **Affiliate mode:** a small **"Ad"** chip at the top-left of the card (uppercase, bordered, muted —
  tasteful, not a banner); the primary CTA button (`slot.label ↗`, `target="_blank"`,
  `rel="sponsored noopener noreferrer"`); then an always-visible disclosure paragraph **adjacent and
  below** (not collapsed/tooltip'd):
  > Affiliate link — if you book through **{partnerName}**, ParkMath **earns** a commission, at no
  > cost to you. We rank parking options by price only; this never affects which we show as cheapest.
- **Official mode:** unchanged (single "Check live prices on the official site" link, no chip, no
  disclosure).
- Accessibility: ≥44px target, ≥4.5:1 contrast on the chip and disclosure, reduced-motion-safe.

### 4. AWIN MasterTag seam — `packages/ui/src/site-analytics.tsx`

Extend the existing analytics seam. (This is the one shared-package touch — additive, null-safe,
inert until its env var is set, so it is safe for RoamMath too.)

```tsx
export function SiteAnalytics() {
  const cfToken = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;
  const awinPubId = process.env.NEXT_PUBLIC_AWIN_PUBLISHER_ID;
  return (
    <>
      {cfToken ? (
        <script defer src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon={JSON.stringify({ token: cfToken })} />
      ) : null}
      {awinPubId ? (
        <script defer src={`https://www.dwin1.com/${awinPubId}.js`} type="text/javascript" />
      ) : null}
    </>
  );
}
```

Ship with `NEXT_PUBLIC_AWIN_PUBLISHER_ID` **unset** → renders nothing. Optional post-launch toggle.

### 5. OG-image fix — Vercel config, no code

`metadataBase` + the `opengraph-image.tsx` routes already exist; they resolve against `localhost` in
prod only because the env var is unset. Fix: set **`NEXT_PUBLIC_SITE_URL=https://www.parkmath.co.uk`**
in Vercel → redeploy → verify a share-preview (and `<meta property="og:image">`) resolves to an
absolute `https://www.parkmath.co.uk/...` URL.

---

## Data flow

Airport parking page → `<AffiliateBlock slotId="parking-prebook" airportSlug officialUrl={record.sourceUrl}/>`
→ `resolveSlot` reads `partners.json` → (active) `buildAwinLink` → user clicks the "Ad"-labelled
`cread.php?...&clickref=parkmath-<airport>` link → AWIN redirect sets `awc` → lands on Holiday Extras
→ HE's conversion tag credits publisher `2932035`, attributed to the airport via `clickref`.

The lounge page's `slotId="lounge-membership"` slot is inactive → `resolveSlot` returns `kind:"official"`
→ unchanged Priority-Pass official link, no chip, no disclosure.

## Testing

Configless vitest (jsdom docblock + `afterEach(cleanup)`; **never** create a vitest/vite config on this
volume).

- **`apps/parkmath/tests/partners.test.ts`** (rewrite — the current "never affiliate while inactive"
  asserts the *old* inert state and must change):
  - `parking-prebook` → `kind:"affiliate"`, `partnerName:"Holiday Extras"`,
    `url` contains `awinmid=3496`, `awinaffid=2932035`, `clickref=parkmath-gatwick`, and **no `ued`**.
  - `lounge-membership` → `kind:"official"`, `url === officialUrl`, `disclosureRequired === false`.
  - Guard: every `active` partner has a non-null `awinmid`; `awin.publisherId` is present.
- **`buildAwinLink` unit test:** correct base params for a v1 link; and the `ued` path
  percent-encodes a destination containing `?a=1&b=2` (asserts the raw `&` does not leak into the
  cread.php query).
- **`AffiliateBlock` component test:** affiliate mode renders the "Ad" chip, a `rel="sponsored"` CTA,
  and the visible disclosure containing "earns" (not "may earn"); official mode renders the single
  official link with no chip and no disclosure.
- Full gate after: `pnpm -w typecheck && pnpm -w test` green; existing ParkMath e2e unaffected.

## Scope

**In scope:** `partners.json` restructure; `resolveSlot` + `buildAwinLink`; `AffiliateBlock`
"Ad"-labelled compliant CTA; `SiteAnalytics` AWIN seam (off); tests; the `NEXT_PUBLIC_SITE_URL` +
optional `NEXT_PUBLIC_AWIN_PUBLISHER_ID` Vercel env settings (ops steps, listed for the user).

**Out of scope (now):**
- Purple Parking / Airparks live placement (same parent as HE — kept inactive in config).
- Lounge affiliates (Priority Pass not approved).
- `ued` deep-linking to merchant airport pages (bare links for v1).
- Real price comparison inside the affiliate block (no AWIN price feed).
- RoamMath affiliate activation (its copies inherit the pattern later; no approvals there yet).

**Future direction (designed-for, explicitly deferred):** *"push for highest commission on direct
parking booking."* The model supports it without a restructure — (a) per-airport routing via an
optional `airportOverrides` map on a slot (e.g. `heathrow → heathrow-official`), (b) EPC-driven
primary selection once real AWIN-dashboard EPC is known, (c) reactivating the sibling brands or a
genuinely-independent merchant as honestly-labelled secondary options. Each is an additive edit to
`partners.json` + `resolveSlot`.

## Success criteria

- Live OG previews resolve to absolute `www.parkmath.co.uk` URLs (no more `localhost`).
- Every ParkMath airport-parking page shows one "Ad"-labelled Holiday Extras pre-book CTA with the
  compliant disclosure; the lounge page is unchanged.
- Clicking the CTA hits `awin1.com/cread.php?...&clickref=parkmath-<airport>` and AWIN records the
  click against publisher `2932035` (verify one live click in the AWIN dashboard).
- Full test gate green; ranking remains commission-blind.
