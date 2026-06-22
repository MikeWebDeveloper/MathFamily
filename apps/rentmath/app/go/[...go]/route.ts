import { createGoRoute } from "@mathfamily/engine";
import { resolveDeeplink } from "@/lib/partners";

export const dynamic = "force-dynamic"; // per-click redirect — never cache

// RentMath's affiliate slot is intentionally inert (resolveDeeplink always returns null), but we
// still mount /go so future intent is logged. Fail-closed: every click logs, then 302s back to the
// home page on our own origin — never a 404, never a bare affiliate URL, never an open redirect.
export const GET = createGoRoute({
  brand: "RentMath",
  resolveDeeplink,
  fallbackPath: "/"
});
