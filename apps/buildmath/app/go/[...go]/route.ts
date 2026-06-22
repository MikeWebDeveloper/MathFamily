import { createGoRoute } from "@mathfamily/engine";
import { resolveDeeplink } from "@/lib/partners";

// First-party, surface-tagged affiliate-click attribution. A CTA links to /go/<...slug>?s=<surface>;
// this logs ONE structured affiliate_click line (no cookies, no PII, no third-party script) and
// 302-redirects to the resolved trades-lead deeplink. Fail-closed: while every partner is inert,
// resolveDeeplink returns null and the shared handler 302s back to an on-site page on our own
// origin (never a 404, never a bare affiliate link, never an open redirect).
export const dynamic = "force-dynamic";

export const GET = createGoRoute({
  brand: "BuildMath",
  resolveDeeplink,
  fallbackPath: "/cost",
});
