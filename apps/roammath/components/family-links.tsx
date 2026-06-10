export function FamilyLinks() {
  const parkmath = process.env.NEXT_PUBLIC_PARKMATH_URL;
  if (!parkmath) return null;
  return (
    <aside className="rounded-card bg-surface p-4 text-sm text-ink-muted">
      <p>
        Flying soon?{" "}
        <a href={`${parkmath}/drop-off-charges`} className="font-medium text-brand-accent underline underline-offset-4">
          Check what the airport drop-off and parking will cost
        </a>{" "}
        on ParkMath — same verified-data rules, same family.
      </p>
    </aside>
  );
}
