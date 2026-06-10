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

## Soft-value flags (records carrying a non-inclusive or non-daily-pass figure)

| Destination | Network | dailyPassPence | Why it's soft |
|---|---|---|---|
| Morocco | O2 | 2600 | NOT in O2 Travel; £26 = cheapest **data-only** Zone-3 Bolt On (100MB), not an inclusive daily pass. Calls £3/min, texts £1. |
| Tunisia | O2 | 2600 | Same as Morocco — Zone 3 data-only Bolt On. |
| Tunisia | Vodafone | 257 | Vodafone **Rest of World Zone 3** — no inclusive daily pass; 257p is the per-minute call rate, data via optional extra. |
| Albania | Vodafone | 257 | Vodafone **Rest of World Zone 1** — no inclusive daily pass; per-minute figure. |
| Montenegro | Vodafone | 257 | Vodafone **Rest of World Zone 1** — no inclusive daily pass; per-minute figure. |

The EE **50GB** Europe fair-use cap comes from EE's help roaming-fair-use page rather than the price-guide PDF (the PDF lists EU charges but not the GB cap); recorded as a fair-use note rather than a hard table value.

## Sources

- EE: https://ee.co.uk/content/dam/help/terms-and-conditions/price-plans/mobile/ee-pay-monthly-standard-and-non-standard-price-guide-23-July-2025.pdf ; https://ee.co.uk/help/mobile/roaming
- O2: https://www.o2.co.uk/international/travel-inclusive-zone-ultimate ; https://www.o2.co.uk/international/o2-travel ; https://www.o2.co.uk/international/data-roaming-bolt-ons
- Vodafone: https://binaries.vodafone.co.uk/gbnnsauqav4t/3ynRZJ6BvgpyYyPmoIAHX0/ff9c9463c41c25d0cbf8f5d27f955afb/evo-paym-charges-guide.pdf ; https://www.vodafone.co.uk/mobile/global-roaming
- Three: https://www.three.co.uk/support/roaming-and-calling-abroad/roaming-abroad/go-roam ; https://www.three.co.uk/content/dam/threedigital/terms-and-conditions/price-guides/latest-price-guides/advancedplans-priceguide-post19apr2026-19042026.pdf
