export function FamilyLinks() {
  const parkmath = process.env.NEXT_PUBLIC_PARKMATH_URL;
  const roammath = process.env.NEXT_PUBLIC_ROAMMATH_URL;
  if (!parkmath && !roammath) return null;
  return (
    <aside className="mf-sheen mf-press rounded-card bg-surface p-4 text-sm text-ink-muted">
      <p>
        Part of the same family of UK cost calculators — same verified-data rules.{" "}
        {parkmath ? (
          <>
            <a href={`${parkmath}/drop-off-charges`} className="font-medium text-brand-accent underline underline-offset-4">
              Check airport drop-off &amp; parking on ParkMath
            </a>
            {roammath ? " · " : "."}
          </>
        ) : null}
        {roammath ? (
          <a href={roammath} className="font-medium text-brand-accent underline underline-offset-4">
            Compare roaming &amp; baggage costs on RoamMath
          </a>
        ) : null}
      </p>
    </aside>
  );
}
