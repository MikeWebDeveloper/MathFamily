export function SourceCitation({ url, label = "Official source" }: { url: string; label?: string }) {
  return (
    <a href={url} rel="noopener noreferrer" target="_blank" className="text-sm text-ink-muted underline decoration-dotted underline-offset-4 hover:text-brand-accent">
      {label} ↗
    </a>
  );
}
