export function FamilyLinks() {
  const parkmath = process.env.NEXT_PUBLIC_PARKMATH_URL;
  const roammath = process.env.NEXT_PUBLIC_ROAMMATH_URL;
  if (!parkmath && !roammath) return null;
  return (
    <aside className="mf-sheen mf-press rounded-card bg-surface p-4 text-sm text-ink-muted">
      <p>
        More from The Math Family — same verified-data rules, same family:{" "}
        {parkmath && (
          <a
            href={`${parkmath}/drop-off-charges`}
            className="font-medium text-brand-accent underline underline-offset-4"
          >
            airport drop-off &amp; parking costs on ParkMath
          </a>
        )}
        {parkmath && roammath ? ", " : ""}
        {roammath && (
          <a
            href={`${roammath}/roaming`}
            className="font-medium text-brand-accent underline underline-offset-4"
          >
            mobile roaming &amp; baggage costs on RoamMath
          </a>
        )}
        .
      </p>
    </aside>
  );
}
