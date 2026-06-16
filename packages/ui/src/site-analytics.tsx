/** Privacy-first analytics seam. Renders the Cloudflare Web Analytics beacon when
 *  NEXT_PUBLIC_CF_BEACON_TOKEN is set, the AWIN publisher MasterTag when
 *  NEXT_PUBLIC_AWIN_PUBLISHER_ID is set, and a Plausible beacon when NEXT_PUBLIC_PLAUSIBLE_DOMAIN
 *  is set. Each renders nothing when its var is unset (safe in dev/CI/preview). This is the one
 *  place analytics/tracking scripts live.
 *
 *  Plausible: NEXT_PUBLIC_PLAUSIBLE_DOMAIN is the site's data-domain (e.g. "parkmath.co.uk");
 *  NEXT_PUBLIC_PLAUSIBLE_HOST overrides the script host for a self-hosted instance (defaults to
 *  https://plausible.io). The outbound-links+tagged-events script gives the loop digest its
 *  outbound-click + utm_campaign grain. The CSP in next.config.ts mirrors the same env so the
 *  configured host is allowlisted automatically. Currently inert — no Plausible host is live yet
 *  (Umami chosen instead); flip it on by setting the two env vars in Vercel + redeploying.
 *
 *  Umami (active analytics): renders the self-hosted Umami beacon when NEXT_PUBLIC_UMAMI_HOST and
 *  NEXT_PUBLIC_UMAMI_WEBSITE_ID are both set. Host is the public tunnel URL (e.g.
 *  https://umami.parkmath.co.uk); Umami captures UTM params natively, powering the reel loop digest's
 *  per-campaign attribution. CSP in next.config.ts allowlists the host from the same env. */
export function SiteAnalytics() {
  const cfToken = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;
  const awinPublisherId = process.env.NEXT_PUBLIC_AWIN_PUBLISHER_ID;
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const plausibleHost = (process.env.NEXT_PUBLIC_PLAUSIBLE_HOST || "https://plausible.io").replace(/\/+$/, "");
  const umamiHost = (process.env.NEXT_PUBLIC_UMAMI_HOST || "").replace(/\/+$/, "");
  const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  return (
    <>
      {cfToken ? (
        <script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon={JSON.stringify({ token: cfToken })}
        />
      ) : null}
      {awinPublisherId ? (
        <script defer src={`https://www.dwin1.com/${awinPublisherId}.js`} type="text/javascript" />
      ) : null}
      {plausibleDomain ? (
        <script defer data-domain={plausibleDomain} src={`${plausibleHost}/js/script.outbound-links.tagged-events.js`} />
      ) : null}
      {umamiHost && umamiWebsiteId ? (
        <script defer src={`${umamiHost}/script.js`} data-website-id={umamiWebsiteId} />
      ) : null}
    </>
  );
}
