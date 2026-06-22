export function FamilyLinks() {
  const parkmath = process.env.NEXT_PUBLIC_PARKMATH_URL;
  const roammath = process.env.NEXT_PUBLIC_ROAMMATH_URL;
  if (!parkmath && !roammath) return null;
  return (
    <aside className="mf-sheen mf-press rounded-card bg-surface p-4 text-sm text-ink-muted">
      <p>
        Part of The Math Family — verified-data calculators.{" "}
        {parkmath && (
          <>
            Flying soon?{" "}
            <a href={`${parkmath}/drop-off-charges`} className="font-medium text-brand-accent underline underline-offset-4">
              Check airport drop-off and parking costs
            </a>{" "}
            on ParkMath.{" "}
          </>
        )}
        {roammath && (
          <>
            Heading abroad?{" "}
            <a href={`${roammath}/roaming`} className="font-medium text-brand-accent underline underline-offset-4">
              See what your phone costs abroad
            </a>{" "}
            on RoamMath.
          </>
        )}
      </p>
    </aside>
  );
}
