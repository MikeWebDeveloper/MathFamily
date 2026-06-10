export function SiteHeader({ brandName, links }: { brandName: string; links: { label: string; href: string }[] }) {
  return (
    <header className="border-b border-ink/10 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <a href="/" className="text-lg font-bold text-brand">{brandName}</a>
        <nav aria-label="Main" className="flex gap-4 text-sm font-medium text-ink-muted">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-brand-accent">{l.label}</a>
          ))}
        </nav>
      </div>
    </header>
  );
}
