# At-domain-attach checklist (P2 → production)

When parkmath.co.uk (+ .uk / maths twins) exists and DNS points at Vercel:

1. Set `NEXT_PUBLIC_SITE_URL=https://parkmath.co.uk` in Vercel (Production), redeploy `--prod`.
2. Verify robots.txt serves WITHOUT the preview `x-robots-tag: noindex` header.
3. Google Search Console: verify domain property, submit `https://parkmath.co.uk/sitemap.xml`.
4. Bing Webmaster Tools: verify, submit sitemap, enable IndexNow (Bing feeds ChatGPT Search).
   - **Cloudflare Crawler Hints** (preferred IndexNow path while Bing verification is pending): Cloudflare dash → **Cache → Configuration → Crawler Hints → enable** (free, one click). Since the site is proxied through Cloudflare, CF submits IndexNow signals as a *trusted* submitter, sidestepping the `403 UserForbiddedToAccessSite` that the custom `apps/parkmath/indexnow.mjs` ping hits before Bing site-verification. Keep both — the script also fans out to Yandex/Seznam/Naver; CF covers Bing.
5. Set `NEXT_PUBLIC_MAILERLITE_FORM_ACTION` once the MailerLite account + group exist.
6. Activate affiliate slots only after Ltd + Awin approval: fill `deeplinkTemplate`, set `active: true` in `apps/parkmath/lib/partners.json` (disclosure renders automatically).
7. Analytics: confirm Vercel Analytics events; create a GA4/analytics segment for AI-referral traffic (chatgpt.com, perplexity.ai, copilot.microsoft.com referrers).
8. Lighthouse pass on /, /drop-off-charges/gatwick, /airport-parking/manchester — budget LCP < 1.2s, CLS ≈ 0.
9. Re-run the 5-airport human spot-check if any data is >30 days old (esp. London City).
10. Monitor Search Console for scaled-content/spam manual actions weekly for the first month (expected: none — every page is data-distinct).

---

# RoamMath — at-domain-attach checklist

When roammath.co.uk (+ .uk / maths twins) exists and DNS points at Vercel:

1. **Run the 15-minute name ritual on roammath.co.uk BEFORE buying** — check trademark registers, existing brand use, and social-handle availability.
2. Set `NEXT_PUBLIC_SITE_URL=https://roammath.co.uk` in Vercel (Production), redeploy `--prod`.
3. Verify robots.txt serves WITHOUT the preview `x-robots-tag: noindex` header.
4. Google Search Console: verify domain property, submit `https://roammath.co.uk/sitemap.xml`.
5. Bing Webmaster Tools: verify, submit sitemap, enable IndexNow (Bing feeds ChatGPT Search).
   - **Cloudflare Crawler Hints** (preferred IndexNow path while Bing verification is pending): Cloudflare dash → **Cache → Configuration → Crawler Hints → enable**. CF submits IndexNow signals as a trusted submitter, sidestepping the Bing `403` the custom ping hits before site-verification (see ParkMath checklist item 4 for the full rationale).
6. Set `NEXT_PUBLIC_MAILERLITE_FORM_ACTION` once the MailerLite account + group (RoamMath segment) exist.
7. Activate eSIM affiliate slots only after Ltd + Awin/affiliate-network approval: fill `deeplinkTemplate`, set `active: true` in `apps/roammath/lib/partners.json` (disclosure renders automatically).
8. **Family cross-links:** set `NEXT_PUBLIC_PARKMATH_URL=https://parkmath.co.uk` on RoamMath's Vercel environment and `NEXT_PUBLIC_ROAMMATH_URL=https://roammath.co.uk` on ParkMath's — both apps render the family-links block only when the env var exists.
9. **Re-verify data before launch** — if roaming network price guides or eSIM snapshots are >30 days old, refresh the research and update `packages/data/datasets/roammath/` before the first `--prod` deploy.
10. Analytics: confirm Vercel Analytics events; create a GA4/analytics segment for AI-referral traffic (chatgpt.com, perplexity.ai, copilot.microsoft.com referrers).
11. Lighthouse pass on /, /roaming/spain, /roaming/spain/three, /baggage-fees/ryanair — budget LCP < 1.2s, CLS ≈ 0.
12. Monitor Search Console for scaled-content/spam manual actions weekly for the first month (expected: none — every page is data-distinct).

---

# P4 — Freshness agent (one-time setup)

Full setup instructions: `tools/freshness/watchdog.md`

1. Create the GitHub private repo (`MikeWebDeveloper/MathFamily`) and push main + tags.
2. `gh auth login` on the Mac mini (the agent needs it for `gh pr create`).
3. Install the launchd plist (weekly sweep, Sunday 07:00): `cp docs/launchd/com.mathfamily.freshness-sweep.plist ~/Library/LaunchAgents/ && launchctl load ~/Library/LaunchAgents/com.mathfamily.freshness-sweep.plist`
4. Import `tools/freshness/n8n-workflow.json` into n8n and wire the "Notify Mike (wire me up)" no-op node to your preferred notifier channel.
5. Supervised first run: `tools/freshness/run-agent.sh sweep --no-pr` (inspect the local branch + diff), then a real `sweep` (with PR).
