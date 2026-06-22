import { createGoRoute } from "@mathfamily/engine";
import { resolveDeeplink } from "@/lib/partners";

// First-party, surface-tagged affiliate-click attribution. A CTA links to
// /go/esim/<provider>/<countrySlug>?s=<surface>; this records ONE structured click line (no
// cookies, no PII, no third-party script) then 302-redirects to the resolved eSIM deeplink.
//
// Fail-CLOSED + inert-safe: every eSIM partner is currently gated off, so resolveDeeplink returns
// null and the route 302s back to an on-site page on our OWN origin — never a 404, never a bare
// affiliate link, never an open redirect. The click intent is still logged, so we lose no signal.
export const dynamic = "force-dynamic";

export const GET = createGoRoute({
  brand: "RoamMath",
  resolveDeeplink, // (parts, surface) => string | null
  // fallbackPath: "/" (default) — land on the homepage when there's no live deeplink.
});
