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
