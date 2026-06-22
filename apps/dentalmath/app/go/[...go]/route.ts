import { createGoRoute } from "@mathfamily/engine";
import { resolveDeeplink } from "@/lib/partners";

// Shared surface-tagged affiliate-click attribution. A CTA links to /go/<...slug>?s=<surface>; the
// route logs ONE structured affiliate_click line (no cookies, no PII) and 302-redirects.
//
// INERT / fail-CLOSED by design: DentalMath's resolveDeeplink ALWAYS returns null (no reviewed,
// compliant dental-plan affiliate exists yet — see lib/partners.ts; dental plans can be a regulated
// financial promotion and need Head of Legal/Compliance sign-off). So every click logs intent and
// 302s back on-site — never a 404, never a bare affiliate link, never an open redirect.
export const dynamic = "force-dynamic";

export const GET = createGoRoute({
  brand: "DentalMath",
  resolveDeeplink
});
