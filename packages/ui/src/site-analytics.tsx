/** Privacy-first analytics seam. Renders the Cloudflare Web Analytics beacon when
 *  NEXT_PUBLIC_CF_BEACON_TOKEN is set, and the AWIN publisher MasterTag when
 *  NEXT_PUBLIC_AWIN_PUBLISHER_ID is set. Renders nothing for any var left unset (safe in
 *  dev/CI/preview). This is the one place analytics/tracking scripts live, so adding a new
 *  provider later (e.g. self-hosted Plausible) means adding one <script> here. */
export function SiteAnalytics() {
  const cfToken = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;
  const awinPublisherId = process.env.NEXT_PUBLIC_AWIN_PUBLISHER_ID;
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
    </>
  );
}
