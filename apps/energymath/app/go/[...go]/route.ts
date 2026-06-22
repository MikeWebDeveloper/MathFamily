import { createGoRoute } from "@mathfamily/engine";
import { resolveDeeplink } from "@/lib/partners";

export const dynamic = "force-dynamic"; // per-click destination — never cache a redirect

// Surface-tagged affiliate redirect. A CTA links to `/go/<category>[/<region>]?s=<surface>`.
// Logs ONE structured affiliate_click line (brand + target + surface, no PII) then 302s to the
// resolved deeplink, or — while every partner is inert — back to an on-site fallback. Rails stay
// inert: resolveDeeplink returns null until a partner is flipped active with a real https link.
export const GET = createGoRoute({
  brand: "EnergyMath",
  resolveDeeplink
});
