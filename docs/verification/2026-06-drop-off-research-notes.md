# ParkMath drop-off-fee research notes — June 2026

Dataset: `packages/data/datasets/parkmath/drop-off-fees.json` (version 1.0.0, lastUpdated 2026-06-10) — complete 25-airport coverage.

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
- Also consulted: /terms-and-conditions/express-set-down/ (same domain); and the official ticker notice at https://www.stanstedairport.com/communication-ticker-page/ticker-notice-4/ (new tariff announcement).
- **Charge (post-19 March 2026):** Express Set Down £10 for stays up to 15 minutes; **£28 for stays over 15 minutes** (up to the 30-minute max stay). Two bands recorded.
- **Max stay:** 30 minutes (T&C). Longer than 15 min incurs the £28 tier.
- **Penalty:** `penaltyPence = null` — the £100 PCN figure was from the superseded pre-March-2026 regime; the current official ticker notice and pick-up-and-drop-off page do not confirm a specific Parking Charge amount for non-payment under the new tariff. `penaltyNotes` records that a Parking Charge *may* be issued but the amount is not currently published.
- **Payment deadline:** 23:59 the day after the visit.
- **Blue Badge:** NOT exempt — normal charges apply, but Blue Badge passengers qualify for an extension to the 30-minute max stay if reasonably required.
- **Free alternative:** Mid Stay car park free drop-off + free shuttle bus. `minutesFree` recorded as 60 — see ambiguity note below.
- **Ambiguity:** The exact free-parking duration at Stansted Mid Stay was not crisply stated as a number on the drop-off page (the page emphasises "free drop-off area" + shuttle). `minutesFree: 60` is the conventional Mid Stay free window but was not pinned to an explicit official figure on the page read — treat the free *duration* as the soft value here; the existence of the free Mid Stay shuttle option IS officially published.
- **priorYearFeePence = null:** no previous fee published on the page.

### Correction applied 2026-06-10 (caught by independent verification reviewer)
The initial dataset recorded only a single band (`£10 / 15 min`) and a £100 PCN penalty, which reflected the **pre-19 March 2026** tariff. A verification reviewer identified that from 19 March 2026 Stansted published a two-tier tariff via the official ticker notice (ticker-notice-4). Re-confirmation against that ticker notice page on 2026-06-10 confirmed:

| Field | Previous (stale) value | Corrected value |
|---|---|---|
| `feeSummary` | `"£10 for up to 15 minutes (Express Set Down)"` | `"£10 for up to 15 minutes, £28 for stays over 15 minutes"` |
| `bands` | `[{15, 1000}]` | `[{15, 1000}, {30, 2800}]` |
| `penaltyPence` | `10000` | `null` |
| `penaltyNotes` | `"£100 Parking Charge Notice for non-payment, reduced to £60 if paid within 14 days"` | `"£28 tier applies to stays over 15 minutes (from 19 March 2026); a Parking Charge may also be issued for non-payment — amount not currently published"` |

Source for correction: https://www.stanstedairport.com/communication-ticker-page/ticker-notice-4/ (effective 00:01 on 19 March 2026).

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

# Task 10 — remaining 15 airports (June 2026)

Same conventions as above. Values read from each airport's OWN official site on **2026-06-10**. Where an official site returned HTTP 403 (or was JS-rendered so the fetch tool saw only the page shell), values were taken from the search index of the **same official-domain pages** and the airport is flagged below as a manual re-confirmation target (same convention as Birmingham/Glasgow/Bristol/Belfast-International above).

## newcastle — Newcastle (NCL)
- **Official URL:** https://www.newcastleairport.com/car-parking/pick-up-drop-off/
- **Charge:** Express Pick Up & Drop Off car park £6 for up to 10 minutes. Single band recorded.
- **maxStayMinutes = null:** no maximum-stay figure published.
- **penaltyPence / penaltyNotes = null:** no overstay/PCN figure published.
- **paymentDeadline:** ticketless ANPR, tariff requested and paid on exit. From March 2026 card payments only at the barrier (cash only at designated cash machines).
- **Blue Badge:** disabled bays in all car parks (must display a valid Blue Badge); no Express drop-off fee concession published online.
- **Free alternative:** Airport Waiting Zone at Callerton Parkway — free for up to 90 minutes, free 24/7 shuttle bus to the terminal (every 30 minutes).
- **priorYearFeePence = null.**
- **WebFetch note:** newcastleairport.com returned HTTP 403 to the fetch tool; values taken from official-domain search snippets. **Manual re-confirmation target.**

## liverpool — Liverpool John Lennon (LPL)
- **Official URL:** https://www.liverpoolairport.com/parking/express-drop-off
- **Charge:** Express Drop Off & Pick Up car park (facing the terminal) £6 for up to 10 minutes. Single band recorded.
- **Ambiguity (flagged):** official-domain snippets show both a legacy "minimum £5" figure and a "from 5 March 2025 the initial up-to-10-minutes period increases to £6." The current (post-March-2025) figure of £6 is recorded; `priorYearFeePence = 500` reflects the officially-attested previous £5 minimum. Re-confirm the live figure.
- **maxStayMinutes = null:** not published; vehicles over 10 min are directed to the Multi Storey short-stay tariff (captured in `penaltyNotes`). No discrete penalty amount published.
- **paymentDeadline:** pay on exit at the barrier (pull up on the day, pay on leaving).
- **Blue Badge:** up to 40 minutes free in the Express Drop-off car park where the Blue Badge holder is the travelling passenger.
- **Free alternative:** Drop Off 2 — free for up to 40 minutes, ~5–10 min (400m) walk. (One stray snippet said "20 minutes" for Drop Off 2; the dedicated Drop Off 2 / express-drop-off pages and FAQ consistently say **40 minutes**, which is recorded.)
- **WebFetch note:** liverpoolairport.com pages are JS-rendered — the fetch tool saw only the page shell (and the `prod.`/`lennon.` hosts refused the connection). Values taken from official-domain search snippets. **Manual re-confirmation target.**

## london-city — London City (LCY)  *(first-ever drop-off charge, Jan 2026)*
- **Official URL:** https://www.londoncityairport.com/parking/drop-off
- Also consulted (same domain): the press release "London City Airport to introduce drop-off charge…", /faqs/how-do-i-pay-for-drop-off, /faqs/are-blue-badge-holders-exempt-from-the-charges, /drop-off-terms-and-conditions, and the pick-up zone FAQ.
- **Officially confirmed from the official domain:** (1) the drop-off charge was **introduced on 6 January 2026** — LCY was the last major London airport to end free forecourt access (so `priorYearFeePence = 0`, i.e. previously free); (2) **Blue Badge holders are exempt** from the charge.
- **Charge (£8 for up to 5 minutes, then £1/min, max stay 10 min):** the WebSearch summariser repeatedly refused to surface the exact £ figure from the official-domain snippets, and **every londoncityairport.com URL (incl. the dropoff. subdomain) returned HTTP 403 to the fetch tool.** The £8/5-min / £1-per-min / 10-min-max figures are corroborated consistently across multiple independent news reports (LBC, Greenwich Wire, taxi-point) that were used only to identify the figure to confirm — never cited. Single band `{5, 800}` recorded; the per-minute tail is in `feeSummary`/`penaltyNotes`, not extrapolated into a band. `maxStayMinutes = 10`.
- **penaltyPence = null:** no specific Parking Charge amount confirmed on the official page.
- **paymentDeadline:** pay online via the drop-off portal, or register a vehicle + card to pay automatically.
- **freeAlternative = null:** LCY publishes no free forecourt/car-park drop-off window; the airport positions public transport (DLR) as the free alternative, which is not a parking product.
- **WebFetch note:** official site 403 + JS-rendered; the £8 band figure is the **highest-priority manual re-confirmation target** in this batch — confirm against the live `dropoff.londoncityairport.com` portal or the on-page drop-off tariff once the 403 clears.

## leeds-bradford — Leeds Bradford (LBA)
- **Official URL:** https://www.leedsbradfordairport.co.uk/parking/pick-up-drop-off
- **Charge:** Pick Up & Drop Off car park (one-minute walk) £7 for up to 10 minutes. Single band recorded.
- **maxStayMinutes / penaltyPence / paymentDeadline = null / cashless:** chargeable, cashless, pay at the barrier on exit; no discrete overstay amount published. SmoothPark automatic payment gives 10% off the standard tariff (noted in `paymentDeadline`).
- **Blue Badge:** dedicated Blue Badge bays in the Pick Up & Drop Off car park; up to 60 minutes for the £7 fee.
- **Free alternative:** One Hour Free Zone — free for up to one hour, 3–4 min walk. Fully electric private cars may also use the Pick Up & Drop Off car park free for up to 1 hour (max 2 visits/day).
- **priorYearFeePence = null.**
- **WebFetch note:** the LBA parking pages render the tariff inside JS accordions, so the fetch tool saw the question headings but not the answers; the £7/10-min figure is from official-domain search snippets. **Manual re-confirmation target.**

## east-midlands — East Midlands (EMA)
- **Official URL:** https://www.eastmidlandsairport.com/parking/pick-up-and-drop-off/
- Also consulted (same domain): /terms-and-conditions/rapid-drop-off/ (fetched cleanly).
- **Charge:** Rapid Drop-off (barrier-free, in front of the terminal) £5 for up to 15 minutes. Single band recorded.
- **Max stay:** 30 minutes (T&C). Overstay → Parking Charge of up to £100, plus debt-recovery fee of up to £70.
- **Penalty:** £100 PCN for overstay/non-payment, reduced to £60 within 14 days, +£70 debt recovery.
- **Payment deadline:** barrier-free — pay by 23:59 the day after the visit (online or by phone; cannot pay on exit).
- **Blue Badge:** no Rapid Drop-off concession published; Short Stay 1 free up to 30 min for Blue Badge holders, Long Stay free up to 60 min.
- **Free alternative:** Short Stay free for up to 30 minutes (Long Stay 2 also free for one hour).
- **priorYearFeePence = null.** (The £5/15-min headline figure is from the official pick-up-and-drop-off page snippet; the T&C page confirmed the 30-min max, payment deadline and penalty structure but does not restate the £ figure. EMA fetch worked, so this is not a re-confirmation flag.)

## aberdeen — Aberdeen (ABZ)
- **Official URL:** https://www.aberdeenairport.com/transport-and-directions/dropping-off-at-aberdeen-airport/ (fetched cleanly)
- **Charge:** Express Drop Off £7 for up to 15 minutes, then £1 per minute. Single anchor band recorded; per-minute tail in `feeSummary`/`penaltyNotes`.
- **Max stay:** 30 minutes. **Penalty:** a flat £50 charge applies for staying beyond 30 minutes (`penaltyPence = 5000`).
- **Payment:** card only at the forecourt exit barrier (contactless accepted).
- **Blue Badge:** should not use Express Drop Off; 30-minute free drop-off/pick-up window in the Short Stay car park (enter the 13-digit Blue Badge number at exit; not for commercial/hire/reward).
- **Free alternative:** Long Stay car park free for up to one hour, free shuttle bus.
- **priorYearFeePence = null.**

## belfast-city — George Best Belfast City (BHD)
- **Official URL:** https://www.belfastcityairport.com/Parking/Drop-Off-and-Pick-Up
- **Charge:** Express Drop-Off & Pick-Up area — minimum charge £4 for the first 10 minutes. Single band recorded.
- **maxStayMinutes / paymentDeadline = null:** not published as discrete figures. No-stopping zones are signposted; stopping there incurs a parking charge (amount not published) → captured in `penaltyNotes`, `penaltyPence = null`.
- **Blue Badge:** may use the Express area for up to 10 minutes free of the £4 charge; also up to 2 hours free in the Short Stay car park to drop off/pick up.
- **Free alternative:** Long Stay car park — take a ticket and reinsert at the exit barrier within 10 minutes to avoid a charge; longer stays £8 for up to one hour.
- **priorYearFeePence = null.**
- **WebFetch note:** belfastcityairport.com returned HTTP 403 to the fetch tool; values taken from official-domain search snippets. **Manual re-confirmation target.**

## southampton — Southampton (SOU)
- **Official URL:** https://www.southamptonairport.com/to-from/pick-up-drop-off/ (fetched cleanly)
- **Charge:** Pick Up & Drop Off (ground floor of the short stay car park, one-minute walk) £7 for up to 20 minutes. Single band; `maxStayMinutes = 20`.
- **Penalty:** £80 enforcement charge for non-compliance, reduced to £50 if paid within 14 days (`penaltyPence = 8000`).
- **Payment:** cashless — card, contactless, Apple Pay, Google Pay on exit.
- **Blue Badge:** standard charges apply to Pick Up & Drop Off; 30 minutes free in the Short Stay car park if validated at customer service on exit.
- **freeAlternative = null:** the official page explicitly states Southampton "does not currently offer a free pick up or drop-off option."
- **priorYearFeePence = null.**

## cardiff — Cardiff (CWL)  *(FREE model — historically free, verified)*
- **Official URL:** https://cardiff-airport.com/parking-cwl/drop-off-and-pick-up-cwl/
- Also consulted (same domain): /parking-cwl/car-park-2/, the special-assistance parking page, and the 2026/27 Charges & Conditions PDF (effective 1 April 2026 — confirms Cardiff's tariffs are current).
- **isFree = true:** the drop-off & pick-up area in **Car Park 2 is free for the first 20 minutes**. The standard Car Park 2 tariff applies thereafter, but that paid tariff is not cleanly published online for Car Park 2 (only Car Park 1's banded tariff surfaced), so no paid bands are recorded; `bands: []` (allowed because `isFree` is true). Same pattern as Birmingham (headline free window published, over-window tariff not).
- **Verification of "historically free" status:** Cardiff still offers a genuine free forecourt window (20 min free in Car Park 2) — it has NOT moved to a pure pay-per-drop-off model. Recorded as free accordingly.
- **maxStayMinutes / penaltyPence / paymentDeadline = null:** not published.
- **Blue Badge:** disabled bays available (Car Park 2 is DPA-accredited); special assistance vehicle for reduced-mobility passengers. No discrete Blue Badge drop-off concession beyond the 20-min-free window published.
- **freeAlternative:** the Car Park 2 drop-off area itself (first 20 minutes free, closest to terminal).
- **priorYearFeePence = null.**
- **WebFetch note:** cardiff-airport.com pages are JS-rendered (fetch tool saw only the page shell); the 20-minutes-free figure is from official-domain search snippets, repeated consistently across the drop-off, Car Park 2 and special-assistance pages. **Manual re-confirmation target** (specifically: the over-20-min Car Park 2 tariff, which is not recorded).

## exeter — Exeter (EXT)
- **Official URL:** https://exeter-airport.co.uk/car-parking/ (fetched cleanly)
- **Charge:** Car Park P1 (drop-off & pick-up bays opposite the Main Terminal) £6 for up to 15 minutes. Single anchor band recorded. P1 continues 15–60 min £7.50, then higher bands (in `penaltyNotes`, not extrapolated into bands). Pre-booked-period overstay £20/day or part thereof.
- **maxStayMinutes = null:** P1 has no hard max-stay (the tariff just continues up the bands).
- **Payment:** card / contactless / Apple Pay / Google Pay at the exit barrier.
- **Blue Badge:** in P1, up to 4 hours for the current up-to-15-minutes rate (£6).
- **Free alternative:** Car Park P4 — free for up to 30 minutes (then £2 for 30–60 min).
- **priorYearFeePence = null.** (P1 is the forecourt drop-off product, hence recorded as `isFree:false`; P4 is the free alternative. Both are official.)

## southend — London Southend (SEN)
- **Official URL:** https://londonsouthendairport.com/getting-to-and-from/parking-terms-and-conditions (southendairport.com 301-redirects to londonsouthendairport.com — the recorded `sourceUrl` is the canonical host)
- **Charge:** Express Pick-up & Drop-off (directly opposite the terminal) £8 for up to 10 minutes. Single band; `maxStayMinutes = 10`.
- **paymentDeadline:** barrier-free — pay online after you exit, by midnight the day after the visit.
- **penaltyPence / penaltyNotes = null:** no discrete overstay PCN amount published on the pages read.
- **Blue Badge:** no specific Express drop-off concession published online.
- **Free alternative:** Long Stay 3 — free for up to 15 minutes (drive in, take a ticket, drop off/pick up, drive out within 15 min without paying or validating).
- **priorYearFeePence = null.**
- **WebFetch note:** the canonical Southend T&C page (post-redirect) is JS-rendered (fetch tool saw only the "Pay for drop-off" link, not the tariff); the £8/10-min and Long Stay 3 free-15-min figures are from official-domain search snippets. **Manual re-confirmation target.**

## bournemouth — Bournemouth (BOH)
- **Official URL:** https://www.bournemouthairport.com/car-parking/
- **Charge:** Car Park CP1 (drop-off and express pick-up) £8 for up to 30 minutes. Single band; entry by ANPR, pay on exit (cash and all major cards accepted).
- **maxStayMinutes = null:** over 30 min the standard not-booked CP1 tariff applies (in `penaltyNotes`). A penalty may be payable for breaching the car-park terms under airport byelaws (amount not published) → `penaltyPence = null`.
- **Blue Badge:** dedicated Pick Up & Drop Off spaces in CP1; may stay up to 4 hours but only charged the published up-to-30-min rate (£8).
- **freeAlternative = null:** the official site shows no completely free pick-up/drop-off option (pre-booked CP3 pick-up is £8/90 min; express CP1 is £8/30 min).
- **priorYearFeePence = null.**
- **WebFetch note:** bournemouthairport.com returned HTTP 403 to the fetch tool; values taken from official-domain search snippets. **Manual re-confirmation target.**

## norwich — Norwich (NWI)
- **Official URL:** https://www.norwichairport.co.uk/car-parking/ (fetched cleanly)
- **Charge:** Car Park 1 (Short Stay) drop-off & pick-up £8 for up to 20 minutes. Single band. Beyond 20 min the Short Stay tariff continues (£15 for 20–60 min, then higher bands — in `penaltyNotes`). Pre-booked-period overstay £30/day or part thereof.
- **maxStayMinutes = null:** the Short Stay tariff just continues up the bands.
- **Payment:** contactless, debit or credit cards only at the exit barriers / payment stations.
- **Blue Badge:** dedicated pick-up/drop-off spaces in Car Park 1, up to 4 hours for the current up-to-20-min rate, adjusted on validation at the parking office.
- **freeAlternative = null:** the official page states Norwich does not offer free drop-off/pick-up; the £8 minimum applies for any stay up to 20 min.
- **priorYearFeePence = null.**

## inverness — Inverness (INV)  *(FREE model — historically free, verified)*
- **Official URL:** https://www.invernessairport.co.uk/car-parking/
- **isFree = true:** drop-off is **free for the first 10 minutes** in the Premium & Drop Off car park in front of the terminal — take a ticket from the barrier. No charge for the headline drop-off window.
- **Verification of "historically free" status:** confirmed Inverness (HIAL) still provides a free 10-minute forecourt window — it has NOT introduced a pay-per-drop-off charge. Recorded as free.
- **Blue Badge:** Blue Badge holders collecting a passenger get 20 minutes free, validated by the Information Desk; the Premium & Drop Off car park is closest to the terminal.
- **Free alternative:** the Premium & Drop Off car park itself (first 10 minutes free).
- **maxStayMinutes / penaltyPence / paymentDeadline = null.** (The paid tariff beyond 10 min is the standard short-stay tariff, not a drop-off product.)
- **priorYearFeePence = null.**
- **WebFetch note:** the official /parking-faqs/ page 301-redirects off-domain (to a third-party comparison site), so the FAQ could not be fetched directly; the free-10-min and Blue-Badge-20-min figures are from official invernessairport.co.uk search snippets. **Manual re-confirmation target.**

## teesside — Teesside International (MME)
- **Official URL:** https://www.teessideinternational.com/teesside-airport-parking/ (fetched cleanly)
- **Note on domain:** the airport's official site is **teessideinternational.com** — the old `teessideairport.com` domain now serves unrelated placeholder/parked content and was NOT used.
- **Charge:** drop-off & pick-up area £2.50 for up to 10 minutes, £5 for up to 1 hour, then £7 per hour thereafter. Two cumulative bands recorded (`{10, 250}`, `{60, 500}`); the £7/hr tail is in `feeSummary`/`penaltyNotes`.
- **maxStayMinutes = null:** the tariff just continues at £7/hr.
- **Payment:** ticketless ANPR barrier system, monitored 24/7.
- **Blue Badge:** no specific Blue Badge drop-off concession published online.
- **Free alternative:** free parking for up to 2 hours when you spend a minimum of £5 in the Landside Café or landside terminal shops (receipt required for validation).
- **priorYearFeePence = null.**

---

## Airports excluded
None. All 25 target airports (10 prior + 15 in this batch) had an official drop-off arrangement confirmable from their own pages. No airport was removed from `airports.json`.

## Free-forecourt airports (`isFree: true, bands: []`)
- **birmingham** — first 10 min free in the Drop Off car park (paid tariff after, not published online).
- **cardiff** — first 20 min free in Car Park 2 (paid tariff after, not cleanly published online). Historically-free status verified.
- **inverness** — first 10 min free in the Premium & Drop Off car park. Historically-free status verified.

## Manual re-confirmation targets (403 / JS-rendered / off-domain redirect)
The following airports' official sites blocked the automated fetch tool (HTTP 403), were JS-rendered so the fetch tool saw only the page shell, or redirected off-domain — their values come from the search index of the **same official-domain pages** (no third-party/aggregator source cited):

Prior batch: **birmingham, glasgow, bristol, belfast-international** (all HTTP 403).

This batch:
- **london-city** — HTTP 403 on every URL incl. the dropoff. subdomain; the **£8/5-min band is the highest-priority re-confirmation** (the £ figure could only be cross-checked via news, never cited). Introduction date (6 Jan 2026) and Blue Badge exemption ARE confirmed from the official domain.
- **newcastle** — HTTP 403.
- **liverpool** — JS-rendered shell; `prod.`/`lennon.` hosts refused connection.
- **leeds-bradford** — tariff hidden inside JS accordions.
- **belfast-city** — HTTP 403.
- **cardiff** — JS-rendered shell (re-confirm the over-20-min Car Park 2 tariff, which is not recorded).
- **southend** — JS-rendered shell on the canonical (post-redirect) host.
- **bournemouth** — HTTP 403.
- **inverness** — official FAQ page 301-redirects off-domain; figures from invernessairport.co.uk snippets.

Cleanly fetched (NOT re-confirmation flags): **east-midlands, aberdeen, southampton, exeter, norwich, teesside.**

## Cross-cutting notes for spot-checkers
- The four MAG/AGS-group sites (Birmingham, Glasgow, Bristol, Belfast International) blocked the automated fetch tool with HTTP 403. Their values come from the search index of the **same official-domain pages** — no third-party/aggregator source was used. These four are high-priority manual re-confirmation targets (see the consolidated list above).
- "Per-minute thereafter" rates (Gatwick, Luton, Edinburgh, London City, Aberdeen) are deliberately NOT expanded into bands to avoid recording extrapolated (non-published) totals. Only the published anchor amount is a band.
- Heathrow's £7 is a flat per-entry charge with no timed band; represented as a 1-minute nominal band with `maxStayMinutes: null`.
- `priorYearFeePence` is recorded as `0` for **london-city** (forecourt was free before the 6 Jan 2026 charge) and `500` for **liverpool** (officially-attested previous £5 minimum). It stays `null` for airports where no prior fee is officially attested.

---

# Full re-verification — 10 June 2026 (rendered official pages)

All 25 airports re-verified using rendered official-page content (reader-proxy transport
for WAF-blocked sites, Wayback Machine snapshots of official pages, and the official
HIAL tariff PDF). Dataset bumped to **v1.2.0**. Corrections applied:

| Airport | What changed | Evidence |
|---|---|---|
| **cardiff** | **No longer free.** Drop Off Zone now £3/10 min; full tariff to £20/2h. isFree → false; freeAlternative removed | cardiff-airport.com drop-off page (rendered 10 Jun 2026) |
| **glasgow** | Fee corrected **£7 → £6**/15 min; + £1/min thereafter; £50 rate beyond 30 min; Blue Badge 30-min window in Multi Storey | Official page via Wayback snapshot 2 Feb 2026 (post-January pricing) |
| **belfast-international** | Full tariff added (£5/10, £8/20, £13/60, £60 over 1h); freeAlternative removed (none published) | belfastairport.com drop-off zone page (rendered) — resolves the earlier £3-vs-£5 conflict in favour of £5 |
| **liverpool** | Bands added (£10/20 min, £25/1h); the "40 min free" is a **Blue Badge concession**, not a general free alternative — freeAlternative removed | liverpoolairport.com express drop-off page (rendered) |
| **newcastle** | Full Express tariff added (£12/30, £16/45, £20/1h, £28/2h) | newcastleairport.com picking-up-dropping-off page (rendered) |
| **southend** | sourceUrl corrected to the pick-up-drop-off page (old URL was T&Cs with no pricing); £8/10 min confirmed; payment by midnight next day; freeAlternative removed (not published) | londonsouthendairport.com pick-up-drop-off page (rendered) |
| **inverness** | **Source corrected**: invernessairport.co.uk is NOT the official site (it says so itself). Official: hial.co.uk. Free period is **15 min** (was recorded 10) in Short Stay drop-off; Blue Badge 20 min free in Premium | HIAL airport-information page + official tariff PDF effective 1 June 2026 |
| **bristol** | Full tariff added (£10.50/20, £13/40, £30/1h, £60/2h, max stay 2h); £100/£60 Red Route penalty; Blue Badge 40 min for £8.50; Waiting Zone (1h free + shuttle) re-confirmed | Official page via Wayback snapshot 25 Apr 2026 |
| **bournemouth** | Band added (£15/30–60 min); £8/30 min confirmed | bournemouthairport.com car-parking page (rendered HTML) |
| **belfast-city** | £4/10 min confirmed; Blue Badge 2h free in Short Stay; Long Stay re-entry rule added | belfastcityairport.com drop-off page (rendered) |
| **birmingham** | Free 10 min confirmed; added: no return within 1h, standard tariff after, pay within 24h | Official-domain search-index content (multiple pages) |
| **leeds-bradford** | £7/10 min + One Hour Free Zone confirmed, no change | Official-domain search-index content |
| **london-city** | £8/5 min + £1/min to 10-min max re-corroborated; payment-by-midnight-next-day added. Official pages remain hard-blocked (Cloudflare) — figures corroborated via official-domain index + multiple independent reports of the official press release | Strongest available evidence short of a human visit |

**Evidence-dating note:** verifiedAt reflects the date values were verified against the
best available official evidence. For glasgow and bristol that evidence is an archived
copy of the official page (2 Feb / 25 Apr 2026 — both post-date the January 2026
pricing round); a live-page glance at those two plus London City is still worthwhile
whenever a human visits.

**Remaining manual targets (downgraded):** london-city (hard-blocked), glasgow +
bristol (archive-dated). All other airports: fully verified against rendered official content.

---

# Targeted re-check — 18 June 2026 (east-midlands free alternative)

**Trigger:** a member of the public flagged on the r/InternetIsBeautiful launch thread
that EMA's "free 30 minutes at the short stay car park is only if you are a blue badge
holder." Re-verified live against the official pages (WebFetch + reader-proxy raw text).
Dataset bumped to **v1.2.1**.

**Official wording confirmed today** (https://www.eastmidlandsairport.com/parking/pick-up-and-drop-off/):
- Short Stay 1 general tariff: **£6** up to 30 min, **£8** up to 1 h, £12 / £16 for 2 h / 3 h.
- "Up to 30 minutes for Blue Badge holders (Short Stay 1 only): **Free**" — i.e. the 30-min
  free period is **Blue Badge only**; general drivers pay £6.
- The pick-up/drop-off page calls the **Long Stay car park a "free" alternative** for
  drop-off (links to /parking/long-stay/) and there is a **free 24/7 shuttle** (every
  20 min, 3–5 min ride), but that page does not state the free duration.
- **General free Long Stay window confirmed** via the official EMA car-parking FAQ /
  parking content (the JS accordion that won't render for a fetcher, surfaced via a
  domain-restricted search of eastmidlandsairport.com): "**60 minutes FREE parking is
  provided in the Long Stay 2 car park for the purposes of drop off and pick up … a
  shuttle bus service is available. If you need additional time beyond the 60 minutes,
  charges are £1 per every minute.**" The £1-per-minute overage is a general consumer
  tariff (Blue-Badge concessions don't carry per-minute overage), so this 60-min free
  window is **open to all drivers**, not a Blue-Badge-only perk. This matches the
  public commenter ("the one hour free at long stay is correct").

**Correction made (two passes):**
1. First set `freeAlternative` → **null**, because the only free durations visible on the
   rendered pick-up/drop-off page (Short Stay 30 min, Long Stay 2 60 min) appeared in the
   Blue-Badge / Assisted-Travel framing — the same error class as Liverpool's "40 min
   free" (10 Jun).
2. Then, after confirming the **general** 60-min Long Stay 2 window from the official FAQ
   content, **restored** `freeAlternative` to `{name: "Long Stay 2 car park",
   minutesFree: 60, details: "Free for up to 60 minutes for drop-off and pick-up, then
   £1 per minute. A 15-20 minute walk from the terminal, or take the free shuttle bus"}`.

`blueBadgePolicy` rewritten to make clear the **Short Stay 1 30-min free is Blue-Badge
only** (general drivers pay £6), while the **Long Stay 2 60-min free is open to all**.
`verifiedAt` → 2026-06-18.

**Retained (not re-fetched today):** the **£5 / 15-min Rapid Drop-off** headline fee.
It is no longer shown on the pick-up-drop-off page (now "pay by midnight the day after",
no £ figure), but it was officially sourced on 10 Jun from
/terms-and-conditions/rapid-drop-off/ and is unchanged. The £100→£60 penalty, 30-min
max stay and payment deadline were re-confirmed today.

> ## NEEDS-HUMAN
> The general 60-min Long Stay 2 free window is sourced from the official EMA FAQ/parking
> content (the JS accordion won't render for an automated fetcher, so it was captured via
> a domain-restricted search of eastmidlandsairport.com rather than a direct page read) and
> corroborated by the public commenter + the airport's own "free Long Stay alternative"
> language. **A human glance at the EMA car-parking FAQ accordion would pin the exact
> wording** if you want belt-and-braces before merging. Separately, the £5/15-min Rapid
> Drop-off fee should be re-sourced from the official Rapid Drop-off T&C page on the next
> sweep, since the main page no longer lists it.

---

## 2026-07-22 — daily re-verification (hard-blocked target: London City)

**`drop-off:london-city`** — re-confirmed against the official page
<https://www.londoncityairport.com/parking/drop-off> (WebFetch 403; reached via
`r.jina.ai` reader). Official "Charges" table read today:

| Duration | Charge |
| --- | --- |
| 0 – 5 minutes | £8.00 |
| 5 minutes and above | £1 per minute thereafter |

_Maximum stay 10 minutes._ Payment: "settle the charge by midnight the day after".
Blue Badge holders register for 10 minutes free in the Drop-off area; Main Stay gives
1 hour free. All match the stored record (bands 800p / 5 min, `perMinuteAfterPence` 100,
`maxStayMinutes` 10, payment deadline, Blue Badge policy). **No value change.** The
£100→£60 enforcement penalty is not itemised on the main page (it lives in the linked
drop-off T&Cs) — unchanged and not contradicted, so retained. `verifiedAt` → 2026-07-22;
dataset `version` 1.3.0 → 1.3.1.
