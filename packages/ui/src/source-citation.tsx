export function SourceCitation({ url, label = "Official source" }: { url: string; label?: string }) {
  return (
    <a
      href={url}
      rel="noopener noreferrer"
      target="_blank"
      className="inline-flex min-h-[44px] items-center text-sm text-ink-muted underline decoration-dotted underline-offset-4 hover:text-accent-strong"
    >
      {label} ↗
    </a>
  );
}
