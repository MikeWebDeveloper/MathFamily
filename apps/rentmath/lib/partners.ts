/**
 * Deeplink resolver for RentMath's surface-tagged `/go` redirect.
 *
 * RentMath's affiliate slot is INTENTIONALLY INERT (see components/inert-affiliate-slot.tsx):
 * there is no clean, compliant "green rail" in UK renting, and contents/tenant insurance is an
 * FCA-regulated AMBER category we do NOT wire without Legal sign-off + introducer permissions.
 *
 * So this resolver ALWAYS returns `null` — no live deeplink, ever, in this MVP. The shared
 * `createGoRoute` is still mounted (fail-closed): every click is logged as structured `intent`
 * before it 302s back to an on-site page on our own origin. That way the moment a compliant deal
 * is approved we already have the demand signal, and nothing here can emit a bare affiliate URL
 * or an open redirect in the meantime.
 *
 * @param _parts   the catch-all path segments after /go
 * @param _surface the `?s=` surface tag (home | town | ...)
 * @returns        always `null` — inert by design
 */
export function resolveDeeplink(_parts: string[], _surface: string): string | null {
  return null;
}
