export function AnswerLead({ answer, children }: { answer: string; children?: string[] }) {
  return (
    <div className="rounded-card border-l-4 border-brand-accent bg-surface p-5">
      <p className="text-lg font-medium text-ink">{answer}</p>
      {children && children.length > 0 ? (
        <ul className="mt-3 space-y-1 text-sm text-ink-muted">
          {children.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
