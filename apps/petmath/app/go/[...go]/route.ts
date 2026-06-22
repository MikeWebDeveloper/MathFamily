import { createGoRoute } from "@mathfamily/engine";
import { resolveDeeplink } from "@/lib/partners";

export const dynamic = "force-dynamic";

// Surface-tagged affiliate-click attribution. A CTA links to /go/food/<speciesSlug>?s=<surface>;
// createGoRoute logs ONE structured affiliate_click line (brand + target + surface, no PII/cookies)
// and 302s to the resolved pet-food deeplink — or back to an on-site page while the rail is inert.
export const GET = createGoRoute({
  brand: "PetMath",
  resolveDeeplink,
  // fallbackPath defaults to "/" — an on-site page on our own origin (inert-safe, never a 404).
});
