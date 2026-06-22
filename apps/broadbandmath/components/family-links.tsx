export function FamilyLinks() {
  const parkmath = process.env.NEXT_PUBLIC_PARKMATH_URL;
  const roammath = process.env.NEXT_PUBLIC_ROAMMATH_URL;
  if (!parkmath && !roammath) return null;
  return (
    <aside className="mf-sheen mf-press rounded-card bg-surface p-4 text-sm text-ink-muted">
      <p>
        Counting the true cost of other things?{" "}
        {roammath && (
          <>
            <a href={roammath} className="font-medium text-brand-accent underline underline-offset-4">
              See what your phone costs abroad
            </a>{" "}
            on RoamMath
            {parkmath ? ", or " : " "}
          </>
        )}
        {parkmath && (
          <>
            <a href={`${parkmath}/drop-off-charges`} className="font-medium text-brand-accent underline underline-offset-4">
              check airport drop-off and parking
            </a>{" "}
            on ParkMath
          </>
        )}
        — same verified-data rules, same family.
      </p>
    </aside>
  );
}
