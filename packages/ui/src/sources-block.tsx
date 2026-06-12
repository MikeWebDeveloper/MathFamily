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
      <p className="mt-3 border-t border-ink/10 pt-3 text-xs text-ink-muted">
        <strong className="font-semibold text-ink">Independent:</strong> we are not owned by any airport, network or
        booking site. Any affiliate links are labelled Ad and earn us a commission — this never affects the figures we
        publish or which option we show as cheapest.
      </p>
    </section>
  );
}
