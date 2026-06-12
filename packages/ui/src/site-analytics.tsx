/** Privacy-first analytics seam. Renders the Cloudflare Web Analytics beacon when
 *  NEXT_PUBLIC_CF_BEACON_TOKEN is set; nothing otherwise (safe in dev/CI/preview).
 *  To add self-hosted Plausible later, add its <script> here — this is the one place
 *  analytics lives, so no layout changes are needed. */
export function SiteAnalytics() {
  const token = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;
  if (!token) return null;
  return (
    <script
      defer
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={JSON.stringify({ token })}
    />
  );
}
