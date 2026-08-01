# Lounges & Priority Pass — verification research notes

Companion to `2026-06-drop-off-research-notes.md` and `2026-06-parking-research-notes.md`,
covering `packages/data/datasets/parkmath/lounges.json` and
`packages/data/datasets/parkmath/priority-pass.json`. Created on the 2026-08-01 sweep, when
these datasets first produced a correction.

---

## 2026-08-01 — daily ParkMath sweep (lounges + priority-pass)

In scope this run: every lounge/priority-pass record whose `verifiedAt` was older than 46
days (Heathrow, Gatwick and Birmingham lounges, and the Priority Pass tiers — all 2026-06-10),
plus the two No1 Lounges pages left `pendingSince` in `tools/freshness/hashes.json`.

### CHANGED

**`lounges:gatwick` → "No1 Lounge (North Terminal)" £38 → £40.**
Read from the operator's own location index,
`https://no1lounges.com/locations/london-gatwick/`, which lists the North Terminal lounges
as: "No1 Lounges at Gatwick North — Prices from: £40", "My Lounge at Gatwick North — Prices
from: £38", "Clubrooms at Gatwick North — Prices from: £44".

Worth flagging for whoever reviews: **£38 is now the price of a different lounge.** The
North Terminal No1 Lounge has moved to £40, and the £38 tier is now "My Lounge" (a separate
No1-operated brand at the same terminal, not currently in our dataset). So this is a genuine
+£2 move on the lounge we track, not a like-for-like renaming.

`notes` also extended to record the Priority Pass condition explicitly ("pre-bookings only"),
matching the sibling Club Aspire entry.

### Re-verified, unchanged

- **`lounges:gatwick` → "Club Aspire Lounge (South Terminal)" £34.**
  `https://no1lounges.com/lounges-by-location/club-aspire-at-gatwick-south/`: "Prices from:
  £34", and "We accept cardholders from: Priority Pass, Lounge Key, Dragonpass - pre-bookings
  only." Both entries in the record are therefore verified today → record `verifiedAt` →
  2026-08-01, dataset `version` 1.0.0 → 1.0.1.
- **`priority-pass` tiers.** `https://www.prioritypass.com/en-GB/join-prioritypass` confirms
  Standard "£69" (pay-per-visit, "£24"), Standard Plus "£229" ("10 FREE visits, then £24"),
  Prestige "£419" ("ALL FREE" member visits, guests "£24"). All three annual fees, the
  included-visit counts and the £24 per-visit rate match the stored record unchanged.
  `verifiedAt` → 2026-08-01.

### Checked, NOT verifiable today (old values kept, `verifiedAt` untouched)

- **`lounges:heathrow`** — half-verified, so deliberately left stale. The Club Aspire
  Lounge (T5) entry **was** re-confirmed at £40 from
  `https://no1lounges.com/lounges-by-location/club-aspire-at-heathrow-t5/` ("Prices from:
  £40", Priority Pass "pre-bookings only"). The second entry, **Plaza Premium Lounge (T5)
  at £47.50, could not be re-sourced**: plazapremiumlounge.com's Heathrow pages 404 /
  render their terminal list and prices only through a JS booking flow. Because one of the
  two lounges in the record is unverified, `verifiedAt` stays 2026-06-10 rather than
  implying the whole record was checked. **This record is 52 days stale.**
- **`lounges:birmingham`** — not reachable. The record's source
  (birminghamairport.co.uk/at-the-airport/lounges/) is Cloudflare-blocked to every automated
  transport, and the newest Wayback snapshot is 2024-12-03. The Aspire operator site
  (aspireloungesandmore.com) returned nothing usable either. Aspire £20.99 kept unchanged.
  **This record is 52 days stale.**

> ## NEEDS-HUMAN
> 1. **Plaza Premium Heathrow T5 (£47.50)** needs a human to read the price off
>    plazapremiumlounge.com's booking flow (or Heathrow's own lounges page) — it is the only
>    thing blocking `lounges:heathrow` from being re-verified, and it crosses the 60-day
>    warning on ~9 Aug 2026.
> 2. **Birmingham lounges** need the same manual browser visit already noted for Birmingham
>    drop-off and parking. Same 60-day deadline (~9 Aug 2026).
> 3. **Consider adding "My Lounge at Gatwick North" (£38) and "Clubrooms at Gatwick North"
>    (£44)** to the Gatwick record — both are published on the same official operator page we
>    already cite, and their absence is why the £38 → £40 move looks like a price rise on a
>    lounge that is still available at £38 under a different name. Adding records is a data
>    decision for Mike, so it is flagged rather than done.
