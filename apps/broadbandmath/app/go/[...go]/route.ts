import { createGoRoute } from "@mathfamily/engine";
import { resolveDeeplink } from "@/lib/partners";

// First-party, surface-tagged affiliate-click measurement. A CTA links to /go/<...slug>?s=<surface>;
// createGoRoute logs ONE structured `affiliate_click` line (no cookies/PII) then 302-redirects to the
// resolved deeplink. The broadband-switching rail is INERT, so resolveDeeplink returns null and the
// route fails closed to an on-site page — never a 404, never a bare affiliate link, never an open
// redirect. We still capture the switching-intent signal before any deal is wired.
export const dynamic = "force-dynamic";

export const GET = createGoRoute({
  brand: "BroadbandMath",
  resolveDeeplink
});
