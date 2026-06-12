# Affiliate Activation — Ops Runbook

## Vercel environment variables (set in the ParkMath project)

| Variable | Value | Purpose | Required? |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://www.parkmath.co.uk` | Fixes `metadataBase` so OG/canonical URLs are absolute (apex 308-redirects to `www`, so use the `www` form). | Yes — fixes broken social previews |
| `NEXT_PUBLIC_AWIN_PUBLISHER_ID` | `2932035` | Renders the AWIN publisher MasterTag. **Optional** — not needed to earn commission; recovers ~4–5% of clicks lost to browser cookie-blocking. | No (leave unset to ship the seam off) |

After setting `NEXT_PUBLIC_SITE_URL`, **redeploy**, then verify a share preview / `<meta property="og:image">`
resolves to an absolute `https://www.parkmath.co.uk/...` URL (not `localhost`).

## Go-live verification

1. Open any `/airport-parking/<airport>` page → the affiliate card shows an **Ad** chip, a
   "Pre-book & compare prices with Holiday Extras" link, and the "earns a commission" disclosure.
2. The link target is `https://www.awin1.com/cread.php?awinmid=3496&awinaffid=2932035&clickref=parkmath-<airport>`.
3. Click it once; confirm the click appears in the AWIN dashboard against publisher 2932035.
4. The `/airport-lounges/<airport>` page is unchanged (Priority Pass official link, no Ad chip).

## Changing this later

- **Swap the featured merchant / reorder:** edit `apps/parkmath/lib/partners.json` — `slots[parking-prebook].partnerIds`.
- **Reactivate Purple Parking / Airparks:** flip their `active` to `true` and add their ids to a slot's `partnerIds`
  (they are the same parent company as Holiday Extras — only present them as honestly-labelled "also from the
  Holiday Extras group", never as independent competitors).
- **Per-airport / highest-commission routing:** add an optional `airportOverrides` map to a slot and extend
  `resolveSlot` to consult it before the default `partnerIds` order (e.g. `heathrow → heathrow-official`).
- **Turn the AWIN MasterTag on:** set `NEXT_PUBLIC_AWIN_PUBLISHER_ID=2932035` in Vercel and redeploy.
