export function FaqAccordion({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <div className="divide-y divide-ink/10 rounded-card border border-ink/10">
      {items.map((item, index) => (
        <details key={index} className="group p-4">
          <summary className="cursor-pointer font-medium text-ink marker:content-none">{item.question}</summary>
          <p className="mt-2 text-sm text-ink-muted">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
