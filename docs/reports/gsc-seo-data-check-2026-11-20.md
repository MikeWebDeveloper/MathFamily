# Search Console, SEO/GEO and data check — 20 Nov 2026

Sources:
- Gmail: Search Console emails since September.
- Google Search Console for `sc-domain:parkmath.co.uk`, read in Chrome.
- The live site.
- `origin/main` datasets.
- A read-only check of 13 official airport pages.
- A research pass over Google, OpenAI and Bing documentation.

## 1. The Search Console emails

| Email | What it is | Verdict |
|---|---|---|
| 19 Nov: Merchant listings, 3 issues (`shippingDetails`, `validFrom`, `hasMerchantReturnPolicy`) | **Non-critical** warnings on the Product/Offer markup of the `/airport-parking/*` pages. The report shows 0 invalid and 2 valid items. | **Intentional, leave it.** Google's product docs say product snippets are "for product pages where people can't directly purchase the product", which is what these pages are. The three fields are e-commerce terms ParkMath can't truthfully fill. No tariff start date is stored, so there is no honest `validFrom` either. |
| 19 Nov: Product snippets, 2 issues (`review`, `aggregateRating`) | Non-critical, same pages. | **Intentional.** Never fabricate reviews. |
| 22 Oct: "Blocked due to access forbidden (403)" | 1 URL: `/go/teesside/lounge?s=dropoff-lounge`, an affiliate redirect. | **Fixed by PR #100.** Its `Disallow: /go/` keeps crawlers off `/go`. |
| 3 Nov: October performance | 696 clicks, 110K impressions (September: 926 and 138K). | See section 3. |

## 2. Indexing (Pages report, last update 16 Nov)

- 237 pages are indexed and 379 are not. The sitemap was read on 13 Nov and holds 245 URLs.
- **Page with redirect (272):** all `/go/` affiliate links, crawled as recently as 17–18 Nov. PR #100 fixes this.
- **Crawled – not indexed (88):**
  - 84 are `opengraph-image` URLs, `/go/` links or a font file. That is harmless.
  - 2 are real pages: `/avoid-drop-off-charge/manchester` and `/blue-badge/southampton`.
- **Discovered – not indexed (8):** Google has never crawled these.
  - `/drop-off-charges/luton`
  - `/drop-off-charges/newcastle`
  - `/drop-off-charges/inverness`
  - `/drop-off-charges/belfast-international`
  - `/abroad/leeds-bradford`
  - `/abroad/newcastle`
  - `/abroad/southend`
  - `/parking-price-index-2026`

  All 8 return 200 and are in the sitemap. **Action:** request indexing in Search Console, which needs Mike's OK.
- **404 (5):** `/day`, `/min`, `/$`, `/&` and `/cdn-cgi/l/email-protection`. These are strings Google pulled out of scripts, plus Cloudflare's email obfuscation. They are harmless; optionally turn off Cloudflare Email Obfuscation.
- **noindex (2), robots.txt (1):** these are `/go/` URLs, as intended.
- **Alternative canonical (2):** `/?ref=producthunt` and `/?ref=stillup.to`. Correct.
- **RoamMath has no Search Console property.** `sc-domain:roammath.co.uk` shows "you don't have access". Adding it needs a DNS TXT record (Mike).

## 3. Performance, last 28 days

- 374 clicks, 67.8k impressions, **0.6% CTR**, average position 19.4.
- `/drop-off-charges/stansted` is **29% of all impressions** (19,494). Its CTR is **0.3%** at position 9.9. The queries are mostly about paying: "pay stansted drop off" (899 impressions), "stansted drop off payment" (876), "stn drop off" (461). Most sit at positions 6–10 with 0–0.6% CTR.
- Other drop-off pages at positions 8–13 also get 0.2–0.4% CTR: Birmingham (2,816 impressions), Southend (2,616), Liverpool (1,777).
- Pages whose title promises a free route do much better at similar positions:
  - Avoid pages get 1.5–9.8% CTR.
  - Blue Badge pages get 1.9–2.9%.

  Their queries differ, so this is a hypothesis to test, not proof.
- Parking pages rank at positions 40–80 for "teesside/prestwick/belfast parking" queries. They are not competitive there.

## 4. Fixed in this PR

1. **The "Verified" badge and the "verified on" sentence now show the record's own date.**
   - Four routes (drop-off, blue-badge, avoid, parking-vs-drop-off) showed the newest *news item's* date instead.
   - Stansted therefore said its £10 charge "was verified on 17 October". It was last checked on 3 September.
   - This also hid the 60-day "Last verified" stale label.
   - Now:
     - The badge uses the record's date.
     - The "current information" line appears only while the record is fresh.
     - `dateModified` still follows the newer date.
2. **Southend's SERP description no longer says "Verified June 2026".**
   - The dataset guard now also catches month-name check dates.
   - It is a text-only dataset edit with no price change.
   - A dry-run merge against a re-verify of the same record from the rolling data PR was clean.

Until the rolling data PR re-verifies them, Stansted, Leeds Bradford and East Midlands will show "Last verified …". That is the honest state.

## 5. Is the data up to date?

Ages on `origin/main` as of today:
- **Drop-off:** 26 records. Three are over 60 days old: **Stansted (78 days)**, Leeds Bradford (77) and East Midlands (77). The CI gate fails at 120 days.
- **Lounges:** Heathrow is 99 days old. Corrections are verified but not merged:
  - Heathrow: Club Aspire T5 has closed and Plaza Premium is now £49 (#98).
  - Glasgow: £27 → £30 (#99).
- **RoamMath baggage:** all 12 records are **163 days old**. #81 and #88 carry re-verifies.
- **Priority Pass:** 77 days old. **Parking and eSIM:** fresh (34–44 days and 19 days).

Official-page spot check of 12 airports:
- **The only wrong live value is East Midlands.** Short Stay 1 is now £12 for 30 minutes, and the Rapid Drop-Off change is in #97 (also in #83, #86, #89 and #94, which are duplicates).
- Heathrow, Manchester, Newcastle, Liverpool, Southend and Cardiff match.
- Not confirmed:
  - Stansted's £10/15 min: the tariff isn't in the page text.
  - Leeds Bradford: the figure is inside a collapsed accordion.
  - Luton: no fee text on the page.
  - Birmingham: blocked by Cloudflare.
- No 2027 fee changes are announced yet.

**Bottom line:** main is stale because verified corrections sit in unmerged PRs (#81–#99), not because nobody checked. The rolling data PR is the way to clear them. Today's daily data check was still "due, not started" at 07:27 UTC.

## 6. Suggested changes, in priority order

1. **Merge #100.** It stops Google crawling 272 `/go/` URLs and adds the measurement-plumbing alerts. Its CI is green. Then merge this PR.
2. **Request indexing** for the 8 never-crawled pages (Luton and Newcastle drop-off first) and the 2 crawled-not-indexed pages.
3. **Verify the site in Bing Webmaster Tools.** This unblocks IndexNow, Copilot citations and Bing's AI-performance report. It is the clearest GEO blocker.
4. **Stansted title and description test**, after the first rolling PR merges. The dataset `seoTitle` sits next to `verifiedAt`, which the rolling PR will change.
   - Title candidates (60 characters or fewer with the suffix):
     - "Stansted drop-off: how to pay it, or skip it free"
     - "Pay the Stansted drop-off (£10) — or skip it free"
   - Description: lead with paying online by 23:59 the next day, then the price, then the free Mid Stay zone.
   - Run it for 4 weeks on Stansted only and compare CTR with Birmingham and Southend as controls.
5. **Add a "How to pay" block in the first screen of the drop-off pages:**
   - The deadline.
   - Where to pay (link to the official page).
   - The penalty.
   - What to do about a wrongly issued charge.

   This matches the pay-intent queries.
6. **Add `sc-domain:roammath.co.uk` to Search Console.** It needs a DNS TXT record.
7. **Skip:** llms.txt tuning (no engine uses it), more schema types, and Speakable (US English news only, so inert here). FAQ rich results ended in May 2026; keep the markup anyway, since it is harmless.

## Not checked

- The Core Web Vitals report did not load.
- The generative-AI report gives only impressions per page; there was no per-page AI split worth recording.
- The new pages were not checked on a deployed preview; the evidence is the build output plus 404 passing app tests.
- The Stansted title change has not been made.
