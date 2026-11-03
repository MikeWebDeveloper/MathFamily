/**
 * Canonical production origin for RoamMath. `www` is canonical; the apex (roammath.co.uk) 308-redirects
 * to it at the Vercel layer — same convention as ParkMath (www.parkmath.co.uk).
 *
 * `NEXT_PUBLIC_SITE_URL` (build-time inlined, set in the Vercel project) overrides this, but an unset or
 * EMPTY value falls back to the production origin instead of throwing at `new URL("")` or leaking a
 * localhost canonical into a deployed build. A single source so layout, robots, sitemap and the JSON-LD
 * builders can never disagree about the host.
 */
export const PRODUCTION_SITE_URL = "https://www.roammath.co.uk";

export function siteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return (fromEnv || PRODUCTION_SITE_URL).replace(/\/+$/, "");
}

/** Public contact address. Needs a Cloudflare Email Routing rule on roammath.co.uk (→ the operator's
 *  inbox) before the first production deploy — see the launch runbook. */
export const CONTACT_EMAIL = "hello@roammath.co.uk";
