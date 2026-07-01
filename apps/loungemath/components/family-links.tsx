// Travel-cluster cross-sell (Mike's decision): DOFOLLOW contextual links to sibling
// =Math members. ParkMath defaults to its live domain because the cross-link is a
// genuine, on-topic editorial link in the travel cluster (sort your parking before
// you fly) — not affiliate — so it is intentionally dofollow. RoamMath only links
// when its URL env is set (it isn't live yet).
const PARKMATH_URL = process.env.NEXT_PUBLIC_PARKMATH_URL ?? "https://parkmath.co.uk";

export function FamilyLinks({ airportName }: { airportName?: string } = {}) {
  const roammath = process.env.NEXT_PUBLIC_ROAMMATH_URL;
  return (
    <aside className="mf-sheen mf-press rounded-card bg-surface p-4 text-sm text-ink-muted">
      <p className="mb-2 font-medium text-ink">Same verified-data rules, same =Math family:</p>
      <ul className="space-y-1">
        <li>
          Before you fly,{" "}
          <a
            href={`${PARKMATH_URL}/drop-off-charges`}
            className="font-medium text-brand-accent underline underline-offset-4"
          >
            sort your airport drop-off &amp; parking{airportName ? ` at ${airportName}` : ""}
          </a>{" "}
          on ParkMath.
        </li>
        {roammath ? (
          <li>
            <a
              href={`${roammath}/roaming`}
              className="font-medium text-brand-accent underline underline-offset-4"
            >
              Check roaming &amp; baggage costs abroad
            </a>{" "}
            on RoamMath.
          </li>
        ) : null}
      </ul>
    </aside>
  );
}
