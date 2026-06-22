export function FamilyLinks() {
  const parkmath = process.env.NEXT_PUBLIC_PARKMATH_URL;
  const roammath = process.env.NEXT_PUBLIC_ROAMMATH_URL;
  if (!parkmath && !roammath) return null;
  return (
    <aside className="mf-sheen mf-press rounded-card bg-surface p-4 text-sm text-ink-muted">
      <p>
        PetMath is part of the <strong className="font-semibold text-ink">Math family</strong> of UK cost
        calculators — same verified-data rules, same date-stamped sources.{" "}
        {parkmath ? (
          <>
            Travelling soon?{" "}
            <a href={`${parkmath}/drop-off-charges`} className="font-medium text-brand-accent underline underline-offset-4">
              See what airport drop-off costs
            </a>
            .
          </>
        ) : null}{" "}
        {roammath ? (
          <>
            <a href={roammath} className="font-medium text-brand-accent underline underline-offset-4">
              Check roaming &amp; baggage costs
            </a>{" "}
            on RoamMath.
          </>
        ) : null}
      </p>
    </aside>
  );
}
