export function SourcesBlock({
  sources,
  method
}: {
  sources: { label: string; url: string; verifiedAt: string }[];
  method: string;
}) {
  return (
    <section aria-label="Sources and methodology" className="rounded-card bg-surface p-4 text-sm text-ink-muted">
      <h2 className="font-semibold text-ink">Sources &amp; method</h2>
      <ul className="mt-2 space-y-1">
        {sources.map((s) => (
          <li key={s.url}>
            <a href={s.url} rel="noopener noreferrer" target="_blank" className="underline decoration-dotted underline-offset-4 hover:text-brand-accent">
              {s.label}
            </a>{" "}
            — verified {s.verifiedAt}
          </li>
        ))}
      </ul>
      <p className="mt-2">{method}</p>
    </section>
  );
}
