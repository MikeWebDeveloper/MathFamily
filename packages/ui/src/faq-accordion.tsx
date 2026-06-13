export function FaqAccordion({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <div
      className="divide-y divide-ink/10 overflow-hidden rounded-card border border-ink/10 bg-white"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {items.map((item, index) => (
        <details key={index} className="group">
          <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-4 p-5 font-medium text-ink outline-none transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-accent/50 marker:content-none">
            {item.question}
            <span aria-hidden className="shrink-0 text-ink-muted transition-transform duration-200 group-open:rotate-180">⌄</span>
          </summary>
          <p className="px-5 pb-5 text-sm leading-relaxed text-ink-muted">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
