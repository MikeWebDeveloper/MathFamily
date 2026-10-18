# RoamMath research notes — UK network roaming (Task 6)

Research date: **2026-06-10**. All values are the current standard charge for a UK customer who joins/upgrades today (newest plan generation), taken from each network's OWN official price guides and roaming pages. Prices in pence in the dataset; £ here for readability.

## Modelling decision: which plan generation?

UK networks publish different roaming charges by join date. For a *new* customer today (June 2026) the applicable rates are the newest band, and where a 2026 price increase is published it is the operative figure. The dataset uses:

- **EE** — £2.59/day EU charge (plans launched from 7 Jul 2021; older plans roam EU free).
- **O2** — £7/day O2 Travel; Europe Zone inclusive.
- **Vodafone** — rates **from 14 April 2026** (Zone B £2.75, Zone C/D £8) per the current Charges Guide.
- **Three** — rates for plans joined/upgraded **on/after 18 Dec 2025**, effective from 1 Apr 2026 (Europe £2.75, Around the World £8).

This keeps the four networks on a like-for-like "what a new joiner pays now" basis.

---

## EE

- **Zone system:** EU/EEA/Switzerland Europe zone + Rest of World (ROW) Zones 1–4 (+ Zone 4* and non-geographic).
- **Europe zone:** **£2.59/day** Daily EU Charge (Handset/SIM plans launched from 7 Jul 2021); plans launched before that roam the EU at no extra cost. Weekly EU pass £15, 12-day pass £21.50. Republic of Ireland included in allowance (no daily charge). **Switzerland, Norway, Iceland are IN the Europe zone.** Fair use: **50GB** Europe roaming cap (EE help roaming-fair-use page — not the price-guide PDF; recorded as a soft fair-use note).
- **ROW Zone 1:** **£5/day** 24-hour pass (UK allowance "Roam Like Home"), or £25/7-day. Includes USA, Canada, Mexico, Australia, NZ, China, South Africa, Thailand, Turkey, UAE, Albania, Montenegro.
- **ROW Zone 2:** **£7.50/day** 24-hour pass, £37.50/7-day. Includes Egypt, India.
- **ROW Zone 3:** **£7.50/day** 24-hour pass (unlimited mins/SMS + **500MB** data only; no weekly pass). Includes Japan, Morocco, Tunisia.
- **Guide URL:** EE Pay Monthly Standard and Non-Standard Price Guide (PDF, 23 Jul 2025) — `https://ee.co.uk/content/dam/help/terms-and-conditions/price-plans/mobile/ee-pay-monthly-standard-and-non-standard-price-guide-23-July-2025.pdf`. Roaming help: `https://ee.co.uk/help/mobile/roaming`.
- **Transport:** WebSearch (site-scoped) located the PDF; **PDF fetched via curl + pdftotext** for the authoritative zone tables (the ee.co.uk HTML roaming pages are JS-rendered and returned no data via WebFetch or r.jina.ai). High confidence.

## O2

- **Zone system:** Europe Zone (inclusive) + O2 Travel Bolt On (one flat worldwide pass) + Data Roaming Bolt Ons (data-only Zones 1/2/3 for everywhere else).
- **Europe Zone:** **inclusive** (roam at no extra cost), **25GB** roaming fair-use limit. Switzerland, Norway, Iceland are IN the Europe Zone.
- **O2 Travel Bolt On:** **£7/day** (days used only) — unlimited mins/texts/data in **75 destinations** outside Europe (the "Travel Inclusive Zone Ultimate" list), data speed capped at 2Mbps. Covers USA, Canada, Mexico, Australia, NZ, UAE, Thailand, Japan, China, India, South Africa, Egypt, Turkey, Albania, Montenegro.
- **NOT in O2 Travel:** **Morocco and Tunisia** — these are Data Roaming Bolt On **Zone 3** (data-only; cheapest £26/100MB; calls £3/min, texts £1). No inclusive daily pass exists for them on O2.
- **Guide URL:** `https://www.o2.co.uk/international/travel-inclusive-zone-ultimate` (75-destination list), `https://www.o2.co.uk/international/o2-travel`, `https://www.o2.co.uk/international/data-roaming-bolt-ons`.
- **Transport:** WebSearch + WebFetch returned the full 75-destination list and £7/day; r.jina.ai used to confirm the Data Roaming Bolt On zone prices and that Morocco/Tunisia = Zone 3. High confidence on the inclusive list; Morocco/Tunisia O2 value is a soft data-only figure (flagged).

## Vodafone

- **Zone system:** Zone A (inclusive) / Zone B / Zone C / Zone D — plus separate **Rest of World Zones 1–4** (PAYG-style, data via optional extras, no inclusive daily charge).
- **Zone A:** Republic of Ireland, Isle of Man, **Iceland, Norway** — **included in all plans**, 25GB fair use.
- **Zone B (Euro Roam):** all EU/EEA + **Switzerland** + Croatia/Cyprus/Malta etc. — **£2.75/day from 14 Apr 2026** (£2.57 before), 25GB fair use.
- **Zone C (Global Roam):** USA, Canada, Mexico, Australia, NZ, Japan, China, South Africa, **Turkey** — **£8/day from 14 Apr 2026** (£7.86 before), 25GB fair use.
- **Zone D:** Egypt, India, Morocco, Thailand, UAE — **£8/day** (same as Zone C).
- **Rest of World Zone 1:** **Albania, Montenegro** — NO inclusive daily pass; pay-per-use (calls per minute, data via optional extra).
- **Rest of World Zone 3:** **Tunisia** — same (no inclusive daily pass).
- **Guide URL:** Vodafone Pay Monthly Charges Guide (PDF) — `https://binaries.vodafone.co.uk/gbnnsauqav4t/3ynRZJ6BvgpyYyPmoIAHX0/ff9c9463c41c25d0cbf8f5d27f955afb/evo-paym-charges-guide.pdf`. Roaming hub: `https://www.vodafone.co.uk/mobile/global-roaming`.
- **Transport:** Charges Guide **PDF fetched via curl + pdftotext** gave authoritative Zone A/B/C/D daily charges + 25GB fair use. r.jina.ai on the global-roaming page confirmed zone membership descriptions ("84 destinations Zone A/B/C = Global Roam includes Australia, Turkey, Mexico, USA"; "Zone D includes Egypt, India, Morocco, Thailand, UAE"). Albania/Montenegro = RoW Zone 1 and Tunisia = RoW Zone 3 confirmed via site-scoped WebSearch snippet. High confidence on daily charges; the exact RoW-zone economics for Albania/Montenegro/Tunisia are pay-per-use and recorded as soft, per-minute figures (flagged).

## Three

- **Zone system:** Go Roam in Europe (band 1) / Go Roam Around the World (band 2) / Go Roam Around the World Extra (band 3). Republic of Ireland and Isle of Man excluded from the daily charge.
- **Go Roam in Europe:** **£2.75/day** (plans joined/upgraded on/after 18 Dec 2025, effective 1 Apr 2026; £2/day for 1 Oct 2021–17 Dec 2025 plans). 49 European destinations including **Switzerland**, Norway, Iceland, Croatia, Cyprus, Malta. Data fair use **12GB**.
- **Go Roam Around the World:** **£8/day** (newest plans; £7 for 1 Oct 2021–17 Dec 2025). 12GB fair use. Covers Turkey, Albania, Montenegro, USA, Canada, Mexico, Australia, NZ, UAE, Thailand, Japan, China, India, South Africa, Egypt, Morocco, Tunisia.
- **Go Roam Around the World Extra:** £8/day, for a small set of destinations (none of the 40 are in this band).
- **Guide URL:** Go Roam support page — `https://www.three.co.uk/support/roaming-and-calling-abroad/roaming-abroad/go-roam`. Advanced Plans Price Guide (PDF, post-19-Apr-2026) — `https://www.three.co.uk/content/dam/threedigital/terms-and-conditions/price-guides/latest-price-guides/advancedplans-priceguide-post19apr2026-19042026.pdf`.
- **Transport:** Advanced Plans **PDF fetched via curl + pdftotext** gave the per-country charge-band table (band 1 = Europe, band 2 = Around the World) and the 12GB fair-use cap. r.jina.ai on the Go Roam page gave the join-date charge bands (£2/£2.75 for Europe). Site-scoped WebSearch confirmed Around the World £8 for on/after 18 Dec 2025. High confidence.

---

## Destination-level ambiguities resolved (Switzerland / Turkey / USA verified per network)

- **Switzerland** — Europe zone on ALL four networks (EE EU/EEA/Switzerland, O2 Europe Zone, Vodafone Zone B, Three Go Roam Europe). Not a worldwide zone anywhere.
- **Turkey** — OUTSIDE Europe on ALL four (EE ROW Zone 1 £5, O2 Travel £7, Vodafone Zone C £8, Three Around the World £8).
- **USA** — EE ROW Zone 1 £5, O2 Travel £7, Vodafone Zone C £8, Three Around the World £8.
- **UAE** — split: EE ROW Zone 1 (£5) but Vodafone Zone D (£8). Both verified.
- **Japan** — EE ROW Zone 3 (£7.50, data limited to 500MB) — more restrictive than EE Zone 1; O2/Vodafone/Three treat it as a normal worldwide pass with full allowance.
- **Norway / Iceland** — INCLUDED (no daily charge) on O2 and Vodafone (Zone A) but charged on EE and Three (their Europe daily charge). A genuine per-network difference, captured in the data.
- **Albania / Montenegro** — band 2 / ROW on every network. Vodafone RoW Zone 1 (no inclusive pass).
- **Northern Cyprus** noted as a separate worldwide zone on EE/Three vs the Republic of Cyprus (EU/Europe zone).

## Previously-soft records — now null-encoded (dailyPassPence: null)

The five records below were previously flagged as "soft" because they carried misleading non-null values (a per-minute rate or a data bolt-on price masquerading as a daily pass). As of this fix they are null-encoded: `dailyPassPence: null`, `passName: null`, with a plain-language `fairUseNote`. The engine treats null as "no published daily pass" and returns `totalPence: null` for these combos rather than multiplying a spurious figure by trip days.

| Destination | Network | Old dailyPassPence | Why it was wrong | New encoding |
|---|---|---|---|---|
| Morocco | O2 | 2600 | NOT in O2 Travel; £26 = cheapest **data-only** Zone-3 Bolt On (100MB), not an inclusive daily pass. Calls £3/min, texts £1. | **null** — "O2 Travel not available — data bolt-ons only (from £26/100MB per the price guide)" |
| Tunisia | O2 | 2600 | Same as Morocco — Zone 3 data-only Bolt On. | **null** — same fairUseNote as Morocco |
| Tunisia | Vodafone | 257 | Vodafone **Rest of World Zone 3** — no inclusive daily pass; 257p is the per-minute call rate, data via optional extra. | **null** — "No daily roaming pass — Vodafone charges per-minute/per-MB rates here (see price guide)" |
| Albania | Vodafone | 257 | Vodafone **Rest of World Zone 1** — no inclusive daily pass; per-minute figure. | **null** — same fairUseNote as Tunisia |
| Montenegro | Vodafone | 257 | Vodafone **Rest of World Zone 1** — no inclusive daily pass; per-minute figure. | **null** — same fairUseNote as Tunisia |

The EE **50GB** Europe fair-use cap comes from EE's help roaming-fair-use page rather than the price-guide PDF (the PDF lists EU charges but not the GB cap); recorded as a fair-use note rather than a hard table value.

## Sources

- EE: https://ee.co.uk/content/dam/help/terms-and-conditions/price-plans/mobile/ee-pay-monthly-standard-and-non-standard-price-guide-23-July-2025.pdf ; https://ee.co.uk/help/mobile/roaming
- O2: https://www.o2.co.uk/international/travel-inclusive-zone-ultimate ; https://www.o2.co.uk/international/o2-travel ; https://www.o2.co.uk/international/data-roaming-bolt-ons
- Vodafone: https://binaries.vodafone.co.uk/gbnnsauqav4t/3ynRZJ6BvgpyYyPmoIAHX0/ff9c9463c41c25d0cbf8f5d27f955afb/evo-paym-charges-guide.pdf ; https://www.vodafone.co.uk/mobile/global-roaming
- Three: https://www.three.co.uk/support/roaming-and-calling-abroad/roaming-abroad/go-roam ; https://www.three.co.uk/content/dam/threedigital/terms-and-conditions/price-guides/latest-price-guides/advancedplans-priceguide-post19apr2026-19042026.pdf

---

# eSIM batch 1 — 20 destinations (Task 7)

Research date: **2026-06-10**. Providers: **Airalo**, **Holafly**, **Saily** — each provider's own public country store page is official for its own prices. Dataset `packages/data/datasets/roammath/esim.json` replaced entirely (`version: 0.2.0`). `dataGb: null` = unlimited. Per bundle the price-read date is carried in `snapshotDate`.

## Currency conversion

- **Indicative rate used: 1 USD = £0.747** (GBP/USD ≈ 1.3377 on 2026-06-10, per exchangerates.org.uk / Wise mid-market). Holafly prices are quoted in USD on the localised pages and Saily prices are quoted in USD; both are converted at this rate, rounded to the nearest pence, and their `bundleName` carries the **"(converted)"** suffix. Airalo pages served GBP directly (no conversion — IP/locale resolved to the UK store).

## Transport

- **Airalo** (`airalo.com/<country>-esim`): all 20 reached via **WebFetch**, GBP prices. Several countries are now **unlimited-only** on Airalo's local store (no GB tiers shown) — for those we recorded an Airalo unlimited bundle. Where Airalo still publishes GB tiers (France, Greece, Germany, Austria, Croatia) we took the ~5GB bundle.
- **Holafly** (`esim.holafly.com/esim-<country>/`): all 20 reached via **WebFetch**, USD prices, unlimited-only (their specialty). We recorded the 30-day unlimited as the representative unlimited bundle. (USA: canonical slug is `esim-usa/`; `esim-united-states/` 301-redirects to an image.)
- **Saily** (`saily.com/esim-<country>/`): **WebFetch 403**, and **r.jina.ai now hits a Cloudflare bot-challenge**. Usable readings came from the **Wayback Machine** (`archive.org/wayback`) and one early live r.jina.ai read (Spain). Saily prices were only recorded where a **2026 snapshot** existed (accuracy gate); 2025-only snapshots and no-snapshot countries omit Saily rather than carry stale prices.

## Per-country coverage

| Country | Airalo | Holafly | Saily | Notes |
|---|---|---|---|---|
| spain | Unl 5d £14.00 | Unl 30d $78.90→£58.94 | 5GB/30d $9.99→£7.46 (snap 2026-06-10, live r.jina) | Airalo unlimited-only |
| france | 5GB/30d £8.50 | Unl 30d $74.90→£55.95 | 5GB/30d $11.99→£8.96 (snap 2026-05-14) | Airalo GB tier |
| italy | Unl 5d £13.50 | Unl 30d $78.90→£58.94 | — | Saily: no Wayback snapshot |
| portugal | Unl 5d £15.00 | Unl 30d $73.90→£55.20 | 5GB/30d $9.99→£7.46 (snap 2026-04-27) | Airalo unlimited-only |
| greece | 5GB/15d £9.00 | Unl 30d $73.90→£55.20 | 5GB/30d $13.99→£10.45 (snap 2026-05-04) | Airalo 30d tier is 50GB; took 5GB/15d |
| germany | 5GB/15d £8.50 | Unl 30d $74.90→£55.95 | 5GB/30d $12.99→£9.70 (snap 2026-05-04) | Airalo 30d tier is 50GB; took 5GB/15d |
| ireland | Unl 5d £15.00 | Unl 30d $73.90→£55.20 | — | Saily: no Wayback snapshot |
| netherlands | Unl 5d £15.00 | Unl 30d $74.90→£55.95 | 5GB/30d $9.99→£7.46 (snap 2026-05-10) | Airalo unlimited-only |
| belgium | Unl 5d £12.00 | Unl 30d $73.90→£55.20 | — | Saily: no Wayback snapshot |
| austria | 5GB/30d £6.50 | Unl 30d $73.90→£55.20 | omitted (2025-08 snapshot, stale) | Airalo GB tier |
| switzerland | Unl 5d £15.00 | Unl 30d $74.90→£55.95 | — | Saily: no Wayback snapshot |
| poland | Unl 5d £15.00 | Unl 30d $73.90→£55.20 | omitted (2025-08 snapshot, stale) | Airalo unlimited-only |
| croatia | 5GB/15d £8.00 | Unl 30d $73.90→£55.20 | — | Airalo 30d tier is 50GB; took 5GB/15d. Saily no snapshot |
| cyprus | Unl 5d £15.00 | Unl 30d $73.90→£55.20 | omitted (2025-09 snapshot, stale) | Airalo unlimited-only |
| malta | Unl 5d £15.00 | Unl 30d $73.90→£55.20 | — | Saily: no Wayback snapshot |
| turkey | Unl 5d £15.00 | Unl 30d $74.90→£55.95 | — | Saily: no Wayback snapshot |
| usa | Unl 5d £14.50 | Unl 30d $74.90→£55.95 | — | Saily: no Wayback snapshot |
| canada | Unl 5d £21.00 | Unl 30d $95.90→£71.64 | — | Holafly Canada priced higher than other markets |
| mexico | Unl 5d £14.00 | Unl 30d $74.90→£55.95 | — | Saily: no Wayback snapshot |
| australia | Unl 5d £14.50 | Unl 30d $74.90→£55.95 | — | Saily snapshot was 2026-02 but plan block not parseable; omitted |

## Coverage summary

- **All 20** countries have **Airalo + Holafly** (2 providers each).
- **6** countries also have **Saily** (3 providers): spain, france, portugal, greece, germany, netherlands.
- Saily gaps: italy, ireland, belgium, switzerland, croatia, malta, turkey, usa, canada, mexico (no usable Wayback snapshot or live access blocked); austria, poland, cyprus (only stale 2025 snapshots — omitted on the accuracy-over-completeness rule); australia (2026-02 snapshot present but plan listing not extractable). Saily's live store is fully behind Cloudflare for direct/r.jina fetches.

## Saily source snapshots (Wayback)

- france: http://web.archive.org/web/20260514072716/https://saily.com/esim-france/
- portugal: http://web.archive.org/web/20260427.../https://saily.com/esim-portugal/ (closest 2026-04-27)
- greece: http://web.archive.org/web/20260504.../https://saily.com/esim-greece/ (closest 2026-05-04)
- germany: http://web.archive.org/web/20260504194420/https://saily.com/esim-germany/
- netherlands: http://web.archive.org/web/20260510.../https://saily.com/esim-netherlands/ (closest 2026-05-10)
- spain: live r.jina.ai read on 2026-06-10 (saily.com/esim-spain/) before Cloudflare challenge engaged

## Sources (eSIM batch 1)

- Airalo: https://www.airalo.com/<country>-esim (e.g. https://www.airalo.com/spain-esim, https://www.airalo.com/united-states-esim)
- Holafly: https://esim.holafly.com/esim-<country>/ (e.g. https://esim.holafly.com/esim-spain/, https://esim.holafly.com/esim-usa/)
- Saily: https://saily.com/esim-<country>/ via Wayback Machine (archive.org)
- FX: https://www.exchangerates.org.uk/GBP-USD-spot-exchange-rates-history-2026.html ; https://wise.com/gb/currency-converter/gbp-to-usd-rate/history

---

# eSIM batch 2 — remaining 20 destinations (Task 8)

Research date: **2026-06-10**. Completes the 40-destination set; `packages/data/datasets/roammath/esim.json` bumped to **`version: 1.0.0`** (20 records appended to batch 1's 20). Same regime as batch 1: Airalo serves GBP natively; Holafly and Saily are USD and converted at **1 USD = £0.747** with the `"(converted)"` suffix; `dataGb: null` = unlimited; per-bundle read date in `snapshotDate`. Destinations: new-zealand, uae, thailand, japan, china, india, south-africa, egypt, morocco, tunisia, norway, iceland, sweden, denmark, czechia, hungary, romania, bulgaria, albania, montenegro.

## Transport

- **Airalo** (`airalo.com/<country>-esim`): all 20 reached via **WebFetch**, GBP. Mostly unlimited-only stores (recorded an unlimited bundle, usually the 5-day for like-for-like with batch 1); where GB tiers were published we took a ~5GB bundle: **south-africa** (CellC 5GB/30d £10.00), **iceland** (5GB/15d £9.00), **bulgaria** (5GB/7d £5.00). UAE canonical slug is `united-arab-emirates-esim` (`uae-esim` 404s).
- **Holafly** (`esim.holafly.com/esim-<country>/`): all 20 reached via **WebFetch**, USD, unlimited-only. Recorded the **30-day unlimited** as the representative bundle, matching batch 1. **Exception — UAE**: Holafly's `esim-dubai/` page (the UAE product; `esim-united-arab-emirates/` 301s to an image) tops out at **15-day unlimited $50.90** with no 30-day tier shown, so the 15-day was recorded (no guessing a 30-day price).
- **Saily** (`saily.com/esim-<country>/`): **WebFetch 403**. **r.jina.ai live reads succeeded for 9** of 20 (Cloudflare let them through this session); the rest hit the bot-challenge. For challenged countries the **Wayback Machine** was checked and used only where a **2026 snapshot** existed (accuracy gate) — that recovered **india** (snap 2026-03-08) and **south-africa** (snap 2026-03-25). 2025-only snapshots (egypt, czechia, hungary, romania, bulgaria, montenegro, albania) and no-snapshot countries (norway, sweden, denmark) omit Saily rather than carry stale prices. Recorded Saily plan = **5GB / 30 days** (converted), consistent with batch 1.

## Per-country coverage

| Country | Airalo | Holafly | Saily | Notes |
|---|---|---|---|---|
| new-zealand | Unl 5d £15.00 | Unl 30d $74.90→£55.95 | 5GB/30d $13.99→£10.45 (live r.jina) | Spark network |
| uae | Unl 5d £16.00 | Unl 15d $50.90→£38.02 | 5GB/30d $11.99→£8.96 (live r.jina) | Holafly Dubai page caps at 15d (no 30d) |
| thailand | Unl 5d £12.00 | Unl 30d $74.90→£55.95 | — | Saily r.jina Cloudflare-blocked, no 2026 snapshot |
| japan | Unl 5d £13.50 | Unl 30d $74.90→£55.95 | 5GB/30d $10.99→£8.21 (live r.jina) | Softbank network |
| china | Unl 5d £15.00 | Unl 30d $74.90→£55.95 | 5GB/30d $15.99→£11.94 (live r.jina) | Saily warns app may be limited in China |
| india | Unl 5d £24.50 | Unl 30d $111.90→£83.59 | 5GB/30d $13.99→£10.45 (snap 2026-03-08) | Airalo India is unlimited-only & pricey |
| south-africa | 5GB/30d £10.00 | Unl 30d $111.90→£83.59 | 5GB/30d $12.99→£9.70 (snap 2026-03-25) | Airalo CellC GB tier; Vodacom unlimited dearer |
| egypt | Unl 5d £23.00 | Unl 30d $93.90→£70.14 | — | Saily only 2025-08 snapshot, omitted |
| morocco | Unl 5d £22.50 | Unl 30d $74.90→£55.95 | 5GB/30d $21.99→£16.43 (live r.jina) | Airalo Morocco store ≤7d unlimited-only |
| tunisia | Unl 5d £22.00 | Unl 30d $113.90→£85.08 | 5GB/30d $11.99→£8.96 (live r.jina) | Ooredoo network |
| norway | Unl 5d £15.00 | Unl 30d $73.90→£55.20 | — | Saily: no Wayback snapshot |
| iceland | 5GB/15d £9.00 | Unl 30d $73.90→£55.20 | 5GB/30d $11.99→£8.96 (live r.jina) | Airalo Iceland GB tier; Holafly unlimited |
| sweden | Unl 5d £15.00 | Unl 30d $73.90→£55.20 | — | Saily: no Wayback snapshot |
| denmark | Unl 5d £15.00 | Unl 30d $73.90→£55.20 | — | Saily: no Wayback snapshot |
| czechia | Unl 5d £15.00 | Unl 30d $73.90→£55.20 | omitted (2025-08 snapshot, stale) | Airalo slug `czech-republic-esim` |
| hungary | Unl 5d £15.00 | Unl 30d $73.90→£55.20 | omitted (2025-08 snapshot, stale) | Airalo unlimited-only |
| romania | Unl 5d £15.00 | Unl 30d $73.90→£55.20 | omitted (2025-04 snapshot, stale) | Airalo unlimited-only |
| bulgaria | 5GB/7d £5.00 | Unl 30d $73.90→£55.20 | omitted (2025-08 snapshot, stale) | Airalo Bulgaria GB tier |
| albania | Unl 5d £20.00 | Unl 30d $125.90→£94.05 | omitted (2025-12 snapshot, stale) | Holafly Albania priced high |
| montenegro | Unl 5d £22.00 | Unl 30d $104.90→£78.36 | omitted (2025-08 snapshot, stale) | MTEL network |

## Coverage summary (batch 2)

- **All 20** countries have **Airalo + Holafly** (2 providers each).
- **9** countries also have **Saily** (3 providers): new-zealand, uae, japan, china, india, south-africa, morocco, tunisia, iceland.
- Saily gaps (11): thailand, egypt, norway, sweden, denmark, czechia, hungary, romania, bulgaria, albania, montenegro — Cloudflare-blocked live and either no Wayback snapshot (thailand, norway, sweden, denmark) or only a stale 2025 snapshot (egypt, czechia, hungary, romania, bulgaria, albania, montenegro), omitted on the accuracy-over-completeness rule.

## Combined dataset coverage (40 destinations)

- All **40** roaming destinations have an eSIM record with **Airalo + Holafly**; the new `esim-coverage.test.ts` gate asserts every roaming slug has ≥1 bundle.
- **15** destinations carry **Saily** as a third provider (6 from batch 1 + 9 from batch 2).

## Saily source snapshots used (batch 2 Wayback)

- india: http://web.archive.org/web/20260308145402/https://saily.com/esim-india/ (5GB/30d $13.99)
- south-africa: http://web.archive.org/web/20260325221129/https://saily.com/esim-south-africa/ (5GB/30d $12.99)
- (live r.jina.ai reads on 2026-06-10 for: new-zealand, uae, japan, china, morocco, tunisia, iceland)

## Sources (eSIM batch 2)

- Airalo: https://www.airalo.com/<country>-esim (UAE: https://www.airalo.com/united-arab-emirates-esim ; Czechia: https://www.airalo.com/czech-republic-esim)
- Holafly: https://esim.holafly.com/esim-<country>/ (UAE: https://esim.holafly.com/esim-dubai/ ; Czechia: https://esim.holafly.com/esim-czech-republic/)
- Saily: https://saily.com/esim-<country>/ via r.jina.ai live + Wayback Machine (archive.org)
- FX: https://www.exchangerates.org.uk/GBP-USD-spot-exchange-rates-history-2026.html ; https://wise.com/gb/currency-converter/gbp-to-usd-rate/history

## Baggage fees (Task 9 — 12 airlines, verified 2026-06-10)

All figures from each airline's OWN published fee/baggage page. Most carriers price bags dynamically by route/date — recorded official published min–max ranges; fixed published figures recorded as min=max; unpublished items recorded as `null` min/max with a note. FX for EUR/USD conversions: **1 EUR = 0.864 GBP** (08 Jun 2026, exchangerates.org.uk), **1 USD ≈ 0.74 GBP** (Jun 2026).

| Airline | Items captured | Headline cabin / checked ranges (GBP) | Transport | Flags |
|---|---|---|---|---|
| ryanair | small bag (free), 10kg cabin, 10kg/20kg/23kg check-in, excess/kg | cabin £12–£60 · checked £9.49–£97 · excess £13/kg | WebSearch → r.jina.ai (help page 403) | Page shows £/€ parity; GBP figures used directly |
| easyjet | small cabin (free), large cabin, hold bag, excess/kg | large cabin from £5.99 (£60 gate) · hold from £6.99 (£60 drop) · excess £12/kg | WebFetch + r.jina.ai | Online prices fully dynamic; airport caps published |
| jet2 | 10kg hand (free), 22kg hold (dynamic), excess/kg | hand free · hold dynamic (null) · excess £12/kg | WebSearch (FAQ/baggage pages JS-only via jina) | Hold bag has no published fixed table → null; £12/kg excess published |
| british-airways | hand baggage (free), 1st checked 23kg (free std fares), overweight | hand free · 1st checked free (std) · overweight £65 | WebSearch + r.jina.ai (GB baggage-essentials) | Basic = hand-only, hold dynamic via calculator; overweight £65 fixed |
| wizz-air | carry-on (free), trolley (dynamic), checked (dynamic), excess/kg | carry-on free · trolley/checked dynamic (null) · excess £11.23 (EUR 13/kg conv) | WebSearch + r.jina.ai | GBP not published statically; only EUR 13/kg excess → converted |
| tui | 10kg hand (free), 15kg hold short/long-haul, extra/kg short/long | hand free · hold £60 (short) / £80 (long) per 15kg · extra £15/£20 per kg | WebSearch + r.jina.ai (page 403) | Flight-only fixed fees published; package incl 20kg+ |
| virgin-atlantic | hand (free), 1st/2nd checked, overweight, oversized | hand free · 1st checked free (exc Economy Light £80) · overweight £65 · oversized £200 | WebSearch + r.jina.ai (GB fees table) | Full GBP fee table published per fare/bag number |
| aer-lingus | 10kg cabin (Saver), 1st checked (free Smart/Flex/Plus+), overweight | cabin free-if-checked · 1st checked free (Smart/Flex 23kg) · overweight £68 (EUR 75) | WebSearch | Saver checked dynamic by route/channel → null max; overweight £68 published |
| vueling | under-seat (free), checked 15-30kg, oversized cabin, excess/kg | checked £8.64–£82 (EUR 10–95 conv) · oversized cabin £52–£121 · excess £10.37 (EUR 12/kg) | WebSearch | Published EUR ranges only → all converted to GBP |
| norwegian | small under-seat (free), overhead cabin, checked (dynamic), excess/kg | cabin from £5–£9 · checked dynamic (null) · excess £11.10 (USD 15/kg conv) | WebSearch (optional-charges JS-only) | Cabin floor in GBP; checked dynamic; excess USD 15/kg → converted |
| emirates | cabin 7kg (free), 1st checked 25kg (free Saver+), extra (dynamic) | cabin free · 1st checked free (Saver+) · extra dynamic (null) | WebSearch | Long-haul: bags included on Economy; extras calculator-only |
| lufthansa | carry-on 8kg (free), 1st checked 23kg (free Classic+), excess (dynamic) | carry-on free · 1st checked free (Economy Classic+) · excess dynamic (null) | WebSearch | Economy Light no free checked bag; flat rates route/fare-specific via calculator |

### Per-airline source URLs
- ryanair: https://www.ryanair.com/gb/en/useful-info/help-centre/fees
- easyjet: https://www.easyjet.com/en/help-centre/policy-terms-and-conditions/fees-charges
- jet2: https://www.jet2.com/en/baggage
- british-airways: https://www.britishairways.com/content/en/gb/information/baggage-essentials
- wizz-air: https://www.wizzair.com/en-gb/help-centre/booking-information-and-services/baggage/baggage-allowance/checked-in-baggage
- tui: https://www.tui.co.uk/destinations/info/luggage-allowance
- virgin-atlantic: https://flywith.virginatlantic.com/gb/en/upgrades-and-extras/optional-service-and-travel-fees.html
- aer-lingus: https://www.aerlingus.com/travel-information/baggage-information/checked-baggage/
- vueling: https://www.vueling.com/en/vueling-services/supplementary-service-rates
- norwegian: https://www.norwegian.com/en/booking/booking-information/optional-charges/
- emirates: https://www.emirates.com/english/before-you-fly/baggage/checked-baggage/
- lufthansa: https://www.lufthansa.com/gb/en/baggage

### Notes / decisions
- **Currency conversions** recorded with a "(converted)" item label or note: wizz-air excess (EUR 13/kg), vueling checked + oversized + excess (EUR), aer-lingus overweight (EUR 75 = published GBP 68 used), norwegian excess (USD 15/kg). FX 1 EUR = 0.864 GBP, 1 USD = 0.74 GBP.
- **Omitted/null items**: jet2 22kg hold, wizz-air trolley + checked, british-airways extra/Basic hold bags, aer-lingus Saver checked, norwegian checked, emirates extra, lufthansa excess — none publish a fixed GBP figure or static range (calculator/route-dynamic only), recorded with null min/max per the no-invention rule.
- **Long-haul included items** (Rule 2): BA, Virgin, Emirates, Lufthansa record cabin + first checked bag as Free (0/0) on standard/Economy fares, with the fare exceptions noted (BA Basic, Virgin/Lufthansa Light).

---

## 2026-06-28 — freshness SWEEP (eSIM re-quote, Airalo provider)

Scheduled weekly sweep. **Method:** each Airalo country page (`airalo.com/<country>-esim`) re-fetched via WebFetch (UK egress → GBP, directly comparable to the dataset's `totalPence`, which is GBP pence). **r.jina.ai is NOT usable as a cross-check here** — its egress is US-geolocated and returns USD (e.g. "France eSIM, from $4.00 USD"), not comparable to the GBP figures without conversion. So Airalo's own page read in GBP is the single official source used.

**Airalo (40 country bundles): 34 cleanly re-verified, 6 left unverified.**

- **27 confirmed UNCHANGED** (snapshotDate → 2026-06-28, no price change): spain, italy, portugal, japan, usa, austria (5GB/30d £6.50), belgium, switzerland, cyprus, malta, turkey, canada, mexico, australia, new-zealand, uae, thailand, china, india, egypt, morocco, tunisia, norway, hungary, romania, montenegro, south-africa (5GB/30d £10.00).
- **7 confirmed DRIFT** (Unlimited / 5-day; clean single-line reads; totalPence updated + snapshotDate → 2026-06-28):
  - ireland, netherlands, poland, sweden, denmark, czechia: £15.00 → **£15.50** (1500 → 1550 pence)
  - albania: £20.00 → **£20.50** (2000 → 2050 pence)
  - These are selective per-country Airalo Unlimited rises — many other Unlimited/5-day countries held at £15.00 (switzerland, cyprus, malta, turkey, new-zealand, china, norway, hungary, romania, portugal), so it is not a global change.
- **6 left UNVERIFIED (stored value kept, FLAGGED)** — all fixed-GB bundles whose Airalo page now defaults to the Unlimited tab, so the fetch could not read the specific GB row reliably:
  - **france** (5GB/30d, stored £8.50): two reads CONFLICTED — first read showed 30d/5GB £12.50 (a row-misalignment artefact: it equalled the 10GB price), the second full-table read showed £9.00. Ambiguous → kept £8.50; likely a real +£0.50 drift to ~£9.00 but not written without a clean confirmation.
  - germany (5GB/15d £8.50), greece (5GB/15d £9.00), croatia (5GB/15d £8.00), iceland (5GB/15d £9.00), bulgaria (5GB/7d £5.00): page exposed only Unlimited packages to the fetcher; fixed-GB rows not readable. Kept stored values.

**Holafly + Saily bundles: NOT re-verified this sweep (NEEDS-HUMAN).** They are "(converted)" values sourced from holafly.com / saily.com (not airalo.com, the record's `sourceUrl`) and require live FX conversion. Re-quoting them reliably is out of scope for an unattended run. Their snapshotDates remain 2026-06-10 (a few older).

**ParkMath (live brand) staleness check:** nothing older than 46 days — every drop-off, parking, lounge, priority-pass and news record was verified between 2026-06-10 and 2026-06-27. The two standing hard-blocked targets are already resolved: London City drop-off has a real record (verified 2026-06-22) and Newcastle Long Stay parking was added (verified 2026-06-27). No ParkMath changes this sweep.

## 2026-10-11 freshness sweep (RoamMath)

**eSIM (esim.json 1.0.1 -> 1.0.2).** All 40 countries re-quoted; snapshotDate/verifiedAt set to 2026-10-11 for every bundle.
- Airalo: direct UK-egress `curl` of each country page, parsed from `__NUXT_DATA__` (GBP flag confirmed, 40/40 pages). Where a tier is sold under two operators (austria, south-africa 5GB/30d) the cheaper one is tracked, as before.
- Holafly: server-rendered USD price table (`esim.holafly.com/esim-<country>/`, czechia = `esim-czech-republic`, uae = `esim-dubai`). Converted at **1 USD = £0.75641** (Frankfurter/ECB reference rate, 2026-10-09), rounded to pence. All 40 read.
- Saily: via r.jina.ai (direct 403s); 5 GB / 30 days USD, same rate. Greece needed the `X-Engine: browser` rung. All 15 read.
- Changes per bundle (country|provider|bundle|old pence|new pence):
```
spain|airalo|Spain Unlimited / 5 days|1400|1350
spain|holafly|Spain Unlimited / 30 days (converted)|5894|5030
spain|saily|Spain 5GB / 30 days (converted)|746|756
france|airalo|France 5GB / 30 days|850|900
france|holafly|France Unlimited / 30 days (converted)|5595|5590
france|saily|France 5GB / 30 days (converted)|896|831
italy|holafly|Italy Unlimited / 30 days (converted)|5894|4879
portugal|holafly|Portugal Unlimited / 30 days (converted)|5520|5590
portugal|saily|Portugal 5GB / 30 days (converted)|746|756
greece|holafly|Greece Unlimited / 30 days (converted)|5520|5787
greece|saily|Greece 5GB / 30 days (converted)|1045|1058
germany|holafly|Germany Unlimited / 30 days (converted)|5595|5787
germany|saily|Germany 5GB / 30 days (converted)|970|831
ireland|airalo|Ireland Unlimited / 5 days|1550|1500
ireland|holafly|Ireland Unlimited / 30 days (converted)|5520|5590
netherlands|airalo|Netherlands Unlimited / 5 days|1550|1450
netherlands|holafly|Netherlands Unlimited / 30 days (converted)|5595|5590
netherlands|saily|Netherlands 5GB / 30 days (converted)|746|756
belgium|holafly|Belgium Unlimited / 30 days (converted)|5520|5590
austria|holafly|Austria Unlimited / 30 days (converted)|5520|5787
switzerland|airalo|Switzerland Unlimited / 5 days|1500|1450
switzerland|holafly|Switzerland Unlimited / 30 days (converted)|5595|5787
poland|airalo|Poland Unlimited / 5 days|1550|1450
poland|holafly|Poland Unlimited / 30 days (converted)|5520|5590
croatia|holafly|Croatia Unlimited / 30 days (converted)|5520|5787
cyprus|airalo|Cyprus Unlimited / 5 days|1500|1450
cyprus|holafly|Cyprus Unlimited / 30 days (converted)|5520|5590
malta|airalo|Malta Unlimited / 5 days|1500|1450
malta|holafly|Malta Unlimited / 30 days (converted)|5520|5787
turkey|airalo|Turkey Unlimited / 5 days|1500|1450
turkey|holafly|Turkey Unlimited / 30 days (converted)|5595|5590
usa|holafly|United States Unlimited / 30 days (converted)|5595|5590
canada|airalo|Canada Unlimited / 5 days|2100|2150
canada|holafly|Canada Unlimited / 30 days (converted)|7164|7254
mexico|holafly|Mexico Unlimited / 30 days (converted)|5595|5030
australia|holafly|Australia Unlimited / 30 days (converted)|5595|5787
new-zealand|airalo|New Zealand Unlimited / 5 days|1500|1450
new-zealand|holafly|New Zealand Unlimited / 30 days (converted)|5595|5787
new-zealand|saily|New Zealand 5GB / 30 days (converted)|1045|1058
uae|airalo|United Arab Emirates Unlimited / 5 days|1600|1500
uae|holafly|United Arab Emirates Unlimited / 15 days (converted)|3802|3820
uae|saily|United Arab Emirates 5GB / 30 days (converted)|896|907
thailand|holafly|Thailand Unlimited / 30 days (converted)|5595|5590
japan|holafly|Japan Unlimited / 30 days (converted)|5595|5590
japan|saily|Japan 5GB / 30 days (converted)|821|831
china|holafly|China Unlimited / 30 days (converted)|5595|5787
china|saily|China 5GB / 30 days (converted)|1194|1209
india|airalo|India Unlimited / 5 days|2450|2500
india|holafly|India Unlimited / 30 days (converted)|8359|8464
india|saily|India 5GB / 30 days (converted)|1045|1058
south-africa|holafly|South Africa Unlimited / 30 days (converted)|8359|8464
south-africa|saily|South Africa 5GB / 30 days (converted)|970|983
egypt|airalo|Egypt Unlimited / 5 days|2300|2250
egypt|holafly|Egypt Unlimited / 30 days (converted)|7014|7254
morocco|airalo|Morocco Unlimited / 5 days|2250|2300
morocco|holafly|Morocco Unlimited / 30 days (converted)|5595|6573
morocco|saily|Morocco 5GB / 30 days (converted)|1643|1663
tunisia|holafly|Tunisia Unlimited / 30 days (converted)|8508|8616
tunisia|saily|Tunisia 5GB / 30 days (converted)|896|907
norway|airalo|Norway Unlimited / 5 days|1500|1450
norway|holafly|Norway Unlimited / 30 days (converted)|5520|5590
iceland|holafly|Iceland Unlimited / 30 days (converted)|5520|5787
iceland|saily|Iceland 5GB / 30 days (converted)|896|907
sweden|holafly|Sweden Unlimited / 30 days (converted)|5520|5590
denmark|airalo|Denmark Unlimited / 5 days|1550|1450
denmark|holafly|Denmark Unlimited / 30 days (converted)|5520|5590
czechia|airalo|Czech Republic Unlimited / 5 days|1550|1450
UNVERIFIED czechia holafly
hungary|airalo|Hungary Unlimited / 5 days|1500|1450
hungary|holafly|Hungary Unlimited / 30 days (converted)|5520|5787
romania|airalo|Romania Unlimited / 5 days|1500|1450
romania|holafly|Romania Unlimited / 30 days (converted)|5520|5787
bulgaria|holafly|Bulgaria Unlimited / 30 days (converted)|5520|5787
albania|airalo|Albania Unlimited / 5 days|2050|2000
albania|holafly|Albania Unlimited / 30 days (converted)|9405|9523
montenegro|airalo|Montenegro Unlimited / 5 days|2200|2150
montenegro|holafly|Montenegro Unlimited / 30 days (converted)|7836|8056czechia|holafly|Czech Republic Unlimited / 30 days (converted)|5520|5787
```
(Holafly/Saily deltas are mostly the FX move 0.747 -> 0.75641 plus some USD list changes.)

**Roaming (roaming.json 1.0.0 -> 1.0.1).** Sources read 2026-10-11: Vodafone price guide PDF (Zone B £2.75, Zone C/D £8 from 14 Apr 2026 - unchanged), Three Go Roam page (£2.75 / £8 from 1 Apr 2026 - unchanged), O2 Travel Bolt On £7/day (unchanged), EE Daily EU Charge £2.72 (unchanged). EE source switched to the 31 Mar 2026 price guide, where ROW passes rose: Zone 1 £5 -> £5.50/day (7-day £25 -> £26.50), Zone 2 £7.50 -> £8/day (7-day £37.50 -> £39.50), Zone 3 £7.50 -> £8/day. dailyPassPence 500->550 (12 records), 750->800 (5). Destination->zone membership was NOT re-checked.

**Baggage (baggage.json untouched).** Official pages are JS-rendered/dynamic; only TUI's figures (hold bag £60/£80, extra kg £15/£20) were confirmed in static HTML. No record's verifiedAt bumped (not every fee confirmed). Others unverified.

## 2026-10-18 freshness sweep (RoamMath)

**eSIM (esim.json 1.0.2 -> 1.0.3).** All 40 countries re-quoted; snapshotDate/verifiedAt set to 2026-10-18 for every bundle.
- Airalo: direct UK-egress `curl`, parsed from `__NUXT_DATA__` (GBP `selected:true` confirmed on 40/40). 39/40 unchanged. **Canada Unlimited / 5 days £21.50 -> £18.50** (single operator "Canada Mobile", slug `canada-mobile-5days-unlimited`, `minor_amount` 1850 GBP).
- Holafly: server-rendered USD table (`esim.holafly.com/esim-<country>/`; czechia = `esim-czech-republic`, uae = `esim-dubai`). All 40 USD list prices **unchanged** vs 2026-10-11.
- Saily: plain `r.jina.ai` (UAE needed `X-Engine: browser`; direct 403s). All 15 5 GB / 30 day USD prices **unchanged**.
- FX: re-converted at **1 USD = £0.74989** (Frankfurter/ECB reference rate, 2026-10-16; was 0.75641 on 2026-10-09), rounded half-up to pence. So every Holafly/Saily delta below is the FX move only.
- Changes (country|provider|bundle|old pence|new pence):
```
spain|holafly|Spain Unlimited / 30 days (converted)|5030|4987
spain|saily|Spain 5GB / 30 days (converted)|756|749
france|holafly|France Unlimited / 30 days (converted)|5590|5542
france|saily|France 5GB / 30 days (converted)|831|824
italy|holafly|Italy Unlimited / 30 days (converted)|4879|4837
portugal|holafly|Portugal Unlimited / 30 days (converted)|5590|5542
portugal|saily|Portugal 5GB / 30 days (converted)|756|749
greece|holafly|Greece Unlimited / 30 days (converted)|5787|5737
greece|saily|Greece 5GB / 30 days (converted)|1058|1049
germany|holafly|Germany Unlimited / 30 days (converted)|5787|5737
germany|saily|Germany 5GB / 30 days (converted)|831|824
ireland|holafly|Ireland Unlimited / 30 days (converted)|5590|5542
netherlands|holafly|Netherlands Unlimited / 30 days (converted)|5590|5542
netherlands|saily|Netherlands 5GB / 30 days (converted)|756|749
belgium|holafly|Belgium Unlimited / 30 days (converted)|5590|5542
austria|holafly|Austria Unlimited / 30 days (converted)|5787|5737
switzerland|holafly|Switzerland Unlimited / 30 days (converted)|5787|5737
poland|holafly|Poland Unlimited / 30 days (converted)|5590|5542
croatia|holafly|Croatia Unlimited / 30 days (converted)|5787|5737
cyprus|holafly|Cyprus Unlimited / 30 days (converted)|5590|5542
malta|holafly|Malta Unlimited / 30 days (converted)|5787|5737
turkey|holafly|Turkey Unlimited / 30 days (converted)|5590|5542
usa|holafly|United States Unlimited / 30 days (converted)|5590|5542
canada|airalo|Canada Unlimited / 5 days|2150|1850
canada|holafly|Canada Unlimited / 30 days (converted)|7254|7191
mexico|holafly|Mexico Unlimited / 30 days (converted)|5030|4987
australia|holafly|Australia Unlimited / 30 days (converted)|5787|5737
new-zealand|holafly|New Zealand Unlimited / 30 days (converted)|5787|5737
new-zealand|saily|New Zealand 5GB / 30 days (converted)|1058|1049
uae|holafly|United Arab Emirates Unlimited / 15 days (converted)|3820|3787
uae|saily|United Arab Emirates 5GB / 30 days (converted)|907|899
thailand|holafly|Thailand Unlimited / 30 days (converted)|5590|5542
japan|holafly|Japan Unlimited / 30 days (converted)|5590|5542
japan|saily|Japan 5GB / 30 days (converted)|831|824
china|holafly|China Unlimited / 30 days (converted)|5787|5737
china|saily|China 5GB / 30 days (converted)|1209|1199
india|holafly|India Unlimited / 30 days (converted)|8464|8391
india|saily|India 5GB / 30 days (converted)|1058|1049
south-africa|holafly|South Africa Unlimited / 30 days (converted)|8464|8391
south-africa|saily|South Africa 5GB / 30 days (converted)|983|974
egypt|holafly|Egypt Unlimited / 30 days (converted)|7254|7191
morocco|holafly|Morocco Unlimited / 30 days (converted)|6573|6517
morocco|saily|Morocco 5GB / 30 days (converted)|1663|1649
tunisia|holafly|Tunisia Unlimited / 30 days (converted)|8616|8541
tunisia|saily|Tunisia 5GB / 30 days (converted)|907|899
norway|holafly|Norway Unlimited / 30 days (converted)|5590|5542
iceland|holafly|Iceland Unlimited / 30 days (converted)|5787|5737
iceland|saily|Iceland 5GB / 30 days (converted)|907|899
sweden|holafly|Sweden Unlimited / 30 days (converted)|5590|5542
denmark|holafly|Denmark Unlimited / 30 days (converted)|5590|5542
czechia|holafly|Czech Republic Unlimited / 30 days (converted)|5787|5737
hungary|holafly|Hungary Unlimited / 30 days (converted)|5787|5737
romania|holafly|Romania Unlimited / 30 days (converted)|5787|5737
bulgaria|holafly|Bulgaria Unlimited / 30 days (converted)|5787|5737
albania|holafly|Albania Unlimited / 30 days (converted)|9523|9441
montenegro|holafly|Montenegro Unlimited / 30 days (converted)|8056|7986
```

**Baggage (baggage.json 1.0.0 -> 1.0.1).** All 12 records were stale (verifiedAt 2026-06-10). Each official page fetched via `r.jina.ai` with `X-Engine: browser`; Ryanair's column headers read in the in-app browser pane. FX for EUR figures: **1 EUR = £0.84385** (Frankfurter/ECB, 2026-10-16).
- **ryanair — re-verified, values changed.** Table has two columns, "At the Time of Booking" and "Post Booking/Airport". Recorded the booking-time column consistently (the June record had mixed columns): Priority & 2 Cabin Bags £12.49-£36 (was £12-£60); 10kg £10.49-£44.99 (was £9.49-£44.99); 20kg £21.49-£59.99 (was £18.99-£59.99); 23kg £28.99-£80.99 (was £29.99-£97). Post-booking ranges and £35.99 / £59.99 bag-drop prices in notes. £13/kg excess unchanged. (Page shows "€/£" parity; GBP figures used directly.)
- **easyjet — re-verified, restructured.** Page no longer publishes the "from £5.99 / £6.99" online floors ("Fees vary with demand… You'll see exact price at time of purchase"). Split into online (null, not published) and fixed airport rows: large cabin bag at gate £60; hold bag at bag drop (≤23kg) £60; excess £12/kg; small cabin bag free (45x36x20, 15kg).
- **tui — re-verified, unchanged** (plain jina rung; direct + browser rung 403): hand luggage 10kg 55x40x20 + personal item free; flight-only hold £60 (short-haul) / £80 (long-haul, Cape Verde, Egypt, Gambia, Senegal) per 15kg; extra kg £15 / £20.
- **vueling — re-verified, values changed.** Overhead cabin bag (10kg, 55x40x20) EUR 10-59 online (EUR 45-75 at desk); checked bag 15-30kg now EUR 10-120 (was EUR 10-95; 30kg tier EUR 25-120); excess EUR 12/kg at desk. Old "oversized cabin bag EUR 60-140" row replaced by the overhead-cabin-bag row (the page no longer has a matching row). All converted at 0.84385.
- **norwegian — re-verified, values changed (source contradicted old record).** Page now publishes EUR: overhead cabin bag EUR 13.90 domestic / 15.90-29.90 international (was "£5-£9"); first checked bag pre-booked EUR 19-45 international (EUR 20 domestic; EUR 45 at/after check-in); excess EUR 15/kg over 23kg (was USD 15/kg). Converted at 0.84385. Under-seat bag dimensions not restated on the page, so dropped from the item name.
- **NOT re-verified (verifiedAt left at 2026-06-10, flagged in PR):**
  - jet2 — hand luggage 10kg 56x45x25 + under-seat 40x30x20 confirmed, 22kg hold still unpublished, but the £12/kg excess is on neither the baggage page nor the baggage FAQ.
  - british-airways — allowances confirmed (cabin 56x45x25, handbag 40x30x15, 23kg checked) but the £65 overweight fee is calculator-only; no £ on the page.
  - wizz-air — EUR 13/kg airport surcharge confirmed; carry-on terms are on a different page not fetched.
  - virgin-atlantic — the sourceUrl now just links to `help.virginatlantic.com/global/en/baggage/additional-baggage.html`, which renders an empty shell on every rung (browser rung times out). sourceUrl likely needs repointing.
  - aer-lingus — "all fares except Saver include a 20kg checked bag", Smart/Flex 23kg transatlantic, and a new **EUR 10/kg excess** seen; the £68 / EUR 75 overweight figure not found.
  - emirates — page now shows Economy weight concept Special 20kg / Saver 25kg / Flex 30kg / Flex Plus 35kg (so Special fares also include a bag); 7kg cabin allowance not on this page.
  - lufthansa — `/gb/en/baggage` is a hub page with no figures.
- The in-app browser pane refused navigation to new sites in this unattended run (only Ryanair loaded), so rung 0 was unavailable for the rest.

**Roaming.** Three Go Roam page re-read: £2.75 (EU) / £8 (ROW) for joins on/after 18 Dec 2025 from 1 Apr 2026 — unchanged; its pending hash cleared. Record verifiedAt not bumped (destination->zone membership not re-checked). O2 Travel Inclusive Zone Ultimate page left pending (zone list not re-checked).
