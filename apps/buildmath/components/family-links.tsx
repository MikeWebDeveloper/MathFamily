export function FamilyLinks() {
  const parkmath = process.env.NEXT_PUBLIC_PARKMATH_URL;
  const roammath = process.env.NEXT_PUBLIC_ROAMMATH_URL;
  if (!parkmath && !roammath) return null;
  return (
    <aside className="mf-sheen mf-press rounded-card bg-surface p-4 text-sm text-ink-muted">
      <p>
        BuildMath is part of The Math Family of UK cost calculators — same verified-data rules,
        same date-stamped sources.{" "}
        {parkmath ? (
          <>
            <a
              href={`${parkmath}/drop-off-charges`}
              className="font-medium text-brand-accent underline underline-offset-4"
            >
              Check airport drop-off &amp; parking on ParkMath
            </a>
            {roammath ? " · " : "."}
          </>
        ) : null}
        {roammath ? (
          <a
            href={`${roammath}/roaming`}
            className="font-medium text-brand-accent underline underline-offset-4"
          >
            Compare mobile roaming &amp; baggage costs on RoamMath
          </a>
        ) : null}
      </p>
    </aside>
  );
}
