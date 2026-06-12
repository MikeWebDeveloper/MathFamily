export function SiteFooter({ brandName, links }: { brandName: string; links: { label: string; href: string }[] }) {
  return (
    <footer className="mt-16 border-t border-ink/10 bg-surface">
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 text-sm text-ink-muted">
        <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-1">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="inline-flex min-h-11 items-center py-1.5 hover:text-brand-accent">{l.label}</a>
          ))}
        </nav>
        <p>
          Prices change — always verify against the official airport page before you travel. {brandName} links to
          official sources on every page. Not financial advice.
        </p>
        <p className="flex items-center gap-2">
          <span aria-hidden className="inline-flex h-4 w-4 items-center justify-center rounded bg-brand text-[10px] font-bold leading-none text-white">=</span>
          <span>Part of the <strong className="font-semibold text-ink">=Math family</strong> of UK cost calculators.</span>
        </p>
      </div>
    </footer>
  );
}
