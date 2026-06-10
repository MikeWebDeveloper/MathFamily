export function SiteFooter({ brandName, links }: { brandName: string; links: { label: string; href: string }[] }) {
  return (
    <footer className="mt-16 border-t border-ink/10 bg-surface">
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 text-sm text-ink-muted">
        <nav aria-label="Footer" className="flex gap-4">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-brand-accent">{l.label}</a>
          ))}
        </nav>
        <p>
          Prices change — always verify against the official airport page before you travel. {brandName} links to
          official sources on every page. Not financial advice.
        </p>
        <p>Part of the Math family of UK cost calculators.</p>
      </div>
    </footer>
  );
}
