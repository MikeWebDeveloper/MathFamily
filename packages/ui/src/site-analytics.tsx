/** Privacy-first analytics seam. Renders the Cloudflare Web Analytics beacon when a token is
 *  available, and the AWIN publisher MasterTag when NEXT_PUBLIC_AWIN_PUBLISHER_ID is set.
 *  Renders nothing for any var left unset (safe in dev/CI/preview). This is the one place
 *  analytics/tracking scripts live, so adding a new provider later (e.g. self-hosted
 *  Plausible) means adding one <script> here.
 *
 *  The CF beacon token resolves to NEXT_PUBLIC_CF_BEACON_TOKEN when set, otherwise the
 *  optional `cfToken` prop. The token is a public client-side id (it ships in the page HTML),
 *  so an app may pass it as a committed default; a Vercel env var still overrides it. */
export function SiteAnalytics({ cfToken }: { cfToken?: string } = {}) {
  const resolvedCfToken = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN || cfToken;
  const awinPublisherId = process.env.NEXT_PUBLIC_AWIN_PUBLISHER_ID;
  return (
    <>
      {resolvedCfToken ? (
        <script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon={JSON.stringify({ token: resolvedCfToken })}
        />
      ) : null}
      {awinPublisherId ? (
        <script defer src={`https://www.dwin1.com/${awinPublisherId}.js`} type="text/javascript" />
      ) : null}
    </>
  );
}
