export function FamilyLinks() {
  const roammath = process.env.NEXT_PUBLIC_ROAMMATH_URL;
  if (!roammath) return null;
  return (
    <aside className="rounded-card bg-surface p-4 text-sm text-ink-muted">
      <p>
        Going abroad?{" "}
        <a href={`${roammath}/roaming`} className="font-medium text-brand-accent underline underline-offset-4">
          Check roaming and baggage costs
        </a>{" "}
        on RoamMath — same verified-data rules, same family.
      </p>
    </aside>
  );
}
