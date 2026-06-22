/** Shared, surface-tagged affiliate-click attribution for the whole family. Generalised from
 *  ParkMath's apps/parkmath/app/go/[airport]/[target]/route.ts.
 *
 *  Any app mounts a catch-all `app/go/[...go]/route.ts` that re-exports `createGoRoute(...)`. A CTA
 *  links to `/go/<...slug>?s=<surface>`; this records ONE lightweight, privacy-friendly click event
 *  (a single structured JSON log line — no cookies, no PII, no third-party script) and then
 *  302-redirects to the resolved affiliate deeplink.
 *
 *  Fail-CLOSED + inert-safe: if a slot has no live deeplink yet, we STILL log the intent and 302
 *  back to an on-site page on our OWN origin (never a 404, never a broken/bare affiliate link, never
 *  an open redirect). So a brand can ship the /go surface before deals are wired and lose no signal. */

export interface AffiliateClick {
  brand: string;
  surface: string;
  parts: string[];
}

/** Emit the single structured click line. Readable from Vercel runtime logs (filter on the
 *  "affiliate_click" marker) or any log drain — counts = clicks, grouped by brand + target + surface. */
export function logAffiliateClick(click: AffiliateClick, log: (line: string) => void = console.log): void {
  log(
    JSON.stringify({
      event: "affiliate_click",
      brand: click.brand,
      target: click.parts.join("/"),
      surface: click.surface || null,
      ts: new Date().toISOString()
    })
  );
}

export interface GoRouteConfig {
  /** The mounting brand, e.g. "RoamMath" — tags every click for cross-brand attribution. */
  brand: string;
  /** Resolve the catch-all path parts (+ surface) to an exact affiliate deeplink, or null when the
   *  slot has no live deal yet. Receives the raw `parts` so apps keep their own clickref/ued logic. */
  resolveDeeplink: (parts: string[], surface: string) => string | null;
  /** Where to land when there is no live deeplink — an on-site page on the same origin. Default "/". */
  fallbackPath?: string;
  /** Injectable for tests. */
  log?: (line: string) => void;
}

type GoContext = { params: Promise<{ go: string[] }> };

/** Build the Next.js Route Handler `GET` for an `app/go/[...go]/route.ts`. Always logs; always
 *  returns a 302 (live deeplink when resolved, else an on-site fallback). */
export function createGoRoute(config: GoRouteConfig) {
  const log = config.log ?? console.log;
  const fallbackPath = config.fallbackPath ?? "/";

  return async function GET(req: Request, ctx: GoContext): Promise<Response> {
    const { go } = await ctx.params;
    const parts = Array.isArray(go) ? go : [go].filter(Boolean);
    const surface = new URL(req.url).searchParams.get("s") ?? "";

    // The money metric: one structured line per affiliate-CTA click. Logged BEFORE we resolve, so
    // intent is captured even for inert (not-yet-wired) slots. No IP/UA/cookie by construction.
    logAffiliateClick({ brand: config.brand, surface, parts }, log);

    const deeplink = config.resolveDeeplink(parts, surface);

    const origin = new URL(req.url).origin;
    const location = deeplink ?? new URL(fallbackPath, origin).toString();

    // 302 (temporary): per-click destination, must not be cached by intermediaries.
    return new Response(null, {
      status: 302,
      headers: { Location: location, "Cache-Control": "no-store" }
    });
  };
}
