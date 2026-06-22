import { createGoRoute } from "@mathfamily/engine";
import { resolveDeeplink } from "@/lib/partners";

export const dynamic = "force-dynamic";

// Surface-tagged affiliate-click attribution for MoveMath's GREEN rails (removals / conveyancing /
// surveys). Inert-safe: while no deal is wired, resolveDeeplink returns null and the route logs the
// click intent, then 302s back on-site (no 404, no bare affiliate link, no open redirect).
// Mortgages (FCA-red) are intentionally NOT routed here — there is no /go surface for them.
export const GET = createGoRoute({
  brand: "MoveMath",
  resolveDeeplink
});
