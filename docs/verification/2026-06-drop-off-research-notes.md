# ParkMath drop-off-fee research notes — June 2026

Dataset: `packages/data/datasets/parkmath/drop-off-fees.json` (version 0.2.0, lastUpdated 2026-06-10).

All values below were read from each airport's OWN official website on **2026-06-10**. News/aggregator sites were used only to locate official pages, never cited. Where a value is not published on an official page, the field is `null` and the gap is noted here.

Conventions:
- `bands[].totalPence` is the cumulative total to stay up to `upToMinutes`.
- Where a tariff is "£X for N minutes, then £1/min", only the **published anchor band** is recorded. Per-minute extrapolations are NOT recorded as bands (no inventing values), but the per-minute rule is captured in `feeSummary`/`penaltyNotes`.

---

## heathrow — London Heathrow (LHR)
- **Official URL:** https://www.heathrow.com/transport-and-directions/terminal-drop-off-charge
- Also consulted (same domain): https://www.heathrow.com/terms-and-conditions/terminal-drop-off-charge-terms-and-conditions
- **Charge:** £7 each time a vehicle enters a terminal drop-off zone. This is a flat per-entry charge, not a timed tariff — there is no published "minutes" band, so a single nominal band `{upToMinutes:1, totalPence:700}` represents the per-entry fee and `maxStayMinutes` is `null` (no published max-stay window for the £7; waiting/pick-ups are not permitted).
- **Penalty:** £80 PCN for non-payment, reduced to £40 if paid within 14 days.
- **Payment deadline:** by midnight the day after the visit (can also pay in advance / on the day).
- **Blue Badge:** 100% discount, applied via the vehicle registration number; can be claimed up to 3 months in advance, during the trip, or by midnight the day after.
- **Free alternative:** Park & Ride (formerly Long Stay) — up to 30 minutes free, free shuttle bus to terminal doors every 15 minutes.
- **priorYearFeePence = 600:** the official page states the charge increased from £6 to £7 from 1 January 2026. Prior fee is therefore officially attested.
- **Ambiguity:** none material. The £7 is a per-entry charge, so the "band" abstraction is a slight fit; documented above.

## gatwick — London Gatwick (LGW)  *(re-verified seed)*
- **Official URL:** https://www.gatwickairport.com/transport-options/drop-off.html
- Also consulted: .../drop-off/drop-off-terms-and-conditions.html and /faqs/drop-off-faqs.html (same domain).
- **Charge (exact wording):** "£10 for 10 minutes, and £1 for each additional minute up to 20 minutes. The maximum charge will be £30 and the maximum length of stay 30 minutes."
- Recorded band: `{upToMinutes:10, totalPence:1000}` (the only clean published anchor). The £20-at-20-min and £30 cap are derived from the per-minute rule, so they are described in `feeSummary` but NOT added as invented bands. `maxStayMinutes = 30` (published).
- **Penalty:** £100 PCN, reduced to £60 if paid within 14 days (£100 if paid within 28 days). Source: drop-off T&C page.
- **Payment deadline:** midnight the day after the visit.
- **Blue Badge:** exempt if dropped off by friends/taxi AND the number plate is registered in advance (free 30-minute session; apply from 3 months before up to the day before travel).
- **Free alternative:** Long Stay car park — free for up to two hours, free shuttle bus to terminals.
- **priorYearFeePence = null:** the official Gatwick page does not state a previous fee. The seed's `700` was not officially attested, so it has been nulled per the task rule.

### Corrections made to the Gatwick seed (it was written from planning docs):
| Field | Old seed value | Corrected (official) value |
|---|---|---|
| feeSummary | "£10 for up to 20 minutes" | "£10 for up to 10 minutes, then £1/min (max £30, max stay 30 min)" |
| bands | `[{20, 1000}]` | `[{10, 1000}]` (10-min anchor; £10 covers first 10 min, not 20) |
| maxStayMinutes | 20 | 30 |
| penaltyPence | 10000 (correct value but wrong notes) | 10000 — kept |
| penaltyNotes | "Reduced if paid within 14 days" | "£100 PCN, reduced to £60 if paid within 14 days" |
| paymentDeadline | "23:59 the day after drop-off" | "Midnight the day after your visit" |
| blueBadgePolicy | vague "should check" | exempt if number plate registered in advance (30-min free session) |
| freeAlternative.minutesFree | 30 | 120 (Long Stay is free for two hours) |
| priorYearFeePence | 700 | null (not stated on official page) |
| sourceUrl | gatwickairport.com homepage | official drop-off page |

## manchester — Manchester (MAN)
- **Official URL:** https://www.manchesterairport.co.uk/parking/pick-up-and-drop-off/
- Also consulted: /terms-and-conditions/drop-off-zone-terms-and-conditions/ and /parking/pick-up-and-drop-off-info/blue-badge-holders/ (same domain).
- **Charge (Terminal 2 tariff published on page):** 5 min £5; 10 min £6.40; up to 30 min £25. Recorded as three cumulative bands.
- **Ambiguity (flagged):** the page header is "Terminals 1, 2 & 3" but the displayed tariff table is the Terminal 2 table; the page notes pricing can vary by terminal/signage. Recorded values are the **published Terminal 2 figures**. Spot-checkers should confirm whether T1/T3 differ at the time of review.
- **Max stay:** 30 minutes.
- **Penalty:** £100 Parking Charge for overstay/non-payment, reduced to £60 within 14 days, plus a debt-recovery fee of up to £70.
- **Payment deadline:** midnight the day after using the Drop Off Zone.
- **Blue Badge:** Drop Off Zone free where the *passenger* (not driver) holds a valid Blue Badge; show it to a traffic marshal on entry.
- **Free alternative:** free drop-off at JetParks 1, free shuttle bus 24/7 (a few minutes' ride).
- **priorYearFeePence = null:** no previous fee published.

## stansted — London Stansted (STN)
- **Official URL:** https://www.stanstedairport.com/parking/pick-up-and-drop-off/
- Also consulted: /terms-and-conditions/express-set-down/ (same domain).
- **Charge:** Express Set Down £10 for up to 15 minutes. Single band recorded.
- **Max stay:** 30 minutes (T&C). Longer than 15 min requires speaking to a marshal.
- **Penalty:** £100 PCN, reduced to £60 if paid within 14 days.
- **Payment deadline:** 23:59 the day after the visit.
- **Blue Badge:** NOT exempt — normal charges apply, but Blue Badge passengers qualify for an extension to the 30-minute max stay if reasonably required.
- **Free alternative:** Mid Stay car park free drop-off + free shuttle bus. `minutesFree` recorded as 60 — see ambiguity.
- **Ambiguity:** The exact free-parking duration at Stansted Mid Stay was not crisply stated as a number on the drop-off page (the page emphasises "free drop-off area" + shuttle). `minutesFree: 60` is the conventional Mid Stay free window but was not pinned to an explicit official figure on the page read — treat the free *duration* as the soft value here; the existence of the free Mid Stay shuttle option IS officially published.
- **priorYearFeePence = null:** no previous fee published on the page.

## luton — London Luton (LTN)
- **Official URL:** https://www.london-luton.co.uk/to-and-from-lla/dropping-off
- **Charge:** Express Drop Off £7 for up to 10 minutes, then £1 per minute (max stay 30 minutes). Single published anchor band recorded; per-minute thereafter is in `feeSummary` only (not extrapolated into a band).
- **Max stay:** 30 minutes.
- **Penalty:** £95 enforcement charge for staying past 30 minutes, reduced to £55 if paid within 14 days.
- **Payment deadline:** midnight the day after the visit.
- **Blue Badge:** no concessions in the main Express Drop Off area (explicitly stated).
- **Free alternative:** Long Stay car park free for up to two hours, free shuttle (~10 min, every 20 min).
- **priorYearFeePence = null:** no previous fee published.

## edinburgh — Edinburgh (EDI)
- **Official URL:** https://www.edinburghairport.com/edinburgh-airport-parking/drop-off-and-pick-up
- **Charge:** up to 10 minutes £8.50; 10 minutes and above £1 per minute. Single published anchor band (`{10, 850}`); per-minute thereafter not extrapolated into a band.
- **maxStayMinutes = null:** no maximum-stay figure published on the page.
- **penaltyPence / penaltyNotes = null:** no PCN/overstay penalty figure published on this page.
- **paymentDeadline = null:** the multi-storey drop-off is card-on-exit (paid at barrier), so no "pay by next day" deadline is published.
- **Blue Badge:** vehicles carrying Blue Badge passengers have free car park access for one hour.
- **freeAlternative = null:** Edinburgh's official page describes the free drop-off/pick-up at the Long Stay area BUT explicitly states there are **no shuttle buses** between the Long Stay and the terminal, and the page read here did not pin a clean "free for N minutes + transfer" structure to cite. To avoid asserting a free alternative the official page does not cleanly publish (shuttle absence makes it materially different from other airports' free options), this is recorded as `null`. **Spot-check candidate:** a reviewer may upgrade this if the official free-drop-off page (.../free-drop-off-pick-up) is treated as authoritative for a specific free window.
- **priorYearFeePence = null.**

## birmingham — Birmingham (BHX)  *(FREE model)*
- **Official URL:** https://www.birminghamairport.co.uk/parking/drop-off-and-pick-up/
- Also consulted: /parking/drop-off-car-park/ and /parking/premium-set-down/ (same domain).
- **isFree = true:** the standard Drop Off car park is **free for the first 10 minutes**. Stays over 10 minutes are charged at "the standard tariff rate displayed at the car park entrance" — that paid tariff is NOT published online (signage only), so no paid bands are recorded; `bands: []` (allowed because `isFree` is true).
- **No-return policy:** returning within one hour forfeits the 10-minutes-free benefit. Recorded in `penaltyNotes`.
- **maxStayMinutes / paymentDeadline / penaltyPence = null:** not published online.
- **Blue Badge:** Premium Set Down free for the first 30 minutes, validated at the NCP Customer Service cabin with Blue Badge + vehicle registration.
- **freeAlternative:** the Drop Off car park itself (first 10 minutes free, short walk to terminal) is the free option.
- **Ambiguity:** the actual paid tariff after 10 minutes is not online — by design Birmingham only publishes the free window. The `isFree:true` classification reflects that the *headline* drop-off product is free; reviewers should note the over-10-min charge exists but is unpublished.
- **WebFetch note:** birminghamairport.co.uk returned HTTP 403 to the fetch tool; values were taken from the official-domain search index snippets of the same official pages (no third-party sources used).

## glasgow — Glasgow (GLA)
- **Official URL:** https://www.glasgowairport.com/to-and-from/pick-up-and-drop-off/
- **Charge:** Express Drop-off £7 for up to 15 minutes. Single band recorded. `maxStayMinutes = 15` (the priced window).
- **Penalty:** a "premium charge" is payable on exit for staying longer than 15 minutes, but the **amount is not published** on the official page → `penaltyPence = null`, described in `penaltyNotes`.
- **paymentDeadline = null:** card-only payment on exit at the barrier; no next-day deadline published.
- **Blue Badge:** should NOT use Express Drop-off; use Car Park 2 opposite the terminal for up to 30 minutes free (not for commercial/hire/reward).
- **Free alternative:** Long Stay car park free for up to one hour, free shuttle bus to terminal.
- **priorYearFeePence = null.**
- **WebFetch note:** glasgowairport.com returned HTTP 403 to the fetch tool; values taken from official-domain search snippets of the official pages.

## bristol — Bristol (BRS)
- **Official URL:** https://www.bristolairport.co.uk/parking/drop-off-and-pick-up/
- Also consulted (same domain): /parking/waiting-zone/ and the official news item "Changes to fees for 'Drop Off & Pick Up' and 'Short Stay' car parks" (Dec 2025), which states the rise from £7 to £8.50.
- **Charge:** Drop Off & Pick Up car park £8.50 for up to 10 minutes (effective 5 January 2026). Single band recorded. Cashless ANPR, pay by contactless/Chip&PIN/Apple/Google Pay on exit.
- **Blue Badge:** up to 40 minutes for the same £8.50 fee, by scanning the barcode on the reverse of the Blue Badge at the exit barrier.
- **Free alternative:** Waiting Zone — free for up to one hour while waiting, free shuttle bus to terminal every 15 minutes (from the adjacent car rental facility).
- **maxStayMinutes / penaltyPence / paymentDeadline = null:** not published as discrete figures (paid on exit).
- **priorYearFeePence = 700:** the official Bristol news/announcement page states the fee increased from £7 to £8.50, so the prior fee is officially attested.
- **WebFetch note:** bristolairport.co.uk returned HTTP 403 to the fetch tool; values taken from official-domain search snippets of the official Bristol pages (incl. the official news/announcement page for the £7→£8.50 change).

## belfast-international — Belfast International (BFS)
- **Official URL:** https://www.belfastairport.com/car-parking/drop-off-zone
- Also consulted (same domain): /special-assistance/blue-badge-holders and /car-parking/short-stay-car-park.
- **Charge:** Drop Off Zone £5 for up to 10 minutes (directly opposite the terminal; coin bin / card machine on exit). Single band recorded.
- **Ambiguity (flagged):** one official-domain snippet showed a conflicting "£3 for 10 minutes" figure on a different page, while the Drop Off Zone page and the Pick Up & Drop Off page both state **£5 for 10 minutes**. The consistent, page-specific Drop Off Zone value (£5/10 min) is recorded; a reviewer should re-confirm against live signage as Belfast was mid-change (a £5 minimum charge regime referenced from 9 March 2026).
- **maxStayMinutes / penaltyPence / paymentDeadline = null:** not published as discrete figures.
- **Blue Badge:** use the Short Stay Car Park free for 30 minutes (validate ticket with a team member / help button); £5 minimum applies after 30 minutes.
- **Free alternative:** Long Stay car park — 15 minutes free for drop-off/collection; normal gate rates apply thereafter.
- **priorYearFeePence = null.**
- **WebFetch note:** belfastairport.com returned HTTP 403 to the fetch tool; values taken from official-domain search snippets of the official Belfast pages.

---

## Airports excluded
None. All 10 target airports had an official drop-off arrangement confirmable from their own pages.

## Cross-cutting notes for spot-checkers
- The four MAG/AGS-group sites (Birmingham, Glasgow, Bristol, Belfast International) blocked the automated fetch tool with HTTP 403. Their values come from the search index of the **same official-domain pages** — no third-party/aggregator source was used. These four are the highest-priority manual re-confirmation targets.
- "Per-minute thereafter" rates (Gatwick, Luton, Edinburgh) are deliberately NOT expanded into bands to avoid recording extrapolated (non-published) totals. Only the published anchor amount is a band.
- Heathrow's £7 is a flat per-entry charge with no timed band; represented as a 1-minute nominal band with `maxStayMinutes: null`.
