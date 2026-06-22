import { createGoRoute } from "@mathfamily/engine";
import { resolveDeeplink } from "@/lib/partners";

// First-party, surface-tagged affiliate-click measurement. A CTA links to /go/<...slug>?s=<surface>;
// this logs ONE structured affiliate_click line (no cookies, no PII) and 302-redirects to the resolved
// deeplink. Fail-closed + INERT-safe: while every accounting-software partner is inert (no live deal),
// resolveDeeplink returns null and the route still records intent, then 302s back to /take-home on our
// own origin — never a 404, never a bare affiliate link, never an open redirect.
export const dynamic = "force-dynamic";

export const GET = createGoRoute({
  brand: "SideMath",
  resolveDeeplink,
  fallbackPath: "/take-home"
});
