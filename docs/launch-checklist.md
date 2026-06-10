# At-domain-attach checklist (P2 → production)

When parkmath.co.uk (+ .uk / maths twins) exists and DNS points at Vercel:

1. Set `NEXT_PUBLIC_SITE_URL=https://parkmath.co.uk` in Vercel (Production), redeploy `--prod`.
2. Verify robots.txt serves WITHOUT the preview `x-robots-tag: noindex` header.
3. Google Search Console: verify domain property, submit `https://parkmath.co.uk/sitemap.xml`.
4. Bing Webmaster Tools: verify, submit sitemap, enable IndexNow (Bing feeds ChatGPT Search).
5. Set `NEXT_PUBLIC_MAILERLITE_FORM_ACTION` once the MailerLite account + group exist.
6. Activate affiliate slots only after Ltd + Awin approval: fill `deeplinkTemplate`, set `active: true` in `apps/parkmath/lib/partners.json` (disclosure renders automatically).
7. Analytics: confirm Vercel Analytics events; create a GA4/analytics segment for AI-referral traffic (chatgpt.com, perplexity.ai, copilot.microsoft.com referrers).
8. Lighthouse pass on /, /drop-off-charges/gatwick, /airport-parking/manchester — budget LCP < 1.2s, CLS ≈ 0.
9. Re-run the 5-airport human spot-check if any data is >30 days old (esp. London City).
10. Monitor Search Console for scaled-content/spam manual actions weekly for the first month (expected: none — every page is data-distinct).
