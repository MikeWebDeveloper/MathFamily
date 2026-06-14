export function AnswerLead({ answer, children }: { answer: string; children?: string[] }) {
  return (
    <div
      className="mf-edge mf-rise-in rounded-card border-l-4 border-l-brand-accent bg-gradient-to-br from-surface to-white dark:from-card dark:to-card p-5 sm:p-6"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <p className="text-lead font-semibold text-ink">{answer}</p>
      {children && children.length > 0 ? (
        <ul className="mt-4 space-y-2 text-sm text-ink-muted">
          {children.map((fact) => (
            <li key={fact} className="flex items-start gap-2.5">
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent/60" />
              <span>{fact}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
