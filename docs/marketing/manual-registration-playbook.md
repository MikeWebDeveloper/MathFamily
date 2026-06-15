# ParkMath — Manual Registration Playbook (Top 20, impact-ranked)

Everything here needs **you** (login, CAPTCHA, logo, or a personal account). Ranked by real
impact for a free UK airport-parking cost tool — not by domain rating. Work top-down; the first
few matter more than the rest combined.

- **Site:** https://www.parkmath.co.uk  ·  **Maker:** Michal Latal (Mike), Sheffield
- **Email:** hello@parkmath.co.uk  ·  **Logo:** `docs/marketing/assets/parkmath-logo-512.png`
- Pairs with [`directory-copy.md`](./directory-copy.md) (full copy) and [`directory-submissions.md`](./directory-submissions.md) (what's already auto-done).

---

## 📋 PASTE BLOCK — reuse these everywhere

**Product name:** `ParkMath`

**Tagline (1 line):**
```
Know exactly what dropping off or parking at your UK airport really costs — before you drive.
```

**Short description (≤60 chars):**
```
Free, independent UK airport drop-off & parking costs
```

**Medium description (~250 chars):**
```
ParkMath is a free, independent UK airport cost checker: drop-off charges, time limits and the free alternative at 25 airports, plus gate-vs-pre-book parking. Every figure is hand-verified against the airport's official page and date-stamped. No bookings, no bias.
```

**Long description:**
```
ParkMath is a free, independent UK airport cost checker. It tells you, in plain numbers, two things every traveller gets stung by: how much it costs to be dropped off at the terminal, and how much parking actually costs once you're there.

It covers 25 UK airports — from Heathrow, Gatwick and Manchester down to Inverness, Teesside and Cardiff — with every figure hand-verified against the airport's own official page and date-stamped.

Drop-off reality: almost every UK airport now charges just to pull up at the terminal (Heathrow £7, Gatwick £10 for 10 minutes). ParkMath shows the fee, the time limit, and the free alternative the airport doesn't advertise.

Parking gap: it compares the drive-up "gate" price with the pre-book price so you can see the difference — often £90+ for the identical car park.

Why independent matters: ParkMath isn't a booking engine and takes no commission, so the cheapest genuine option is the one you see first. No upsells, no aggregator bias. Free, no account, no app.

https://www.parkmath.co.uk
```

**"Alternative to" line (for AlternativeTo etc.):**
```
A free, independent cost-comparison and drop-off-fee checker for UK airports — use it before you book with Holiday Extras, APH or Purple Parking to know what the fair price actually is.
```

**Competitors / alternatives (when asked):** `Holiday Extras, APH (Airport Parking & Hotels), Purple Parking`

**Tags / keywords:** `airport parking, drop-off charges, UK airports, parking comparison, kiss and fly, travel costs, parking calculator`

**Category (pick closest):** Travel · Tools / Utilities · Productivity · Consumer App

---

# TIER A — DO FIRST (tracking & owned channels — bigger than any backlink)

## 1. Google Search Console — *the single most important one*
**Why:** without it you're flying blind on organic + AI-search traffic. ~20 min, permanent.
**Steps:**
1. Go to `search.google.com/search-console` → **Add property** → **Domain** → enter `parkmath.co.uk`.
2. Copy the TXT record it gives you → Cloudflare → DNS → add **TXT** on `@` → Verify.
3. **Sitemaps** → submit `https://www.parkmath.co.uk/sitemap.xml`.
4. After 48h: check **Pages** (indexing) and **Performance**.
5. Create a filter for AI referrals: Performance → add filter, query/referrer contains `chatgpt`, `perplexity`, `copilot`, `claude` — watch it grow.
**Paste:** property = `parkmath.co.uk` · sitemap = `https://www.parkmath.co.uk/sitemap.xml`

## 2. Bing Webmaster Tools — *feeds ChatGPT Search*
**Why:** in 2026 ChatGPT/Copilot answers lean on Bing's index. No Bing index = invisible to them.
**Steps:**
1. `bing.com/webmasters` → sign in → **Import** from Google Search Console (one click after #1).
2. Confirm the import, submit sitemap `https://www.parkmath.co.uk/sitemap.xml`.
3. Enable **IndexNow** (instant re-crawl on publish).
**Paste:** sitemap = `https://www.parkmath.co.uk/sitemap.xml`

## 3. MailerLite — *own the audience*
**Why:** the "tell me when MY airport's price changes" hook is unique to you and your data actually changes. Free up to 500 subs.
**Steps:**
1. `mailerlite.com` → create free account → create a group **"ParkMath Alerts"**.
2. Forms → **Embedded** → copy the form action URL.
3. Add Vercel env var `NEXT_PUBLIC_MAILERLITE_FORM_ACTION = {that URL}` → redeploy (or tell me, I'll wire it).
**Paste — welcome email subject:** `You're on the ParkMath list — here's what's changed this week`

## 4. F5Bot — *free lead radar*
**Why:** emails you the moment anyone on Reddit/HN mentions your keywords → forum opportunities (see #5/#6).
**Steps:** `f5bot.com` → enter your email → add keywords (one per line):
```
airport parking heathrow
airport parking gatwick
airport parking manchester
drop off charge
kiss and fly
meet and greet parking
cheapest airport parking
```

---

# TIER B — HIGHEST-TRAFFIC PLATFORMS

## 5. MoneySavingExpert forum — *highest-converting UK community for this niche*
**Why:** people literally ask "cheapest parking at [airport]?" here, ready to act. Cite ParkMath as an independent source (never an affiliate link, never claim you run it in the first reply).
**Steps:** `forums.moneysavingexpert.com` → Register → find threads (Motoring/Travel boards) → reply helpfully.
**Paste — reply template:**
```
The verified figures at parkmath.co.uk for [airport] show:
- Drive-up (gate): £X for 7 days
- Pre-book: £Y for 7 days (saving ~£Z)
- Free drop-off alternative: [from the airport's page]
Worth comparing before you book — prices there are date-stamped against the official airport source.
```

## 6. Reddit — *r/uktravel, r/AskUK, r/InternetIsBeautiful*
**Why:** high-intent UK travel discussion + a one-time "I built a free tool" post.
**Steps:** register at `reddit.com` → build a little comment karma first → post the tool **once** in r/InternetIsBeautiful, then be genuinely helpful (link only when relevant) in r/uktravel & r/AskUK.
**Paste — r/InternetIsBeautiful title:**
```
I built a free, independent UK airport drop-off & parking cost checker — every figure hand-verified against the airport's official page
```

## 7. Product Hunt — *launch-day traffic + brand*
**Why:** big referral spike + lasting profile (link is nofollow — value is traffic, not juice).
**Steps:**
1. `producthunt.com` → sign in (LinkedIn / GitHub / X — no Google).
2. **Submit** → New Product. Tagline + description (paste block). Topics: **Travel** + **Productivity**.
3. Upload logo (240×240+) and **2 gallery images** (1270×760) — screenshot the homepage + a drop-off page.
4. **Schedule** for a Tue/Wed 00:01 PST. Add a maker first-comment. **Don't** launch blind — pick the day.
**Paste tagline:** `The free, independent UK airport drop-off & parking cost checker`

---

# TIER C — DOFOLLOW DIRECTORIES (account required, real link value)

## 8. Uneed — **dofollow DR74**
**Steps:** `uneed.best/submit-a-tool` → enter name + URL → it scrapes → **sign up to save** (Google fastest) → pick free "waiting line" launch → finish description + screenshots. **Paste:** name/URL/medium desc + tags.

## 9. SaaSHub — **dofollow DR79**
**Steps:** `saashub.com/services/submit` → Register → website URL → add categories (Travel/Tools) → **list competitors: Holiday Extras, APH, Purple Parking** (skipping this de-prioritises you) → submit. **Paste:** medium desc + competitors line.

## 10. AlternativeTo — **DR79, "unbiased comparison" intent** (nofollow)
**Steps:** `alternativeto.net` → Register → top-right user menu → **Suggest new application** → name, URL, Platform = **Online/Web**, License = **Free** → tag travel/parking → in "alternative to" use the alt-to line. **Paste:** alt-to line + medium desc.

## 11. FreeIndex (UK) — **dofollow DA56, UK-relevant**
**Steps:** `freeindex.co.uk` → Register → add free business listing → category Travel/Motoring → use medium desc + `hello@parkmath.co.uk`. No Companies House number needed. **Paste:** medium desc + tags.

## 12. Hotfrog UK — **dofollow DA58, UK**
**Steps:** `hotfrog.co.uk` → create account → **confirm via email** → add business → category Travel Services → medium desc. **Paste:** medium desc + tags.

## 13. Brownbook — **dofollow DA63**
**Steps:** `brownbook.net` → register → verify email → solve their "I'm not a robot" → add business → medium desc. **Paste:** medium desc.

## 14. BetaList — **dofollow DR73**
**Steps:** `betalist.com/submit` → sign in (X or magic-link) → startup name, URL, tagline, 800×600 thumbnail (logo) → submit (free queue is long; that's fine). **Paste:** tagline + medium desc.

## 15. PeerPush — **dofollow DR74**
**Steps:** `peerpush.com` → create account + profile → submit product (name/URL/desc/category) → engage a little to rank. **Paste:** medium desc + tags.

## 16. twelve.tools — **dofollow DR80** (needs a footer link)
**Steps:**
1. Tell me to add the "As featured on" reciprocal link to the site footer + deploy (you approved this).
2. `twelve.tools/submit-your-tool` → tool name (≤24 chars) `ParkMath`, headline (≤92) , URL, upload logo (≥128px square), category Travel/Productivity, email → tick the backlink-confirmation box → submit.
**Paste headline:** `Free, independent UK airport drop-off & parking cost checker`

## 17. Fazier — launch directory (dofollow)
**Steps:** `fazier.com/submit` → sign in → product name, tagline, description, screenshot → free tier requires their badge/link (I can add it with twelve.tools' if you want) → submit. **Paste:** tagline + medium desc.

## 18. IndieHackers — "Show IH" story post
**Why:** community traffic + credibility (link nofollow until karma — value is reach).
**Steps:** `indiehackers.com` → sign in (X) → group **Show IH** → New Post → paste the story.
**Paste — title:**
```
Show IH: I got charged £7 just to drop my mum at Heathrow, so I built a free, independent UK airport cost checker
```
(Full body is in `directory-copy.md` §5 — paste that as the post.)

---

# TIER D — QUICK CAPTCHA WINS (no account — I filled everything, you just finish)

## 19. ProLinkDirectory — **verified dofollow** ⭐ easiest high-value
**Why:** clean verified dofollow, no login — literally just a CAPTCHA stands between you and the link.
**Steps:** `prolinkdirectory.com/submit.php` → select **Regular link (Free)** → Title `ParkMath`, URL, medium desc, **Category → Change category → Travel & Vacation → Transportation**, name/email → type the image CAPTCHA → Continue. **Paste:** all from the paste block.

## 20. 9sites.net — likely dofollow
**Steps:** `9sites.net/addurl.php` → **Regular Links (free)** → Category `Business & Economy » Transportation`, URL, Title, medium desc, name `Michal Latal`, email → Next → **type the CAPTCHA code** on the review page → Submit. **Paste:** all from the paste block.

---

## Honest priority note
Do **1–6 first** — they're worth more than every directory below combined. **8–11** (Uneed,
SaaSHub, AlternativeTo, FreeIndex) are the real dofollow/intent prizes. **19–20** are 60-second
finishes. Everything 12–18 is incremental — do them when you have a spare evening, not as a priority.
The biggest lever of all isn't on this list: **one national/regional press link** (Sheffield Star,
a travel-desk pickup of your drop-off data) outweighs all 20 — see `directory-copy.md` + the PR
section of the marketing guide when you're ready to pitch.
